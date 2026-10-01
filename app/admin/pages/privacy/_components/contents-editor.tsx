"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  readPrivacySections,
  savePrivacySections,
  type PrivacyContentsContent,
} from "@/lib/mart-mock/privacy-sections";
import { usePrivacySections } from "@/lib/mart-mock/hooks";
import { isContentActive } from "@/lib/mart-mock/visibility";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  Labeled,
  PrivacyHeader,
  PrivacyModal,
  PrivacyPanel,
  setPrivacyQuery,
  usePrivacyNav,
  useReturnFocus,
} from "./privacy-shared";

type Draft = {
  isActive: boolean;
  title: string;
  subtitle: string;
  navLabel: string;
};

function draftFrom(contents: PrivacyContentsContent): Draft {
  return {
    isActive: contents.isActive !== false,
    title: contents.title,
    subtitle: contents.subtitle,
    navLabel: contents.navLabel,
  };
}

export function PrivacyContentsEditor() {
  const sections = usePrivacySections();
  const { contents } = sections;
  const params = useSearchParams();
  const { pathname, router } = usePrivacyNav();
  const editing = params.get("edit") === "contents";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const links = [
    sections.introduction,
    sections.collection,
    sections.usage,
    sections.sharing,
    sections.rights,
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
    setPrivacyQuery(router, pathname, open, "contents");
  }

  function save(draft: Draft) {
    const doc = readPrivacySections();
    savePrivacySections({
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
      <PrivacyHeader
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
      <PrivacyPanel
        headingId="privacy-contents-card"
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
      </PrivacyPanel>
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
  contents: PrivacyContentsContent;
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
      <PrivacyModal
        titleId="privacy-contents-modal"
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
      </PrivacyModal>
    </FormCloseGuard>
  );
}
