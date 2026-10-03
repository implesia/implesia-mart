"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  readAboutCta,
  updateAboutCta,
  type AboutCta,
} from "@/lib/mart-api/about-cta";
import { MartApiError } from "@/lib/mart-api/products";
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

type Draft = {
  isActive: boolean;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

const EMPTY_CTA: AboutCta = {
  isActive: true,
  title: "",
  subtitle: "",
  primaryCta: { label: "", href: "" },
  secondaryCta: { label: "", href: "" },
};

function draftFrom(cta: AboutCta): Draft {
  return {
    isActive: cta.isActive !== false,
    title: cta.title,
    subtitle: cta.subtitle,
    primaryLabel: cta.primaryCta.label,
    primaryHref: cta.primaryCta.href,
    secondaryLabel: cta.secondaryCta.label,
    secondaryHref: cta.secondaryCta.href,
  };
}

export function AboutCtaEditor() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const editing = params.has("edit");
  const [cta, setCta] = useState<AboutCta>(EMPTY_CTA);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");
  const focusEdit = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const page = findCmsPage("about");

  useEffect(() => {
    let cancelled = false;
    readAboutCta()
      .then((next) => {
        if (!cancelled) setCta(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof MartApiError ? error.message : "Could not load the call to action.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (editing || !returnFocus.current) return;
    returnFocus.current = false;
    focusEdit.current?.focus();
  }, [editing]);

  function setEditing(open: boolean) {
    if (!open) returnFocus.current = true;
    const next = new URLSearchParams(window.location.search);
    if (open) next.set("edit", "cta");
    else next.delete("edit");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  async function save(draft: Draft) {
    const saved = await updateAboutCta({
      isActive: draft.isActive,
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      primaryCta: {
        label: draft.primaryLabel.trim(),
        href: draft.primaryHref.trim(),
      },
      secondaryCta: {
        label: draft.secondaryLabel.trim(),
        href: draft.secondaryHref.trim(),
      },
    });
    setCta(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

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
          <span className="font-medium text-neutral-950">CTA</span>
        </nav>
        {page ? (
          <div
            className="mb-4 flex gap-2 overflow-x-auto pb-1"
            aria-label="About sections"
          >
            {page.sections.map((section) => {
              const active = section.id === "cta";
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
          title="CTA"
          description="The closing block at the bottom of the about page. A hidden block stays off the about page."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/about-us"
                target="_blank"
                rel="noreferrer"
                className={adminButtonClass.secondary}
              >
                View on site
                <MaterialIcon name="open_in_new" className="text-[18px]" />
              </a>
              <button
                ref={focusEdit}
                type="button"
                onClick={() => setEditing(true)}
                className={adminButtonClass.primary}
              >
                <MaterialIcon name="edit" className="text-[18px]" />
                Edit CTA
              </button>
            </div>
          }
        />
      </div>

      {loadError ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} The about page call to action is up to date.
        </p>
      ) : null}

      <section
        className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
        aria-labelledby="about-cta-card-heading"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5">
          <div>
            <h2
              id="about-cta-card-heading"
              className="flex items-center gap-2 text-sm font-semibold text-neutral-950"
            >
              CTA content
              <VisibilityBadge active={cta.isActive !== false} />
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {cta.isActive !== false
                ? "Shown at the bottom of the about page."
                : "Hidden on the about page."}
            </p>
          </div>
        </div>
        {!ready ? (
          <p className="px-4 py-8 text-sm text-neutral-500">Loading the call to action…</p>
        ) : cta.title.trim() || cta.subtitle.trim() ? (
          <div className={cn("bg-admin-canvas p-4 sm:p-5", cta.isActive === false && "opacity-45")}>
            <CtaPreview cta={cta} />
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-950">
              No CTA content yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add the heading and buttons for the closing block.
            </p>
          </div>
        )}
      </section>

      {editing ? (
        <CtaFormModal key="cta" cta={cta} onClose={() => setEditing(false)} onSave={save} />
      ) : null}
    </div>
  );
}

function CtaPreview({ cta }: { cta: AboutCta }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] px-4 py-8 text-center sm:px-8 sm:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(43,192,181,0.22),transparent_55%)]"
      />
      <div className="relative z-10 mx-auto max-w-lg">
        <p className="text-xl font-semibold tracking-tight text-white">
          {cta.title.trim() || "Title"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          {cta.subtitle.trim() || "Subtitle"}
        </p>
        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
          {cta.primaryCta.label.trim() ? (
            <span className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary">
              {cta.primaryCta.label}
              <MaterialIcon name="arrow_forward" className="text-[18px]" />
            </span>
          ) : null}
          {cta.secondaryCta.label.trim() ? (
            <span className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white">
              {cta.secondaryCta.label}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CtaFormModal({
  cta,
  onClose,
  onSave,
}: {
  cta: AboutCta;
  onClose: () => void;
  onSave: (draft: Draft) => Promise<void>;
}) {
  const initial = draftFrom(cta);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [titleError, setTitleError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  async function save() {
    if (saving) return;
    if (!draft.title.trim()) {
      setTitleError("Title is required.");
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
    } catch (error) {
      setSaving(false);
      setTitleError(
        error instanceof MartApiError ? error.message : "Could not save the call to action.",
      );
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <AdminFormModal titleId="about-cta-drawer-title" size="md">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="about-cta-drawer-title"
              className="text-lg font-semibold text-neutral-950"
            >
              Edit CTA
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Update the closing block displayed on the about page.
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
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
          <ActiveStatusField
            checked={draft.isActive}
            onChange={(isActive) => setDraft({ ...draft, isActive })}
          />
          <section aria-labelledby={`${formId}-content`}>
            <h3
              id={`${formId}-content`}
              className="text-sm font-semibold text-neutral-950"
            >
              Content
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              The heading and short line inside the dark block.
            </p>
            <div className="mt-3 grid gap-3">
              <div>
                <FieldLabel htmlFor={`${formId}-title`}>
                  Title <span className="text-red-700">*</span>
                </FieldLabel>
                <input
                  id={`${formId}-title`}
                  autoFocus
                  value={draft.title}
                  placeholder="The line customers should read first"
                  aria-invalid={titleError ? true : undefined}
                  aria-describedby={
                    titleError ? `${formId}-title-error` : undefined
                  }
                  onChange={(event) => {
                    setDraft({ ...draft, title: event.target.value });
                    setTitleError("");
                  }}
                  className={cn(adminFieldClass, titleError && "border-red-400")}
                />
                {titleError ? (
                  <div id={`${formId}-title-error`}>
                    <FieldError message={titleError} />
                  </div>
                ) : null}
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-subtitle`}>
                  Subtitle
                </FieldLabel>
                <textarea
                  id={`${formId}-subtitle`}
                  value={draft.subtitle}
                  rows={3}
                  placeholder="A short line under the title"
                  onChange={(event) =>
                    setDraft({ ...draft, subtitle: event.target.value })
                  }
                  className={cn(adminFieldClass, "h-auto py-3")}
                />
              </div>
            </div>
          </section>
          <section
            className="border-t border-neutral-100 pt-5"
            aria-labelledby={`${formId}-buttons`}
          >
            <h3
              id={`${formId}-buttons`}
              className="text-sm font-semibold text-neutral-950"
            >
              Buttons
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              The filled button is first. The outline button is second. Leave a
              label empty to hide that button.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor={`${formId}-primary-label`}>
                  Primary button label
                </FieldLabel>
                <input
                  id={`${formId}-primary-label`}
                  value={draft.primaryLabel}
                  placeholder="See all products"
                  onChange={(event) =>
                    setDraft({ ...draft, primaryLabel: event.target.value })
                  }
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-primary-link`}>
                  Primary button link
                </FieldLabel>
                <input
                  id={`${formId}-primary-link`}
                  value={draft.primaryHref}
                  placeholder="/products"
                  onChange={(event) =>
                    setDraft({ ...draft, primaryHref: event.target.value })
                  }
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-secondary-label`}>
                  Secondary button label
                </FieldLabel>
                <input
                  id={`${formId}-secondary-label`}
                  value={draft.secondaryLabel}
                  placeholder="Contact"
                  onChange={(event) =>
                    setDraft({ ...draft, secondaryLabel: event.target.value })
                  }
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-secondary-link`}>
                  Secondary button link
                </FieldLabel>
                <input
                  id={`${formId}-secondary-link`}
                  value={draft.secondaryHref}
                  placeholder="/contact-us"
                  onChange={(event) =>
                    setDraft({ ...draft, secondaryHref: event.target.value })
                  }
                  className={adminFieldClass}
                />
              </div>
            </div>
          </section>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
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
