"use client";

import { useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { importResultMessage, type ImportKind, type ImportPreview } from "@/lib/admin/inventory";
import {
  DuplicateFileError,
  confirmInventoryImport,
  downloadImportTemplate,
  previewInventoryImport,
  saveWorkbook,
} from "@/lib/mart-api/inventory";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import { adminButtonClass, adminFieldClass } from "../../_components/admin-ui";
import { useAdminNotify } from "../../_components/confirm-delete";
import { InventoryDialog } from "./inventory-dialog";

const KIND_LABEL: Record<ImportKind, string> = {
  purchases: "Purchases",
  opening: "Opening stock",
  stock_count: "Stock count",
  cost_price: "Cost price",
};

export function ExportExcelButton({
  onExport,
  filename,
  label = "Export Excel",
}: {
  onExport: () => Promise<Blob>;
  filename: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const notify = useAdminNotify();

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await onExport();
      saveWorkbook(blob, filename);
      notify("Excel file downloaded.", "ok");
    } catch (error) {
      notify(error instanceof MartApiError ? error.message : "Could not export Excel.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={adminButtonClass.secondary} onClick={() => void run()} disabled={busy}>
      <MaterialIcon name="download" className="text-[18px]" />
      {busy ? "Exporting…" : label}
    </button>
  );
}

export function ImportExcelButton({
  kinds,
  canConfirm,
  onImported,
}: {
  kinds: ImportKind[];
  /** Confirm saves rows. Viewers may preview; only editors confirm. */
  canConfirm: boolean;
  onImported?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={adminButtonClass.secondary} onClick={() => setOpen(true)}>
        <MaterialIcon name="upload" className="text-[18px]" />
        Import Excel
      </button>
      {open ? (
        <ImportExcelDialog
          kinds={kinds}
          canConfirm={canConfirm}
          onClose={() => setOpen(false)}
          onImported={() => {
            onImported?.();
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function ImportExcelDialog({
  kinds,
  canConfirm,
  onClose,
  onImported,
}: {
  kinds: ImportKind[];
  canConfirm: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const titleId = useId();
  const inputId = useId();
  const notify = useAdminNotify();
  const fileRef = useRef<File | null>(null);
  const [kind, setKind] = useState<ImportKind>(kinds[0]);
  const [phase, setPhase] = useState<"idle" | "loading" | "preview" | "duplicate">("idle");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [duplicate, setDuplicate] = useState<{ message: string; fileHash: string } | null>(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [error, setError] = useState("");

  async function downloadTemplate() {
    try {
      const blob = await downloadImportTemplate(kind);
      saveWorkbook(blob, `${kind.replaceAll("_", "-")}-template.xlsx`);
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not download the template.");
    }
  }

  async function previewFile(file: File) {
    setPhase("loading");
    setError("");
    setDuplicate(null);
    try {
      const next = await previewInventoryImport(kind, file);
      fileRef.current = file;
      setAllowDuplicate(false);
      setPreview(next);
      setPhase("preview");
      if (next.duplicate) {
        setDuplicate({
          message: "This file was already imported. Confirm to import it again.",
          fileHash: next.fileHash,
        });
      }
    } catch (reason) {
      setPhase("idle");
      setPreview(null);
      setError(reason instanceof MartApiError ? reason.message : "Could not read this Excel file.");
    }
  }

  async function confirm(confirmDuplicate: boolean) {
    const file = fileRef.current;
    if (!file || !preview || !canConfirm) return;
    setPhase("loading");
    setError("");
    try {
      const result = await confirmInventoryImport(kind, file, confirmDuplicate || allowDuplicate);
      notify(importResultMessage(result.saved, result.skipped), "ok");
      onImported();
    } catch (reason) {
      if (reason instanceof DuplicateFileError) {
        setDuplicate({ message: reason.message, fileHash: reason.fileHash });
        setAllowDuplicate(false);
        setPhase("preview");
        setError(reason.message);
        return;
      }
      setPhase("preview");
      const message = reason instanceof MartApiError ? reason.message : "Could not import this file.";
      setError(message);
      notify(message, "error");
    }
  }

  return (
    <InventoryDialog
      title="Import Excel"
      titleId={titleId}
      description="Download the template, fill it in, then check the preview before anything is saved."
      onClose={onClose}
      wide
    >
      <div className="space-y-4">
        {kinds.length > 1 ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700">What are you importing?</span>
            <select
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as ImportKind);
                setPreview(null);
                setPhase("idle");
                setAllowDuplicate(false);
                fileRef.current = null;
              }}
              className={adminFieldClass}
            >
              {kinds.map((item) => (
                <option key={item} value={item}>
                  {KIND_LABEL[item]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm text-neutral-700">
            Template: <span className="font-medium">{KIND_LABEL[kind]}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" className={adminButtonClass.secondary} onClick={() => void downloadTemplate()}>
            <MaterialIcon name="download" className="text-[18px]" />
            Download template
          </button>
          <label className={cn(adminButtonClass.primary, "cursor-pointer")}>
            <MaterialIcon name="upload_file" className="text-[18px]" />
            Choose file
            <input
              id={inputId}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void previewFile(file);
              }}
            />
          </label>
        </div>

        {phase === "loading" ? (
          <p role="status" aria-live="polite" className="text-sm text-neutral-600">
            Checking the file…
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        ) : null}

        {duplicate ? (
          <div role="alert" className="rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning ring-1 ring-warning/30">
            <p>{duplicate.message}</p>
          </div>
        ) : null}

        {preview ? (
          <div className="space-y-3">
            <p className="text-sm text-neutral-700" role="status">
              {preview.validCount} valid, {preview.invalidCount} need a fix. Only valid rows are saved.
            </p>
            <div className="overflow-x-auto rounded-xl ring-1 ring-neutral-200">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <caption className="sr-only">Import preview</caption>
                <thead className="bg-neutral-50 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Result</th>
                    <th className="px-3 py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr
                      key={row.row}
                      className={cn(
                        "border-t border-neutral-100",
                        row.valid ? "bg-success/10" : "bg-error-container text-on-error-container",
                      )}
                    >
                      <td className="px-3 py-2 tabular-nums">{row.row}</td>
                      <td className="px-3 py-2 font-medium">{row.valid ? "Valid" : "Invalid"}</td>
                      <td className="px-3 py-2">{row.valid ? row.summary || row.action : row.errors.join(" ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className={adminButtonClass.secondary} onClick={onClose}>
                Cancel
              </button>
              {canConfirm ? (
                <button
                  type="button"
                  className={adminButtonClass.primary}
                  disabled={phase === "loading" || preview.validCount === 0}
                  onClick={() => void confirm(Boolean(duplicate) || preview.duplicate)}
                >
                  {phase === "loading" ? "Saving…" : duplicate || preview.duplicate ? "Import again" : "Confirm"}
                </button>
              ) : (
                <p className="text-sm text-neutral-600">Your role can preview this file. Saving it needs an editor.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </InventoryDialog>
  );
}
