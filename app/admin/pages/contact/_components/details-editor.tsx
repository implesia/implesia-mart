"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  FacebookIcon,
  LinkedinIcon,
} from "@/app/(client)/_components/common/brand-icons";
import {
  blankContactChannel,
  readContactSections,
  saveContactSections,
  type ContactChannelItem,
  type ContactDirectContent,
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
  VisibilitySwitch,
  useContactNav,
  useReturnFocus,
} from "./contact-shared";

type Draft = ContactDirectContent;

function draftFrom(direct: ContactDirectContent): Draft {
  return {
    isActive: direct.isActive !== false,
    title: direct.title,
    subtitle: direct.subtitle,
    badge: direct.badge,
    channels: direct.channels.map((item) => ({
      ...item,
      isActive: item.isActive !== false,
    })),
    social: direct.social.map((item) => ({
      ...item,
      isActive: item.isActive !== false,
    })),
  };
}

const socialIcons = {
  facebook: FacebookIcon,
  linkedin: LinkedinIcon,
} as const;

export function ContactDetailsEditor() {
  const { direct } = useContactSections();
  const params = useSearchParams();
  const { pathname, router } = useContactNav();
  const editing = params.has("edit");
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const empty =
    !direct.title.trim() &&
    !direct.subtitle.trim() &&
    direct.channels.length === 0;

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setContactQuery(router, pathname, open, "details");
  }

  function save(draft: Draft) {
    const doc = readContactSections();
    saveContactSections({
      ...doc,
      direct: {
        isActive: draft.isActive !== false,
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        badge: draft.badge.trim(),
        channels: draft.channels.map((item) => ({
          ...item,
          title: item.title.trim(),
          value: item.value.trim(),
          href: item.href.trim(),
          isActive: item.isActive !== false,
        })),
        social: draft.social.map((item) => ({
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
        sectionId="details"
        title="Contacts"
        description="Call, WhatsApp, email, and service area."
        editLabel="Edit contacts"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <ContactCard
        headingId="contact-details-card"
        title="Contacts"
        description={
          direct.isActive === false
            ? "Hidden on the contact page."
            : "Shown beside the message form. Channels stay in this order, two in each row."
        }
        active={direct.isActive !== false}
        empty={empty}
        emptyTitle="No contacts yet"
        emptyBody="Add the ways customers can reach you."
      >
        <DetailsPreview direct={direct} />
      </ContactCard>
      {editing ? (
        <DetailsForm
          direct={direct}
          onClose={() => setEditing(false)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function DetailsPreview({ direct }: { direct: ContactDirectContent }) {
  return (
    <div>
      <p className="text-lg font-semibold text-neutral-950">
        {direct.title.trim() || "Title"}
      </p>
      <p className="mt-1 text-sm text-neutral-600">
        {direct.subtitle.trim() || "Subtitle"}
      </p>
      {direct.channels.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No channels yet</p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {direct.channels.map((channel) => (
            <li
              key={channel.id}
              className={cn(
                "flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-neutral-200",
                channel.isActive === false && "opacity-50",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MaterialIcon name={channel.icon || "call"} className="text-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  {channel.title || "Channel"}
                </span>
                <span className="block truncate text-sm font-medium text-neutral-950">
                  {channel.value || "Value"}
                  {channel.isActive === false ? " · Hidden" : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {direct.badge.trim() ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200">
            <MaterialIcon name="payments" className="text-[16px] text-primary" />
            {direct.badge}
          </span>
        ) : (
          <span />
        )}
        <span className="flex items-center gap-2">
          {direct.social.map((item) => {
            const Icon = socialIcons[item.platform];
            if (!item.href.trim()) return null;
            return (
              <span
                key={item.platform}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full bg-white text-neutral-600 ring-1 ring-neutral-200",
                  item.isActive === false && "opacity-50",
                )}
                aria-label={item.label || item.platform}
              >
                <Icon className="size-4" />
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
}

function DetailsForm({
  direct,
  onClose,
  onSave,
}: {
  direct: ContactDirectContent;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const initial = draftFrom(direct);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [titleError, setTitleError] = useState("");
  const [channelError, setChannelError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  function save() {
    if (saving) return;
    const nextTitle = draft.title.trim() ? "" : "Title is required.";
    const nextChannels = draft.channels.some(
      (item) => !item.title.trim() || !item.value.trim() || !item.href.trim(),
    )
      ? "Each channel needs a title, a value, and a link."
      : "";
    setTitleError(nextTitle);
    setChannelError(nextChannels);
    if (nextTitle || nextChannels) return;
    setSaving(true);
    onSave(draft);
  }

  function move(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.channels.length) return current;
      const channels = [...current.channels];
      const [item] = channels.splice(index, 1);
      if (!item) return current;
      channels.splice(target, 0, item);
      return { ...current, channels };
    });
  }

  function update(id: string, patch: Partial<ContactChannelItem>) {
    setDraft((current) => ({
      ...current,
      channels: current.channels.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
    setChannelError("");
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <ContactModal
        titleId="contact-details-drawer-title"
        title="Edit contacts"
        description="Update the channels, badge, and social links beside the form."
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
              <textarea
                id={`${formId}-subtitle`}
                value={draft.subtitle}
                rows={2}
                onChange={(event) =>
                  setDraft({ ...draft, subtitle: event.target.value })
                }
                className={cn(adminFieldClass, "h-auto py-3")}
              />
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-badge`}>Badge</FieldLabel>
              <input
                id={`${formId}-badge`}
                value={draft.badge}
                placeholder="Cash on delivery"
                onChange={(event) =>
                  setDraft({ ...draft, badge: event.target.value })
                }
                className={adminFieldClass}
              />
            </div>
          </div>
        </section>
        <section className="border-t border-neutral-100 pt-5" aria-labelledby={`${formId}-channels`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id={`${formId}-channels`} className="text-sm font-semibold text-neutral-950">
                Channels
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                Call, chat, email, or any other way to reach you.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  channels: [...current.channels, blankContactChannel()],
                }))
              }
              className={adminButtonClass.secondary}
            >
              <MaterialIcon name="add" className="text-[18px]" />
              Add channel
            </button>
          </div>
          {channelError ? (
            <div className="mt-3">
              <FieldError message={channelError} />
            </div>
          ) : null}
          {draft.channels.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">No channels yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {draft.channels.map((channel, index) => (
                <li key={channel.id} className="rounded-2xl bg-admin-canvas p-3">
                  <ItemToolbar
                    index={index}
                    total={draft.channels.length}
                    noun="Channel"
                    onMove={(direction) => move(index, direction)}
                    onRemove={() => {
                      setDraft((current) => ({
                        ...current,
                        channels: current.channels.filter(
                          (item) => item.id !== channel.id,
                        ),
                      }));
                      setChannelError("");
                    }}
                  />
                  <ContactIconPicker
                    value={channel.icon}
                    onChange={(icon) => update(channel.id, { icon })}
                  />
                  <div className="mt-3 grid gap-3">
                    <Labeled
                      id={`${formId}-${channel.id}-title`}
                      label="Title"
                      required
                      value={channel.title}
                      invalid={Boolean(channelError && !channel.title.trim())}
                      onChange={(title) => update(channel.id, { title })}
                    />
                    <Labeled
                      id={`${formId}-${channel.id}-value`}
                      label="Value"
                      required
                      value={channel.value}
                      placeholder="+880 ..."
                      invalid={Boolean(channelError && !channel.value.trim())}
                      onChange={(value) => update(channel.id, { value })}
                    />
                    <Labeled
                      id={`${formId}-${channel.id}-href`}
                      label="Link"
                      required
                      value={channel.href}
                      placeholder="tel:, mailto:, https://, or /page"
                      invalid={Boolean(channelError && !channel.href.trim())}
                      onChange={(href) => update(channel.id, { href })}
                    />
                  </div>
                  <VisibilitySwitch
                    checked={channel.isActive !== false}
                    label={
                      channel.isActive !== false
                        ? `Hide channel ${index + 1}`
                        : `Show channel ${index + 1}`
                    }
                    onChange={(isActive) => update(channel.id, { isActive })}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="border-t border-neutral-100 pt-5" aria-labelledby={`${formId}-social`}>
          <h3 id={`${formId}-social`} className="text-sm font-semibold text-neutral-950">
            Social
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Leave a link empty to hide that icon.
          </p>
          <div className="mt-3 space-y-3">
            {draft.social.map((item) => (
              <div key={item.platform} className="rounded-2xl bg-admin-canvas p-3">
                <p className="mb-3 text-sm font-medium text-neutral-950 capitalize">
                  {item.platform}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Labeled
                    id={`${formId}-${item.platform}-label`}
                    label="Label"
                    value={item.label}
                    onChange={(label) =>
                      setDraft((current) => ({
                        ...current,
                        social: current.social.map((social) =>
                          social.platform === item.platform
                            ? { ...social, label }
                            : social,
                        ),
                      }))
                    }
                  />
                  <Labeled
                    id={`${formId}-${item.platform}-href`}
                    label="Link"
                    value={item.href}
                    placeholder="https://"
                    onChange={(href) =>
                      setDraft((current) => ({
                        ...current,
                        social: current.social.map((social) =>
                          social.platform === item.platform
                            ? { ...social, href }
                            : social,
                        ),
                      }))
                    }
                  />
                </div>
                <VisibilitySwitch
                  checked={item.isActive !== false}
                  label={
                    item.isActive !== false
                      ? `Hide ${item.platform}`
                      : `Show ${item.platform}`
                  }
                  onChange={(isActive) =>
                    setDraft((current) => ({
                      ...current,
                      social: current.social.map((social) =>
                        social.platform === item.platform
                          ? { ...social, isActive }
                          : social,
                      ),
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </section>
      </ContactModal>
    </FormCloseGuard>
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
