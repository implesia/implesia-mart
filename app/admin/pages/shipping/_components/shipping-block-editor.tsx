"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { getShippingBlock, saveShippingBlock, type ShippingBlock } from "@/lib/mart-api/shipping-block";
import {
  blankNote,
  blankShippingCard,
  blankTimeline,
  moveList,
  type ShippingCard,
  type ShippingNote,
  type ShippingTimelineItem,
} from "@/lib/mart-mock/shipping-sections";
import { cn } from "@/lib/utils";

import { ActiveStatusField, FieldLabel } from "../../../_components/admin-ui";
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
  intro: string;
  cards: ShippingCard[];
  timelinesTitle: string;
  timelines: ShippingTimelineItem[];
  notes: ShippingNote[];
};

function draftFrom(block: ShippingBlock): Draft {
  return {
    isActive: block.isActive !== false,
    icon: block.icon || "local_shipping",
    navLabel: block.navLabel,
    heading: block.heading,
    intro: block.intro,
    cards: block.cards.map((item) => ({ ...item, isActive: item.isActive !== false })),
    timelinesTitle: block.timelinesTitle,
    timelines: block.timelines.map((item) => ({ ...item, isActive: item.isActive !== false })),
    notes: block.notes.map((item) => ({ ...item, isActive: item.isActive !== false })),
  };
}

export function ShippingBlockEditor() {
  const [shipping, setShipping] = useState<ShippingBlock | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useShippingNav();
  const editing = params.get("edit") === "shipping";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getShippingBlock()
      .then((next) => {
        if (active) setShipping(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load the shipping section.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setShippingQuery(router, pathname, open, "shipping");
  }

  async function save(draft: Draft) {
    const saved = await saveShippingBlock({
      isActive: draft.isActive,
      icon: draft.icon,
      navLabel: draft.navLabel.trim(),
      heading: draft.heading.trim(),
      intro: draft.intro.trim(),
      cards: draft.cards.map((item) => ({
        ...item,
        eyebrow: item.eyebrow.trim(),
        title: item.title.trim(),
        body: item.body.trim(),
        isActive: item.isActive !== false,
      })),
      timelinesTitle: draft.timelinesTitle.trim(),
      timelines: draft.timelines.map((item) => ({
        id: item.id,
        label: item.label.trim(),
        value: item.value.trim(),
        isActive: item.isActive !== false,
      })),
      notes: draft.notes.map((item) => ({
        id: item.id,
        icon: item.icon,
        title: item.title.trim(),
        body: item.body.trim(),
        isActive: item.isActive !== false,
      })),
    });
    setShipping(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!shipping) {
    return (
      <div className="min-w-0 space-y-4">
        <ShippingHeader
          sectionId="shipping"
          title="Shipping"
          description="Coverage, timelines, and notes."
          editLabel="Edit shipping"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the shipping section…"}</p>
      </div>
    );
  }

  const empty =
    !shipping.heading.trim() &&
    !shipping.intro.trim() &&
    shipping.cards.length === 0 &&
    shipping.timelines.length === 0 &&
    shipping.notes.length === 0;

  return (
    <div className="min-w-0 space-y-4">
      <ShippingHeader
        sectionId="shipping"
        title="Shipping"
        description="Coverage, timelines, and notes."
        editLabel="Edit shipping"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <ShippingPanel
        headingId="shipping-block-card"
        title="Shipping"
        description={
          shipping.isActive === false
            ? "Hidden on the shipping page."
            : "Coverage cards, delivery times, and notes."
        }
        active={shipping.isActive !== false}
      >
        {empty ? (
          <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
            <p className="text-sm font-semibold text-neutral-950">No shipping copy yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add coverage, delivery times, and notes.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-neutral-950">
              {shipping.heading.trim() || "Heading"}
            </p>
            <p className="mt-1 text-sm text-neutral-600">{shipping.intro}</p>
            <ul className="mt-3 space-y-2">
              {shipping.cards.map((card) => (
                <li
                  key={card.id}
                  className={cn(
                    "rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-neutral-200",
                    card.isActive === false && "opacity-50",
                  )}
                >
                  {card.title || "Card"}
                  {card.variant === "primary" ? " · Highlighted" : ""}
                  {card.isActive === false ? " · Hidden" : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </ShippingPanel>
      {editing ? <BlockForm block={shipping} onClose={() => setEditing(false)} onSave={save} /> : null}
    </div>
  );
}

function BlockForm({
  block,
  onClose,
  onSave,
}: {
  block: ShippingBlock;
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
    const incomplete =
      draft.cards.some((item) => !item.title.trim()) ||
      draft.timelines.some((item) => !item.label.trim() || !item.value.trim()) ||
      draft.notes.some((item) => !item.title.trim());
    if (incomplete) {
      setError("Fill in every card, time, and note, or remove the empty ones.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Could not save the shipping section.");
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <ShippingModal titleId="shipping-block-modal" title="Edit shipping" description="Coverage, delivery times, and notes." size="lg" saving={saving} onClose={onClose} onSave={save}>
        <ActiveStatusField checked={draft.isActive} onChange={(isActive) => setDraft({ ...draft, isActive })} />
        <Labeled id={`${formId}-nav`} label="Sidebar label" value={draft.navLabel} onChange={(navLabel) => setDraft({ ...draft, navLabel })} />
        <ShippingIconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
        <Labeled id={`${formId}-heading`} label="Heading" required value={draft.heading} invalid={Boolean(error) && !draft.heading.trim()} onChange={(heading) => { setDraft({ ...draft, heading }); setError(""); }} />
        <Labeled id={`${formId}-intro`} label="Intro" value={draft.intro} multiline onChange={(intro) => setDraft({ ...draft, intro })} />

        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">Cards</h3>
          {draft.cards.map((card, index) => (
            <div key={card.id} className="rounded-2xl bg-admin-canvas p-3">
              <ItemToolbar index={index} total={draft.cards.length} noun="Card" onMove={(direction) => setDraft((current) => ({ ...current, cards: moveList(current.cards, index, direction) }))} onRemove={() => setDraft((current) => ({ ...current, cards: current.cards.filter((row) => row.id !== card.id) }))} />
              <div className="space-y-3">
                <ShippingIconPicker value={card.icon} onChange={(icon) => setDraft((current) => ({ ...current, cards: current.cards.map((row) => row.id === card.id ? { ...row, icon } : row) }))} />
                <Labeled id={`${formId}-eyebrow-${card.id}`} label="Eyebrow" value={card.eyebrow} onChange={(eyebrow) => setDraft((current) => ({ ...current, cards: current.cards.map((row) => row.id === card.id ? { ...row, eyebrow } : row) }))} />
                <Labeled id={`${formId}-title-${card.id}`} label="Title" required value={card.title} onChange={(title) => { setDraft((current) => ({ ...current, cards: current.cards.map((row) => row.id === card.id ? { ...row, title } : row) })); setError(""); }} />
                <Labeled id={`${formId}-body-${card.id}`} label="Body" value={card.body} multiline onChange={(body) => setDraft((current) => ({ ...current, cards: current.cards.map((row) => row.id === card.id ? { ...row, body } : row) }))} />
                <div>
                  <FieldLabel htmlFor={`${formId}-variant-${card.id}`}>Style</FieldLabel>
                  <select
                    id={`${formId}-variant-${card.id}`}
                    value={card.variant}
                    onChange={(event) => setDraft((current) => ({ ...current, cards: current.cards.map((row) => row.id === card.id ? { ...row, variant: event.target.value === "primary" ? "primary" : "default" } : row) }))}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                  >
                    <option value="default">Plain</option>
                    <option value="primary">Highlighted</option>
                  </select>
                </div>
              </div>
              <VisibilitySwitch checked={card.isActive !== false} label={card.isActive !== false ? `Hide card ${index + 1}` : `Show card ${index + 1}`} onChange={(isActive) => setDraft((current) => ({ ...current, cards: current.cards.map((row) => row.id === card.id ? { ...row, isActive } : row) }))} />
            </div>
          ))}
          <AddButton label="Add card" onClick={() => setDraft((current) => ({ ...current, cards: [...current.cards, blankShippingCard()] }))} />
        </section>

        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">Delivery times</h3>
          <Labeled id={`${formId}-times`} label="Times heading" value={draft.timelinesTitle} onChange={(timelinesTitle) => setDraft({ ...draft, timelinesTitle })} />
          {draft.timelines.map((item, index) => (
            <div key={item.id} className="rounded-2xl bg-admin-canvas p-3">
              <ItemToolbar index={index} total={draft.timelines.length} noun="Time" onMove={(direction) => setDraft((current) => ({ ...current, timelines: moveList(current.timelines, index, direction) }))} onRemove={() => setDraft((current) => ({ ...current, timelines: current.timelines.filter((row) => row.id !== item.id) }))} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Labeled id={`${formId}-label-${item.id}`} label="Label" required value={item.label} onChange={(label) => { setDraft((current) => ({ ...current, timelines: current.timelines.map((row) => row.id === item.id ? { ...row, label } : row) })); setError(""); }} />
                <Labeled id={`${formId}-value-${item.id}`} label="Value" required value={item.value} onChange={(value) => { setDraft((current) => ({ ...current, timelines: current.timelines.map((row) => row.id === item.id ? { ...row, value } : row) })); setError(""); }} />
              </div>
              <VisibilitySwitch checked={item.isActive !== false} label={item.isActive !== false ? `Hide time ${index + 1}` : `Show time ${index + 1}`} onChange={(isActive) => setDraft((current) => ({ ...current, timelines: current.timelines.map((row) => row.id === item.id ? { ...row, isActive } : row) }))} />
            </div>
          ))}
          <AddButton label="Add time" onClick={() => setDraft((current) => ({ ...current, timelines: [...current.timelines, blankTimeline()] }))} />
        </section>

        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">Notes</h3>
          {draft.notes.map((note, index) => (
            <div key={note.id} className="rounded-2xl bg-admin-canvas p-3">
              <ItemToolbar index={index} total={draft.notes.length} noun="Note" onMove={(direction) => setDraft((current) => ({ ...current, notes: moveList(current.notes, index, direction) }))} onRemove={() => setDraft((current) => ({ ...current, notes: current.notes.filter((row) => row.id !== note.id) }))} />
              <div className="space-y-3">
                <ShippingIconPicker value={note.icon} onChange={(icon) => setDraft((current) => ({ ...current, notes: current.notes.map((row) => row.id === note.id ? { ...row, icon } : row) }))} />
                <Labeled id={`${formId}-note-title-${note.id}`} label="Title" required value={note.title} onChange={(title) => { setDraft((current) => ({ ...current, notes: current.notes.map((row) => row.id === note.id ? { ...row, title } : row) })); setError(""); }} />
                <Labeled id={`${formId}-note-body-${note.id}`} label="Body" value={note.body} multiline onChange={(body) => setDraft((current) => ({ ...current, notes: current.notes.map((row) => row.id === note.id ? { ...row, body } : row) }))} />
              </div>
              <VisibilitySwitch checked={note.isActive !== false} label={note.isActive !== false ? `Hide note ${index + 1}` : `Show note ${index + 1}`} onChange={(isActive) => setDraft((current) => ({ ...current, notes: current.notes.map((row) => row.id === note.id ? { ...row, isActive } : row) }))} />
            </div>
          ))}
          <AddButton label="Add note" onClick={() => setDraft((current) => ({ ...current, notes: [...current.notes, blankNote()] }))} />
        </section>
        <FormError message={error} />
      </ShippingModal>
    </FormCloseGuard>
  );
}
