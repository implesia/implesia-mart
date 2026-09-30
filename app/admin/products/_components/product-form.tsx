"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  ProductBadge,
  ProductCategoryId,
} from "@/app/(client)/_data/products/products";
import { cn } from "@/lib/utils";
import {
  createAdminProduct,
  formatTaka,
  saveAdminProduct,
  type AdminProduct,
  type ProductDraft,
  type StockStatus,
} from "@/lib/mart-mock/store";

import {
  ADMIN_CATEGORY_LABEL,
  ADMIN_STOCK_STATUS_LABEL,
  adminFieldClass,
  FieldError,
  FieldLabel,
  STOCK_STATUS_TONE,
} from "../../_components/admin-ui";
import { ImageField } from "../../_components/image-field";

const BADGE_OPTIONS: { value: ProductBadge | ""; label: string }[] = [
  { value: "", label: "None" },
  { value: "New", label: "New" },
  { value: "Best Seller", label: "Best seller" },
  { value: "Limited", label: "Limited" },
];

type FormState = {
  title: string;
  subtitle: string;
  categoryId: ProductCategoryId;
  price: string;
  compareAtPrice: string;
  quantity: string;
  status: StockStatus;
  badge: ProductBadge | "";
  imageSrc: string;
  featured: boolean;
  published: boolean;
};

function toForm(product?: AdminProduct): FormState {
  if (!product) {
    return {
      title: "",
      subtitle: "",
      categoryId: "gadgets",
      price: "",
      compareAtPrice: "",
      quantity: "",
      status: "available",
      badge: "",
      imageSrc: "",
      featured: false,
      published: true,
    };
  }
  return {
    title: product.title,
    subtitle: product.subtitle,
    categoryId: product.categoryId,
    price: String(product.price),
    compareAtPrice:
      product.compareAtPrice == null ? "" : String(product.compareAtPrice),
    quantity: product.quantity == null ? "" : String(product.quantity),
    status: product.status,
    badge: product.badge ?? "",
    imageSrc: product.imageSrc,
    featured: product.featured,
    published: product.published,
  };
}

export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toForm(product));
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError("Enter a name.");
      return;
    }
    const price = Number(form.price);
    if (!form.price.trim() || !Number.isFinite(price) || price < 0) {
      setError("Enter a selling price.");
      return;
    }
    let compareAtPrice: number | null = null;
    if (form.compareAtPrice.trim()) {
      compareAtPrice = Number(form.compareAtPrice);
      if (!Number.isFinite(compareAtPrice) || compareAtPrice < 0) {
        setError("Enter the compare-at price as a number, or leave it blank.");
        return;
      }
      if (compareAtPrice < price) {
        setError(
          "The compare-at price cannot be lower than the selling price.",
        );
        return;
      }
    }
    let quantity: number | null = null;
    if (form.quantity.trim()) {
      quantity = Number(form.quantity);
      if (!Number.isInteger(quantity) || quantity < 0) {
        setError("Leave quantity blank, or enter a whole number of 0 or more.");
        return;
      }
    }

    const draft: ProductDraft = {
      title,
      subtitle: form.subtitle.trim(),
      categoryId: form.categoryId,
      price,
      compareAtPrice,
      quantity,
      status: form.status,
      badge: form.badge || null,
      imageSrc: form.imageSrc.trim(),
      featured: form.featured,
      published: form.published,
    };

    if (product) {
      saveAdminProduct({
        ...draft,
        slug: product.slug,
        custom: product.custom,
      });
    } else {
      createAdminProduct(draft);
    }
    router.push("/admin/products");
  }

  const priceNumber = Number(form.price);
  const priceReady =
    form.price.trim() !== "" &&
    Number.isFinite(priceNumber) &&
    priceNumber >= 0;
  const compareNumber = Number(form.compareAtPrice);
  const compareReady =
    form.compareAtPrice.trim() !== "" &&
    Number.isFinite(compareNumber) &&
    compareNumber > (priceReady ? priceNumber : 0);

  return (
    <form
      onSubmit={save}
      className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_24rem]"
      noValidate
    >
      <div className="space-y-3">
        <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
          <h2 className="text-sm font-semibold text-neutral-950">Details</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <FieldLabel htmlFor="product-title">Name</FieldLabel>
              <input
                id="product-title"
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="Product name"
                className={adminFieldClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="product-subtitle">Subtitle</FieldLabel>
              <input
                id="product-subtitle"
                value={form.subtitle}
                onChange={(event) => setField("subtitle", event.target.value)}
                placeholder="Short line under the name"
                className={adminFieldClass}
              />
            </div>
            <fieldset className="lg:col-span-2">
              <legend className="mb-1.5 text-sm font-medium text-neutral-700">
                Category
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {(["gadgets", "fashion"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={form.categoryId === id}
                    onClick={() => setField("categoryId", id)}
                    className={cn(
                      "h-11 rounded-xl text-sm font-medium ring-1 transition-colors",
                      form.categoryId === id
                        ? "bg-primary/10 text-primary ring-primary/30"
                        : "bg-[#f5f6f8] text-neutral-700 ring-transparent hover:bg-neutral-100",
                    )}
                  >
                    {ADMIN_CATEGORY_LABEL[id]}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </section>

        <div className="grid items-start gap-3 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold text-neutral-950">
              Price and stock
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="product-price">Selling price</FieldLabel>
                <input
                  id="product-price"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(event) => setField("price", event.target.value)}
                  placeholder="999"
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="product-compare">
                  Compare-at price
                </FieldLabel>
                <input
                  id="product-compare"
                  inputMode="numeric"
                  value={form.compareAtPrice}
                  onChange={(event) =>
                    setField("compareAtPrice", event.target.value)
                  }
                  placeholder="Optional"
                  className={adminFieldClass}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="product-qty">Quantity</FieldLabel>
                <input
                  id="product-qty"
                  inputMode="numeric"
                  value={form.quantity}
                  onChange={(event) => setField("quantity", event.target.value)}
                  placeholder="Blank = made to order"
                  className={adminFieldClass}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <ImageField
              value={form.imageSrc}
              onChange={(imageSrc) => setField("imageSrc", imageSrc)}
            />
          </section>
        </div>
      </div>

      <aside className="space-y-3 xl:sticky xl:top-20">
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
          <div className="relative aspect-[4/3] bg-[#f3f4f6]">
            {form.imageSrc ? (
              <Image
                src={form.imageSrc}
                alt=""
                fill
                sizes="360px"
                className="object-contain p-4"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-neutral-400">
                No image yet
              </div>
            )}
          </div>
          <div className="space-y-2 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  STOCK_STATUS_TONE[form.status],
                )}
              >
                {ADMIN_STOCK_STATUS_LABEL[form.status]}
              </span>
              {form.badge ? (
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                  {form.badge}
                </span>
              ) : null}
              <span className="text-xs text-neutral-500">
                {ADMIN_CATEGORY_LABEL[form.categoryId]}
              </span>
            </div>
            <p className="text-base font-semibold text-neutral-950">
              {form.title.trim() || "Product name"}
            </p>
            {form.subtitle.trim() ? (
              <p className="text-sm text-neutral-500">{form.subtitle.trim()}</p>
            ) : null}
            <p className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tabular-nums text-neutral-950">
                {priceReady ? formatTaka(priceNumber) : "৳—"}
              </span>
              {compareReady ? (
                <span className="text-sm text-neutral-400 line-through tabular-nums">
                  {formatTaka(compareNumber)}
                </span>
              ) : null}
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90">
          <p className="text-sm font-medium text-neutral-700">Stock</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {(["available", "sold-out", "coming-soon"] as const).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  aria-pressed={form.status === status}
                  onClick={() => setField("status", status)}
                  className={cn(
                    "h-9 rounded-full px-2 text-xs font-semibold",
                    form.status === status
                      ? STOCK_STATUS_TONE[status]
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
                  )}
                >
                  {ADMIN_STOCK_STATUS_LABEL[status]}
                </button>
              ),
            )}
          </div>
          <p className="mt-4 text-sm font-medium text-neutral-700">Badge</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {BADGE_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={form.badge === option.value}
                onClick={() => setField("badge", option.value)}
                className={cn(
                  "h-8 rounded-full px-3 text-xs font-semibold",
                  form.badge === option.value
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <Toggle
              label="Featured"
              hint="Shows a Featured label in the product list."
              checked={form.featured}
              onChange={(checked) => setField("featured", checked)}
            />
            <Toggle
              label="Published"
              hint={
                form.published
                  ? "Marked live in the catalog."
                  : "Marked hidden in the catalog."
              }
              checked={form.published}
              onChange={(checked) => setField("published", checked)}
            />
          </div>
          {error ? <FieldError message={error} /> : null}
          <button
            type="submit"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white hover:bg-black"
          >
            {product ? "Save changes" : "Add product"}
          </button>
        </section>
      </aside>
    </form>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f5f6f8] px-3.5 py-3">
      <span>
        <span className="block text-sm font-medium text-neutral-800">
          {label}
        </span>
        <span className="block text-xs text-neutral-500">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-neutral-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-all",
            checked ? "left-5" : "left-0.5",
          )}
        />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}
