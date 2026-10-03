"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import {
  getPrivacyIntroduction,
  savePrivacyIntroduction,
  type PrivacyIntroduction,
} from "@/lib/mart-api/privacy-introduction";
import { blankParagraph, moveList, type PrivacyParagraph } from "@/lib/mart-mock/privacy-sections";
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
  paragraphs: PrivacyParagraph[];
};

function draftFrom(block: PrivacyIntroduction): Draft {
  return {
    isActive: block.isActive !== false,
    icon: block.icon || "info",
    navLabel: block.navLabel,
    heading: block.heading,
    paragraphs: block.paragraphs.map((item) => ({
      ...item,
      isActive: item.isActive !== false,
    })),
  };
}

export function PrivacyIntroductionEditor() {
  const [introduction, setIntroduction] = useState<PrivacyIntroduction | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = usePrivacyNav();
  const editing = params.get("edit") === "introduction";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getPrivacyIntroduction()
      .then((next) => {
        if (active) setIntroduction(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load the introduction.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setPrivacyQuery(router, pathname, open, "introduction");
  }

  async function save(draft: Draft) {
    const saved = await savePrivacyIntroduction({
      isActive: draft.isActive,
      icon: draft.icon,
      navLabel: draft.navLabel.trim(),
      heading: draft.heading.trim(),
      paragraphs: draft.paragraphs.map((item) => ({
        id: item.id,
        text: item.text.trim(),
        isActive: item.isActive !== false,
      })),
    });
    setIntroduction(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!introduction) {
    return (
      <div className="min-w-0 space-y-4">
        <PrivacyHeader
          sectionId="introduction"
          title="Introduction"
          description="What the policy covers."
          editLabel="Edit introduction"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the introduction…"}</p>
      </div>
    );
  }

  const empty = !introduction.heading.trim() && introduction.paragraphs.length === 0;

  return (
    <div className="min-w-0 space-y-4">
      <PrivacyHeader
        sectionId="introduction"
        title="Introduction"
        description="What the policy covers."
        editLabel="Edit introduction"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <PrivacyPanel
        headingId="privacy-intro-card"
        title="Introduction"
        description={
          introduction.isActive === false
            ? "Hidden on the privacy page."
            : "The first block under the sidebar."
        }
        active={introduction.isActive !== false}
      >
        {empty ? (
          <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
            <p className="text-sm font-semibold text-neutral-950">No introduction copy yet</p>
            <p className="mt-1 text-sm text-neutral-600">Add a heading and paragraphs.</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-neutral-950">
              {introduction.heading.trim() || "Heading"}
            </p>
            <ul className="mt-3 space-y-2">
              {introduction.paragraphs.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-neutral-200",
                    item.isActive === false && "opacity-50",
                  )}
                >
                  {item.text || "Paragraph"}
                  {item.isActive === false ? " · Hidden" : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </PrivacyPanel>
      {editing ? (
        <IntroForm block={introduction} onClose={() => setEditing(false)} onSave={save} />
      ) : null}
    </div>
  );
}

function IntroForm({
  block,
  onClose,
  onSave,
}: {
  block: PrivacyIntroduction;
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
    if (draft.paragraphs.some((item) => !item.text.trim())) {
      setError("Every paragraph needs text, or remove the empty ones.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the introduction.");
      setSaving(false);
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <PrivacyModal
        titleId="privacy-intro-modal"
        title="Edit introduction"
        description="The opening paragraphs."
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
        {draft.paragraphs.map((item, index) => (
          <div key={item.id} className="rounded-2xl bg-admin-canvas p-3">
            <ItemToolbar
              index={index}
              total={draft.paragraphs.length}
              noun="Paragraph"
              onMove={(direction) =>
                setDraft((current) => ({
                  ...current,
                  paragraphs: moveList(current.paragraphs, index, direction),
                }))
              }
              onRemove={() =>
                setDraft((current) => ({
                  ...current,
                  paragraphs: current.paragraphs.filter((row) => row.id !== item.id),
                }))
              }
            />
            <Labeled
              id={`${formId}-text-${item.id}`}
              label="Paragraph"
              required
              value={item.text}
              multiline
              onChange={(text) => {
                setDraft((current) => ({
                  ...current,
                  paragraphs: current.paragraphs.map((row) =>
                    row.id === item.id ? { ...row, text } : row,
                  ),
                }));
                setError("");
              }}
            />
            <VisibilitySwitch
              checked={item.isActive !== false}
              label={
                item.isActive !== false
                  ? `Hide paragraph ${index + 1}`
                  : `Show paragraph ${index + 1}`
              }
              onChange={(isActive) =>
                setDraft((current) => ({
                  ...current,
                  paragraphs: current.paragraphs.map((row) =>
                    row.id === item.id ? { ...row, isActive } : row,
                  ),
                }))
              }
            />
          </div>
        ))}
        <AddButton
          label="Add paragraph"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              paragraphs: [...current.paragraphs, blankParagraph()],
            }))
          }
        />
        <FormError message={error} />
      </PrivacyModal>
    </FormCloseGuard>
  );
}
