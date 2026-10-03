"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { getFaqListing, saveFaqListing, type FaqListing } from "@/lib/mart-api/faq-listing";

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

type Draft = {
  isActive: boolean;
  countSuffix: string;
  emptyTitle: string;
  emptyBody: string;
};

function draftFrom(listing: FaqListing): Draft {
  return {
    isActive: listing.isActive !== false,
    countSuffix: listing.countSuffix,
    emptyTitle: listing.emptyTitle,
    emptyBody: listing.emptyBody,
  };
}

export function FaqListingEditor() {
  const [listing, setListing] = useState<FaqListing | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useFaqNav();
  const editing = params.get("edit") === "listing";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getFaqListing()
      .then((next) => {
        if (active) setListing(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load the results.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setFaqQuery(router, pathname, "edit", open ? "listing" : null);
  }

  async function save(draft: Draft) {
    const saved = await saveFaqListing({
      isActive: draft.isActive,
      countSuffix: draft.countSuffix.replace(/\s+$/u, ""),
      emptyTitle: draft.emptyTitle.trim(),
      emptyBody: draft.emptyBody.trim(),
    });
    setListing(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!listing) {
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
        <p className="text-sm text-neutral-600">{loadError || "Loading the results…"}</p>
      </div>
    );
  }

  const empty =
    !listing.countSuffix.trim() && !listing.emptyTitle.trim() && !listing.emptyBody.trim();

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
        empty={empty}
        emptyTitle="No results copy yet"
        emptyBody="Add the count line and the message shown when a search has no matches."
      >
        <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
          <p className="text-sm text-neutral-500">0{listing.countSuffix || " —"}</p>
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
  listing: FaqListing;
  onClose: () => void;
  onSave: (draft: Draft) => void | Promise<void>;
}) {
  const initial = draftFrom(listing);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Could not save the results.");
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <FaqModal
        titleId="faq-listing-modal-title"
        title="Edit results"
        description="The count sits directly after the number. A leading space is kept."
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
          placeholder=" questions"
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
        <FormError message={error} />
      </FaqModal>
    </FormCloseGuard>
  );
}
