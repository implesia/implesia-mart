"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { getFaqHero, saveFaqHero, type FaqHero, type FaqHeroSearch } from "@/lib/mart-api/faq-hero";
import { blankFaqTrending, moveList } from "@/lib/mart-mock/faq-sections";
import { cn } from "@/lib/utils";

import { ActiveStatusField, adminButtonClass } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  FaqCard,
  FaqHeader,
  FaqModal,
  FormError,
  ItemToolbar,
  Labeled,
  setFaqQuery,
  useFaqNav,
  useReturnFocus,
  VisibilitySwitch,
} from "./faq-shared";

type Draft = {
  isActive: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  placeholder: string;
  searchLabel: string;
  clearLabel: string;
  trendingLabel: string;
  trending: FaqHeroSearch[];
};

function draftFrom(hero: FaqHero): Draft {
  return {
    isActive: hero.isActive !== false,
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
    placeholder: hero.placeholder,
    searchLabel: hero.searchLabel,
    clearLabel: hero.clearLabel,
    trendingLabel: hero.trendingLabel,
    trending: hero.trending.map((item) => ({ ...item, isActive: item.isActive !== false })),
  };
}

export function FaqHeroEditor() {
  const [hero, setHero] = useState<FaqHero | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useFaqNav();
  const editing = params.get("edit") === "hero";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getFaqHero()
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
    setFaqQuery(router, pathname, "edit", open ? "hero" : null);
  }

  async function save(draft: Draft) {
    const saved = await saveFaqHero({
      isActive: draft.isActive,
      eyebrow: draft.eyebrow.trim(),
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      placeholder: draft.placeholder.trim(),
      searchLabel: draft.searchLabel.trim(),
      clearLabel: draft.clearLabel.trim(),
      trendingLabel: draft.trendingLabel.trim(),
      trending: draft.trending.map((item) => ({
        id: item.id,
        label: item.label.trim(),
        isActive: item.isActive !== false,
      })),
    });
    setHero(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!hero) {
    return (
      <div className="min-w-0 space-y-4">
        <FaqHeader
          sectionId="hero"
          title="Hero"
          description="Opening copy, search, and quick searches."
          editLabel="Edit hero"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the hero…"}</p>
      </div>
    );
  }

  const empty = !hero.title.trim() && !hero.subtitle.trim();

  return (
    <div className="min-w-0 space-y-4">
      <FaqHeader
        sectionId="hero"
        title="Hero"
        description="Opening copy, search, and quick searches."
        editLabel="Edit hero"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <FaqCard
        headingId="faq-hero-card"
        title="Hero"
        description={
          hero.isActive === false
            ? "Hidden on the FAQ page, including search."
            : "Shown at the top of the FAQ page."
        }
        active={hero.isActive !== false}
        empty={empty}
        emptyTitle="No hero content yet"
        emptyBody="Add the heading and search for the FAQ page."
      >
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] px-4 py-8 text-center sm:px-8">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            {hero.eyebrow.trim() || "Eyebrow"}
          </p>
          <p className="mt-2 text-xl font-semibold text-white">{hero.title.trim() || "Title"}</p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-white/70">
            {hero.subtitle.trim() || "Subtitle"}
          </p>
          <p className="mx-auto mt-4 max-w-md rounded-full bg-white px-4 py-2.5 text-left text-sm text-neutral-500">
            {hero.placeholder.trim() || "Search"}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {hero.trending.map((item) => (
              <span
                key={item.id}
                className={cn(
                  "rounded-full border border-white/20 px-3 py-1 text-xs text-white",
                  item.isActive === false && "opacity-40",
                )}
              >
                {item.label || "Search"}
                {item.isActive === false ? " · Hidden" : ""}
              </span>
            ))}
          </div>
        </div>
      </FaqCard>
      {editing ? <HeroForm hero={hero} onClose={() => setEditing(false)} onSave={save} /> : null}
    </div>
  );
}

function HeroForm({
  hero,
  onClose,
  onSave,
}: {
  hero: FaqHero;
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
    if (draft.trending.length > 12) {
      setError("You can add up to 12 quick searches.");
      return;
    }
    if (draft.trending.some((item) => !item.label.trim())) {
      setError("Every quick search needs a word.");
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
      <FaqModal
        titleId="faq-hero-modal-title"
        title="Edit hero"
        description="The banner, search box, and quick searches."
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <p className="text-sm text-neutral-500">
          Turning this off hides the banner and the search box.
        </p>
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
          invalid={error === "Title is required."}
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled
            id={`${formId}-placeholder`}
            label="Search placeholder"
            value={draft.placeholder}
            onChange={(placeholder) => setDraft({ ...draft, placeholder })}
          />
          <Labeled
            id={`${formId}-trending-label`}
            label="Quick search label"
            value={draft.trendingLabel}
            onChange={(trendingLabel) => setDraft({ ...draft, trendingLabel })}
          />
          <Labeled
            id={`${formId}-search-label`}
            label="Search field label"
            value={draft.searchLabel}
            onChange={(searchLabel) => setDraft({ ...draft, searchLabel })}
          />
          <Labeled
            id={`${formId}-clear-label`}
            label="Clear search label"
            value={draft.clearLabel}
            onChange={(clearLabel) => setDraft({ ...draft, clearLabel })}
          />
        </div>
        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">Quick searches</h3>
          {draft.trending.length === 0 ? (
            <p className="rounded-2xl bg-admin-canvas px-4 py-8 text-center text-sm text-neutral-500">
              No quick searches yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {draft.trending.map((item, index) => (
                <li key={item.id} className="rounded-2xl bg-admin-canvas p-3">
                  <ItemToolbar
                    index={index}
                    total={draft.trending.length}
                    noun="Search"
                    onMove={(direction) =>
                      setDraft((current) => ({
                        ...current,
                        trending: moveList(current.trending, index, direction),
                      }))
                    }
                    onRemove={() =>
                      setDraft((current) => ({
                        ...current,
                        trending: current.trending.filter((chip) => chip.id !== item.id),
                      }))
                    }
                  />
                  <Labeled
                    id={`${formId}-${item.id}`}
                    label="Word"
                    required
                    value={item.label}
                    invalid={Boolean(error && !item.label.trim())}
                    onChange={(label) => {
                      setDraft((current) => ({
                        ...current,
                        trending: current.trending.map((chip) =>
                          chip.id === item.id ? { ...chip, label } : chip,
                        ),
                      }));
                      setError("");
                    }}
                  />
                  <VisibilitySwitch
                    checked={item.isActive !== false}
                    label={
                      item.isActive !== false
                        ? `Hide search ${index + 1}`
                        : `Show search ${index + 1}`
                    }
                    onChange={(isActive) =>
                      setDraft((current) => ({
                        ...current,
                        trending: current.trending.map((chip) =>
                          chip.id === item.id ? { ...chip, isActive } : chip,
                        ),
                      }))
                    }
                  />
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            disabled={draft.trending.length >= 12}
            onClick={() =>
              setDraft((current) => {
                if (current.trending.length >= 12) return current;
                const item = blankFaqTrending();
                return {
                  ...current,
                  trending: [
                    ...current.trending,
                    { id: item.id, label: item.label, isActive: true },
                  ],
                };
              })
            }
            className={adminButtonClass.secondary}
          >
            <MaterialIcon name="add" className="text-[18px]" />
            Add quick search
          </button>
        </section>
        <FormError message={error} />
      </FaqModal>
    </FormCloseGuard>
  );
}
