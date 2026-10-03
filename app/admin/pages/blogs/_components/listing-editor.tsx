"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { getBlogListing, saveBlogListing, type BlogListing } from "@/lib/mart-api/blog-listing";
import { listAdminBlogPosts } from "@/lib/mart-api/blog-posts";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  BlogCard,
  BlogHeader,
  BlogModal,
  FormError,
  Labeled,
  setBlogQuery,
  useBlogNav,
  useReturnFocus,
} from "./blog-shared";

type Draft = BlogListing;

function draftFrom(listing: BlogListing): Draft {
  return {
    isActive: listing.isActive !== false,
    heading: listing.heading,
    allLabel: listing.allLabel,
    countSuffix: listing.countSuffix,
    emptyMessage: listing.emptyMessage,
    featuredLabel: listing.featuredLabel,
    readLabel: listing.readLabel,
    readSuffix: listing.readSuffix,
    tabsLabel: listing.tabsLabel,
  };
}

export function BlogListingEditor() {
  const [count, setCount] = useState(0);
  const [listing, setListing] = useState<BlogListing | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useBlogNav();
  const editing = params.get("edit") === "listing";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  useEffect(() => {
    let active = true;
    listAdminBlogPosts()
      .then((posts) => {
        if (active) setCount(posts.filter((post) => post.isActive !== false).length);
      })
      .catch(() => {
        if (active) setCount(0);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getBlogListing()
      .then((next) => {
        if (active) setListing(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load the listing.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setBlogQuery(router, pathname, "edit", open ? "listing" : null);
  }

  async function save(draft: Draft) {
    const saved = await saveBlogListing({
      isActive: draft.isActive,
      heading: draft.heading.trim(),
      allLabel: draft.allLabel.trim(),
      countSuffix: draft.countSuffix.replace(/\s+$/u, ""),
      emptyMessage: draft.emptyMessage.trim(),
      featuredLabel: draft.featuredLabel.trim(),
      readLabel: draft.readLabel.trim(),
      readSuffix: draft.readSuffix.trim(),
      tabsLabel: draft.tabsLabel.trim(),
    });
    setListing(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!listing) {
    return (
      <div className="min-w-0 space-y-4">
        <BlogHeader
          sectionId="listing"
          title="Listing"
          description="Headings, empty state, and card labels."
          editLabel="Edit listing"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">
          {loadError || "Loading the listing…"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <BlogHeader
        sectionId="listing"
        title="Listing"
        description="Headings, empty state, and card labels."
        editLabel="Edit listing"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <BlogCard
        headingId="blog-listing-card"
        title="Listing"
        description={
          listing.isActive === false
            ? "The list heading is hidden. Articles still show."
            : "The heading above the article cards."
        }
        active={listing.isActive !== false}
      >
        <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
          <p className="text-base font-semibold text-neutral-950">
            {listing.heading.trim() || "Heading"}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {count}
            {listing.countSuffix}
          </p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <Row label="All filter" value={listing.allLabel} />
            <Row label="Featured" value={listing.featuredLabel} />
            <Row label="Read" value={listing.readLabel} />
            <Row label="Read time" value={listing.readSuffix} />
            <Row label="Empty" value={listing.emptyMessage} />
            <Row label="Filters" value={listing.tabsLabel} />
          </dl>
        </div>
      </BlogCard>
      {editing ? (
        <ListingForm listing={listing} onClose={() => setEditing(false)} onSave={save} />
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-950">{value.trim() || "—"}</dd>
    </div>
  );
}

function ListingForm({
  listing,
  onClose,
  onSave,
}: {
  listing: BlogListing;
  onClose: () => void;
  onSave: (draft: Draft) => void | Promise<void>;
}) {
  const initial = draftFrom(listing);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const formId = useId();

  async function save() {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      setSaveError(
        caught instanceof Error ? caught.message : "Could not save the listing.",
      );
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <BlogModal
        titleId="blog-listing-modal-title"
        title="Edit listing"
        description="Labels around the article cards. The articles themselves are under Posts."
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <p className="text-sm text-neutral-500">
          Turning this off hides the heading and the count. The cards stay.
        </p>
        <FormError message={saveError} />
        <Labeled
          id={`${formId}-heading`}
          label="Heading"
          value={draft.heading}
          placeholder="সর্বশেষ আর্টিকেল"
          onChange={(heading) => setDraft({ ...draft, heading })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled
            id={`${formId}-all`}
            label="All filter"
            value={draft.allLabel}
            placeholder="সব"
            onChange={(allLabel) => setDraft({ ...draft, allLabel })}
          />
          <Labeled
            id={`${formId}-count`}
            label="Count suffix"
            value={draft.countSuffix}
            placeholder="টি আর্টিকেল"
            onChange={(countSuffix) => setDraft({ ...draft, countSuffix })}
          />
          <Labeled
            id={`${formId}-featured`}
            label="Featured label"
            value={draft.featuredLabel}
            placeholder="ফিচার্ড"
            onChange={(featuredLabel) => setDraft({ ...draft, featuredLabel })}
          />
          <Labeled
            id={`${formId}-read`}
            label="Read label"
            value={draft.readLabel}
            placeholder="পড়ুন"
            onChange={(readLabel) => setDraft({ ...draft, readLabel })}
          />
          <Labeled
            id={`${formId}-suffix`}
            label="Read time suffix"
            value={draft.readSuffix}
            placeholder="পড়া"
            onChange={(readSuffix) => setDraft({ ...draft, readSuffix })}
          />
          <Labeled
            id={`${formId}-tabs`}
            label="Filter group label"
            value={draft.tabsLabel}
            placeholder="ব্লগ ক্যাটাগরি"
            onChange={(tabsLabel) => setDraft({ ...draft, tabsLabel })}
          />
        </div>
        <Labeled
          id={`${formId}-empty`}
          label="Empty message"
          value={draft.emptyMessage}
          multiline
          onChange={(emptyMessage) => setDraft({ ...draft, emptyMessage })}
        />
        <p className="text-sm text-neutral-500">
          Count suffix is placed right after the number, so 9 and টি আর্টিকেল read as 9টি আর্টিকেল. Leave a label empty to hide it.
        </p>
      </BlogModal>
    </FormCloseGuard>
  );
}
