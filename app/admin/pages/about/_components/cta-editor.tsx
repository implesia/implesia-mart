"use client";

import Link from "next/link";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  readAboutSections,
  saveAboutSections,
} from "@/lib/mart-mock/about-sections";
import { useAboutSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import {
  adminButtonClass,
  AdminPageHeader,
} from "../../../_components/admin-ui";
import { findCmsPage } from "../../../_config/cms";
import { SectionCopyForm } from "../../../home/_components/section-copy-form";

export function AboutCtaEditor() {
  const { cta } = useAboutSections();
  const page = findCmsPage("about");

  function saveCopy(next: Record<string, string>) {
    const doc = readAboutSections();
    saveAboutSections({
      ...doc,
      cta: {
        ...doc.cta,
        title: next.title ?? "",
        subtitle: next.subtitle ?? "",
        primaryCta: {
          label: next.primaryLabel ?? "",
          href: next.primaryHref ?? "",
        },
        secondaryCta: {
          label: next.secondaryLabel ?? "",
          href: next.secondaryHref ?? "",
        },
      },
    });
  }

  function setActive(isActive: boolean) {
    const doc = readAboutSections();
    saveAboutSections({ ...doc, cta: { ...doc.cta, isActive } });
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
          description="Closing call to action. Turn it off to hide this section on the about page."
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

      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-medium text-neutral-950">
              Active
            </span>
            <span className="mt-1 block text-sm text-neutral-500">
              {cta.isActive
                ? "This section is shown at the bottom of the about page."
                : "This section is hidden on the about page."}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={cta.isActive}
            aria-label="Active"
            onClick={() => setActive(!cta.isActive)}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              cta.isActive ? "bg-primary" : "bg-neutral-300",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white transition-all",
                cta.isActive ? "left-5" : "left-0.5",
              )}
            />
          </button>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-2xl bg-admin-canvas ring-1 ring-neutral-200/90"
        aria-labelledby="about-cta-preview-heading"
      >
        <div className="px-4 pt-4 sm:px-5">
          <h2
            id="about-cta-preview-heading"
            className="text-sm font-semibold text-neutral-950"
          >
            Storefront preview
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {cta.isActive
              ? "Shown at the bottom of the about page."
              : "Hidden until you turn Active back on."}
          </p>
        </div>
        <div className={cn("p-4 sm:p-5", !cta.isActive && "opacity-45")}>
          <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] px-4 py-8 text-center sm:px-8 sm:py-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(43,192,181,0.22),transparent_55%)]"
            />
            <div className="relative z-10 mx-auto max-w-lg">
              <p className="text-xl font-semibold tracking-tight text-white">
                {cta.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {cta.subtitle}
              </p>
              <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
                {cta.primaryCta.label ? (
                  <span className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary">
                    {cta.primaryCta.label}
                    <MaterialIcon
                      name="arrow_forward"
                      className="text-[18px]"
                    />
                  </span>
                ) : null}
                {cta.secondaryCta.label ? (
                  <span className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white">
                    {cta.secondaryCta.label}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <SectionCopyForm
          values={{
            title: cta.title,
            subtitle: cta.subtitle,
            primaryLabel: cta.primaryCta.label,
            primaryHref: cta.primaryCta.href,
            secondaryLabel: cta.secondaryCta.label,
            secondaryHref: cta.secondaryCta.href,
          }}
          fields={[
            { name: "title", label: "Title", wide: true },
            {
              name: "subtitle",
              label: "Subtitle",
              multiline: true,
              rows: 3,
              wide: true,
            },
            { name: "primaryLabel", label: "Primary button label" },
            { name: "primaryHref", label: "Primary button link" },
            { name: "secondaryLabel", label: "Secondary button label" },
            { name: "secondaryHref", label: "Secondary button link" },
          ]}
          saveLabel="Save heading"
          onSave={saveCopy}
        />
      </section>
    </div>
  );
}
