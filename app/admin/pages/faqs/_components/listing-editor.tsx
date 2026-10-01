"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import {
  readFaqSections,
  saveFaqSections,
  type FaqListingContent,
} from "@/lib/mart-mock/faq-sections";
import { useFaqSections } from "@/lib/mart-mock/hooks";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  FaqCard,
  FaqHeader,
  FaqModal,
  Labeled,
  setFaqQuery,
  useFaqNav,
  useReturnFocus,
} from "./faq-shared";

type Draft = {
  isActive: boolean;
  countSuffix: string;
  emptyTitle: string;
  emptyBody: string;
};

function draftFrom(listing: FaqListingContent): Draft {
  return {
    isActive: listing.isActive !== false,
    countSuffix: listing.countSuffix,
    emptyTitle: listing.emptyTitle,
    emptyBody: listing.emptyBody,
  };
}

export function FaqListingEditor() {
  const { listing } = useFaqSections();
  const params = useSearchParams();
  const { pathname, router } = useFaqNav();
  const editing = params.get("edit") === "listing";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setFaqQuery(router, pathname, "edit", open ? "listing" : null);
  }

  function save(draft: Draft) {
    const doc = readFaqSections();
    saveFaqSections({
      ...doc,
      listing: {
        isActive: draft.isActive,
        countSuffix: draft.countSuffix.trim(),
        emptyTitle: draft.emptyTitle.trim(),
        emptyBody: draft.emptyBody.trim(),
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      <FaqHeader
        sectionId="listing"
        title="Results"
        description="Question count and the empty search message."
        editLabel="Edit results"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <FaqCard
        headingId="faq-listing-card"
        title="Results"
        description={
          listing.isActive === false
            ? "The count line is hidden. Questions still show."
            : "The line under the selected category."
        }
        active={listing.isActive !== false}
      >
        <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
          <p className="text-base font-semibold text-neutral-950">সব প্রশ্ন</p>
          <p className="mt-1 text-sm text-neutral-500">18{listing.countSuffix}</p>
          <p className="mt-4 text-sm font-semibold text-neutral-950">
            {listing.emptyTitle.trim() || "Empty title"}
          </p>
          <p className="mt-1 text-sm text-neutral-600">{listing.emptyBody}</p>
        </div>
      </FaqCard>
      {editing ? (
        <ListingForm listing={listing} onClose={() => setEditing(false)} onSave={save} />
      ) : null}
    </div>
  );
}

function ListingForm({
  listing,
  onClose,
  onSave,
}: {
  listing: FaqListingContent;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const initial = draftFrom(listing);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [saving, setSaving] = useState(false);
  const formId = useId();

  function save() {
    if (saving) return;
    setSaving(true);
    onSave(draft);
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <FaqModal
        titleId="faq-listing-modal-title"
        title="Edit results"
        description="The count sits directly after the number, so 18 and টি প্রশ্ন read as 18টি প্রশ্ন."
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <Labeled
          id={`${formId}-suffix`}
          label="Count suffix"
          value={draft.countSuffix}
          placeholder="টি প্রশ্ন"
          onChange={(countSuffix) => setDraft({ ...draft, countSuffix })}
        />
        <Labeled
          id={`${formId}-empty-title`}
          label="Empty title"
          value={draft.emptyTitle}
          onChange={(emptyTitle) => setDraft({ ...draft, emptyTitle })}
        />
        <Labeled
          id={`${formId}-empty-body`}
          label="Empty message"
          value={draft.emptyBody}
          multiline
          onChange={(emptyBody) => setDraft({ ...draft, emptyBody })}
        />
      </FaqModal>
    </FormCloseGuard>
  );
}
