"use client";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { readSustainabilitySections, saveSustainabilitySections } from "@/lib/mart-mock/sustainability-sections";
import { useSustainabilitySections } from "@/lib/mart-mock/hooks";

import { SectionCopyForm } from "../../../home/_components/section-copy-form";
import { SustainHeader } from "./sustain-shared";

export function SustainabilityCtaEditor() {
  const { cta } = useSustainabilitySections();

  function saveCopy(next: Record<string, string>) {
    const doc = readSustainabilitySections();
    saveSustainabilitySections({
      ...doc,
      cta: {
        ...doc.cta,
        title: next.title ?? "",
        subtitle: next.subtitle ?? "",
        primaryCta: { label: next.primaryLabel ?? "", href: next.primaryHref ?? "" },
        secondaryCta: { label: next.secondaryLabel ?? "", href: next.secondaryHref ?? "" },
      },
    });
  }

  return (
    <div className="min-w-0 space-y-4">
      <SustainHeader sectionId="cta" title="CTA" description="Closing call to action." />
      <section className="overflow-hidden rounded-2xl bg-admin-canvas ring-1 ring-neutral-200/90">
        <div className="px-4 pt-4 sm:px-5">
          <h2 className="text-sm font-semibold text-neutral-950">Storefront preview</h2>
          <p className="mt-1 text-sm text-neutral-500">Shown at the bottom of the sustainability page.</p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] px-4 py-8 text-center sm:px-8">
            <p className="text-xl font-semibold text-white">{cta.title}</p>
            <p className="mt-2 text-sm text-white/70">{cta.subtitle}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              {cta.primaryCta.label ? (
                <span className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary">
                  {cta.primaryCta.label}
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </span>
              ) : null}
              {cta.secondaryCta.label ? (
                <span className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white">{cta.secondaryCta.label}</span>
              ) : null}
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
            { name: "subtitle", label: "Subtitle", multiline: true, rows: 3, wide: true },
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
