"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import {
  getPrivacySharing,
  savePrivacySharing,
  type PrivacyChip,
  type PrivacySharing,
} from "@/lib/mart-api/privacy-sharing";
import { blankChip, moveList } from "@/lib/mart-mock/privacy-sections";
import { cn } from "@/lib/utils";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  AddButton,
  FormError,
  ItemToolbar,
  Labeled,
  PrivacyHeader,
  PrivacyIconPicker,
  PrivacyModal,
  PrivacyPanel,
  setPrivacyQuery,
  usePrivacyNav,
  useReturnFocus,
  VisibilitySwitch,
} from "./privacy-shared";

type Draft = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  heading: string;
  body: string;
  chips: PrivacyChip[];
};

function draftFrom(block: PrivacySharing): Draft {
  return {
    isActive: block.isActive !== false,
    icon: block.icon || "share",
    navLabel: block.navLabel,
    heading: block.heading,
    body: block.body,
    chips: block.chips.map((item) => ({
      ...item,
      isActive: item.isActive !== false,
    })),
  };
}

export function PrivacySharingEditor() {
  const [sharing, setSharing] = useState<PrivacySharing | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = usePrivacyNav();
  const editing = params.get("edit") === "sharing";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getPrivacySharing()
      .then((next) => {
        if (active) setSharing(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load the sharing section.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setPrivacyQuery(router, pathname, open, "sharing");
  }

  async function save(draft: Draft) {
    const saved = await savePrivacySharing({
      isActive: draft.isActive,
      icon: draft.icon,
      navLabel: draft.navLabel.trim(),
      heading: draft.heading.trim(),
      body: draft.body.trim(),
      chips: draft.chips.map((item) => ({
        id: item.id,
        label: item.label.trim(),
        isActive: item.isActive !== false,
      })),
    });
    setSharing(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!sharing) {
    return (
      <div className="min-w-0 space-y-4">
        <PrivacyHeader
          sectionId="sharing"
          title="Sharing"
          description="Limited sharing with courier and payment."
          editLabel="Edit sharing"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the sharing section…"}</p>
      </div>
    );
  }

  const empty = !sharing.heading.trim() && !sharing.body.trim() && sharing.chips.length === 0;

  return (
    <div className="min-w-0 space-y-4">
      <PrivacyHeader
        sectionId="sharing"
        title="Sharing"
        description="Limited sharing with courier and payment."
        editLabel="Edit sharing"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <PrivacyPanel
        headingId="privacy-sharing-card"
        title="Sharing"
        description={
          sharing.isActive === false
            ? "Hidden on the privacy page."
            : "The sharing paragraph and chips."
        }
        active={sharing.isActive !== false}
      >
        {empty ? (
          <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
            <p className="text-sm font-semibold text-neutral-950">No sharing copy yet</p>
            <p className="mt-1 text-sm text-neutral-600">Add a heading, a paragraph, and chips.</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-neutral-950">
              {sharing.heading.trim() || "Heading"}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {sharing.chips.map((chip) => (
                <li
                  key={chip.id}
                  className={cn(
                    "rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-neutral-200",
                    chip.isActive === false && "opacity-50",
                  )}
                >
                  {chip.label || "Chip"}
                  {chip.isActive === false ? " · Hidden" : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </PrivacyPanel>
      {editing ? (
        <SharingForm block={sharing} onClose={() => setEditing(false)} onSave={save} />
      ) : null}
    </div>
  );
}

function SharingForm({
  block,
  onClose,
  onSave,
}: {
  block: PrivacySharing;
  onClose: () => void;
  onSave: (draft: Draft) => Promise<void>;
}) {
  const initial = draftFrom(block);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  async function save() {
    if (saving) return;
    if (!draft.heading.trim()) {
      setError("Heading is required.");
      return;
    }
    if (draft.chips.length > 12) {
      setError("You can add up to 12 chips.");
      return;
    }
    if (draft.chips.some((item) => !item.label.trim())) {
      setError("Every chip needs a label, or remove the empty ones.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the sharing section.");
      setSaving(false);
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <PrivacyModal
        titleId="privacy-sharing-modal"
        title="Edit sharing"
        description="Who can receive limited information."
        size="lg"
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <Labeled
          id={`${formId}-nav`}
          label="Sidebar label"
          value={draft.navLabel}
          onChange={(navLabel) => setDraft({ ...draft, navLabel })}
        />
        <PrivacyIconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
        <Labeled
          id={`${formId}-heading`}
          label="Heading"
          required
          value={draft.heading}
          invalid={Boolean(error) && !draft.heading.trim()}
          onChange={(heading) => {
            setDraft({ ...draft, heading });
            setError("");
          }}
        />
        <Labeled
          id={`${formId}-body`}
          label="Body"
          value={draft.body}
          multiline
          onChange={(body) => setDraft({ ...draft, body })}
        />
        {draft.chips.map((chip, index) => (
          <div key={chip.id} className="rounded-2xl bg-admin-canvas p-3">
            <ItemToolbar
              index={index}
              total={draft.chips.length}
              noun="Chip"
              onMove={(direction) =>
                setDraft((current) => ({
                  ...current,
                  chips: moveList(current.chips, index, direction),
                }))
              }
              onRemove={() =>
                setDraft((current) => ({
                  ...current,
                  chips: current.chips.filter((row) => row.id !== chip.id),
                }))
              }
            />
            <Labeled
              id={`${formId}-chip-${chip.id}`}
              label="Label"
              required
              value={chip.label}
              onChange={(label) => {
                setDraft((current) => ({
                  ...current,
                  chips: current.chips.map((row) =>
                    row.id === chip.id ? { ...row, label } : row,
                  ),
                }));
                setError("");
              }}
            />
            <VisibilitySwitch
              checked={chip.isActive !== false}
              label={
                chip.isActive !== false ? `Hide chip ${index + 1}` : `Show chip ${index + 1}`
              }
              onChange={(isActive) =>
                setDraft((current) => ({
                  ...current,
                  chips: current.chips.map((row) =>
                    row.id === chip.id ? { ...row, isActive } : row,
                  ),
                }))
              }
            />
          </div>
        ))}
        <AddButton
          label="Add chip"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              chips: [...current.chips, { ...blankChip(), isActive: true }],
            }))
          }
        />
        <FormError message={error} />
      </PrivacyModal>
    </FormCloseGuard>
  );
}
