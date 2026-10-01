"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import {
  readShippingSections,
  saveShippingSections,
  type ShippingHeroContent,
} from "@/lib/mart-mock/shipping-sections";
import { useShippingSections } from "@/lib/mart-mock/hooks";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  FormError,
  Labeled,
  setShippingQuery,
  ShippingHeader,
  ShippingModal,
  ShippingPanel,
  useReturnFocus,
  useShippingNav,
} from "./shipping-shared";

type Draft = { isActive: boolean; eyebrow: string; title: string; subtitle: string };

function draftFrom(hero: ShippingHeroContent): Draft {
  return {
    isActive: hero.isActive !== false,
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
  };
}

export function ShippingHeroEditor() {
  const { hero } = useShippingSections();
  const params = useSearchParams();
  const { pathname, router } = useShippingNav();
  const editing = params.get("edit") === "hero";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setShippingQuery(router, pathname, open, "hero");
  }

  function save(draft: Draft) {
    const doc = readShippingSections();
    saveShippingSections({
      ...doc,
      hero: {
        isActive: draft.isActive,
        eyebrow: draft.eyebrow.trim(),
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      <ShippingHeader
        sectionId="hero"
        title="Hero"
        description="Opening copy."
        editLabel="Edit hero"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? <p role="status" className="text-sm font-medium text-emerald-800">{notice} This section is up to date.</p> : null}
      <ShippingPanel
        headingId="shipping-hero-card"
        title="Hero"
        description={hero.isActive === false ? "Hidden on the shipping page." : "Shown at the top of the shipping page."}
        active={hero.isActive !== false}
      >
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] px-4 py-8 text-center sm:px-8">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">{hero.eyebrow.trim() || "Eyebrow"}</p>
          <p className="mt-2 text-xl font-semibold text-white">{hero.title.trim() || "Title"}</p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/70">{hero.subtitle.trim() || "Subtitle"}</p>
        </div>
      </ShippingPanel>
      {editing ? <HeroForm hero={hero} onClose={() => setEditing(false)} onSave={save} /> : null}
    </div>
  );
}

function HeroForm({ hero, onClose, onSave }: { hero: ShippingHeroContent; onClose: () => void; onSave: (draft: Draft) => void }) {
  const initial = draftFrom(hero);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  function save() {
    if (saving) return;
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    onSave(draft);
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <ShippingModal titleId="shipping-hero-modal" title="Edit hero" description="The banner at the top of the page." saving={saving} onClose={onClose} onSave={save}>
        <ActiveStatusField checked={draft.isActive} onChange={(isActive) => setDraft({ ...draft, isActive })} />
        <Labeled id={`${formId}-eyebrow`} label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
        <Labeled id={`${formId}-title`} label="Title" required value={draft.title} invalid={Boolean(error)} onChange={(title) => { setDraft({ ...draft, title }); setError(""); }} />
        <Labeled id={`${formId}-subtitle`} label="Subtitle" value={draft.subtitle} multiline onChange={(subtitle) => setDraft({ ...draft, subtitle })} />
        <FormError message={error} />
      </ShippingModal>
    </FormCloseGuard>
  );
}
