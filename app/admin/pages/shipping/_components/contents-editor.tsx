"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { shippingContentsNav, type ContentsNavLink } from "@/lib/mart-api/contents-nav";
import { getShippingBlock } from "@/lib/mart-api/shipping-block";
import {
  getShippingContents,
  saveShippingContents,
  type ShippingContents,
} from "@/lib/mart-api/shipping-contents";
import { getShippingPayment } from "@/lib/mart-api/shipping-payment";
import { getShippingRefund } from "@/lib/mart-api/shipping-refund";
import { getShippingReturns } from "@/lib/mart-api/shipping-returns";
import { getShippingSupport } from "@/lib/mart-api/shipping-support";

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

type Draft = {
  isActive: boolean;
  title: string;
  subtitle: string;
  navLabel: string;
};

async function optional<T>(task: Promise<T>): Promise<T | null> {
  try {
    return await task;
  } catch {
    return null;
  }
}

function draftFrom(contents: ShippingContents): Draft {
  return {
    isActive: contents.isActive !== false,
    title: contents.title,
    subtitle: contents.subtitle,
    navLabel: contents.navLabel,
  };
}

export function ShippingContentsEditor() {
  const [contents, setContents] = useState<ShippingContents | null>(null);
  const [links, setLinks] = useState<ContentsNavLink[]>([]);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useShippingNav();
  const editing = params.get("edit") === "contents";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    Promise.all([
      getShippingContents(),
      optional(getShippingBlock()),
      optional(getShippingPayment()),
      optional(getShippingReturns()),
      optional(getShippingRefund()),
      optional(getShippingSupport()),
    ])
      .then(([next, shipping, payment, returns, refund, support]) => {
        if (!active) return;
        setContents(next);
        setLinks(shippingContentsNav({ shipping, payment, returns, refund, support }));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Could not load the contents.");
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setShippingQuery(router, pathname, open, "contents");
  }

  async function save(draft: Draft) {
    const saved = await saveShippingContents({
      isActive: draft.isActive,
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      navLabel: draft.navLabel.trim(),
    });
    setContents(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!contents) {
    return (
      <div className="min-w-0 space-y-4">
        <ShippingHeader
          sectionId="contents"
          title="Contents"
          description="Sidebar heading and section links."
          editLabel="Edit contents"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the contents…"}</p>
      </div>
    );
  }

  const empty = !contents.title.trim() && !contents.subtitle.trim() && !contents.navLabel.trim();

  return (
    <div className="min-w-0 space-y-4">
      <ShippingHeader
        sectionId="contents"
        title="Contents"
        description="Sidebar heading and section links."
        editLabel="Edit contents"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <ShippingPanel
        headingId="shipping-contents-card"
        title="Contents"
        description={
          contents.isActive === false
            ? "The sidebar is hidden. The sections still show."
            : "Links follow each section’s sidebar label. An inactive section drops out."
        }
        active={contents.isActive !== false}
      >
        {empty ? (
          <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
            <p className="text-sm font-semibold text-neutral-950">No contents yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add the sidebar heading for the shipping page.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-3 ring-1 ring-neutral-200">
            <p className="px-2 text-sm font-semibold text-neutral-950">
              {contents.title.trim() || "Contents"}
            </p>
            <p className="px-2 text-xs text-neutral-500">{contents.subtitle}</p>
            <ul className="mt-2 space-y-1">
              {links.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 px-2 py-2 text-sm text-neutral-800"
                >
                  <MaterialIcon name={item.icon || "info"} className="text-[18px]" />
                  {item.label || "Section"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </ShippingPanel>
      {editing ? (
        <ContentsForm contents={contents} onClose={() => setEditing(false)} onSave={save} />
      ) : null}
    </div>
  );
}

function ContentsForm({
  contents,
  onClose,
  onSave,
}: {
  contents: ShippingContents;
  onClose: () => void;
  onSave: (draft: Draft) => void | Promise<void>;
}) {
  const initial = draftFrom(contents);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const formId = useId();

  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Could not save the contents.");
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <ShippingModal
        titleId="shipping-contents-modal"
        title="Edit contents"
        description="The sidebar heading. Each section edits its own link label."
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
        <Labeled
          id={`${formId}-subtitle`}
          label="Subtitle"
          value={draft.subtitle}
          onChange={(subtitle) => setDraft({ ...draft, subtitle })}
        />
        <Labeled
          id={`${formId}-nav`}
          label="Sidebar label"
          value={draft.navLabel}
          onChange={(navLabel) => setDraft({ ...draft, navLabel })}
        />
        <FormError message={error} />
      </ShippingModal>
    </FormCloseGuard>
  );
}
