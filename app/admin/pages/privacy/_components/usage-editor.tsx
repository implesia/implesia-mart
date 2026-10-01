"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import {
  blankBadge,
  blankUseItem,
  moveList,
  readPrivacySections,
  savePrivacySections,
  type PrivacyBadge,
  type PrivacyUsage,
  type PrivacyUseItem,
} from "@/lib/mart-mock/privacy-sections";
import { usePrivacySections } from "@/lib/mart-mock/hooks";
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
  items: PrivacyUseItem[];
  protectionActive: boolean;
  protectionIcon: string;
  protectionTitle: string;
  protectionBody: string;
  badges: PrivacyBadge[];
};

function draftFrom(block: PrivacyUsage): Draft {
  return {
    isActive: block.isActive !== false,
    icon: block.icon,
    navLabel: block.navLabel,
    heading: block.heading,
    intro: block.intro,
    items: block.items.map((item) => ({
      ...item,
      isActive: item.isActive !== false,
    })),
    protectionActive: block.protection.isActive !== false,
    protectionIcon: block.protection.icon,
    protectionTitle: block.protection.title,
    protectionBody: block.protection.body,
    badges: block.protection.badges.map((item) => ({
      ...item,
      isActive: item.isActive !== false,
    })),
  };
}

export function PrivacyUsageEditor() {
  const { usage } = usePrivacySections();
  const params = useSearchParams();
  const { pathname, router } = usePrivacyNav();
  const editing = params.get("edit") === "usage";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setPrivacyQuery(router, pathname, open, "usage");
  }

  function save(draft: Draft) {
    const doc = readPrivacySections();
    savePrivacySections({
      ...doc,
      usage: {
        isActive: draft.isActive,
        icon: draft.icon,
        navLabel: draft.navLabel.trim(),
        heading: draft.heading.trim(),
        intro: draft.intro.trim(),
        items: draft.items.map((item) => ({
          id: item.id,
          title: item.title.trim(),
          description: item.description.trim(),
          isActive: item.isActive !== false,
        })),
        protection: {
          isActive: draft.protectionActive,
          icon: draft.protectionIcon,
          title: draft.protectionTitle.trim(),
          body: draft.protectionBody.trim(),
          badges: draft.badges.map((item) => ({
            id: item.id,
            icon: item.icon,
            label: item.label.trim(),
            isActive: item.isActive !== false,
          })),
        },
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      <PrivacyHeader
        sectionId="usage"
        title="Use"
        description="How data is used and protected."
        editLabel="Edit use"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <PrivacyPanel
        headingId="privacy-usage-card"
        title="Use"
        description={
          usage.isActive === false
            ? "Hidden on the privacy page."
            : "Uses, then the protection note."
        }
        active={usage.isActive !== false}
      >
        <p className="text-sm font-semibold text-neutral-950">
          {usage.heading.trim() || "Heading"}
        </p>
        <ul className="mt-3 space-y-2">
          {usage.items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-neutral-200",
                item.isActive === false && "opacity-50",
              )}
            >
              {item.title || "Use"}
              {item.isActive === false ? " · Hidden" : ""}
            </li>
          ))}
        </ul>
      </PrivacyPanel>
      {editing ? (
        <UsageForm
          block={usage}
          onClose={() => setEditing(false)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function UsageForm({
  block,
  onClose,
  onSave,
}: {
  block: PrivacyUsage;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const initial = draftFrom(block);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  function save() {
    if (saving) return;
    if (!draft.heading.trim()) {
      setError("Heading is required.");
      return;
    }
    if (
      draft.items.some((item) => !item.title.trim()) ||
      draft.badges.some((item) => !item.label.trim())
    ) {
      setError("Fill in every use and badge, or remove the empty ones.");
      return;
    }
    setSaving(true);
    onSave(draft);
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <PrivacyModal
        titleId="privacy-usage-modal"
        title="Edit use"
        description="How information is used, and the protection note."
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
        <PrivacyIconPicker
          value={draft.icon}
          onChange={(icon) => setDraft({ ...draft, icon })}
        />
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
        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">Uses</h3>
          {draft.items.map((item, index) => (
            <div key={item.id} className="rounded-2xl bg-admin-canvas p-3">
              <ItemToolbar
                index={index}
                total={draft.items.length}
                noun="Use"
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
                  item.isActive !== false
                    ? `Hide use ${index + 1}`
                    : `Show use ${index + 1}`
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
            label="Add use"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                items: [...current.items, blankUseItem()],
              }))
            }
          />
        </section>
        <section className="space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-950">Protection</h3>
          <PrivacyIconPicker
            value={draft.protectionIcon}
            onChange={(protectionIcon) =>
              setDraft({ ...draft, protectionIcon })
            }
          />
          <Labeled
            id={`${formId}-protect-title`}
            label="Title"
            value={draft.protectionTitle}
            onChange={(protectionTitle) =>
              setDraft({ ...draft, protectionTitle })
            }
          />
          <Labeled
            id={`${formId}-protect-body`}
            label="Body"
            value={draft.protectionBody}
            multiline
            onChange={(protectionBody) =>
              setDraft({ ...draft, protectionBody })
            }
          />
          <VisibilitySwitch
            checked={draft.protectionActive}
            label={
              draft.protectionActive ? "Hide protection" : "Show protection"
            }
            onChange={(protectionActive) =>
              setDraft({ ...draft, protectionActive })
            }
          />
          {draft.badges.map((badge, index) => (
            <div key={badge.id} className="rounded-2xl bg-admin-canvas p-3">
              <ItemToolbar
                index={index}
                total={draft.badges.length}
                noun="Badge"
                onMove={(direction) =>
                  setDraft((current) => ({
                    ...current,
                    badges: moveList(current.badges, index, direction),
                  }))
                }
                onRemove={() =>
                  setDraft((current) => ({
                    ...current,
                    badges: current.badges.filter((row) => row.id !== badge.id),
                  }))
                }
              />
              <div className="space-y-3">
                <PrivacyIconPicker
                  value={badge.icon}
                  onChange={(icon) =>
                    setDraft((current) => ({
                      ...current,
                      badges: current.badges.map((row) =>
                        row.id === badge.id ? { ...row, icon } : row,
                      ),
                    }))
                  }
                />
                <Labeled
                  id={`${formId}-badge-${badge.id}`}
                  label="Label"
                  required
                  value={badge.label}
                  onChange={(label) => {
                    setDraft((current) => ({
                      ...current,
                      badges: current.badges.map((row) =>
                        row.id === badge.id ? { ...row, label } : row,
                      ),
                    }));
                    setError("");
                  }}
                />
              </div>
              <VisibilitySwitch
                checked={badge.isActive !== false}
                label={
                  badge.isActive !== false
                    ? `Hide badge ${index + 1}`
                    : `Show badge ${index + 1}`
                }
                onChange={(isActive) =>
                  setDraft((current) => ({
                    ...current,
                    badges: current.badges.map((row) =>
                      row.id === badge.id ? { ...row, isActive } : row,
                    ),
                  }))
                }
              />
            </div>
          ))}
          <AddButton
            label="Add badge"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                badges: [...current.badges, blankBadge()],
              }))
            }
          />
        </section>
        <FormError message={error} />
      </PrivacyModal>
    </FormCloseGuard>
  );
}
