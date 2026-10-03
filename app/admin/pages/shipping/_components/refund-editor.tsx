"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { getShippingRefund, saveShippingRefund, type ShippingRefund } from "@/lib/mart-api/shipping-refund";
import { blankStep, moveList, type RefundStep } from "@/lib/mart-mock/shipping-sections";
import { cn } from "@/lib/utils";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  AddButton,
  FormError,
  ItemToolbar,
  Labeled,
  setShippingQuery,
  ShippingHeader,
  ShippingIconPicker,
  ShippingModal,
  ShippingPanel,
  useReturnFocus,
  useShippingNav,
  VisibilitySwitch,
} from "./shipping-shared";

type Draft = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  heading: string;
  steps: RefundStep[];
  note: string;
};

function draftFrom(block: ShippingRefund): Draft {
  return {
    isActive: block.isActive !== false,
    icon: block.icon || "receipt_long",
    navLabel: block.navLabel,
    heading: block.heading,
    steps: block.steps.map((item) => ({ ...item, isActive: item.isActive !== false })),
    note: block.note,
  };
}

export function ShippingRefundEditor() {
  const [refund, setRefund] = useState<ShippingRefund | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useShippingNav();
  const editing = params.get("edit") === "refund";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getShippingRefund()
      .then((next) => {
        if (active) setRefund(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load the refund section.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setShippingQuery(router, pathname, open, "refund");
  }

  async function save(draft: Draft) {
    const saved = await saveShippingRefund({
      isActive: draft.isActive,
      icon: draft.icon,
      navLabel: draft.navLabel.trim(),
      heading: draft.heading.trim(),
      note: draft.note.trim(),
      steps: draft.steps.map((item) => ({
        id: item.id,
        title: item.title.trim(),
        body: item.body.trim(),
        isActive: item.isActive !== false,
      })),
    });
    setRefund(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!refund) {
    return (
      <div className="min-w-0 space-y-4">
        <ShippingHeader
          sectionId="refund"
          title="Refund"
          description="Refund steps and the note."
          editLabel="Edit refund"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the refund section…"}</p>
      </div>
    );
  }

  const empty = !refund.heading.trim() && !refund.note.trim() && refund.steps.length === 0;

  return (
    <div className="min-w-0 space-y-4">
      <ShippingHeader
        sectionId="refund"
        title="Refund"
        description="Refund steps and the note."
        editLabel="Edit refund"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <ShippingPanel
        headingId="shipping-refund-card"
        title="Refund"
        description={
          refund.isActive === false ? "Hidden on the shipping page." : "Numbered steps follow this order."
        }
        active={refund.isActive !== false}
      >
        {empty ? (
          <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
            <p className="text-sm font-semibold text-neutral-950">No refund copy yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">Add steps and a note.</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-neutral-950">
              {refund.heading.trim() || "Heading"}
            </p>
            <ol className="mt-3 space-y-2">
              {refund.steps.map((step, index) => (
                <li
                  key={step.id}
                  className={cn(
                    "rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-neutral-200",
                    step.isActive === false && "opacity-50",
                  )}
                >
                  {index + 1}. {step.title || "Step"}
                  {step.isActive === false ? " · Hidden" : ""}
                </li>
              ))}
            </ol>
          </>
        )}
      </ShippingPanel>
      {editing ? <RefundForm block={refund} onClose={() => setEditing(false)} onSave={save} /> : null}
    </div>
  );
}

function RefundForm({
  block,
  onClose,
  onSave,
}: {
  block: ShippingRefund;
  onClose: () => void;
  onSave: (draft: Draft) => void | Promise<void>;
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
    if (draft.steps.some((item) => !item.title.trim())) {
      setError("Every step needs a title.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Could not save the refund section.");
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <ShippingModal titleId="shipping-refund-modal" title="Edit refund" description="Numbers follow the order of the steps." size="lg" saving={saving} onClose={onClose} onSave={save}>
        <ActiveStatusField checked={draft.isActive} onChange={(isActive) => setDraft({ ...draft, isActive })} />
        <Labeled id={`${formId}-nav`} label="Sidebar label" value={draft.navLabel} onChange={(navLabel) => setDraft({ ...draft, navLabel })} />
        <ShippingIconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
        <Labeled id={`${formId}-heading`} label="Heading" required value={draft.heading} invalid={Boolean(error) && !draft.heading.trim()} onChange={(heading) => { setDraft({ ...draft, heading }); setError(""); }} />
        {draft.steps.map((step, index) => (
          <div key={step.id} className="rounded-2xl bg-admin-canvas p-3">
            <ItemToolbar index={index} total={draft.steps.length} noun="Step" onMove={(direction) => setDraft((current) => ({ ...current, steps: moveList(current.steps, index, direction) }))} onRemove={() => setDraft((current) => ({ ...current, steps: current.steps.filter((row) => row.id !== step.id) }))} />
            <div className="space-y-3">
              <Labeled id={`${formId}-title-${step.id}`} label="Title" required value={step.title} onChange={(title) => { setDraft((current) => ({ ...current, steps: current.steps.map((row) => row.id === step.id ? { ...row, title } : row) })); setError(""); }} />
              <Labeled id={`${formId}-body-${step.id}`} label="Body" value={step.body} multiline onChange={(body) => setDraft((current) => ({ ...current, steps: current.steps.map((row) => row.id === step.id ? { ...row, body } : row) }))} />
            </div>
            <VisibilitySwitch checked={step.isActive !== false} label={step.isActive !== false ? `Hide step ${index + 1}` : `Show step ${index + 1}`} onChange={(isActive) => setDraft((current) => ({ ...current, steps: current.steps.map((row) => row.id === step.id ? { ...row, isActive } : row) }))} />
          </div>
        ))}
        <AddButton label="Add step" onClick={() => setDraft((current) => ({ ...current, steps: [...current.steps, blankStep()] }))} />
        <Labeled id={`${formId}-note`} label="Note" value={draft.note} multiline onChange={(note) => setDraft({ ...draft, note })} />
        <FormError message={error} />
      </ShippingModal>
    </FormCloseGuard>
  );
}
