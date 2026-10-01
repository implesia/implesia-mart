"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  readShippingSections,
  saveShippingSections,
  type ShippingContentsContent,
} from "@/lib/mart-mock/shipping-sections";
import { useShippingSections } from "@/lib/mart-mock/hooks";
import { isContentActive } from "@/lib/mart-mock/visibility";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
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

function draftFrom(contents: ShippingContentsContent): Draft {
  return {
    isActive: contents.isActive !== false,
    title: contents.title,
    subtitle: contents.subtitle,
    navLabel: contents.navLabel,
  };
}

export function ShippingContentsEditor() {
  const sections = useShippingSections();
  const { contents } = sections;
  const params = useSearchParams();
  const { pathname, router } = useShippingNav();
  const editing = params.get("edit") === "contents";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const links = [
    sections.shipping,
    sections.payment,
    sections.returns,
    sections.refund,
    sections.support,
  ]
    .filter(isContentActive)
    .map((item, index) => ({
      id: `${item.navLabel}-${index}`,
      icon: item.icon,
      label: item.navLabel || ("heading" in item ? item.heading : item.title),
    }));

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setShippingQuery(router, pathname, open, "contents");
  }

  function save(draft: Draft) {
    const doc = readShippingSections();
    saveShippingSections({
      ...doc,
      contents: {
        isActive: draft.isActive,
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        navLabel: draft.navLabel.trim(),
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

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
                <MaterialIcon
                  name={item.icon || "info"}
                  className="text-[18px]"
                />
                {item.label || "Section"}
              </li>
            ))}
          </ul>
        </div>
      </ShippingPanel>
      {editing ? (
        <ContentsForm
          contents={contents}
          onClose={() => setEditing(false)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function ContentsForm({
  contents,
  onClose,
  onSave,
}: {
  contents: ShippingContentsContent;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const initial = draftFrom(contents);
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
      </ShippingModal>
    </FormCloseGuard>
  );
}
