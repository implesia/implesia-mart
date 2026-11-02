"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { brandedTitle, productSeo, SITE_URL } from "@/lib/seo";

import { adminFieldClass, FieldLabel } from "../../_components/admin-ui";

/** Google shows about this much; longer text is cut off in results. */
const TITLE_GUIDE = 60;
const DESCRIPTION_GUIDE = 160;
/** API limits. */
export const SEO_TITLE_MAX = 120;
export const SEO_DESCRIPTION_MAX = 320;
export const SEO_KEYWORDS_MAX = 500;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type SeoValues = {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

type Props = {
  formId: string;
  value: SeoValues;
  onChange: (key: keyof SeoValues, value: string) => void;
  /** The product as the storefront falls back to it. */
  fallback: { title: string; description: string; subtitle: string; tagline: string };
  /** Edit mode: the slug can be changed. A new product gets one from its name. */
  productId?: string;
  slugError?: string;
  serverSlugErrors?: ReactNode;
  serverSeoErrors?: ReactNode;
  slugInvalid?: boolean;
};

function Counter({ length, guide, max }: { length: number; guide: number; max?: number }) {
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        length > guide ? "font-medium text-amber-700" : "text-neutral-500",
      )}
    >
      {length} / {guide}
      {max ? <span className="text-neutral-400"> (max {max})</span> : null}
    </span>
  );
}

export function ProductSeoFields({
  formId,
  value,
  onChange,
  fallback,
  productId,
  slugError,
  serverSlugErrors,
  serverSeoErrors,
  slugInvalid = false,
}: Props) {
  const keywords = value.seoKeywords
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);
  const seo = productSeo({
    ...fallback,
    title: fallback.title || "Product name",
    seo: { title: value.seoTitle, description: value.seoDescription, keywords },
  });
  const shownTitle = brandedTitle(seo.title);
  const host = SITE_URL.replace(/^https?:\/\//, "");

  return (
    <div className="grid gap-4">
      <div
        className="rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200"
        aria-label="Google search preview"
      >
        <p className="mb-2 text-xs font-medium tracking-wide text-neutral-500 uppercase">
          Google preview
        </p>
        <p className="truncate text-xs text-neutral-600">
          {host} › products › {productId ?? "…"}
        </p>
        <p className="mt-0.5 line-clamp-1 text-lg leading-snug text-primary">{shownTitle}</p>
        <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-neutral-600">
          {seo.description || "Add a description so search results have a snippet."}
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <FieldLabel htmlFor={`${formId}-seo-title`}>SEO title</FieldLabel>
          <Counter length={shownTitle.length} guide={TITLE_GUIDE} />
        </div>
        <input
          id={`${formId}-seo-title`}
          value={value.seoTitle}
          maxLength={SEO_TITLE_MAX}
          onChange={(event) => onChange("seoTitle", event.target.value)}
          placeholder={fallback.title || "Uses the product name"}
          className={adminFieldClass}
        />
        <p className="mt-1.5 text-xs text-neutral-500">
          Empty = the product name. “| Implesia Mart” is added for you; the count includes it.
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <FieldLabel htmlFor={`${formId}-seo-description`}>Meta description</FieldLabel>
          <Counter length={value.seoDescription.trim().length} guide={DESCRIPTION_GUIDE} />
        </div>
        <textarea
          id={`${formId}-seo-description`}
          value={value.seoDescription}
          maxLength={SEO_DESCRIPTION_MAX}
          rows={3}
          onChange={(event) => onChange("seoDescription", event.target.value)}
          placeholder="Empty = the product description, cut to about 160 characters"
          className={cn(adminFieldClass, "h-auto py-2.5")}
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <FieldLabel htmlFor={`${formId}-seo-keywords`}>Keywords</FieldLabel>
          <span className="text-xs text-neutral-500 tabular-nums">
            {value.seoKeywords.length} / {SEO_KEYWORDS_MAX}
          </span>
        </div>
        <input
          id={`${formId}-seo-keywords`}
          value={value.seoKeywords}
          maxLength={SEO_KEYWORDS_MAX}
          onChange={(event) => onChange("seoKeywords", event.target.value)}
          placeholder="lamp, desk lamp, ল্যাম্প"
          className={adminFieldClass}
        />
        <p className="mt-1.5 text-xs text-neutral-500">Separate with commas.</p>
      </div>
      {serverSeoErrors}

      <div>
        <FieldLabel htmlFor={`${formId}-slug`}>Slug</FieldLabel>
        {productId ? (
          <>
            <input
              id={`${formId}-slug`}
              value={value.slug}
              maxLength={160}
              onChange={(event) => onChange("slug", event.target.value.toLowerCase())}
              aria-invalid={slugError || slugInvalid ? true : undefined}
              aria-describedby={slugError ? `${formId}-slug-error` : undefined}
              className={cn(
                adminFieldClass,
                "font-mono text-sm",
                (slugError || slugInvalid) &&
                  "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200",
              )}
            />
            {slugError ? (
              <p id={`${formId}-slug-error`} className="mt-1.5 text-sm text-red-700">
                {slugError}
              </p>
            ) : null}
            {serverSlugErrors}
            <p className="mt-1.5 text-xs text-neutral-500">
              Lowercase letters, numbers and hyphens. Product pages live at their id, so a new
              slug never breaks links; old /products/&lt;slug&gt; links keep redirecting here.
            </p>
          </>
        ) : (
          <p className="text-xs text-neutral-500">Made from the product name when you save.</p>
        )}
      </div>
    </div>
  );
}
