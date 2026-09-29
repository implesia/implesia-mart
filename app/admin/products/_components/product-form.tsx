"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { categoryLabels, type ProductBadge, type ProductCategoryId } from "@/app/(client)/_data/products/products";
import { cn } from "@/lib/utils";
import {
  createAdminProduct,
  saveAdminProduct,
  type AdminProduct,
  type ProductDraft,
  type StockStatus,
} from "@/lib/mart-mock/store";

import {
  AdminCard,
  adminFieldClass,
  FieldError,
  FieldLabel,
} from "../../_components/admin-ui";

const BADGE_OPTIONS: { value: ProductBadge | ""; label: string }[] = [
  { value: "", label: "নেই" },
  { value: "New", label: "নতুন" },
  { value: "Best Seller", label: "বেস্ট সেলার" },
  { value: "Limited", label: "লিমিটেড" },
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
      setError("নাম দিন।");
      return;
    }
    const price = Number(form.price);
    if (!form.price.trim() || !Number.isFinite(price) || price < 0) {
      setError("বিক্রয় মূল্য দিন।");
      return;
    }
    let compareAtPrice: number | null = null;
    if (form.compareAtPrice.trim()) {
      compareAtPrice = Number(form.compareAtPrice);
      if (!Number.isFinite(compareAtPrice) || compareAtPrice < 0) {
        setError("আগের মূল্য সংখ্যায় দিন, অথবা খালি রাখুন।");
        return;
      }
      if (compareAtPrice < price) {
        setError("আগের মূল্য বিক্রয় মূল্যের চেয়ে ছোট হতে পারবে না।");
        return;
      }
    }
    let quantity: number | null = null;
    if (form.quantity.trim()) {
      quantity = Number(form.quantity);
      if (!Number.isInteger(quantity) || quantity < 0) {
        setError("পরিমাণ খালি রাখুন, অথবা ০ বা তার বেশি পূর্ণসংখ্যা দিন।");
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
          <FieldLabel htmlFor="product-title">নাম</FieldLabel>
          <input
            id="product-title"
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            className={adminFieldClass}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="product-subtitle">সাবটাইটেল</FieldLabel>
          <input
            id="product-subtitle"
            value={form.subtitle}
            onChange={(event) => setField("subtitle", event.target.value)}
            className={adminFieldClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="product-category">ক্যাটাগরি</FieldLabel>
          <select
            id="product-category"
            value={form.categoryId}
            onChange={(event) => setField("categoryId", event.target.value as ProductCategoryId)}
            className={adminFieldClass}
          >
            <option value="gadgets">{categoryLabels.gadgets}</option>
            <option value="fashion">{categoryLabels.fashion}</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="product-status">অবস্থা</FieldLabel>
          <select
            id="product-status"
            value={form.status}
            onChange={(event) => setField("status", event.target.value as StockStatus)}
            className={adminFieldClass}
          >
            <option value="available">আছে</option>
            <option value="sold-out">শেষ</option>
            <option value="coming-soon">শীঘ্রই আসছে</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="product-price">বিক্রয় মূল্য</FieldLabel>
          <input
            id="product-price"
            inputMode="numeric"
            value={form.price}
            onChange={(event) => setField("price", event.target.value)}
            className={adminFieldClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="product-compare">আগের মূল্য</FieldLabel>
          <input
            id="product-compare"
            inputMode="numeric"
            value={form.compareAtPrice}
            onChange={(event) => setField("compareAtPrice", event.target.value)}
            placeholder="খালি থাকতে পারে"
            className={adminFieldClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="product-qty">পরিমাণ</FieldLabel>
          <input
            id="product-qty"
            inputMode="numeric"
            value={form.quantity}
            onChange={(event) => setField("quantity", event.target.value)}
            placeholder="খালি মানে অর্ডার অনুযায়ী"
            className={adminFieldClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="product-badge">ব্যাজ</FieldLabel>
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
          <FieldLabel htmlFor="product-image">ছবির পাথ</FieldLabel>
          <input
            id="product-image"
            value={form.imageSrc}
            onChange={(event) => setField("imageSrc", event.target.value)}
            className={adminFieldClass}
          />
        </div>
        <Toggle
          label="ফিচার্ড"
          checked={form.featured}
          onChange={(checked) => setField("featured", checked)}
        />
        <Toggle
          label="প্রকাশিত"
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
            সেভ
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
        <span className="sr-only">{checked ? "চালু" : "বন্ধ"}</span>
      </button>
    </div>
  );
}
