"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import {
  blankNote,
  blankRule,
  moveList,
  readShippingSections,
  saveShippingSections,
  type ReturnRule,
  type ReturnsBlock,
  type ShippingNote,
} from "@/lib/mart-mock/shipping-sections";
import { useShippingSections } from "@/lib/mart-mock/hooks";
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
  eligibilityTitle: string;
  eligibilityBody: string;
  rules: ReturnRule[];
  special: ShippingNote[];
};

function draftFrom(block: ReturnsBlock): Draft {
  return {
    isActive: block.isActive !== false,
    icon: block.icon,
    navLabel: block.navLabel,
    heading: block.heading,
    eligibilityTitle: block.eligibilityTitle,
    eligibilityBody: block.eligibilityBody,
    rules: block.rules.map((item) => ({ ...item, isActive: item.isActive !== false })),
    special: block.special.map((item) => ({ ...item, isActive: item.isActive !== false })),
  };
}

export function ShippingReturnsEditor() {
  const { returns } = useShippingSections();
  const params = useSearchParams();
  const { pathname, router } = useShippingNav();
  const editing = params.get("edit") === "returns";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setShippingQuery(router, pathname, open, "returns");
  }

  function save(draft: Draft) {
    const doc = readShippingSections();
    saveShippingSections({
      ...doc,
      returns: {
        isActive: draft.isActive,
        icon: draft.icon,
        navLabel: draft.navLabel.trim(),
        heading: draft.heading.trim(),
        eligibilityTitle: draft.eligibilityTitle.trim(),
        eligibilityBody: draft.eligibilityBody.trim(),
        rules: draft.rules.map((item) => ({ id: item.id, text: item.text.trim(), isActive: item.isActive !== false })),
        special: draft.special.map((item) => ({
          id: item.id,
          icon: item.icon,
          title: item.title.trim(),
          body: item.body.trim(),
          isActive: item.isActive !== false,
        })),
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      <ShippingHeader sectionId="returns" title="Returns" description="3-day return rules and exceptions." editLabel="Edit returns" onEdit={() => setEditing(true)} editRef={focusEdit} />
      {notice ? <p role="status" className="text-sm font-medium text-emerald-800">{notice} This section is up to date.</p> : null}
      <ShippingPanel headingId="shipping-returns-card" title="Returns" description={returns.isActive === false ? "Hidden on the shipping page." : "Eligibility, rules, and special notes."} active={returns.isActive !== false}>
        <p className="text-sm font-semibold text-neutral-950">{returns.heading.trim() || "Heading"}</p>
        <ul className="mt-3 space-y-2">
          {returns.rules.map((rule) => (
            <li key={rule.id} className={cn("rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-neutral-200", rule.isActive === false && "opacity-50")}>
              {rule.text || "Rule"}
              {rule.isActive === false ? " · Hidden" : ""}
            </li>
          ))}
        </ul>
      </ShippingPanel>
      {editing ? <ReturnsForm block={returns} onClose={() => setEditing(false)} onSave={save} /> : null}
    </div>
  );
}

function ReturnsForm({ block, onClose, onSave }: { block: ReturnsBlock; onClose: () => void; onSave: (draft: Draft) => void }) {
  const initial = draftFrom(block);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  function save() {
    if (saving) return;
    if (!draft.heading.trim()) {
      setError("Heading is required.");
      return;
    }
    if (draft.rules.some((item) => !item.text.trim()) || draft.special.some((item) => !item.title.trim())) {
      setError("Fill in every rule and note, or remove the empty ones.");
      return;
    }
    setSaving(true);
    onSave(draft);
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <ShippingModal titleId="shipping-returns-modal" title="Edit returns" description="Eligibility, rules, and special notes." size="lg" saving={saving} onClose={onClose} onSave={save}>
        <ActiveStatusField checked={draft.isActive} onChange={(isActive) => setDraft({ ...draft, isActive })} />
        <Labeled id={`${formId}-nav`} label="Sidebar label" value={draft.navLabel} onChange={(navLabel) => setDraft({ ...draft, navLabel })} />
        <ShippingIconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
        <Labeled id={`${formId}-heading`} label="Heading" required value={draft.heading} invalid={Boolean(error) && !draft.heading.trim()} onChange={(heading) => { setDraft({ ...draft, heading }); setError(""); }} />
        <Labeled id={`${formId}-eligibility`} label="Eligibility title" value={draft.eligibilityTitle} onChange={(eligibilityTitle) => setDraft({ ...draft, eligibilityTitle })} />
        <Labeled id={`${formId}-eligibility-body`} label="Eligibility body" value={draft.eligibilityBody} multiline onChange={(eligibilityBody) => setDraft({ ...draft, eligibilityBody })} />
        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">Rules</h3>
          {draft.rules.map((rule, index) => (
            <div key={rule.id} className="rounded-2xl bg-admin-canvas p-3">
              <ItemToolbar index={index} total={draft.rules.length} noun="Rule" onMove={(direction) => setDraft((current) => ({ ...current, rules: moveList(current.rules, index, direction) }))} onRemove={() => setDraft((current) => ({ ...current, rules: current.rules.filter((row) => row.id !== rule.id) }))} />
              <Labeled id={`${formId}-rule-${rule.id}`} label="Rule" required value={rule.text} multiline onChange={(text) => { setDraft((current) => ({ ...current, rules: current.rules.map((row) => row.id === rule.id ? { ...row, text } : row) })); setError(""); }} />
              <VisibilitySwitch checked={rule.isActive !== false} label={rule.isActive !== false ? `Hide rule ${index + 1}` : `Show rule ${index + 1}`} onChange={(isActive) => setDraft((current) => ({ ...current, rules: current.rules.map((row) => row.id === rule.id ? { ...row, isActive } : row) }))} />
            </div>
          ))}
          <AddButton label="Add rule" onClick={() => setDraft((current) => ({ ...current, rules: [...current.rules, blankRule()] }))} />
        </section>
        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">Special notes</h3>
          {draft.special.map((note, index) => (
            <div key={note.id} className="rounded-2xl bg-admin-canvas p-3">
              <ItemToolbar index={index} total={draft.special.length} noun="Note" onMove={(direction) => setDraft((current) => ({ ...current, special: moveList(current.special, index, direction) }))} onRemove={() => setDraft((current) => ({ ...current, special: current.special.filter((row) => row.id !== note.id) }))} />
              <div className="space-y-3">
                <ShippingIconPicker value={note.icon} onChange={(icon) => setDraft((current) => ({ ...current, special: current.special.map((row) => row.id === note.id ? { ...row, icon } : row) }))} />
                <Labeled id={`${formId}-special-title-${note.id}`} label="Title" required value={note.title} onChange={(title) => { setDraft((current) => ({ ...current, special: current.special.map((row) => row.id === note.id ? { ...row, title } : row) })); setError(""); }} />
                <Labeled id={`${formId}-special-body-${note.id}`} label="Body" value={note.body} multiline onChange={(body) => setDraft((current) => ({ ...current, special: current.special.map((row) => row.id === note.id ? { ...row, body } : row) }))} />
              </div>
              <VisibilitySwitch checked={note.isActive !== false} label={note.isActive !== false ? `Hide note ${index + 1}` : `Show note ${index + 1}`} onChange={(isActive) => setDraft((current) => ({ ...current, special: current.special.map((row) => row.id === note.id ? { ...row, isActive } : row) }))} />
            </div>
          ))}
          <AddButton label="Add note" onClick={() => setDraft((current) => ({ ...current, special: [...current.special, blankNote()] }))} />
        </section>
        <FormError message={error} />
      </ShippingModal>
    </FormCloseGuard>
  );
}
