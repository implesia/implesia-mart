"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankHeroSlide,
  createHeroSlide,
  deleteHeroSlide,
  getHeroSlide,
  heroImage,
  updateHeroSlide,
  type HeroSlideInput,
} from "@/lib/mart-api/hero";
import { MartApiError } from "@/lib/mart-api/products";
import { type HeroAccent } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { ImageField } from "../../../_components/image-field";
import {
  AdminLoading,
  AdminPageHeader,
  adminButtonClass,
  adminFieldClass,
  FieldLabel,
} from "../../../_components/admin-ui";
import { HomeCmsHeader } from "../../_components/home-cms-header";

const ACCENTS: { id: HeroAccent; label: string; swatch: string; banner: string }[] = [
  { id: "gold", label: "Gold", swatch: "bg-[#c4a35a]", banner: "bg-[linear-gradient(100deg,#1c1408_0%,#0c0d12_42%,#05060a_100%)]" },
  { id: "teal", label: "Teal", swatch: "bg-primary", banner: "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]" },
  { id: "rose", label: "Rose", swatch: "bg-[#c45b7a]", banner: "bg-[linear-gradient(100deg,#1a0c14_0%,#0c0a10_46%,#05060a_100%)]" },
  { id: "ink", label: "Ink", swatch: "bg-[#243140]", banner: "bg-[linear-gradient(100deg,#071018_0%,#07090f_46%,#05060a_100%)]" },
];

export default function EditHomeHeroSlidePage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const creating = id === "new";
  const router = useRouter();
  const [banner, setBanner] = useState<HeroSlideInput | null>(creating ? blankHeroSlide() : null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (creating) return;
    let cancelled = false;
    getHeroSlide(id)
      .then((slide) => {
        if (cancelled) return;
        if (!slide) setMissing(true);
        else setBanner(slide);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(loadError instanceof MartApiError ? loadError.message : "Could not load this slide.");
      });
    return () => {
      cancelled = true;
    };
  }, [creating, id]);

  if (!banner && !missing && !error) return <AdminLoading />;
  if (error && !banner) {
    return <p className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-red-700 ring-1 ring-red-100">{error}</p>;
  }

  if (!banner) {
    return (
      <>
        <AdminPageHeader title="Slide not found" />
        <Link href="/admin/home/hero" className="text-sm font-medium text-primary">
          Back to hero slides
        </Link>
      </>
    );
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!banner) return;
    setSaving(true);
    setError("");
    try {
      if (creating) await createHeroSlide(banner);
      else await updateHeroSlide(id, banner);
      router.push("/admin/home/hero");
    } catch (saveError) {
      setSaving(false);
      setError(saveError instanceof MartApiError ? saveError.message : "Could not save the slide.");
    }
  }

  const accent = ACCENTS.find((item) => item.id === banner.accent) ?? ACCENTS[1];

  return (
    <form onSubmit={save}>
      <HomeCmsHeader
        title={creating ? "New slide" : "Edit slide"}
        description={
          creating
            ? "Write the slide, then save it. Turn on Live if it should appear on the home page."
            : "Changes show on the home page when this slide is live."
        }
        sectionId="hero"
        extra={
          <button type="submit" disabled={saving} className={adminButtonClass.primary}>
            {saving ? "Saving…" : creating ? "Create slide" : "Save"}
          </button>
        }
      />

      {error ? <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Panel title="Copy">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="banner-eyebrow"
                label="Eyebrow"
                value={banner.eyebrow}
                placeholder="Short line above the title"
                onChange={(eyebrow) => setBanner({ ...banner, eyebrow })}
              />
              <Field
                id="banner-price"
                label="Price"
                value={banner.priceLabel}
                placeholder="৳999"
                onChange={(priceLabel) => setBanner({ ...banner, priceLabel })}
              />
            </div>
            <Field
              id="banner-title"
              label="Title"
              value={banner.title}
              placeholder="What visitors should notice"
              onChange={(title) => setBanner({ ...banner, title })}
            />
            <div>
              <FieldLabel htmlFor="banner-description">Description</FieldLabel>
              <textarea
                id="banner-description"
                value={banner.description}
                rows={3}
                placeholder="One or two lines under the title"
                onChange={(event) => setBanner({ ...banner, description: event.target.value })}
                className={cn(adminFieldClass, "h-auto py-3")}
              />
            </div>
          </Panel>

          <Panel title="Button">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="banner-cta"
                label="Label"
                value={banner.primaryCtaLabel}
                placeholder="Order now"
                onChange={(primaryCtaLabel) => setBanner({ ...banner, primaryCtaLabel })}
              />
              <Field
                id="banner-cta-href"
                label="Link"
                value={banner.primaryCtaHref}
                placeholder="/products"
                onChange={(primaryCtaHref) => setBanner({ ...banner, primaryCtaHref })}
              />
            </div>
          </Panel>

          <Panel title="Image">
            <ImageField
              value={heroImage(banner.imageSrc)}
              onChange={(imageSrc) => setBanner({ ...banner, imageSrc })}
            />
            <Field
              id="banner-alt"
              label="Image description"
              value={banner.imageAlt}
              placeholder="What the picture shows"
              onChange={(imageAlt) => setBanner({ ...banner, imageAlt })}
            />
            <div>
              <FieldLabel>Background</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((item) => {
                  const selected = banner.accent === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setBanner({ ...banner, accent: item.id })}
                      className={cn(
                        "inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium ring-1",
                        selected
                          ? "bg-neutral-950 text-white ring-neutral-950"
                          : "bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50",
                      )}
                    >
                      <span className={cn("size-3 rounded-full", item.swatch)} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>

          <Panel title="Visibility">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-neutral-950">{banner.published ? "Live on the home page" : "Hidden"}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {banner.published ? "Visitors can see this slide." : "Saved, but not shown until you publish it."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={banner.published}
                onClick={() => setBanner({ ...banner, published: !banner.published })}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full",
                  banner.published ? "bg-primary" : "bg-neutral-300",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-5 rounded-full bg-white",
                    banner.published ? "left-5" : "left-0.5",
                  )}
                />
              </button>
            </div>
            {creating ? null : (
              <div className="border-t border-neutral-100 pt-4">
                {confirmDelete ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-red-700">
                    Delete this slide?
                    <button
                      type="button"
                      onClick={() => {
                        void deleteHeroSlide(id)
                          .then(() => router.push("/admin/home/hero"))
                          .catch((deleteError: unknown) => {
                            setError(
                              deleteError instanceof MartApiError
                                ? deleteError.message
                                : "Could not delete the slide.",
                            );
                          });
                      }}
                      className="font-semibold underline"
                    >
                      Delete
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="font-semibold">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-sm font-medium text-neutral-500 hover:text-red-600"
                  >
                    Delete slide
                  </button>
                )}
              </div>
            )}
          </Panel>
        </div>

        <aside className="xl:sticky xl:top-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">Preview</p>
          <div className={cn("overflow-hidden rounded-2xl text-white", accent.banner)}>
            <div className="grid h-56 grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] items-center sm:h-72 lg:h-80">
              <div className="min-w-0 px-5 py-6 sm:px-7">
                <p className="text-[11px] font-medium text-primary">{banner.eyebrow || "Eyebrow"}</p>
                <p className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                  {banner.title || "Slide title"}
                </p>
                <p className="mt-2 line-clamp-2 max-w-[36ch] text-sm leading-relaxed text-white/70">
                  {banner.description || "Description shows here."}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white">
                    {banner.primaryCtaLabel || "Button"}
                  </span>
                  {banner.priceLabel ? (
                    <span className="text-sm font-semibold text-white/90">{banner.priceLabel}</span>
                  ) : null}
                </div>
              </div>
              <div className="relative h-full">
                {banner.imageSrc ? (
                  <Image src={heroImage(banner.imageSrc)} alt="" fill sizes="40vw" className="object-contain p-4" />
                ) : (
                  <div className="grid h-full place-items-center text-white/40">
                    <MaterialIcon name="image" className="text-[32px]" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            {banner.published ? "This preview matches a live slide." : "Hidden slides stay off the home page."}
          </p>
        </aside>
      </div>
    </form>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold text-neutral-950">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={adminFieldClass}
      />
    </div>
  );
}
