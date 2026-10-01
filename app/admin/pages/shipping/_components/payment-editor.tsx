"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import {
  blankPaymentCard,
  moveList,
  readShippingSections,
  saveShippingSections,
  type PaymentBlock,
  type PaymentCardItem,
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
  intro: string;
  cards: PaymentCardItem[];
};

function draftFrom(block: PaymentBlock): Draft {
  return {
    isActive: block.isActive !== false,
    icon: block.icon,
    navLabel: block.navLabel,
    heading: block.heading,
    intro: block.intro,
    cards: block.cards.map((item) => ({ ...item, isActive: item.isActive !== false })),
  };
}

export function ShippingPaymentEditor() {
  const { payment } = useShippingSections();
  const params = useSearchParams();
  const { pathname, router } = useShippingNav();
  const editing = params.get("edit") === "payment";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setShippingQuery(router, pathname, open, "payment");
  }

  function save(draft: Draft) {
    const doc = readShippingSections();
    saveShippingSections({
      ...doc,
      payment: {
        isActive: draft.isActive,
        icon: draft.icon,
        navLabel: draft.navLabel.trim(),
        heading: draft.heading.trim(),
        intro: draft.intro.trim(),
        cards: draft.cards.map((item) => ({
          id: item.id,
          icon: item.icon,
          badge: item.badge.trim(),
          title: item.title.trim(),
          body: item.body.trim(),
          footnote: item.footnote.trim(),
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
      <ShippingHeader sectionId="payment" title="Payment" description="Cash on delivery and mobile banking." editLabel="Edit payment" onEdit={() => setEditing(true)} editRef={focusEdit} />
      {notice ? <p role="status" className="text-sm font-medium text-emerald-800">{notice} This section is up to date.</p> : null}
      <ShippingPanel headingId="shipping-payment-card" title="Payment" description={payment.isActive === false ? "Hidden on the shipping page." : "Payment cards under shipping."} active={payment.isActive !== false}>
        <p className="text-sm font-semibold text-neutral-950">{payment.heading.trim() || "Heading"}</p>
        <ul className="mt-3 space-y-2">
          {payment.cards.map((card) => (
            <li key={card.id} className={cn("rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-neutral-200", card.isActive === false && "opacity-50")}>
              {card.title || "Card"}
              {card.isActive === false ? " · Hidden" : ""}
            </li>
          ))}
        </ul>
      </ShippingPanel>
      {editing ? <PaymentForm block={payment} onClose={() => setEditing(false)} onSave={save} /> : null}
    </div>
  );
}

function PaymentForm({ block, onClose, onSave }: { block: PaymentBlock; onClose: () => void; onSave: (draft: Draft) => void }) {
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
    if (draft.cards.some((item) => !item.title.trim())) {
      setError("Every card needs a title.");
      return;
    }
    setSaving(true);
    onSave(draft);
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <ShippingModal titleId="shipping-payment-modal" title="Edit payment" description="Cash on delivery and other payment cards." size="lg" saving={saving} onClose={onClose} onSave={save}>
        <ActiveStatusField checked={draft.isActive} onChange={(isActive) => setDraft({ ...draft, isActive })} />
        <Labeled id={`${formId}-nav`} label="Sidebar label" value={draft.navLabel} onChange={(navLabel) => setDraft({ ...draft, navLabel })} />
        <ShippingIconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
        <Labeled id={`${formId}-heading`} label="Heading" required value={draft.heading} invalid={Boolean(error) && !draft.heading.trim()} onChange={(heading) => { setDraft({ ...draft, heading }); setError(""); }} />
        <Labeled id={`${formId}-intro`} label="Intro" value={draft.intro} multiline onChange={(intro) => setDraft({ ...draft, intro })} />
        {draft.cards.map((card, index) => (
          <div key={card.id} className="rounded-2xl bg-admin-canvas p-3">
            <ItemToolbar index={index} total={draft.cards.length} noun="Card" onMove={(direction) => setDraft((current) => ({ ...current, cards: moveList(current.cards, index, direction) }))} onRemove={() => setDraft((current) => ({ ...current, cards: current.cards.filter((row) => row.id !== card.id) }))} />
            <div className="space-y-3">
              <ShippingIconPicker value={card.icon} onChange={(icon) => setDraft((current) => ({ ...current, cards: current.cards.map((row) => row.id === card.id ? { ...row, icon } : row) }))} />
              <Labeled id={`${formId}-badge-${card.id}`} label="Badge" value={card.badge} onChange={(badge) => setDraft((current) => ({ ...current, cards: current.cards.map((row) => row.id === card.id ? { ...row, badge } : row) }))} />
              <Labeled id={`${formId}-title-${card.id}`} label="Title" required value={card.title} onChange={(title) => { setDraft((current) => ({ ...current, cards: current.cards.map((row) => row.id === card.id ? { ...row, title } : row) })); setError(""); }} />
              <Labeled id={`${formId}-body-${card.id}`} label="Body" value={card.body} multiline onChange={(body) => setDraft((current) => ({ ...current, cards: current.cards.map((row) => row.id === card.id ? { ...row, body } : row) }))} />
              <Labeled id={`${formId}-note-${card.id}`} label="Footnote" value={card.footnote} onChange={(footnote) => setDraft((current) => ({ ...current, cards: current.cards.map((row) => row.id === card.id ? { ...row, footnote } : row) }))} />
            </div>
            <VisibilitySwitch checked={card.isActive !== false} label={card.isActive !== false ? `Hide card ${index + 1}` : `Show card ${index + 1}`} onChange={(isActive) => setDraft((current) => ({ ...current, cards: current.cards.map((row) => row.id === card.id ? { ...row, isActive } : row) }))} />
          </div>
        ))}
        <AddButton label="Add card" onClick={() => setDraft((current) => ({ ...current, cards: [...current.cards, blankPaymentCard()] }))} />
        <FormError message={error} />
      </ShippingModal>
    </FormCloseGuard>
  );
}
