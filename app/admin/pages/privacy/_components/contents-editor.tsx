"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { privacyContentsNav, type ContentsNavLink } from "@/lib/mart-api/contents-nav";
import { getPrivacyCollection } from "@/lib/mart-api/privacy-collection";
import {
  getPrivacyContents,
  savePrivacyContents,
  type PrivacyContents,
} from "@/lib/mart-api/privacy-contents";
import { getPrivacyIntroduction } from "@/lib/mart-api/privacy-introduction";
import { getPrivacyRights } from "@/lib/mart-api/privacy-rights";
import { getPrivacySharing } from "@/lib/mart-api/privacy-sharing";
import { getPrivacySupport } from "@/lib/mart-api/privacy-support";
import { getPrivacyUsage } from "@/lib/mart-api/privacy-usage";

import { ActiveStatusField } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  FormError,
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

async function optional<T>(task: Promise<T>): Promise<T | null> {
  try {
    return await task;
  } catch {
    return null;
  }
}

function draftFrom(contents: PrivacyContents): Draft {
  return {
    isActive: contents.isActive !== false,
    title: contents.title,
    subtitle: contents.subtitle,
    navLabel: contents.navLabel,
  };
}

export function PrivacyContentsEditor() {
  const [contents, setContents] = useState<PrivacyContents | null>(null);
  const [links, setLinks] = useState<ContentsNavLink[]>([]);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = usePrivacyNav();
  const editing = params.get("edit") === "contents";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    Promise.all([
      getPrivacyContents(),
      optional(getPrivacyIntroduction()),
      optional(getPrivacyCollection()),
      optional(getPrivacyUsage()),
      optional(getPrivacySharing()),
      optional(getPrivacyRights()),
      optional(getPrivacySupport()),
    ])
      .then(([next, introduction, collection, usage, sharing, rights, support]) => {
        if (!active) return;
        setContents(next);
        setLinks(
          privacyContentsNav({ introduction, collection, usage, sharing, rights, support }),
        );
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
    setPrivacyQuery(router, pathname, open, "contents");
  }

  async function save(draft: Draft) {
    const saved = await savePrivacyContents({
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
        <PrivacyHeader
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
        {empty ? (
          <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
            <p className="text-sm font-semibold text-neutral-950">No contents yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add the sidebar heading for the privacy page.
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
      </PrivacyPanel>
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
  contents: PrivacyContents;
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
        <FormError message={error} />
      </PrivacyModal>
    </FormCloseGuard>
  );
}
