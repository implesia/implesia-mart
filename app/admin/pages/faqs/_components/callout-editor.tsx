"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { getFaqCallout, saveFaqCallout, type FaqCallout } from "@/lib/mart-api/faq-callout";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  FaqCard,
  FaqHeader,
  FaqModal,
  FormError,
  Labeled,
  setFaqQuery,
  useFaqNav,
  useReturnFocus,
} from "./faq-shared";

type Draft = { isActive: boolean; eyebrow: string; body: string };

function draftFrom(callout: FaqCallout): Draft {
  return {
    isActive: callout.isActive !== false,
    eyebrow: callout.eyebrow,
    body: callout.body,
  };
}

export function FaqCalloutEditor() {
  const [callout, setCallout] = useState<FaqCallout | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useFaqNav();
  const editing = params.get("edit") === "callout";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getFaqCallout()
      .then((next) => {
        if (active) setCallout(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load the callout.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setFaqQuery(router, pathname, "edit", open ? "callout" : null);
  }

  async function save(draft: Draft) {
    const saved = await saveFaqCallout({
      isActive: draft.isActive,
      eyebrow: draft.eyebrow.trim(),
      body: draft.body.trim(),
    });
    setCallout(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!callout) {
    return (
      <div className="min-w-0 space-y-4">
        <FaqHeader
          sectionId="callout"
          title="Callout"
          description="Important note above the questions."
          editLabel="Edit callout"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the callout…"}</p>
      </div>
    );
  }

  const empty = !callout.eyebrow.trim() && !callout.body.trim();

  return (
    <div className="min-w-0 space-y-4">
      <FaqHeader
        sectionId="callout"
        title="Callout"
        description="Important note above the questions."
        editLabel="Edit callout"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <FaqCard
        headingId="faq-callout-card"
        title="Callout"
        description={
          callout.isActive === false
            ? "Hidden on the FAQ page."
            : "Shown above the question list."
        }
        active={callout.isActive !== false}
        empty={empty}
        emptyTitle="No callout yet"
        emptyBody="Add the note readers see above the questions."
      >
        <div className="flex gap-3 rounded-2xl border-l-4 border-primary bg-white p-4">
          <MaterialIcon name="info" filled className="mt-0.5 text-[20px] text-primary" />
          <div>
            <p className="text-xs font-semibold text-primary">
              {callout.eyebrow.trim() || "Eyebrow"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              {callout.body.trim() || "Note"}
            </p>
          </div>
        </div>
      </FaqCard>
      {editing ? (
        <CalloutForm callout={callout} onClose={() => setEditing(false)} onSave={save} />
      ) : null}
    </div>
  );
}

function CalloutForm({
  callout,
  onClose,
  onSave,
}: {
  callout: FaqCallout;
  onClose: () => void;
  onSave: (draft: Draft) => void | Promise<void>;
}) {
  const initial = draftFrom(callout);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  async function save() {
    if (saving) return;
    if (!draft.body.trim()) {
      setError("Note is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Could not save the callout.");
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <FaqModal
        titleId="faq-callout-modal-title"
        title="Edit callout"
        description="The note above the questions."
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
          id={`${formId}-body`}
          label="Note"
          required
          value={draft.body}
          multiline
          invalid={Boolean(error)}
          onChange={(body) => {
            setDraft({ ...draft, body });
            setError("");
          }}
        />
        <FormError message={error} />
      </FaqModal>
    </FormCloseGuard>
  );
}
