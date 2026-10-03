"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { getShippingHero, saveShippingHero, type ShippingHero } from "@/lib/mart-api/shipping-hero";

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

function draftFrom(hero: ShippingHero): Draft {
  return {
    isActive: hero.isActive !== false,
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
  };
}

export function ShippingHeroEditor() {
  const [hero, setHero] = useState<ShippingHero | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useShippingNav();
  const editing = params.get("edit") === "hero";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getShippingHero()
      .then((next) => {
        if (active) setHero(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load the hero.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setShippingQuery(router, pathname, open, "hero");
  }

  async function save(draft: Draft) {
    const saved = await saveShippingHero({
      isActive: draft.isActive,
      eyebrow: draft.eyebrow.trim(),
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
    });
    setHero(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!hero) {
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
        <p className="text-sm text-neutral-600">{loadError || "Loading the hero…"}</p>
      </div>
    );
  }

  const empty = !hero.eyebrow.trim() && !hero.title.trim() && !hero.subtitle.trim();

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
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <ShippingPanel
        headingId="shipping-hero-card"
        title="Hero"
        description={
          hero.isActive === false ? "Hidden on the shipping page." : "Shown at the top of the shipping page."
        }
        active={hero.isActive !== false}
      >
        {empty ? (
          <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
            <p className="text-sm font-semibold text-neutral-950">No hero content yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add the opening banner for the shipping page.
            </p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] px-4 py-8 text-center sm:px-8">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              {hero.eyebrow.trim() || "Eyebrow"}
            </p>
            <p className="mt-2 text-xl font-semibold text-white">{hero.title.trim() || "Title"}</p>
            <p className="mx-auto mt-2 max-w-lg text-sm text-white/70">
              {hero.subtitle.trim() || "Subtitle"}
            </p>
          </div>
        )}
      </ShippingPanel>
      {editing ? <HeroForm hero={hero} onClose={() => setEditing(false)} onSave={save} /> : null}
    </div>
  );
}

function HeroForm({
  hero,
  onClose,
  onSave,
}: {
  hero: ShippingHero;
  onClose: () => void;
  onSave: (draft: Draft) => void | Promise<void>;
}) {
  const initial = draftFrom(hero);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  async function save() {
    if (saving) return;
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Could not save the hero.");
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <ShippingModal
        titleId="shipping-hero-modal"
        title="Edit hero"
        description="The banner at the top of the page."
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <Labeled
          id={`${formId}-eyebrow`}
          label="Eyebrow"
          value={draft.eyebrow}
          onChange={(eyebrow) => setDraft({ ...draft, eyebrow })}
        />
        <Labeled
          id={`${formId}-title`}
          label="Title"
          required
          value={draft.title}
          invalid={Boolean(error)}
          onChange={(title) => {
            setDraft({ ...draft, title });
            setError("");
          }}
        />
        <Labeled
          id={`${formId}-subtitle`}
          label="Subtitle"
          value={draft.subtitle}
          multiline
          onChange={(subtitle) => setDraft({ ...draft, subtitle })}
        />
        <FormError message={error} />
      </ShippingModal>
    </FormCloseGuard>
  );
}
