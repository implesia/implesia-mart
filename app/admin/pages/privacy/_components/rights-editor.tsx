"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import {
  getPrivacyRights,
  savePrivacyRights,
  type PrivacyRightItem,
  type PrivacyRights,
} from "@/lib/mart-api/privacy-rights";
import { blankPrivacyCard, moveList } from "@/lib/mart-mock/privacy-sections";
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
  intro: string;
  items: PrivacyRightItem[];
  retentionActive: boolean;
  retentionTitle: string;
  retentionBody: string;
  updatesActive: boolean;
  updatesTitle: string;
  updatesBody: string;
};

function draftFrom(block: PrivacyRights): Draft {
  return {
    isActive: block.isActive !== false,
    icon: block.icon || "gavel",
    navLabel: block.navLabel,
    heading: block.heading,
    intro: block.intro,
    items: block.items.map((item) => ({
      ...item,
      isActive: item.isActive !== false,
    })),
    retentionActive: block.retention.isActive !== false,
    retentionTitle: block.retention.title,
    retentionBody: block.retention.body,
    updatesActive: block.updates.isActive !== false,
    updatesTitle: block.updates.title,
    updatesBody: block.updates.body,
  };
}

export function PrivacyRightsEditor() {
  const [rights, setRights] = useState<PrivacyRights | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = usePrivacyNav();
  const editing = params.get("edit") === "rights";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getPrivacyRights()
      .then((next) => {
        if (active) setRights(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load the rights section.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setPrivacyQuery(router, pathname, open, "rights");
  }

  async function save(draft: Draft) {
    const saved = await savePrivacyRights({
      isActive: draft.isActive,
      icon: draft.icon,
      navLabel: draft.navLabel.trim(),
      heading: draft.heading.trim(),
      intro: draft.intro.trim(),
      items: draft.items.map((item) => ({
        id: item.id,
        icon: item.icon,
        title: item.title.trim(),
        description: item.description.trim(),
        isActive: item.isActive !== false,
      })),
      retention: {
        isActive: draft.retentionActive,
        title: draft.retentionTitle.trim(),
        body: draft.retentionBody.trim(),
      },
      updates: {
        isActive: draft.updatesActive,
        title: draft.updatesTitle.trim(),
        body: draft.updatesBody.trim(),
      },
    });
    setRights(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!rights) {
    return (
      <div className="min-w-0 space-y-4">
        <PrivacyHeader
          sectionId="rights"
          title="Rights"
          description="View, correct, delete, and how long data is kept."
          editLabel="Edit rights"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the rights section…"}</p>
      </div>
    );
  }

  const empty =
    !rights.heading.trim() &&
    !rights.intro.trim() &&
    rights.items.length === 0 &&
    !rights.retention.title.trim() &&
    !rights.retention.body.trim() &&
    !rights.updates.title.trim() &&
    !rights.updates.body.trim();

  return (
    <div className="min-w-0 space-y-4">
      <PrivacyHeader
        sectionId="rights"
        title="Rights"
        description="View, correct, delete, and how long data is kept."
        editLabel="Edit rights"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <PrivacyPanel
        headingId="privacy-rights-card"
        title="Rights"
        description={
          rights.isActive === false
            ? "Hidden on the privacy page."
            : "Rights cards, retention, and updates."
        }
        active={rights.isActive !== false}
      >
        {empty ? (
          <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
            <p className="text-sm font-semibold text-neutral-950">No rights copy yet</p>
            <p className="mt-1 text-sm text-neutral-600">
              Add a heading, rights, retention, and updates.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-neutral-950">
              {rights.heading.trim() || "Heading"}
            </p>
            <ul className="mt-3 space-y-2">
              {rights.items.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-neutral-200",
                    item.isActive === false && "opacity-50",
                  )}
                >
                  {item.title || "Right"}
                  {item.isActive === false ? " · Hidden" : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </PrivacyPanel>
      {editing ? <RightsForm block={rights} onClose={() => setEditing(false)} onSave={save} /> : null}
    </div>
  );
}

function RightsForm({
  block,
  onClose,
  onSave,
}: {
  block: PrivacyRights;
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
    if (draft.items.length > 12) {
      setError("You can add up to 12 rights.");
      return;
    }
    if (draft.items.some((item) => !item.title.trim())) {
      setError("Every right needs a title.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the rights section.");
      setSaving(false);
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <PrivacyModal
        titleId="privacy-rights-modal"
        title="Edit rights"
        description="Customer rights, retention, and policy updates."
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
        <Labeled
          id={`${formId}-intro`}
          label="Intro"
          value={draft.intro}
          multiline
          onChange={(intro) => setDraft({ ...draft, intro })}
        />
        {draft.items.map((item, index) => (
          <div key={item.id} className="rounded-2xl bg-admin-canvas p-3">
            <ItemToolbar
              index={index}
              total={draft.items.length}
              noun="Right"
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
              <PrivacyIconPicker
                value={item.icon}
                onChange={(icon) =>
                  setDraft((current) => ({
                    ...current,
                    items: current.items.map((row) =>
                      row.id === item.id ? { ...row, icon } : row,
                    ),
                  }))
                }
              />
              <Labeled
                id={`${formId}-title-${item.id}`}
                label="Title"
                required
                value={item.title}
                onChange={(title) => {
                  setDraft((current) => ({
                    ...current,
                    items: current.items.map((row) =>
                      row.id === item.id ? { ...row, title } : row,
                    ),
                  }));
                  setError("");
                }}
              />
              <Labeled
                id={`${formId}-body-${item.id}`}
                label="Description"
                value={item.description}
                multiline
                onChange={(description) =>
                  setDraft((current) => ({
                    ...current,
                    items: current.items.map((row) =>
                      row.id === item.id ? { ...row, description } : row,
                    ),
                  }))
                }
              />
            </div>
            <VisibilitySwitch
              checked={item.isActive !== false}
              label={
                item.isActive !== false ? `Hide right ${index + 1}` : `Show right ${index + 1}`
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
          </div>
        ))}
        <AddButton
          label="Add right"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              items: [...current.items, { ...blankPrivacyCard("visibility"), isActive: true }],
            }))
          }
        />
        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">Retention</h3>
          <Labeled
            id={`${formId}-keep-title`}
            label="Title"
            value={draft.retentionTitle}
            onChange={(retentionTitle) => setDraft({ ...draft, retentionTitle })}
          />
          <Labeled
            id={`${formId}-keep-body`}
            label="Body"
            value={draft.retentionBody}
            multiline
            onChange={(retentionBody) => setDraft({ ...draft, retentionBody })}
          />
          <VisibilitySwitch
            checked={draft.retentionActive}
            label={draft.retentionActive ? "Hide retention" : "Show retention"}
            onChange={(retentionActive) => setDraft({ ...draft, retentionActive })}
          />
        </section>
        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">Updates</h3>
          <Labeled
            id={`${formId}-update-title`}
            label="Title"
            value={draft.updatesTitle}
            onChange={(updatesTitle) => setDraft({ ...draft, updatesTitle })}
          />
          <Labeled
            id={`${formId}-update-body`}
            label="Body"
            value={draft.updatesBody}
            multiline
            onChange={(updatesBody) => setDraft({ ...draft, updatesBody })}
          />
          <VisibilitySwitch
            checked={draft.updatesActive}
            label={draft.updatesActive ? "Hide updates" : "Show updates"}
            onChange={(updatesActive) => setDraft({ ...draft, updatesActive })}
          />
        </section>
        <FormError message={error} />
      </PrivacyModal>
    </FormCloseGuard>
  );
}
