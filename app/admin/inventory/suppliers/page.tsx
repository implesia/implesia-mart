"use client";

import { useEffect, useId, useState, type FormEvent } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { fetchSuppliers, saveSupplier, type Supplier } from "@/lib/mart-api/inventory";
import { MartApiError } from "@/lib/mart-api/products";

import {
  AdminEmpty,
  AdminLoading,
  AdminNotice,
  AdminPageHeader,
  FieldLabel,
  adminButtonClass,
  adminFieldClass,
} from "../../_components/admin-ui";
import { useAdminNotify } from "../../_components/confirm-delete";
import { InventoryDialog } from "../_components/inventory-dialog";
import { InventoryPager } from "../_components/pager";
import { useInventoryWriter } from "../_components/use-inventory-role";

const PAGE_SIZE = 20;

type Draft = { name: string; phone: string; address: string; note: string };

const EMPTY: Draft = { name: "", phone: "", address: "", note: "" };

export default function SuppliersPage() {
  const canWrite = useInventoryWriter();
  const notify = useAdminNotify();
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Supplier[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ id?: string; draft: Draft } | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setApplied(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    void fetchSuppliers({ q: applied, page, pageSize: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setRows(result.items);
        setTotal(result.total);
        setPages(result.pages);
        setError("");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setRows([]);
        setError(reason instanceof MartApiError ? reason.message : "Could not load suppliers.");
      });
    return () => {
      cancelled = true;
    };
  }, [applied, page, reload]);

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader
        title="Suppliers"
        description="People and companies you buy stock from."
        action={
          <div className="flex flex-wrap gap-2">
            {canWrite ? (
              <button
                type="button"
                className={adminButtonClass.primary}
                onClick={() => setEditing({ draft: EMPTY })}
              >
                <MaterialIcon name="add" className="text-[18px]" />
                New supplier
              </button>
            ) : null}
          </div>
        }
      />

      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <label className="relative block">
            <span className="sr-only">Search suppliers</span>
            <MaterialIcon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-500"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name"
              className={`${adminFieldClass} pl-10`}
            />
          </label>
        </div>

        {rows == null ? <AdminLoading /> : null}
        {error ? (
          <div className="p-4">
            <AdminNotice tone="warning">{error}</AdminNotice>
          </div>
        ) : null}
        {rows && rows.length === 0 && !error ? (
          <AdminEmpty title="No suppliers yet" detail="Add a supplier before you record a purchase." />
        ) : null}
        {rows && rows.length > 0 ? (
          <>
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Suppliers</caption>
                <thead className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Address</th>
                    <th className="px-5 py-3">Note</th>
                    {canWrite ? <th className="px-5 py-3"><span className="sr-only">Actions</span></th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((supplier) => (
                    <tr key={supplier.id} className="border-t border-neutral-100">
                      <td className="px-5 py-3 font-medium text-neutral-950">{supplier.name}</td>
                      <td className="px-5 py-3 text-neutral-700">{supplier.phone || "—"}</td>
                      <td className="px-5 py-3 text-neutral-700">{supplier.address || "—"}</td>
                      <td className="max-w-xs truncate px-5 py-3 text-neutral-600">{supplier.note || "—"}</td>
                      {canWrite ? (
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            className={adminButtonClass.quiet}
                            onClick={() =>
                              setEditing({
                                id: supplier.id,
                                draft: {
                                  name: supplier.name,
                                  phone: supplier.phone,
                                  address: supplier.address,
                                  note: supplier.note,
                                },
                              })
                            }
                          >
                            Edit
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-neutral-100 md:hidden">
              {rows.map((supplier) => (
                <li key={supplier.id} className="space-y-1 px-4 py-4">
                  <p className="font-semibold text-neutral-950">{supplier.name}</p>
                  <p className="text-sm text-neutral-700">{supplier.phone || "No phone"}</p>
                  <p className="text-sm text-neutral-600">{supplier.address || "No address"}</p>
                  {supplier.note ? <p className="text-sm text-neutral-600">{supplier.note}</p> : null}
                  {canWrite ? (
                    <button
                      type="button"
                      className={adminButtonClass.quiet}
                      onClick={() =>
                        setEditing({
                          id: supplier.id,
                          draft: {
                            name: supplier.name,
                            phone: supplier.phone,
                            address: supplier.address,
                            note: supplier.note,
                          },
                        })
                      }
                    >
                      Edit
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {rows ? (
          <InventoryPager
            page={page}
            pages={pages}
            total={total}
            pageSize={PAGE_SIZE}
            onPage={setPage}
          />
        ) : null}
      </section>

      {editing ? (
        <SupplierDialog
          id={editing.id}
          initial={editing.draft}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setReload((value) => value + 1);
            notify(message, "ok");
          }}
        />
      ) : null}
    </div>
  );
}

function SupplierDialog({
  id,
  initial,
  onClose,
  onSaved,
}: {
  id?: string;
  initial: Draft;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const titleId = useId();
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setNameError("Enter the supplier name.");
      return;
    }
    setNameError("");
    setBusy(true);
    setError("");
    try {
      await saveSupplier(
        {
          name: draft.name.trim(),
          phone: draft.phone.trim(),
          address: draft.address.trim(),
          note: draft.note.trim(),
        },
        id,
      );
      onSaved(id ? "Supplier updated." : "Supplier added.");
    } catch (reason) {
      setBusy(false);
      setError(reason instanceof MartApiError ? reason.message : "Could not save the supplier.");
    }
  }

  return (
    <InventoryDialog
      title={id ? "Edit supplier" : "New supplier"}
      titleId={titleId}
      onClose={onClose}
    >
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <div>
          <FieldLabel htmlFor="supplier-name">Name</FieldLabel>
          <input
            id="supplier-name"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            autoFocus
            required
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "supplier-name-error" : undefined}
            className={adminFieldClass}
          />
          {nameError ? (
            <p id="supplier-name-error" role="alert" className="mt-1.5 text-xs text-error">
              {nameError}
            </p>
          ) : null}
        </div>
        <div>
          <FieldLabel htmlFor="supplier-phone">Phone</FieldLabel>
          <input
            id="supplier-phone"
            value={draft.phone}
            onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
            autoComplete="tel"
            className={adminFieldClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="supplier-address">Address</FieldLabel>
          <textarea
            id="supplier-address"
            value={draft.address}
            onChange={(event) => setDraft({ ...draft, address: event.target.value })}
            rows={2}
            className={`${adminFieldClass} h-auto py-2.5`}
          />
        </div>
        <div>
          <FieldLabel htmlFor="supplier-note">Note</FieldLabel>
          <textarea
            id="supplier-note"
            value={draft.note}
            onChange={(event) => setDraft({ ...draft, note: event.target.value })}
            rows={3}
            className={`${adminFieldClass} h-auto py-2.5`}
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={adminButtonClass.secondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={adminButtonClass.primary} disabled={busy}>
            {busy ? "Saving…" : "Save supplier"}
          </button>
        </div>
      </form>
    </InventoryDialog>
  );
}
