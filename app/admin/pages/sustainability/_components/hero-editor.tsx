"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { readSustainabilitySections, saveSustainabilitySections, type SustainMedia } from "@/lib/mart-mock/sustainability-sections";
import { useSustainabilitySections } from "@/lib/mart-mock/hooks";

import { SectionCopyForm } from "../../../home/_components/section-copy-form";
import { DrawerOverlay, ImagePanel, SavedLine, SustainHeader, useFocusWhenClosed, useSustainNav, replaceSearch } from "./sustain-shared";

const PHOTOS = [
  { key: "primary", label: "Primary photo" },
  { key: "secondary", label: "Secondary photo" },
] as const;

type PhotoKey = (typeof PHOTOS)[number]["key"];

function isPhoto(value: string | null): value is PhotoKey {
  return value === "primary" || value === "secondary";
}

export function SustainabilityHeroEditor() {
  const { hero } = useSustainabilitySections();
  const params = useSearchParams();
  const { pathname, router } = useSustainNav();
  const selected = params.get("photo");
  const photoKey = isPhoto(selected) ? selected : null;
  const opened = photoKey ? (photoKey === "primary" ? hero.primaryImage : hero.secondaryImage) : null;
  const [notice, setNotice] = useState("");
  const focusRef = useFocusWhenClosed(Boolean(opened));

  function setPhoto(id: PhotoKey | null) {
    replaceSearch(router, pathname, (next) => {
      if (id) next.set("photo", id);
      else next.delete("photo");
    });
  }

  function saveCopy(next: Record<string, string>) {
    const doc = readSustainabilitySections();
    saveSustainabilitySections({
      ...doc,
      hero: {
        ...doc.hero,
        eyebrow: next.eyebrow ?? "",
        title: next.title ?? "",
        subtitle: next.subtitle ?? "",
        primaryCta: { label: next.primaryLabel ?? "", href: next.primaryHref ?? "" },
        secondaryCta: { label: next.secondaryLabel ?? "", href: next.secondaryHref ?? "" },
      },
    });
  }

  function saveImage(draft: SustainMedia) {
    if (!photoKey) return;
    const doc = readSustainabilitySections();
    const key = photoKey === "primary" ? "primaryImage" : "secondaryImage";
    saveSustainabilitySections({ ...doc, hero: { ...doc.hero, [key]: draft } });
    focusRef.current = `sustain-hero-${photoKey}`;
    setNotice("Saved");
    window.setTimeout(() => setNotice(""), 1600);
    setPhoto(null);
  }

  return (
    <div className="min-w-0 space-y-4">
      <SustainHeader sectionId="hero" title="Hero" description="Opening copy and images." />
      <SavedLine notice={notice} open={Boolean(opened)} />
      <section className="overflow-hidden rounded-2xl bg-admin-canvas ring-1 ring-neutral-200/90" aria-labelledby="sustain-hero-preview">
        <div className="px-4 pt-4 sm:px-5">
          <h2 id="sustain-hero-preview" className="text-sm font-semibold text-neutral-950">
            Storefront preview
          </h2>
          <p className="mt-1 text-sm text-neutral-500">Shown at the top of the sustainability page. Two photos stay side by side.</p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid items-center gap-4 rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] p-4 xl:grid-cols-12 sm:p-6">
            <div className="xl:col-span-7">
              <p className="text-xs font-medium text-primary">{hero.eyebrow}</p>
              <p className="mt-2 text-xl font-bold tracking-tight text-white">{hero.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{hero.subtitle}</p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {hero.primaryCta.label ? (
                  <span className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary">
                    {hero.primaryCta.label}
                    <MaterialIcon name="arrow_forward" className="text-[18px]" />
                  </span>
                ) : null}
                {hero.secondaryCta.label ? (
                  <span className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white">
                    {hero.secondaryCta.label}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 xl:col-span-5">
              {PHOTOS.map((photo) => {
                const image = photo.key === "primary" ? hero.primaryImage : hero.secondaryImage;
                return (
                  <button
                    key={photo.key}
                    type="button"
                    aria-label={image.alt || photo.label}
                    onClick={() => setPhoto(photo.key)}
                    className="relative aspect-square overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {image.src ? <Image src={image.src} alt="" fill sizes="180px" className="object-cover" /> : <span className="grid size-full place-items-center text-xs text-white/70">Photo</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <SectionCopyForm
          values={{
            eyebrow: hero.eyebrow,
            title: hero.title,
            subtitle: hero.subtitle,
            primaryLabel: hero.primaryCta.label,
            primaryHref: hero.primaryCta.href,
            secondaryLabel: hero.secondaryCta.label,
            secondaryHref: hero.secondaryCta.href,
          }}
          fields={[
            { name: "eyebrow", label: "Eyebrow" },
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
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-labelledby="sustain-hero-photos">
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2 id="sustain-hero-photos" className="text-sm font-semibold text-neutral-950">
            2 photos
          </h2>
        </div>
        <ol>
          {PHOTOS.map((photo, index) => {
            const image = photo.key === "primary" ? hero.primaryImage : hero.secondaryImage;
            return (
              <li key={photo.key} className="border-t border-neutral-100 first:border-t-0">
                <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
                  <button id={`sustain-hero-${photo.key}`} type="button" onClick={() => setPhoto(photo.key)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="w-5 text-right text-xs text-neutral-400">{index + 1}</span>
                    <span className="relative size-12 overflow-hidden rounded-xl bg-neutral-100">
                      {image.src ? <Image src={image.src} alt="" fill sizes="48px" className="object-cover" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-neutral-950">{image.alt || photo.label}</span>
                      <span className="block text-xs text-neutral-500">{photo.label}</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setPhoto(photo.key)} className="text-sm font-medium text-neutral-600">
                    Edit
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      {opened && photoKey ? (
        <DrawerOverlay titleId="sustain-hero-drawer" onClose={() => setPhoto(null)}>
          <ImagePanel
            key={photoKey}
            creating={false}
            titleId="sustain-hero-drawer"
            initial={opened}
            notice={notice}
            onClose={() => setPhoto(null)}
            onSave={saveImage}
          />
        </DrawerOverlay>
      ) : null}
    </div>
  );
}
