"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { getShippingFaq, saveShippingFaq, type ShippingFaq } from "@/lib/mart-api/shipping-faq";
import { blankShippingFaq, moveList, type ShippingFaqItem } from "@/lib/mart-mock/shipping-sections";
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
  ShippingModal,
  ShippingPanel,
  useReturnFocus,
  useShippingNav,
  VisibilitySwitch,
} from "./shipping-shared";

type Draft = {
  isActive: boolean;
  title: string;
  items: ShippingFaqItem[];
  moreBefore: string;
  moreLinkLabel: string;
  moreHref: string;
  moreAfter: string;
};

function draftFrom(faq: ShippingFaq): Draft {
  return {
    isActive: faq.isActive !== false,
    title: faq.title,
    items: faq.items.map((item) => ({ ...item, isActive: item.isActive !== false })),
    moreBefore: faq.moreBefore,
    moreLinkLabel: faq.moreLinkLabel,
    moreHref: faq.moreHref,
    moreAfter: faq.moreAfter,
  };
}

export function ShippingFaqEditor() {
  const [faq, setFaq] = useState<ShippingFaq | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useShippingNav();
  const editing = params.get("edit") === "faq";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getShippingFaq()
      .then((next) => {
        if (active) setFaq(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load the FAQ.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setShippingQuery(router, pathname, open, "faq");
  }

  async function save(draft: Draft) {
    const saved = await saveShippingFaq({
      isActive: draft.isActive,
      title: draft.title.trim(),
      moreBefore: draft.moreBefore.trim(),
      moreLinkLabel: draft.moreLinkLabel.trim(),
      moreHref: draft.moreHref.trim(),
      moreAfter: draft.moreAfter.trim(),
      items: draft.items.map((item) => ({
        id: item.id,
        question: item.question.trim(),
        answer: item.answer.trim(),
        isActive: item.isActive !== false,
      })),
    });
    setFaq(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!faq) {
    return (
      <div className="min-w-0 space-y-4">
        <ShippingHeader
          sectionId="faq"
          title="FAQ"
          description="Short questions on this page."
          editLabel="Edit FAQ"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the FAQ…"}</p>
      </div>
    );
  }

  const empty =
    !faq.title.trim() &&
    faq.items.length === 0 &&
    !faq.moreBefore.trim() &&
    !faq.moreLinkLabel.trim() &&
    !faq.moreAfter.trim();

  return (
    <div className="min-w-0 space-y-4">
      <ShippingHeader
        sectionId="faq"
        title="FAQ"
        description="Short questions on this page."
        editLabel="Edit FAQ"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <ShippingPanel
        headingId="shipping-faq-card"
        title="FAQ"
        description={
          faq.isActive === false ? "Hidden on the shipping page." : "Shown under the support banner."
        }
        active={faq.isActive !== false}
      >
        {empty ? (
          <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
            <p className="text-sm font-semibold text-neutral-950">No FAQ copy yet</p>
            <p className="mt-1 text-sm text-neutral-600">Add questions and a link.</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-neutral-950">{faq.title.trim() || "Questions"}</p>
            <ul className="mt-3 space-y-2">
              {faq.items.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-neutral-200",
                    item.isActive === false && "opacity-50",
                  )}
                >
                  {item.question || "Question"}
                  {item.isActive === false ? " · Hidden" : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </ShippingPanel>
      {editing ? <FaqForm faq={faq} onClose={() => setEditing(false)} onSave={save} /> : null}
    </div>
  );
}

function FaqForm({
  faq,
  onClose,
  onSave,
}: {
  faq: ShippingFaq;
  onClose: () => void;
  onSave: (draft: Draft) => Promise<void>;
}) {
  const initial = draftFrom(faq);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  async function save() {
    if (saving) return;
    if (draft.items.some((item) => !item.question.trim() || !item.answer.trim())) {
      setError("Every question needs a question and an answer.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the FAQ.");
      setSaving(false);
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <ShippingModal
        titleId="shipping-faq-modal"
        title="Edit FAQ"
        description="Short questions at the bottom of the page."
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
          id={`${formId}-title`}
          label="Title"
          value={draft.title}
          onChange={(title) => setDraft({ ...draft, title })}
        />
        <ul className="space-y-3">
          {draft.items.map((item, index) => (
            <li key={item.id} className="rounded-2xl bg-admin-canvas p-3">
              <ItemToolbar
                index={index}
                total={draft.items.length}
                noun="Question"
                onMove={(direction) =>
                  setDraft((current) => ({
                    ...current,
                    items: moveList(current.items, index, direction),
                  }))
                }
                onRemove={() =>
                  setDraft((current) => ({
                    ...current,
                    items: current.items.filter((row) => row.id !== item.id),
                  }))
                }
              />
              <div className="space-y-3">
                <Labeled
                  id={`${formId}-q-${item.id}`}
                  label="Question"
                  required
                  value={item.question}
                  onChange={(question) => {
                    setDraft((current) => ({
                      ...current,
                      items: current.items.map((row) =>
                        row.id === item.id ? { ...row, question } : row,
                      ),
                    }));
                    setError("");
                  }}
                />
                <Labeled
                  id={`${formId}-a-${item.id}`}
                  label="Answer"
                  required
                  value={item.answer}
                  multiline
                  onChange={(answer) => {
                    setDraft((current) => ({
                      ...current,
                      items: current.items.map((row) =>
                        row.id === item.id ? { ...row, answer } : row,
                      ),
                    }));
                    setError("");
                  }}
                />
              </div>
              <VisibilitySwitch
                checked={item.isActive !== false}
                label={
                  item.isActive !== false
                    ? `Hide question ${index + 1}`
                    : `Show question ${index + 1}`
                }
                onChange={(isActive) =>
                  setDraft((current) => ({
                    ...current,
                    items: current.items.map((row) =>
                      row.id === item.id ? { ...row, isActive } : row,
                    ),
                  }))
                }
              />
            </li>
          ))}
        </ul>
        <AddButton
          label="Add question"
          onClick={() =>
            setDraft((current) => ({ ...current, items: [...current.items, blankShippingFaq()] }))
          }
        />
        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">More questions link</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Labeled
              id={`${formId}-before`}
              label="Text before"
              value={draft.moreBefore}
              onChange={(moreBefore) => setDraft({ ...draft, moreBefore })}
            />
            <Labeled
              id={`${formId}-link`}
              label="Link label"
              value={draft.moreLinkLabel}
              onChange={(moreLinkLabel) => setDraft({ ...draft, moreLinkLabel })}
            />
            <Labeled
              id={`${formId}-href`}
              label="Link"
              value={draft.moreHref}
              onChange={(moreHref) => setDraft({ ...draft, moreHref })}
            />
            <Labeled
              id={`${formId}-after`}
              label="Text after"
              value={draft.moreAfter}
              onChange={(moreAfter) => setDraft({ ...draft, moreAfter })}
            />
          </div>
        </section>
        <FormError message={error} />
      </ShippingModal>
    </FormCloseGuard>
  );
}
