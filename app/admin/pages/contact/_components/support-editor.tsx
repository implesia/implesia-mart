"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState, type ReactNode } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankContactHour,
  blankContactLink,
  readContactSections,
  saveContactSections,
  type ContactSupportContent,
} from "@/lib/mart-mock/contact-sections";
import { useContactSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import { ActiveStatusField, adminButtonClass, adminFieldClass, FieldError, FieldLabel } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  ContactCard,
  ContactHeader,
  ContactIconPicker,
  ContactModal,
  ItemToolbar,
  setContactQuery,
  useContactNav,
  VisibilitySwitch,
  useReturnFocus,
} from "./contact-shared";

type Draft = ContactSupportContent;

function draftFrom(support: ContactSupportContent): Draft {
  return {
    isActive: support.isActive !== false,
    title: support.title,
    subtitle: support.subtitle,
    hours: support.hours.map((item) => ({
      ...item,
      isActive: item.isActive !== false,
    })),
    quickLinks: support.quickLinks.map((item) => ({
      ...item,
      isActive: item.isActive !== false,
    })),
  };
}

export function ContactSupportEditor() {
  const { support } = useContactSections();
  const params = useSearchParams();
  const { pathname, router } = useContactNav();
  const editing = params.has("edit");
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const empty =
    !support.title.trim() &&
    support.hours.length === 0 &&
    support.quickLinks.length === 0;

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setContactQuery(router, pathname, open, "support");
  }

  function save(draft: Draft) {
    const doc = readContactSections();
    saveContactSections({
      ...doc,
      support: {
        isActive: draft.isActive !== false,
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        hours: draft.hours.map((item) => ({
          ...item,
          label: item.label.trim(),
          value: item.value.trim(),
          isActive: item.isActive !== false,
        })),
        quickLinks: draft.quickLinks.map((item) => ({
          ...item,
          label: item.label.trim(),
          href: item.href.trim(),
          isActive: item.isActive !== false,
        })),
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      <ContactHeader
        sectionId="support"
        title="Support"
        description="Support hours and quick links."
        editLabel="Edit support"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <ContactCard
        headingId="contact-support-card"
        title="Support"
        description={
          support.isActive === false
            ? "Hidden on the contact page."
            : "Shown under the form. Hours on the left, links on the right."
        }
        active={support.isActive !== false}
        empty={empty}
        emptyTitle="No support content yet"
        emptyBody="Add the hours and the links customers use most."
      >
        <SupportPreview support={support} />
      </ContactCard>
      {editing ? (
        <SupportForm
          support={support}
          onClose={() => setEditing(false)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function SupportPreview({ support }: { support: ContactSupportContent }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MaterialIcon name="schedule" className="text-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-950">
              {support.title.trim() || "Title"}
            </p>
            <p className="text-xs text-neutral-500">
              {support.subtitle.trim() || "Subtitle"}
            </p>
          </div>
        </div>
        {support.hours.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">No hours yet</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {support.hours.map((hour) => (
              <li
                key={hour.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-neutral-200",
                  hour.isActive === false && "opacity-50",
                )}
              >
                <span className="font-medium text-neutral-950">
                  {hour.label || "Day"}
                  {hour.isActive === false ? " · Hidden" : ""}
                </span>
                <span className="text-right text-neutral-600">
                  {hour.value || "Hours"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {support.quickLinks.length === 0 ? (
        <p className="text-sm text-neutral-500">No links yet</p>
      ) : (
        <ul className="space-y-2">
          {support.quickLinks.map((link) => (
            <li
              key={link.id}
              className={cn(
                "flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-neutral-200",
                link.isActive === false && "opacity-50",
              )}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MaterialIcon name={link.icon || "help"} className="text-[16px]" />
              </span>
              <span className="text-sm font-medium text-neutral-950">
                {link.label || "Link"}
                {link.isActive === false ? " · Hidden" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SupportForm({
  support,
  onClose,
  onSave,
}: {
  support: ContactSupportContent;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const initial = draftFrom(support);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [titleError, setTitleError] = useState("");
  const [hourError, setHourError] = useState("");
  const [linkError, setLinkError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  function save() {
    if (saving) return;
    const nextTitle = draft.title.trim() ? "" : "Title is required.";
    const nextHours = draft.hours.some(
      (item) => !item.label.trim() || !item.value.trim(),
    )
      ? "Each row needs a day and the hours."
      : "";
    const nextLinks = draft.quickLinks.some(
      (item) => !item.label.trim() || !item.href.trim(),
    )
      ? "Each link needs a label and a destination."
      : "";
    setTitleError(nextTitle);
    setHourError(nextHours);
    setLinkError(nextLinks);
    if (nextTitle || nextHours || nextLinks) return;
    setSaving(true);
    onSave(draft);
  }

  function moveHours(index: number, direction: -1 | 1) {
    setDraft((current) => moveList(current, "hours", index, direction));
  }

  function moveLinks(index: number, direction: -1 | 1) {
    setDraft((current) => moveList(current, "quickLinks", index, direction));
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <ContactModal
        titleId="contact-support-drawer-title"
        title="Edit support"
        description="Update the hours and the links under the contact form."
        size="lg"
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive !== false}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <section aria-labelledby={`${formId}-content`}>
          <h3 id={`${formId}-content`} className="text-sm font-semibold text-neutral-950">
            Content
          </h3>
          <div className="mt-3 grid gap-3">
            <div>
              <FieldLabel htmlFor={`${formId}-title`}>
                Title <span className="text-red-700">*</span>
              </FieldLabel>
              <input
                id={`${formId}-title`}
                autoFocus
                value={draft.title}
                onChange={(event) => {
                  setDraft({ ...draft, title: event.target.value });
                  setTitleError("");
                }}
                className={cn(adminFieldClass, titleError && "border-red-400")}
              />
              {titleError ? <FieldError message={titleError} /> : null}
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-subtitle`}>Subtitle</FieldLabel>
              <input
                id={`${formId}-subtitle`}
                value={draft.subtitle}
                onChange={(event) =>
                  setDraft({ ...draft, subtitle: event.target.value })
                }
                className={adminFieldClass}
              />
            </div>
          </div>
        </section>
        <ListSection
          id={`${formId}-hours`}
          title="Hours"
          body="One row for each part of the week."
          action="Add hours"
          error={hourError}
          empty="No hours yet."
          onAdd={() => {
            setDraft((current) => ({
              ...current,
              hours: [...current.hours, blankContactHour()],
            }));
            setHourError("");
          }}
        >
          {draft.hours.map((hour, index) => (
            <li key={hour.id} className="rounded-2xl bg-admin-canvas p-3">
              <ItemToolbar
                index={index}
                total={draft.hours.length}
                noun="Hours"
                onMove={(direction) => moveHours(index, direction)}
                onRemove={() => {
                  setDraft((current) => ({
                    ...current,
                    hours: current.hours.filter((item) => item.id !== hour.id),
                  }));
                  setHourError("");
                }}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Labeled
                  id={`${formId}-${hour.id}-label`}
                  label="Day"
                  required
                  value={hour.label}
                  placeholder="Saturday – Thursday"
                  invalid={Boolean(hourError && !hour.label.trim())}
                  onChange={(label) => {
                    setDraft((current) => ({
                      ...current,
                      hours: patch(current.hours, hour.id, { label }),
                    }));
                    setHourError("");
                  }}
                />
                <Labeled
                  id={`${formId}-${hour.id}-value`}
                  label="Hours"
                  required
                  value={hour.value}
                  placeholder="9:00 – 22:00"
                  invalid={Boolean(hourError && !hour.value.trim())}
                  onChange={(value) => {
                    setDraft((current) => ({
                      ...current,
                      hours: patch(current.hours, hour.id, { value }),
                    }));
                    setHourError("");
                  }}
                />
              </div>
              <VisibilitySwitch
                checked={hour.isActive !== false}
                label={
                  hour.isActive !== false
                    ? `Hide hours ${index + 1}`
                    : `Show hours ${index + 1}`
                }
                onChange={(isActive) =>
                  setDraft((current) => ({
                    ...current,
                    hours: patch(current.hours, hour.id, { isActive }),
                  }))
                }
              />
            </li>
          ))}
        </ListSection>
        <ListSection
          id={`${formId}-links`}
          title="Quick links"
          body="Shortcuts shown beside the hours."
          action="Add link"
          error={linkError}
          empty="No links yet."
          onAdd={() => {
            setDraft((current) => ({
              ...current,
              quickLinks: [...current.quickLinks, blankContactLink()],
            }));
            setLinkError("");
          }}
        >
          {draft.quickLinks.map((link, index) => (
            <li key={link.id} className="rounded-2xl bg-admin-canvas p-3">
              <ItemToolbar
                index={index}
                total={draft.quickLinks.length}
                noun="Link"
                onMove={(direction) => moveLinks(index, direction)}
                onRemove={() => {
                  setDraft((current) => ({
                    ...current,
                    quickLinks: current.quickLinks.filter(
                      (item) => item.id !== link.id,
                    ),
                  }));
                  setLinkError("");
                }}
              />
              <ContactIconPicker
                value={link.icon}
                onChange={(icon) =>
                  setDraft((current) => ({
                    ...current,
                    quickLinks: patch(current.quickLinks, link.id, { icon }),
                  }))
                }
              />
              <div className="mt-3 grid gap-3">
                <Labeled
                  id={`${formId}-${link.id}-label`}
                  label="Label"
                  required
                  value={link.label}
                  invalid={Boolean(linkError && !link.label.trim())}
                  onChange={(label) => {
                    setDraft((current) => ({
                      ...current,
                      quickLinks: patch(current.quickLinks, link.id, { label }),
                    }));
                    setLinkError("");
                  }}
                />
                <Labeled
                  id={`${formId}-${link.id}-href`}
                  label="Link"
                  required
                  value={link.href}
                  placeholder="/faqs"
                  invalid={Boolean(linkError && !link.href.trim())}
                  onChange={(href) => {
                    setDraft((current) => ({
                      ...current,
                      quickLinks: patch(current.quickLinks, link.id, { href }),
                    }));
                    setLinkError("");
                  }}
                />
              </div>
              <VisibilitySwitch
                checked={link.isActive !== false}
                label={
                  link.isActive !== false
                    ? `Hide link ${index + 1}`
                    : `Show link ${index + 1}`
                }
                onChange={(isActive) =>
                  setDraft((current) => ({
                    ...current,
                    quickLinks: patch(current.quickLinks, link.id, { isActive }),
                  }))
                }
              />
            </li>
          ))}
        </ListSection>
      </ContactModal>
    </FormCloseGuard>
  );
}

function moveList<K extends "hours" | "quickLinks">(
  current: Draft,
  key: K,
  index: number,
  direction: -1 | 1,
): Draft {
  const items = [...current[key]];
  const target = index + direction;
  if (target < 0 || target >= items.length) return current;
  const [item] = items.splice(index, 1);
  if (!item) return current;
  items.splice(target, 0, item);
  return { ...current, [key]: items };
}

function patch<T extends { id: string }>(
  items: T[],
  id: string,
  next: Partial<T>,
) {
  return items.map((item) => (item.id === id ? { ...item, ...next } : item));
}

function ListSection({
  id,
  title,
  body,
  action,
  error,
  empty,
  onAdd,
  children,
}: {
  id: string;
  title: string;
  body: string;
  action: string;
  error: string;
  empty: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.some(Boolean);
  return (
    <section className="border-t border-neutral-100 pt-5" aria-labelledby={id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id={id} className="text-sm font-semibold text-neutral-950">
            {title}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">{body}</p>
        </div>
        <button type="button" onClick={onAdd} className={adminButtonClass.secondary}>
          <MaterialIcon name="add" className="text-[18px]" />
          {action}
        </button>
      </div>
      {error ? (
        <div className="mt-3">
          <FieldError message={error} />
        </div>
      ) : null}
      {hasItems ? <ul className="mt-3 space-y-3">{children}</ul> : (
        <p className="mt-3 text-sm text-neutral-500">{empty}</p>
      )}
    </section>
  );
}

function Labeled({
  id,
  label,
  value,
  placeholder,
  required,
  invalid,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>
        {label} {required ? <span className="text-red-700">*</span> : null}
      </FieldLabel>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(adminFieldClass, invalid && "border-red-400")}
      />
    </div>
  );
}
