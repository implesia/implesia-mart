"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import {
  getPrivacyCollection,
  savePrivacyCollection,
  type PrivacyCollection,
  type PrivacyCollectionCard,
} from "@/lib/mart-api/privacy-collection";
import { blankPrivacyCard, moveList } from "@/lib/mart-mock/privacy-sections";
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
  intro: string;
  cards: PrivacyCollectionCard[];
};

function draftFrom(block: PrivacyCollection): Draft {
  return {
    isActive: block.isActive !== false,
    icon: block.icon || "database",
    navLabel: block.navLabel,
    heading: block.heading,
    intro: block.intro,
    cards: block.cards.map((item) => ({
      ...item,
      isActive: item.isActive !== false,
    })),
  };
}

export function PrivacyCollectionEditor() {
  const [collection, setCollection] = useState<PrivacyCollection | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = usePrivacyNav();
  const editing = params.get("edit") === "collection";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getPrivacyCollection()
      .then((next) => {
        if (active) setCollection(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load the collection.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setPrivacyQuery(router, pathname, open, "collection");
  }

  async function save(draft: Draft) {
    const saved = await savePrivacyCollection({
      isActive: draft.isActive,
      icon: draft.icon,
      navLabel: draft.navLabel.trim(),
      heading: draft.heading.trim(),
      intro: draft.intro.trim(),
      cards: draft.cards.map((item) => ({
        id: item.id,
        icon: item.icon,
        title: item.title.trim(),
        description: item.description.trim(),
        isActive: item.isActive !== false,
      })),
    });
    setCollection(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!collection) {
    return (
      <div className="min-w-0 space-y-4">
        <PrivacyHeader
          sectionId="collection"
          title="Collection"
          description="What information is stored."
          editLabel="Edit collection"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the collection…"}</p>
      </div>
    );
  }

  const empty =
    !collection.heading.trim() && !collection.intro.trim() && collection.cards.length === 0;

  return (
    <div className="min-w-0 space-y-4">
      <PrivacyHeader
        sectionId="collection"
        title="Collection"
        description="What information is stored."
        editLabel="Edit collection"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <PrivacyPanel
        headingId="privacy-collection-card"
        title="Collection"
        description={
          collection.isActive === false
            ? "Hidden on the privacy page."
            : "The information cards."
        }
        active={collection.isActive !== false}
      >
        {empty ? (
          <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
            <p className="text-sm font-semibold text-neutral-950">No collection copy yet</p>
            <p className="mt-1 text-sm text-neutral-600">Add a heading, intro, and cards.</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-neutral-950">
              {collection.heading.trim() || "Heading"}
            </p>
            <ul className="mt-3 space-y-2">
              {collection.cards.map((card) => (
                <li
                  key={card.id}
                  className={cn(
                    "rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-neutral-200",
                    card.isActive === false && "opacity-50",
                  )}
                >
                  {card.title || "Card"}
                  {card.isActive === false ? " · Hidden" : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </PrivacyPanel>
      {editing ? (
        <CollectionForm block={collection} onClose={() => setEditing(false)} onSave={save} />
      ) : null}
    </div>
  );
}

function CollectionForm({
  block,
  onClose,
  onSave,
}: {
  block: PrivacyCollection;
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
    if (draft.cards.length > 12) {
      setError("You can add up to 12 cards.");
      return;
    }
    if (draft.cards.some((item) => !item.title.trim())) {
      setError("Every card needs a title.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the collection.");
      setSaving(false);
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <PrivacyModal
        titleId="privacy-collection-modal"
        title="Edit collection"
        description="The kinds of information that are stored."
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
        <PrivacyIconPicker
          value={draft.icon}
          onChange={(icon) => setDraft({ ...draft, icon })}
        />
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
          id={`${formId}-intro`}
          label="Intro"
          value={draft.intro}
          multiline
          onChange={(intro) => setDraft({ ...draft, intro })}
        />
        {draft.cards.map((card, index) => (
          <div key={card.id} className="rounded-2xl bg-admin-canvas p-3">
            <ItemToolbar
              index={index}
              total={draft.cards.length}
              noun="Card"
              onMove={(direction) =>
                setDraft((current) => ({
                  ...current,
                  cards: moveList(current.cards, index, direction),
                }))
              }
              onRemove={() =>
                setDraft((current) => ({
                  ...current,
                  cards: current.cards.filter((row) => row.id !== card.id),
                }))
              }
            />
            <div className="space-y-3">
              <PrivacyIconPicker
                value={card.icon}
                onChange={(icon) =>
                  setDraft((current) => ({
                    ...current,
                    cards: current.cards.map((row) =>
                      row.id === card.id ? { ...row, icon } : row,
                    ),
                  }))
                }
              />
              <Labeled
                id={`${formId}-title-${card.id}`}
                label="Title"
                required
                value={card.title}
                onChange={(title) => {
                  setDraft((current) => ({
                    ...current,
                    cards: current.cards.map((row) =>
                      row.id === card.id ? { ...row, title } : row,
                    ),
                  }));
                  setError("");
                }}
              />
              <Labeled
                id={`${formId}-body-${card.id}`}
                label="Description"
                value={card.description}
                multiline
                onChange={(description) =>
                  setDraft((current) => ({
                    ...current,
                    cards: current.cards.map((row) =>
                      row.id === card.id ? { ...row, description } : row,
                    ),
                  }))
                }
              />
            </div>
            <VisibilitySwitch
              checked={card.isActive !== false}
              label={
                card.isActive !== false
                  ? `Hide card ${index + 1}`
                  : `Show card ${index + 1}`
              }
              onChange={(isActive) =>
                setDraft((current) => ({
                  ...current,
                  cards: current.cards.map((row) =>
                    row.id === card.id ? { ...row, isActive } : row,
                  ),
                }))
              }
            />
          </div>
        ))}
        <AddButton
          label="Add card"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              cards: [...current.cards, { ...blankPrivacyCard("person_search"), isActive: true }],
            }))
          }
        />
        <FormError message={error} />
      </PrivacyModal>
    </FormCloseGuard>
  );
}
