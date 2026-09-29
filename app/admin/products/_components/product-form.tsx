"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ProductBadge, ProductCategoryId } from "@/app/(client)/_data/products/products";
import { cn } from "@/lib/utils";
import {
  createAdminProduct,
  saveAdminProduct,
  type AdminProduct,
  type ProductDraft,
  type StockStatus,
} from "@/lib/mart-mock/store";

import {
  ADMIN_CATEGORY_LABEL,
  ADMIN_STOCK_STATUS_LABEL,
  AdminCard,
  adminFieldClass,
  FieldError,
  FieldLabel,
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
    compareAtPrice: product.compareAtPrice == null ? "" : String(product.compareAtPrice),
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
        setError("The compare-at price cannot be lower than the selling price.");
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
      saveAdminProduct({ ...draft, slug: product.slug, custom: product.custom });
    } else {
      createAdminProduct(draft);
    }
    router.push("/admin/products");
  }

  return (
    <AdminCard>
      <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="product-title">Name</FieldLabel>
          <input
            id="product-title"
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            className={adminFieldClass}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="product-subtitle">Subtitle</FieldLabel>
          <input
            id="product-subtitle"
            value={form.subtitle}
            onChange={(event) => setField("subtitle", event.target.value)}
            className={adminFieldClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="product-category">Category</FieldLabel>
          <select
            id="product-category"
            value={form.categoryId}
            onChange={(event) => setField("categoryId", event.target.value as ProductCategoryId)}
            className={adminFieldClass}
          >
            <option value="gadgets">{ADMIN_CATEGORY_LABEL.gadgets}</option>
            <option value="fashion">{ADMIN_CATEGORY_LABEL.fashion}</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="product-status">Status</FieldLabel>
          <select
            id="product-status"
            value={form.status}
            onChange={(event) => setField("status", event.target.value as StockStatus)}
            className={adminFieldClass}
          >
            <option value="available">{ADMIN_STOCK_STATUS_LABEL.available}</option>
            <option value="sold-out">{ADMIN_STOCK_STATUS_LABEL["sold-out"]}</option>
            <option value="coming-soon">{ADMIN_STOCK_STATUS_LABEL["coming-soon"]}</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="product-price">Selling price</FieldLabel>
          <input
            id="product-price"
            inputMode="numeric"
            value={form.price}
            onChange={(event) => setField("price", event.target.value)}
            className={adminFieldClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="product-compare">Compare-at price</FieldLabel>
          <input
            id="product-compare"
            inputMode="numeric"
            value={form.compareAtPrice}
            onChange={(event) => setField("compareAtPrice", event.target.value)}
            placeholder="Optional"
            className={adminFieldClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="product-qty">Quantity</FieldLabel>
          <input
            id="product-qty"
            inputMode="numeric"
            value={form.quantity}
            onChange={(event) => setField("quantity", event.target.value)}
            placeholder="Blank means made to order"
            className={adminFieldClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="product-badge">Badge</FieldLabel>
          <select
            id="product-badge"
            value={form.badge}
            onChange={(event) => setField("badge", event.target.value as ProductBadge | "")}
            className={adminFieldClass}
          >
            {BADGE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <ImageField value={form.imageSrc} onChange={(imageSrc) => setField("imageSrc", imageSrc)} />
        </div>
        <Toggle
          label="Featured"
          checked={form.featured}
          onChange={(checked) => setField("featured", checked)}
        />
        <Toggle
          label="Published"
          checked={form.published}
          onChange={(checked) => setField("published", checked)}
        />
        {error ? (
          <div className="sm:col-span-2">
            <FieldError message={error} />
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/80"
          >
            Save
          </button>
        </div>
      </form>
    </AdminCard>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f5f6f8] px-3.5 py-3">
      <span className="text-sm font-medium text-neutral-800">{label}</span>
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
