"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import type {
  ProductBadge,
  ProductCategoryId,
} from "@/app/(client)/_data/products/products";
import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";
import {
  rollup,
  rowsFromVariants,
  rowsToVariants,
  sameVariants,
  validateVariants,
  type VariantRow,
} from "@/lib/mart-api/admin-variants";
import {
  deleteMartProduct,
  MartApiError,
  saveMartProduct,
  type ApiFieldError,
} from "@/lib/mart-api/products";
import {
  cleanProductContent,
  emptyProductContent,
  type ProductStorefrontContent,
} from "@/lib/mart-mock/product-content";
import {
  formatTaka,
  type AdminProduct,
  type ProductDraft,
  type StockStatus,
} from "@/lib/mart-mock/store";

import {
  ADMIN_STOCK_STATUS_LABEL,
  adminButtonClass,
  adminFieldClass,
  AdminPageHeader,
  FieldError,
  FieldLabel,
  STOCK_STATUS_TONE,
  StockStatusBadge,
} from "../../_components/admin-ui";
import { UnsavedChangesDialog } from "../../_components/unsaved-changes-dialog";
import { useAdminNotify, useConfirmDelete } from "../../_components/confirm-delete";
import { ImageField } from "../../_components/image-field";
import {
  ProductCopyFields,
  ProductDetailFields,
  ProductGalleryFields,
} from "./product-content-fields";
import { CategoryCascade } from "./category-cascade";
import { ProductOptionsFields } from "./product-options-fields";
import { ProductVariantsFields } from "./product-variants-fields";
import { productPath } from "@/lib/mart-api/product-url";
import { badgeToneClass, type AdminBadgeRef } from "@/lib/mart-api/badge-rules";
import { ProductBadgePicker } from "./product-badge-picker";
import { QuantityTiersEditor } from "../../_components/quantity-tiers-editor";
import {
  derivedBase,
  parsePercent,
  parseTierRows,
  percentText,
  sellingPrice,
  tierRowsFrom,
  type TierRow,
} from "@/lib/mart-api/pricing";

const SECTIONS = [
  { id: "product-information", label: "Product information" },
  { id: "product-media", label: "Media" },
  { id: "product-pricing", label: "Pricing" },
  { id: "product-inventory", label: "Inventory" },
  { id: "product-options", label: "Options" },
  { id: "product-variants", label: "Variants" },
  { id: "product-details", label: "Product details" },
  { id: "product-organization", label: "Organization" },
  { id: "product-publishing", label: "Publishing" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

type FormState = {
  title: string;
  subtitle: string;
  categoryId: ProductCategoryId;
  categoryRefId: string;
  categoryTrail: string;
  /** Derived from regularPrice + baseDiscount; kept for the preview and the variant default. */
  price: string;
  compareAtPrice: string;
  regularPrice: string;
  baseDiscount: string;
  tierMode: "global" | "custom";
  tiers: TierRow[];
  quantity: string;
  status: StockStatus;
  /** Legacy single badge; only sent when `badges` is unknown (older API data). */
  badge: ProductBadge | "";
  /** Badges in display order. `null` = the API did not send a list for this product. */
  badges: AdminBadgeRef[] | null;
  imageSrc: string;
  featured: boolean;
  published: boolean;
  content: ProductStorefrontContent;
  minOrder: string;
  maxOrder: string;
  variants: VariantRow[];
};

type FieldKey =
  | "category"
  | "title"
  | "price"
  | "compareAtPrice"
  | "baseDiscount"
  | "quantityTiers"
  | "quantity"
  | "orderLimits"
  | "variants";
type FieldErrors = Partial<Record<FieldKey, string>>;

// Field keys in the product create API's `errors` list, in the order the form shows them.
const SERVER_FIELD_ORDER = [
  "title",
  "slug",
  "subtitle",
  "images",
  "regularPrice",
  "price",
  "compareAtPrice",
  "baseDiscount",
  "quantityTiers",
  "quantity",
  "status",
  "orderLimits",
  "variants",
  "content",
  "category",
  "badges",
  "publishing",
  "form",
] as const;

const SERVER_FIELD_LABEL: Record<string, string> = {
  title: "প্রোডাক্টের নাম",
  slug: "প্রোডাক্টের নাম",
  subtitle: "সাবটাইটেল",
  images: "ছবি",
  price: "দাম",
  compareAtPrice: "আগের দাম",
  regularPrice: "রেগুলার দাম",
  baseDiscount: "বেস ছাড়",
  quantityTiers: "পরিমাণ অনুযায়ী ছাড়",
  quantity: "স্টকের পরিমাণ",
  status: "স্টক স্ট্যাটাস",
  orderLimits: "অর্ডারের সীমা",
  variants: "ভ্যারিয়েন্ট",
  content: "প্রোডাক্টের বিস্তারিত",
  category: "ক্যাটাগরি",
  badges: "ব্যাজ",
  publishing: "পাবলিশিং",
  form: "ফর্ম",
};

/** Section that holds each API field; `form` problems live in the summary only. */
const SERVER_FIELD_SECTION: Record<string, SectionId> = {
  title: "product-information",
  slug: "product-information",
  subtitle: "product-information",
  images: "product-media",
  price: "product-pricing",
  compareAtPrice: "product-pricing",
  regularPrice: "product-pricing",
  baseDiscount: "product-pricing",
  quantityTiers: "product-pricing",
  quantity: "product-inventory",
  status: "product-inventory",
  orderLimits: "product-inventory",
  variants: "product-variants",
  content: "product-details",
  category: "product-organization",
  badges: "product-organization",
  publishing: "product-publishing",
};

/** `${formId}-<suffix>` input to focus for an API field. */
const SERVER_FIELD_INPUT: Record<string, string> = {
  title: "title",
  slug: "title",
  subtitle: "subtitle",
  price: "price",
  compareAtPrice: "price",
  regularPrice: "price",
  baseDiscount: "base",
  quantity: "qty",
  orderLimits: "min-order",
};

/** API fields whose error goes away as soon as the matching form value changes. */
const SERVER_FIELDS_FOR: Partial<Record<keyof FormState, string[]>> = {
  title: ["title", "slug"],
  subtitle: ["subtitle"],
  price: ["price"],
  compareAtPrice: ["compareAtPrice"],
  regularPrice: ["regularPrice", "price", "compareAtPrice"],
  baseDiscount: ["baseDiscount", "price", "compareAtPrice"],
  tierMode: ["quantityTiers"],
  tiers: ["quantityTiers"],
  quantity: ["quantity"],
  status: ["status"],
  minOrder: ["orderLimits"],
  maxOrder: ["orderLimits"],
  variants: ["variants", "price", "quantity"],
  imageSrc: ["images"],
  badges: ["badges"],
  published: ["publishing"],
  featured: ["publishing"],
};

const INVALID_FIELD = "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200";
const NETWORK_TOAST =
  "সার্ভারের সাথে যোগাযোগ করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।";
const SERVER_TOAST = "সার্ভারে একটা সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।";

function bengaliDigits(value: number) {
  return String(value).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function serverRank(field: string) {
  const index = (SERVER_FIELD_ORDER as readonly string[]).indexOf(field);
  return index === -1 ? SERVER_FIELD_ORDER.length : index;
}

const SIDEBAR_KEY = "implesia.admin.sidebar.collapsed";
const SIDEBAR_EVENT = "implesia-admin-sidebar";

function useAdminSidebarCollapsed() {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener(SIDEBAR_EVENT, onStoreChange);
      window.addEventListener("storage", onStoreChange);
      return () => {
        window.removeEventListener(SIDEBAR_EVENT, onStoreChange);
        window.removeEventListener("storage", onStoreChange);
      };
    },
    () => window.localStorage.getItem(SIDEBAR_KEY) === "1",
    () => false,
  );
}

function toForm(product?: AdminProduct): FormState {
  if (!product) {
    return {
      title: "",
      subtitle: "",
      categoryId: "",
      categoryRefId: "",
      categoryTrail: "",
      price: "",
      compareAtPrice: "",
      regularPrice: "",
      baseDiscount: "",
      tierMode: "global",
      tiers: [],
      quantity: "",
      status: "available",
      badge: "",
      badges: [],
      imageSrc: "",
      featured: false,
      published: false,
      content: emptyProductContent(),
      minOrder: "1",
      maxOrder: "",
      variants: [],
    };
  }
  const regular =
    product.regularPrice ?? Math.max(product.compareAtPrice ?? 0, product.price);
  const base = product.baseDiscountPercent ?? derivedBase(regular, product.price);
  const blankPrice = !product.published && product.price === 0 && !product.variants?.length;
  return {
    title: product.title,
    subtitle: product.subtitle,
    categoryId: product.categoryId,
    categoryRefId: product.categoryRefId ?? "",
    categoryTrail: product.categoryPath?.map((node) => node.name).join(" › ") ?? "",
    // A draft saved without a price is stored as 0; show it blank so publishing asks for one.
    price:
      !product.published && product.price === 0 && !product.variants?.length
        ? ""
        : String(product.price),
    compareAtPrice:
      product.compareAtPrice == null ? "" : String(product.compareAtPrice),
    regularPrice: blankPrice ? "" : String(regular),
    baseDiscount: base ? percentText(base) : "",
    tierMode: product.tierMode ?? "global",
    tiers: tierRowsFrom(product.quantityTiers ?? []),
    quantity: product.quantity == null ? "" : String(product.quantity),
    status: product.status,
    badge: product.badge ?? "",
    badges: product.badges ? [...product.badges] : null,
    imageSrc: product.imageSrc,
    featured: product.featured,
    published: product.published,
    content: structuredClone(product.content),
    minOrder: String(product.minOrderQuantity ?? 1),
    maxOrder: product.maxOrderQuantity == null ? "" : String(product.maxOrderQuantity),
    variants: rowsFromVariants(product.variants),
  };
}

/** `draft` saves with only a name; `publish` also needs a category and a price. */
type SaveIntent = "draft" | "publish";

function validate(form: FormState, intent: SaveIntent = "publish"): FieldErrors {
  const errors: FieldErrors = {};
  const publishing = intent === "publish";
  if (!form.title.trim()) errors.title = "Product name is required.";
  if (publishing && !form.categoryRefId) errors.category = "Choose a category.";

  // With variants the API rolls the price and stock up from them, so the product's own are unused.
  const hasVariants = form.variants.length > 0;
  const price = Number(form.price);
  // A draft may leave the price blank. A price that was typed must still be valid.
  const priceMissing = !form.price.trim();
  if (
    !hasVariants &&
    ((publishing && priceMissing) ||
      (!priceMissing && (!Number.isFinite(price) || price < 0)))
  ) {
    errors.price = "Enter a regular price as a whole number of taka.";
  }
  if (!hasVariants && parsePercent(form.baseDiscount) == null) {
    errors.baseDiscount = "Enter a base discount from 0 to 99.99%, at most two decimals.";
  }
  if (form.tierMode === "custom") {
    const tierError = parseTierRows(form.tiers).error;
    if (tierError) errors.quantityTiers = tierError;
  }

  if (!hasVariants && form.compareAtPrice.trim()) {
    const compareAtPrice = Number(form.compareAtPrice);
    if (!Number.isFinite(compareAtPrice) || compareAtPrice < 0) {
      errors.compareAtPrice =
        "Enter the compare-at price as a number, or leave it blank.";
    } else if (!errors.price && compareAtPrice < price) {
      errors.compareAtPrice =
        "Compare-at price must be at least the selling price.";
    }
  }

  if (!hasVariants && form.quantity.trim()) {
    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      errors.quantity =
        "Leave quantity blank, or enter a whole number of 0 or more.";
    }
  }

  const min = Number(form.minOrder);
  const max = Number(form.maxOrder);
  if (!Number.isInteger(min) || min < 1 || min > 5) {
    errors.orderLimits = "Minimum per order must be a whole number from 1 to 5.";
  } else if (form.maxOrder.trim()) {
    if (!Number.isInteger(max) || max < 1 || max > 5) {
      errors.orderLimits = "Maximum per order must be from 1 to 5, or blank for no extra limit.";
    } else if (max < min) {
      errors.orderLimits = "Maximum per order must be at least the minimum.";
    }
  }

  if (hasVariants && !validateVariants(form.variants, form.content.options).ok) {
    errors.variants = "Fix the highlighted variants.";
  }

  return errors;
}

function firstErrorSection(errors: FieldErrors): SectionId | null {
  if (errors.title) return "product-information";
  if (errors.category) return "product-organization";
  if (errors.price || errors.compareAtPrice || errors.baseDiscount || errors.quantityTiers) {
    return "product-pricing";
  }
  if (errors.quantity || errors.orderLimits) return "product-inventory";
  if (errors.variants) return "product-variants";
  return null;
}

export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<FormState>(() => toForm(product));
  const [baseline] = useState<FormState>(() => toForm(product));
  const [showErrors, setShowErrors] = useState(false);
  const [errorIntent, setErrorIntent] = useState<SaveIntent>("publish");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [serverErrors, setServerErrors] = useState<ApiFieldError[]>([]);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastSeq = useRef(0);
  const confirmDelete = useConfirmDelete();
  const notify = useAdminNotify();
  const [uploading, setUploading] = useState(false);
  const uploads = useRef(0);
  const [active, setActive] = useState<SectionId>("product-information");
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const bypassLeave = useRef(false);
  const collapsed = useAdminSidebarCollapsed();

  const issues = validate(form);
  const errors = showErrors ? validate(form, errorIntent) : {};
  const dirty =
    JSON.stringify({ ...form, categoryTrail: "" }) !==
    JSON.stringify({ ...baseline, categoryTrail: "" });
  const variantMode = form.variants.length > 0;
  const variantCheck = validateVariants(form.variants, form.content.options);
  const summary = rollup(form.variants);
  const shownPrice = variantMode ? String(summary.price ?? "") : form.price;
  const shownQuantity = variantMode
    ? summary.quantity == null
      ? ""
      : String(summary.quantity)
    : form.quantity;
  const priceNumber = Number(form.price);
  const priceReady =
    form.price.trim() !== "" &&
    Number.isFinite(priceNumber) &&
    priceNumber >= 0;
  const compareNumber = Number(form.compareAtPrice);
  const compareReady =
    form.compareAtPrice.trim() !== "" &&
    Number.isFinite(compareNumber) &&
    compareNumber >= 0 &&
    !issues.compareAtPrice;
  const discount =
    priceReady && compareReady && compareNumber > priceNumber
      ? Math.round(((compareNumber - priceNumber) / compareNumber) * 100)
      : null;

  function serverFor(...fields: string[]) {
    return serverErrors.filter((item) => fields.includes(item.field));
  }

  function clearServer(fields: string[]) {
    setServerErrors((prev) =>
      prev.some((item) => fields.includes(item.field))
        ? prev.filter((item) => !fields.includes(item.field))
        : prev,
    );
  }

  /** Regular price + base % -> the quantity-1 selling price shown and saved. */
  function setPricing(patch: { regularPrice?: string; baseDiscount?: string }) {
    clearServer(["regularPrice", "baseDiscount", "price", "compareAtPrice"]);
    setForm((prev) => {
      const regularPrice = patch.regularPrice ?? prev.regularPrice;
      const baseDiscount = patch.baseDiscount ?? prev.baseDiscount;
      const regular = Number(regularPrice);
      const base = parsePercent(baseDiscount);
      const ok = regularPrice.trim() !== "" && Number.isInteger(regular) && regular >= 0;
      // An invalid regular price is kept as typed so validation flags it.
      const price = ok && base != null ? sellingPrice(regular, base) : null;
      return {
        ...prev,
        regularPrice,
        baseDiscount,
        price: price == null ? regularPrice : String(price),
        compareAtPrice: price != null && price < regular ? String(regular) : "",
      };
    });
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    const fields = SERVER_FIELDS_FOR[key];
    if (fields) clearServer(fields);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setContent(content: ProductStorefrontContent) {
    if (JSON.stringify(content) !== JSON.stringify(form.content)) {
      clearServer(["content", "images"]);
    }
    setForm((prev) => ({ ...prev, content }));
  }

  function showToast(message: string) {
    toastSeq.current += 1;
    setToast({ message, key: toastSeq.current });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function focusServerField(field: string) {
    const suffix = SERVER_FIELD_INPUT[field];
    const input = suffix ? document.getElementById(`${formId}-${suffix}`) : null;
    if (input && !(input as HTMLInputElement).disabled) {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      input.focus({ preventScroll: true });
      return;
    }
    const section = SERVER_FIELD_SECTION[field];
    if (section) {
      scrollToSection(section);
      document.getElementById(`${formId}-server-${field}`)?.focus({ preventScroll: true });
      return;
    }
    const summary = document.getElementById(`${formId}-error-summary`);
    summary?.scrollIntoView({ behavior: "smooth", block: "center" });
    summary?.focus({ preventScroll: true });
  }

  function onUploadBusy(busy: boolean) {
    uploads.current = Math.max(0, uploads.current + (busy ? 1 : -1));
    setUploading(uploads.current > 0);
  }

  function scrollToSection(id: SectionId) {
    setActive(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    const nodes = SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((node): node is HTMLElement => node != null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.id;
        if (id && SECTIONS.some((section) => section.id === id))
          setActive(id as SectionId);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.15, 0.4] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (bypassLeave.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const onClick = (event: MouseEvent) => {
      if (bypassLeave.current) return;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setLeaveHref(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  function requestLeave(href: string) {
    if (!dirty || bypassLeave.current) {
      router.push(href);
      return;
    }
    setLeaveHref(href);
  }

  function confirmLeave() {
    const href = leaveHref;
    bypassLeave.current = true;
    setLeaveHref(null);
    if (href) router.push(href);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The pressed button decides. Enter in a field keeps the current status (hidden default button).
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent: SaveIntent = submitter?.value === "publish" ? "publish" : "draft";
    const nextErrors = validate(form, intent);
    if (Object.keys(nextErrors).length > 0) {
      setErrorIntent(intent);
      setShowErrors(true);
      showToast(
        intent === "draft"
          ? "Add a product name to save the draft."
          : "Fix the highlighted fields to publish.",
      );
      const section = firstErrorSection(nextErrors);
      if (section) scrollToSection(section);
      return;
    }
    if (uploading || saving) return;
    setServerErrors([]);

    const price = variantMode ? (summary.price ?? 0) : Number(form.price || 0);
    if (!Number.isInteger(price)) {
      setSaveError("Enter the price as a whole number of taka.");
      return;
    }
    const compareAtPrice =
      form.compareAtPrice.trim() && !variantMode ? Number(form.compareAtPrice) : null;
    if (compareAtPrice != null && !Number.isInteger(compareAtPrice)) {
      setSaveError("Enter the compare-at price as a whole number of taka.");
      return;
    }
    // Regular price + base % go to the API only when changed, so saving other fields never
    // re-rounds an older price.
    const pricingChanged =
      !product ||
      form.regularPrice !== baseline.regularPrice ||
      form.baseDiscount !== baseline.baseDiscount;
    const tiers = parseTierRows(form.tiers).tiers ?? [];
    const quantity = variantMode
      ? summary.quantity
      : form.quantity.trim()
        ? Number(form.quantity)
        : null;
    const draft: ProductDraft = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      categoryId: form.categoryId,
      categoryRefId: form.categoryRefId,
      price,
      compareAtPrice,
      ...(!variantMode && pricingChanged && form.regularPrice.trim()
        ? {
            regularPrice: Number(form.regularPrice),
            baseDiscountPercent: parsePercent(form.baseDiscount) ?? 0,
          }
        : {}),
      tierMode: form.tierMode,
      quantityTiers: tiers,
      quantity,
      status: form.status,
      badge: form.badge || null,
      badges: form.badges ?? undefined,
      imageSrc: form.imageSrc.trim(),
      featured: form.featured,
      published: intent === "publish",
      minOrderQuantity: Number(form.minOrder),
      maxOrderQuantity: form.maxOrder.trim() ? Number(form.maxOrder) : null,
      // Sent only when changed, so editing something else never rewrites variant prices or stock.
      variants: sameVariants(form.variants, baseline.variants)
        ? undefined
        : rowsToVariants(form.variants),
      content: cleanProductContent({
        ...form.content,
        imageAlt: form.content.imageAlt.trim() || form.title.trim(),
      }),
    };

    setSaveError("");
    setSaving(true);
    try {
      await saveMartProduct(product?.id, draft);
      bypassLeave.current = true;
      notify(
        intent === "draft"
          ? product?.published
            ? "Moved to draft. It is no longer on the store."
            : "Draft saved. Only admins can see it."
          : product?.published
            ? "Changes saved"
            : "Product published",
        "ok",
      );
      router.push("/admin/products");
    } catch (error) {
      setSaving(false);
      if (error instanceof MartApiError && error.kind === "network") {
        showToast(NETWORK_TOAST);
        return;
      }
      if (error instanceof MartApiError && error.kind === "server") {
        const first = error.fieldErrors[0];
        showToast(first ? `${first.message} ${first.fix}`.trim() : SERVER_TOAST);
        return;
      }
      if (error instanceof MartApiError && error.fieldErrors.length > 0) {
        const sorted = [...error.fieldErrors].sort(
          (a, b) => serverRank(a.field) - serverRank(b.field),
        );
        setServerErrors(sorted);
        // Wait for the messages to render, then bring the first problem into view.
        requestAnimationFrame(() => focusServerField(sorted[0].field));
        return;
      }
      const message =
        error instanceof MartApiError
          ? error.message
          : "The product could not be saved.";
      setSaveError(message);
      showToast(message);
    }
  }

  function removeProduct() {
    const id = product?.id;
    if (!id || saving) return;
    void confirmDelete({
      title: "Delete this product?",
      description: (
        <>
          <span className="font-semibold text-neutral-800">“{product.title}”</span>{" "}
          will be removed from the catalog and the store. This cannot be undone.
        </>
      ),
      successMessage: "Product deleted",
      errorMessage: "The product could not be deleted.",
      onConfirm: async () => {
        setSaving(true);
        setSaveError("");
        try {
          await deleteMartProduct(id);
        } catch (error) {
          setSaving(false);
          throw error;
        }
        bypassLeave.current = true;
        router.push("/admin/products");
      },
    });
  }

  const statusLine = uploading
    ? "Uploading image…"
    : saving
      ? "Saving…"
      : dirty
        ? "Unsaved changes"
        : product
          ? "No unsaved changes"
          : "Not saved yet";
  const setupDone = [
    Boolean(form.title.trim()),
    priceReady && !issues.price,
    Boolean(form.imageSrc),
    Boolean(form.content.description.trim()),
  ].filter(Boolean).length;

  return (
    <form id={formId} onSubmit={save} className="min-w-0 pb-24" noValidate>
      <AdminPageHeader
        title={product ? "Edit product" : "Create product"}
        description={
          product
            ? form.title.trim() || product.title
            : "Add product information, pricing, inventory, and media. It stays hidden until you publish it."
        }
      />
      {saveError ? (
        <p className="-mt-3 mb-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {saveError}
        </p>
      ) : null}
      {serverErrors.length > 0 ? (
        <div
          id={`${formId}-error-summary`}
          tabIndex={-1}
          role="alert"
          className="-mt-3 mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 focus:outline-none"
        >
          <p className="flex items-center gap-2 font-semibold">
            <MaterialIcon name="error" className="text-[18px]" />
            {bengaliDigits(serverErrors.length)}টা সমস্যা আছে, ঠিক করে আবার চেষ্টা করুন
          </p>
          <ul className="mt-2 space-y-1.5 pl-6">
            {serverErrors.map((item, index) => (
              <li key={`${item.field}-${index}`}>
                <button
                  type="button"
                  onClick={() => focusServerField(item.field)}
                  className="text-left hover:underline focus-visible:underline focus-visible:outline-none"
                >
                  <span className="font-medium">
                    {SERVER_FIELD_LABEL[item.field] ?? SERVER_FIELD_LABEL.form}:
                  </span>{" "}
                  {item.message}
                </button>
                {item.fix ? <span className="block text-xs text-red-600">{item.fix}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {product ? (
        <div className="-mt-3 mb-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 ring-1 ring-neutral-200">
            {product.slug}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              form.published
                ? "bg-emerald-50 text-emerald-800"
                : "bg-neutral-100 text-neutral-600",
            )}
          >
            {form.published ? "Published" : "Draft"}
          </span>
          <StockStatusBadge status={form.status} />
          {form.featured ? (
            <span className="text-xs font-medium text-primary">Featured</span>
          ) : null}
          <Link
            href={productPath(product)}
            target="_blank"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View on site
          </Link>
          {product.id ? (
            <button
              type="button"
              onClick={removeProduct}
              className="h-8 rounded-full px-3 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-red-600"
            >
              Delete
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_16.5rem] xl:grid-cols-[11rem_minmax(0,1fr)_17.5rem]">
        <nav
          aria-label="Product sections"
          className="sticky top-20 hidden xl:block"
        >
          <ol className="space-y-1">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <SectionLink
                  active={active === section.id}
                  onClick={() => scrollToSection(section.id)}
                >
                  {section.label}
                </SectionLink>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 space-y-4">
          <div className="sticky top-16 z-10 -mx-4 bg-[#f5f6f8]/95 px-4 py-2 backdrop-blur sm:-mx-5 sm:px-5 xl:hidden">
            <div className="flex gap-1 overflow-x-auto">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  aria-current={active === section.id ? "true" : undefined}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "h-9 shrink-0 rounded-full px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    active === section.id
                      ? "bg-neutral-950 text-white"
                      : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50",
                  )}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          <FormSection
            invalid={serverFor("title", "slug", "subtitle").length > 0}
            id="product-information"
            title="Product information"
            description="Name is required. Subtitle is the short catalog line. Tagline and description are the product page copy."
          >
            <div className="grid gap-4">
              <div>
                <FieldLabel htmlFor={`${formId}-title`}>
                  Product name <RequiredMark />
                </FieldLabel>
                <input
                  id={`${formId}-title`}
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                  placeholder="Sunset projection lamp"
                  aria-invalid={
                    errors.title || serverFor("title", "slug").length ? true : undefined
                  }
                  aria-describedby={
                    errors.title
                      ? `${formId}-title-error`
                      : serverFor("title", "slug").length
                        ? `${formId}-server-title`
                        : undefined
                  }
                  className={cn(
                    adminFieldClass,
                    "h-12 text-base",
                    (errors.title || serverFor("title", "slug").length > 0) && INVALID_FIELD,
                  )}
                />
                <FieldErrorSlot
                  id={`${formId}-title-error`}
                  message={errors.title}
                />
                <ServerFieldErrors
                  id={`${formId}-server-title`}
                  items={serverFor("title", "slug")}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-subtitle`}>Subtitle</FieldLabel>
                <input
                  id={`${formId}-subtitle`}
                  value={form.subtitle}
                  onChange={(event) => setField("subtitle", event.target.value)}
                  placeholder="Short line under the name"
                  aria-invalid={serverFor("subtitle").length ? true : undefined}
                  aria-describedby={
                    serverFor("subtitle").length ? `${formId}-server-subtitle` : undefined
                  }
                  className={cn(
                    adminFieldClass,
                    serverFor("subtitle").length > 0 && INVALID_FIELD,
                  )}
                />
                <ServerFieldErrors
                  id={`${formId}-server-subtitle`}
                  items={serverFor("subtitle")}
                />
              </div>
              <ProductCopyFields
                formId={formId}
                content={form.content}
                onChange={setContent}
              />
            </div>
          </FormSection>

          <FormSection
            invalid={serverFor("images").length > 0}
            id="product-media"
            title="Media"
            description="The main image is the catalog thumbnail. Gallery images are the product page photos. JPG, PNG, WEBP, GIF, or AVIF, up to 5 MB."
          >
            <p className="mb-1.5 text-sm font-medium text-neutral-700">Main image</p>
            <ImageField
              label=""
              variant="tile"
              tileSize="lg"
              value={form.imageSrc}
              onChange={(imageSrc) => setField("imageSrc", imageSrc)}
              confirmRemove
              onBusy={onUploadBusy}
            />
            <ServerFieldErrors id={`${formId}-server-images`} items={serverFor("images")} />
            {!form.imageSrc ? (
              <p className="mt-2 text-sm text-neutral-500">
                Add a product image before publishing. A draft can be saved without one.
              </p>
            ) : null}
            <div className="mt-3">
              <FieldLabel htmlFor={`${formId}-image-alt`}>
                Image description
              </FieldLabel>
              <input
                id={`${formId}-image-alt`}
                value={form.content.imageAlt}
                onChange={(event) =>
                  setContent({ ...form.content, imageAlt: event.target.value })
                }
                placeholder="Used as the image description on the product page"
                className={adminFieldClass}
              />
            </div>
            <ProductGalleryFields
              content={form.content}
              onChange={setContent}
              onBusy={onUploadBusy}
            />
          </FormSection>

          <FormSection
            invalid={
              serverFor("price", "compareAtPrice", "regularPrice", "baseDiscount", "quantityTiers")
                .length > 0
            }
            id="product-pricing"
            title="Pricing"
            description="Enter the regular price and a base discount %. The selling price is worked out for you. Quantity discounts add more on top. Amounts are in taka."
          >
            {variantMode ? (
              <p
                className="mb-4 rounded-xl bg-[#f5f6f8] px-3 py-2.5 text-sm text-neutral-600"
                data-testid="pricing-from-variants"
              >
                This product has variants, so its price comes from them. The product list shows the lowest
                available variant price. Edit prices under Variants.
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor={`${formId}-price`}>
                  Regular price <RequiredMark />
                </FieldLabel>
                <input
                  id={`${formId}-price`}
                  inputMode="numeric"
                  value={variantMode ? shownPrice : form.regularPrice}
                  disabled={variantMode}
                  onChange={(event) => setPricing({ regularPrice: event.target.value })}
                  placeholder="1000"
                  aria-invalid={
                    errors.price || serverFor("price", "regularPrice").length ? true : undefined
                  }
                  aria-describedby={errors.price ? `${formId}-price-error` : undefined}
                  className={cn(
                    adminFieldClass,
                    (errors.price || serverFor("price", "regularPrice").length > 0) &&
                      INVALID_FIELD,
                  )}
                />
                <FieldErrorSlot id={`${formId}-price-error`} message={errors.price} />
                <ServerFieldErrors
                  id={`${formId}-server-price`}
                  items={serverFor("price", "regularPrice", "compareAtPrice")}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-base`}>Base discount %</FieldLabel>
                <input
                  id={`${formId}-base`}
                  inputMode="decimal"
                  value={variantMode ? "" : form.baseDiscount}
                  disabled={variantMode}
                  onChange={(event) => setPricing({ baseDiscount: event.target.value })}
                  placeholder="0"
                  aria-invalid={
                    errors.baseDiscount || serverFor("baseDiscount").length ? true : undefined
                  }
                  aria-describedby={`${formId}-base-hint`}
                  className={cn(
                    adminFieldClass,
                    (errors.baseDiscount || serverFor("baseDiscount").length > 0) && INVALID_FIELD,
                  )}
                />
                <FieldErrorSlot id={`${formId}-base-error`} message={errors.baseDiscount} />
                <ServerFieldErrors
                  id={`${formId}-server-baseDiscount`}
                  items={serverFor("baseDiscount")}
                />
                {!variantMode && priceReady && !errors.baseDiscount ? (
                  <p
                    id={`${formId}-base-hint`}
                    className="mt-1.5 text-xs text-neutral-500"
                    data-testid="selling-price-preview"
                  >
                    Selling price{" "}
                    <span className="font-semibold text-neutral-900 tabular-nums">
                      {formatTaka(priceNumber)}
                    </span>
                    {discount != null
                      ? ` (${percentText(parsePercent(form.baseDiscount) ?? 0)}% off ${formatTaka(compareNumber)})`
                      : ""}
                  </p>
                ) : null}
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-unit`}>Price note</FieldLabel>
                <input
                  id={`${formId}-unit`}
                  value={form.content.unitLabel}
                  onChange={(event) =>
                    setContent({
                      ...form.content,
                      unitLabel: event.target.value,
                    })
                  }
                  placeholder="Optional, such as শুরু"
                  className={adminFieldClass}
                />
                <p className="mt-1.5 text-xs text-neutral-500">
                  Shown beside the price on the product page. Leave blank for a
                  normal price.
                </p>
              </div>
            </div>
            <fieldset className="mt-5 border-t border-neutral-100 pt-4">
              <legend className="text-sm font-medium text-neutral-800">
                Quantity discounts
              </legend>
              <p className="mt-1 text-xs text-neutral-500">
                Buying more pieces adds an extra % on the regular price, on top of the base
                discount.
              </p>
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
                {(
                  [
                    ["global", "Use store-wide tiers (Settings › Pricing)"],
                    ["custom", "Custom tiers for this product"],
                  ] as const
                ).map(([mode, label]) => (
                  <label
                    key={mode}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-700 ring-1",
                      form.tierMode === mode
                        ? "ring-2 ring-primary"
                        : "ring-neutral-200 hover:bg-neutral-50",
                    )}
                  >
                    <input
                      type="radio"
                      name={`${formId}-tier-mode`}
                      value={mode}
                      checked={form.tierMode === mode}
                      onChange={() => setField("tierMode", mode)}
                      className="accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
              {form.tierMode === "custom" ? (
                <div className="mt-3">
                  <QuantityTiersEditor
                    id={`${formId}-tiers`}
                    rows={form.tiers}
                    onChange={(rows) => setField("tiers", rows)}
                    error={errors.quantityTiers}
                  />
                </div>
              ) : null}
              <ServerFieldErrors
                id={`${formId}-server-quantityTiers`}
                items={serverFor("quantityTiers")}
              />
            </fieldset>
          </FormSection>

          <FormSection
            invalid={serverFor("quantity", "status", "orderLimits").length > 0}
            id="product-inventory"
            title="Inventory"
            description="Stock status is the availability label. Quantity is optional: leave it blank for made to order."
          >
            <div>
              <p className="mb-1.5 text-sm font-medium text-neutral-700">
                Stock status
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["available", "sold-out", "coming-soon"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={form.status === status}
                      onClick={() => setField("status", status)}
                      className={cn(
                        "h-11 rounded-xl px-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        form.status === status
                          ? STOCK_STATUS_TONE[status]
                          : "bg-[#f5f6f8] text-neutral-500 ring-1 ring-transparent hover:bg-neutral-100",
                      )}
                    >
                      {ADMIN_STOCK_STATUS_LABEL[status]}
                    </button>
                  ),
                )}
              </div>
              <ServerFieldErrors id={`${formId}-server-status`} items={serverFor("status")} />
              <p className="mt-2 text-xs text-neutral-500">
                {form.status === "available"
                  ? "In stock. Catalog products with this status can be added to cart."
                  : form.status === "sold-out"
                    ? "Sold out. Catalog products with this status cannot be added to cart."
                    : "Coming soon. Catalog products with this status cannot be added to cart."}
              </p>
            </div>
            <div className="mt-4">
              <FieldLabel htmlFor={`${formId}-qty`}>Quantity</FieldLabel>
              <input
                id={`${formId}-qty`}
                inputMode="numeric"
                value={shownQuantity}
                disabled={variantMode}
                onChange={(event) => setField("quantity", event.target.value)}
                placeholder="Blank = made to order"
                aria-invalid={errors.quantity || serverFor("quantity").length ? true : undefined}
                aria-describedby={
                  errors.quantity ? `${formId}-qty-error` : `${formId}-qty-hint`
                }
                className={cn(
                  adminFieldClass,
                  (errors.quantity || serverFor("quantity").length > 0) && INVALID_FIELD,
                )}
              />
              <FieldErrorSlot
                id={`${formId}-qty-error`}
                message={errors.quantity}
              />
              <ServerFieldErrors id={`${formId}-server-quantity`} items={serverFor("quantity")} />
              {!errors.quantity ? (
                <p
                  id={`${formId}-qty-hint`}
                  className="mt-1.5 text-xs text-neutral-500"
                >
                  {variantMode
                    ? "Total of the available variants. Edit stock under Variants."
                    : form.quantity.trim()
                      ? `${form.quantity.trim()} in stock in the product list.`
                      : "Blank is saved as made to order."}
                </p>
              ) : null}
            </div>
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-medium text-neutral-700">
                Order limits per customer
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor={`${formId}-min-order`}>Minimum</FieldLabel>
                  <input
                    id={`${formId}-min-order`}
                    inputMode="numeric"
                    value={form.minOrder}
                    onChange={(event) => setField("minOrder", event.target.value)}
                    aria-invalid={errors.orderLimits || serverFor("orderLimits").length ? true : undefined}
                    aria-describedby={`${formId}-order-limits-hint`}
                    className={cn(
                      adminFieldClass,
                      (errors.orderLimits || serverFor("orderLimits").length > 0) && INVALID_FIELD,
                    )}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor={`${formId}-max-order`}>Maximum</FieldLabel>
                  <input
                    id={`${formId}-max-order`}
                    inputMode="numeric"
                    value={form.maxOrder}
                    placeholder="No extra limit"
                    onChange={(event) => setField("maxOrder", event.target.value)}
                    aria-invalid={errors.orderLimits || serverFor("orderLimits").length ? true : undefined}
                    aria-describedby={`${formId}-order-limits-hint`}
                    className={cn(
                      adminFieldClass,
                      (errors.orderLimits || serverFor("orderLimits").length > 0) && INVALID_FIELD,
                    )}
                  />
                </div>
              </div>
              <FieldErrorSlot
                id={`${formId}-order-limits-error`}
                message={errors.orderLimits}
              />
              <ServerFieldErrors id={`${formId}-server-orderLimits`} items={serverFor("orderLimits")} />
              <p
                id={`${formId}-order-limits-hint`}
                className="mt-1.5 text-xs text-neutral-500"
              >
                Units a customer can put in one cart line. The store allows 5 at most; the API checks these
                limits again at cart and order time.
              </p>
            </div>
            <div className="mt-4">
              <FieldLabel htmlFor={`${formId}-stock-label`}>
                Availability note
              </FieldLabel>
              <input
                id={`${formId}-stock-label`}
                value={form.content.stockLabel}
                onChange={(event) =>
                  setContent({
                    ...form.content,
                    stockLabel: event.target.value,
                  })
                }
                placeholder="স্টকে আছে"
                className={adminFieldClass}
              />
              <p className="mt-1.5 text-xs text-neutral-500">
                Shown next to the price when the product is in stock. Sold out
                and coming soon replace this note on the product page.
              </p>
            </div>
          </FormSection>

          <FormSection
            id="product-options"
            title="Options"
            description="Color, size, or any other choice. The customer picks one value from each group before ordering."
          >
            <ProductOptionsFields content={form.content} onChange={setContent} />
          </FormSection>

          <FormSection
            invalid={serverFor("variants").length > 0}
            id="product-variants"
            title="Variants"
            description="Price, stock, and SKU for each combination of options."
          >
            <ServerFieldErrors
              id={`${formId}-server-variants`}
              items={serverFor("variants")}
              boxed
            />
            <ProductVariantsFields
              formId={formId}
              groups={form.content.options}
              rows={form.variants}
              basePrice={form.price}
              check={variantCheck}
              showErrors={showErrors}
              onChange={(variants) => setField("variants", variants)}
            />
          </FormSection>

          <FormSection
            invalid={serverFor("content").length > 0}
            id="product-details"
            title="Product details"
            description="Content for the product page: highlights, the details tab, specifications, and questions. Reviews stay as they are."
          >
            <ServerFieldErrors
              id={`${formId}-server-content`}
              items={serverFor("content")}
              boxed
            />
            <ProductDetailFields
              formId={formId}
              content={form.content}
              onChange={setContent}
              category={form.categoryId}
            />
          </FormSection>

          <FormSection
            invalid={serverFor("category", "badges").length > 0}
            id="product-organization"
            title="Organization"
            description="Category is required. Badges are optional."
          >
            <div>
              <p className="mb-1.5 text-sm font-medium text-neutral-700">
                Category <RequiredMark />
              </p>
              <CategoryCascade
                value={form.categoryRefId}
                error={errors.category ?? serverFor("category")[0]?.message}
                onChange={(id, trail) => {
                  if (id !== form.categoryRefId) clearServer(["category"]);
                  setForm((current) =>
                    current.categoryRefId === id && current.categoryTrail === trail
                      ? current
                      : { ...current, categoryRefId: id, categoryTrail: trail },
                  );
                }}
              />
              <ServerFieldErrors
                id={`${formId}-server-category`}
                items={errors.category ? [] : serverFor("category")}
                fixOnly
              />
              <p className="mt-1.5 text-xs text-neutral-500">
                Pick a category, then a subcategory if there is one. The product shows up under every
                level above the one you choose.
              </p>
            </div>
            <div className="mt-4">
              <ProductBadgePicker
                value={form.badges ?? []}
                initial={baseline.badges ?? []}
                onChange={(next) => setField("badges", next)}
              />
              <ServerFieldErrors id={`${formId}-server-badges`} items={serverFor("badges")} />
            </div>
          </FormSection>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20">
          <section
            className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
            aria-label="Catalog preview"
          >
            <div className="relative aspect-[4/3] bg-[#f3f4f6]">
              {form.imageSrc ? (
                <Image
                  src={form.imageSrc}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-contain p-4"
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-neutral-500">
                  No image yet
                </div>
              )}
            </div>
            <div className="space-y-2 px-4 py-3">
              <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                Catalog preview
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <StockStatusBadge status={form.status} />
                {form.badges === null ? (
                  form.badge ? (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                      {form.badge}
                    </span>
                  ) : null
                ) : (
                  form.badges.map((badge) => (
                    <span
                      key={badge.id}
                      className={cn(
                        "max-w-full truncate rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
                        badgeToneClass(badge.tone),
                        !badge.isActive && "opacity-50",
                      )}
                    >
                      {badge.name}
                    </span>
                  ))
                )}
              </div>
              <p className="text-base font-semibold text-neutral-950">
                {form.title.trim() || "Product name"}
              </p>
              {form.subtitle.trim() ? (
                <p className="text-sm text-neutral-500">
                  {form.subtitle.trim()}
                </p>
              ) : null}
              <p className="text-xs text-neutral-500">
                {form.categoryTrail || "No category yet"}
              </p>
              <p className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-neutral-950 tabular-nums">
                  {priceReady ? formatTaka(priceNumber) : "৳—"}
                </span>
                {discount != null ? (
                  <span className="text-sm text-neutral-500 line-through tabular-nums">
                    {formatTaka(compareNumber)}
                  </span>
                ) : null}
              </p>
            </div>
          </section>

          <FormSection
            invalid={serverFor("publishing").length > 0}
            id="product-publishing"
            title="Publishing"
            description="Draft and Published are the catalog states. Featured adds a label in the product list."
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3 rounded-xl px-1 py-1">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800">Status</p>
                  <p className="text-xs text-neutral-500">
                    {form.published
                      ? "Customers can see this product. Move to draft to hide it."
                      : "Only admins can see a draft. Publish to show it on the store."}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                    form.published
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-neutral-100 text-neutral-600",
                  )}
                >
                  {form.published ? "Published" : "Draft"}
                </span>
              </div>
              <Toggle
                label="Featured"
                hint="Shows a Featured label in the product list."
                checked={form.featured}
                onChange={(checked) => setField("featured", checked)}
              />
            </div>
            <ServerFieldErrors id={`${formId}-server-publishing`} items={serverFor("publishing")} />
            <p className="mt-4 border-t border-neutral-100 pt-3 text-sm font-medium text-neutral-800">
              Setup {setupDone} of 4
            </p>
            <ul className="mt-2 space-y-2" aria-label="Required details">
              <CheckRow
                done={Boolean(form.title.trim())}
                label="Product name"
              />
              <CheckRow
                done={priceReady && !issues.price}
                label="Selling price"
              />
              <CheckRow
                done={Boolean(form.imageSrc)}
                label="Main image"
                optional
              />
              <CheckRow
                done={Boolean(form.content.description.trim())}
                label="Product description"
                optional
              />
            </ul>
          </FormSection>
        </aside>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur",
          collapsed ? "lg:left-[4.5rem]" : "lg:left-64",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
          {/* Enter in a field submits with this one, so it never changes the product's status. */}
          <button
            type="submit"
            name="intent"
            value={product?.published ? "publish" : "draft"}
            disabled={saving || uploading}
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => requestLeave("/admin/products")}
            className={adminButtonClass.secondary}
          >
            Cancel
          </button>
          <p
            className="min-w-0 flex-1 truncate text-sm text-neutral-500"
            role="status"
          >
            {statusLine}
          </p>
          <button
            type="submit"
            name="intent"
            value="draft"
            disabled={saving || uploading}
            className={adminButtonClass.secondary}
          >
            {product?.published ? "Move to draft" : product ? "Save draft" : "Save as Draft"}
          </button>
          <button
            type="submit"
            name="intent"
            value="publish"
            disabled={saving || uploading}
            className={adminButtonClass.primary}
          >
            {saving ? "Saving…" : product?.published ? "Save changes" : "Publish"}
          </button>
        </div>
      </div>

      {leaveHref ? (
        <UnsavedChangesDialog onStay={() => setLeaveHref(null)} onDiscard={confirmLeave} />
      ) : null}

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4"
      >
        {toast ? (
          <p
            key={toast.key}
            className="flex max-w-xl items-center gap-2 rounded-full bg-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xl"
          >
            <MaterialIcon name="error" className="shrink-0 text-[18px]" />
            {toast.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function FormSection({
  id,
  title,
  description,
  invalid = false,
  children,
}: {
  id: string;
  title: string;
  description: string;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-32 rounded-2xl bg-white p-4 ring-1 sm:p-5",
        invalid ? "ring-red-300" : "ring-neutral-200/90",
      )}
    >
      <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-neutral-500">
        {description}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SectionLink({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "true" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full rounded-xl px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active
          ? "bg-white font-semibold text-neutral-950 ring-1 ring-neutral-200"
          : "font-medium text-neutral-500 hover:bg-white/70 hover:text-neutral-800",
      )}
    >
      {children}
    </button>
  );
}

function RequiredMark() {
  return (
    <>
      <span className="text-red-700" aria-hidden>
        *
      </span>
      <span className="sr-only">required</span>
    </>
  );
}

function FieldErrorSlot({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <div id={id}>
      <FieldError message={message} />
    </div>
  );
}

/** Problems the API reported for one field: the message, then how to fix it, in red. */
function ServerFieldErrors({
  id,
  items,
  boxed = false,
  fixOnly = false,
}: {
  id: string;
  items: ApiFieldError[];
  boxed?: boolean;
  fixOnly?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div
      id={id}
      tabIndex={-1}
      className={cn(
        "space-y-1 focus:outline-none",
        boxed ? "mb-4 rounded-xl bg-red-50 px-3 py-2.5 ring-1 ring-red-200" : "mt-1.5",
      )}
    >
      {items.map((item, index) => (
        <p key={`${item.field}-${index}`} className="text-sm text-red-700">
          {fixOnly ? null : <span className="block font-medium">{item.message}</span>}
          {item.fix ? <span className="block text-xs text-red-600">{item.fix}</span> : null}
        </p>
      ))}
    </div>
  );
}

function CheckRow({
  done,
  label,
  optional = false,
}: {
  done: boolean;
  label: string;
  optional?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <MaterialIcon
        name={done ? "check_circle" : "radio_button_unchecked"}
        className={cn(
          "text-[18px]",
          done ? "text-emerald-700" : "text-neutral-500",
        )}
      />
      <span className={done ? "text-neutral-800" : "text-neutral-600"}>
        {label}
      </span>
      {optional ? (
        <span className="text-xs text-neutral-500">Optional</span>
      ) : (
        <span className="text-xs text-neutral-500">Required</span>
      )}
    </li>
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
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          checked ? "bg-primary" : "bg-neutral-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-all",
            checked ? "left-5" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}
