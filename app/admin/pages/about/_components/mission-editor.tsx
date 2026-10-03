"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  listAboutMission,
  updateAboutMissionCard,
  type AboutMissionCard,
  type AboutMissionDraft,
} from "@/lib/mart-api/about-mission";
import { MartApiError } from "@/lib/mart-api/products";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { cn } from "@/lib/utils";

import { AdminFormModal } from "../../../_components/admin-form-modal";
import {
  ActiveStatusField,
  adminButtonClass,
  adminFieldClass,
  AdminPageHeader,
  FieldError,
  FieldLabel,
  VisibilityBadge,
} from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import { findCmsPage } from "../../../_config/cms";

const CARDS = [
  { key: "vision", label: "Vision" },
  { key: "mission", label: "Mission" },
] as const;

type CardKey = (typeof CARDS)[number]["key"];

const ICONS: { name: string; label: string }[] = [
  { name: "payments", label: "Payments" },
  { name: "local_shipping", label: "Delivery" },
  { name: "assignment_return", label: "Returns" },
  { name: "verified", label: "Verified" },
  { name: "category", label: "Category" },
  { name: "location_on", label: "Location" },
  { name: "design_services", label: "Design" },
  { name: "back_hand", label: "Handmade" },
  { name: "checkroom", label: "Dresses" },
  { name: "visibility", label: "Visibility" },
  { name: "rocket_launch", label: "Launch" },
  { name: "search", label: "Search" },
  { name: "task_alt", label: "Done" },
  { name: "storefront", label: "Store" },
  { name: "support_agent", label: "Support" },
  { name: "favorite", label: "Favorite" },
  { name: "shield", label: "Shield" },
];

function isCardKey(value: string | null): value is CardKey {
  return value === "vision" || value === "mission";
}

function iconChoices(current: string) {
  if (ICONS.some((icon) => icon.name === current)) return ICONS;
  return [{ name: current, label: current }, ...ICONS];
}

function iconLabel(name: string) {
  return ICONS.find((icon) => icon.name === name)?.label ?? name;
}

function cardLabel(key: CardKey) {
  return key === "vision" ? "Vision" : "Mission";
}

export function AboutMissionEditor() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get("card");
  const cardKey = isCardKey(selected) ? selected : null;
  const [cards, setCards] = useState<AboutMissionCard[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const opened =
    cardKey && cards
      ? (cards.find((card) => card.key === cardKey) ?? null)
      : null;
  const [notice, setNotice] = useState("");
  const [savedKey, setSavedKey] = useState<CardKey | null>(null);
  const focusId = useRef<string | null>(null);
  const page = findCmsPage("about");
  const drawerOpen = Boolean(opened);

  useEffect(() => {
    let cancelled = false;
    listAboutMission()
      .then((next) => {
        if (!cancelled) setCards(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof MartApiError
            ? error.message
            : "Could not load the cards.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (drawerOpen || !focusId.current) return;
    const id = focusId.current;
    focusId.current = null;
    document.getElementById(id)?.focus();
  }, [drawerOpen]);

  function setCard(id: CardKey | null) {
    const next = new URLSearchParams(window.location.search);
    if (id) next.set("card", id);
    else next.delete("card");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => {
      setNotice("");
      setSavedKey(null);
    }, 1600);
  }

  async function save(draft: AboutMissionDraft) {
    if (!cardKey || !cards) return;
    const saved = await updateAboutMissionCard(cardKey, draft);
    setCards(cards.map((card) => (card.key === cardKey ? saved : card)));
    setSavedKey(cardKey);
    focusId.current = `about-mission-${cardKey}`;
    flash("Saved");
    setCard(null);
  }

  function cardFor(key: CardKey) {
    return cards?.find((card) => card.key === key) ?? null;
  }

  const missing = Boolean(selected && !cardKey);

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex flex-wrap items-center gap-1 text-sm text-neutral-500"
        >
          <Link
            href="/admin/pages/about"
            className="font-medium hover:text-neutral-950"
          >
            About
          </Link>
          <MaterialIcon
            name="chevron_right"
            className="text-[16px] text-neutral-300"
          />
          <span className="font-medium text-neutral-950">Mission & vision</span>
        </nav>
        {page ? (
          <div
            className="mb-4 flex gap-2 overflow-x-auto pb-1"
            aria-label="About sections"
          >
            {page.sections.map((section) => {
              const active = section.id === "mission";
              return (
                <Link
                  key={section.id}
                  href={`${page.href}/${section.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center rounded-full px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    active
                      ? "bg-neutral-950 font-medium text-white"
                      : "bg-white font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50",
                  )}
                >
                  {section.label}
                </Link>
              );
            })}
          </div>
        ) : null}
        <AdminPageHeader
          title="Mission & vision"
          description="Two cards — vision and mission. Hidden cards stay off the about page."
          action={
            <a
              href="/about-us"
              target="_blank"
              rel="noreferrer"
              className={adminButtonClass.secondary}
            >
              View on site
              <MaterialIcon name="open_in_new" className="text-[18px]" />
            </a>
          }
        />
      </div>

      {loadError ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {loadError}
        </p>
      ) : null}
      {notice && !drawerOpen ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The cards are up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This card is no longer here.{" "}
          <button
            type="button"
            onClick={() => setCard(null)}
            className="font-medium text-primary"
          >
            Close
          </button>
        </p>
      ) : null}

      <section
        className="overflow-hidden rounded-2xl bg-admin-canvas ring-1 ring-neutral-200/90"
        aria-labelledby="about-mission-preview-heading"
      >
        <div className="px-4 pt-4 sm:px-5">
          <h2
            id="about-mission-preview-heading"
            className="text-sm font-semibold text-neutral-950"
          >
            Storefront preview
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Shown on the about page. Vision stays on the left, mission on the
            right.
          </p>
        </div>
        <div className="p-4 sm:p-5">
          {cards === null ? (
            <p className="text-sm text-neutral-500">Loading mission cards…</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 rounded-2xl bg-[#f5f6f8] p-4 xl:grid-cols-2 xl:gap-4 sm:p-5">
              {CARDS.map((entry, index) => {
                const card = cardFor(entry.key);
                if (!card) return null;
                const dark = index === 1;
                return (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => setCard(entry.key)}
                    className={cn(
                      "rounded-2xl border p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-6",
                      dark
                        ? "border-transparent bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] text-white"
                        : "border-neutral-200/90 bg-white",
                    )}
                  >
                    <span
                      className={cn(
                        "mb-3 flex size-10 items-center justify-center rounded-xl",
                        dark
                          ? "bg-white/10 text-primary"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      <MaterialIcon
                        name={card.icon || "notes"}
                        filled
                        className="text-[22px]"
                      />
                    </span>
                    <span
                      className={cn(
                        "mb-2 block text-base font-semibold tracking-tight sm:text-lg",
                        dark ? "text-white" : "text-neutral-950",
                      )}
                    >
                      {card.title}
                    </span>
                    <span
                      className={cn(
                        "block text-sm leading-relaxed",
                        dark ? "text-white/70" : "text-neutral-600",
                      )}
                    >
                      {card.description}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section
        className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
        aria-labelledby="about-mission-list-heading"
      >
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2
            id="about-mission-list-heading"
            className="text-sm font-semibold text-neutral-950"
          >
            {cards === null ? "Loading mission cards…" : "2 cards"}
          </h2>
        </div>
        <ol>
          {cards === null
            ? null
            : CARDS.map((entry, index) => {
                const card = cardFor(entry.key);
                if (!card) return null;
                return (
                  <li
                    key={entry.key}
                    className={cn(
                      "border-t border-neutral-100 first:border-t-0",
                      cardKey === entry.key && "bg-primary/5",
                      savedKey === entry.key && "bg-emerald-50",
                    )}
                  >
                    <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
                      <button
                        id={`about-mission-${entry.key}`}
                        type="button"
                        onClick={() => setCard(entry.key)}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">
                          {index + 1}
                        </span>
                        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-admin-canvas text-primary">
                          <MaterialIcon
                            name={card.icon || "notes"}
                            className="text-[22px]"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm font-semibold text-neutral-950">
                              {card.title || entry.label}
                            </span>
                            <VisibilityBadge active={isContentActive(card)} />
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs text-neutral-500">
                            {entry.label} · {iconLabel(card.icon)}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCard(entry.key)}
                        className={adminButtonClass.quiet}
                      >
                        Edit
                      </button>
                    </div>
                  </li>
                );
              })}
        </ol>
      </section>

      {opened && cardKey ? (
        <CardDrawer
          key={cardKey}
          cardKey={cardKey}
          initial={opened}
          notice={notice}
          onClose={() => setCard(null)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function CardDrawer({
  cardKey,
  initial,
  notice,
  onClose,
  onSave,
}: {
  cardKey: CardKey;
  initial: AboutMissionCard;
  notice: string;
  onClose: () => void;
  onSave: (draft: AboutMissionDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState(() => ({
    ...initial,
    isActive: initial.isActive !== false,
  }));
  const [baseline] = useState(draft);
  const [titleError, setTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const label = cardLabel(cardKey);
  const title = draft.title.trim() || label;

  async function save() {
    if (saving) return;
    const nextTitle = draft.title.trim();
    const nextDescription = draft.description.trim();
    setTitleError(nextTitle ? "" : "Title is required.");
    setDescriptionError(nextDescription ? "" : "Description is required.");
    if (!nextTitle || !nextDescription) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        icon: draft.icon || "verified",
        title: nextTitle,
        description: nextDescription,
        isActive: draft.isActive,
      });
    } catch (caught) {
      setSaving(false);
      setError(
        caught instanceof MartApiError
          ? caught.message
          : "Could not save the card.",
      );
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <AdminFormModal titleId="about-mission-drawer-title" size="sm">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="about-mission-drawer-title"
              className="text-lg font-semibold text-neutral-950"
            >
              Edit {label.toLowerCase()}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Update the {label.toLowerCase()} shown on the about page.
            </p>
          </div>
          <button
            type="button"
            data-form-dismiss=""
            aria-label="Close"
            title="Close"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <ActiveStatusField
            checked={draft.isActive !== false}
            onChange={(isActive) => setDraft({ ...draft, isActive })}
          />
          <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-neutral-200">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MaterialIcon
                name={draft.icon || "notes"}
                filled
                className="text-[22px]"
              />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-950">
                {draft.title.trim() || "Title"}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
                {draft.description.trim() || "Description"}
              </p>
            </div>
          </div>
          <div>
            <FieldLabel>Icon</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {iconChoices(draft.icon).map((icon) => (
                <button
                  key={icon.name}
                  type="button"
                  aria-pressed={draft.icon === icon.name}
                  aria-label={icon.label}
                  onClick={() => setDraft({ ...draft, icon: icon.name })}
                  className={cn(
                    "grid size-10 place-items-center rounded-xl ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    draft.icon === icon.name
                      ? "bg-primary/10 text-primary ring-primary/30"
                      : "bg-white text-neutral-600 ring-neutral-200",
                  )}
                >
                  <MaterialIcon name={icon.name} className="text-[20px]" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel htmlFor={titleId}>
              Title <span className="text-red-700">*</span>
            </FieldLabel>
            <input
              id={titleId}
              autoFocus
              value={draft.title}
              placeholder="What this card is called"
              onChange={(event) => {
                setDraft({ ...draft, title: event.target.value });
                setTitleError("");
              }}
              aria-invalid={titleError ? true : undefined}
              aria-describedby={titleError ? `${titleId}-error` : undefined}
              className={cn(adminFieldClass, titleError && "border-red-400")}
            />
            {titleError ? (
              <div id={`${titleId}-error`}>
                <FieldError message={titleError} />
              </div>
            ) : null}
          </div>
          <div>
            <FieldLabel htmlFor={descriptionId}>
              Description <span className="text-red-700">*</span>
            </FieldLabel>
            <textarea
              id={descriptionId}
              value={draft.description}
              rows={5}
              placeholder="The promise customers should remember"
              onChange={(event) => {
                setDraft({ ...draft, description: event.target.value });
                setDescriptionError("");
              }}
              aria-invalid={descriptionError ? true : undefined}
              aria-describedby={
                descriptionError ? `${descriptionId}-error` : undefined
              }
              className={cn(
                adminFieldClass,
                "h-auto py-3",
                descriptionError && "border-red-400",
              )}
            />
            {descriptionError ? (
              <div id={`${descriptionId}-error`}>
                <FieldError message={descriptionError} />
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
          {error ? (
            <p
              role="alert"
              className="mr-auto text-sm font-medium text-red-700"
            >
              {error}
            </p>
          ) : notice ? (
            <p
              role="status"
              className="mr-auto text-sm font-medium text-emerald-800"
            >
              {notice}
            </p>
          ) : null}
          <button
            type="button"
            data-form-dismiss=""
            onClick={onClose}
            className={adminButtonClass.secondary}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={adminButtonClass.primary}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </AdminFormModal>
    </FormCloseGuard>
  );
}
