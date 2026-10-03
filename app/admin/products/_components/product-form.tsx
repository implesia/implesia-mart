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
  deleteMartProduct,
  MartApiError,
  saveMartProduct,
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
  ADMIN_CATEGORY_LABEL,
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
import { ImageField } from "../../_components/image-field";
import {
  ProductCopyFields,
  ProductDetailFields,
  ProductGalleryFields,
} from "./product-content-fields";
import { ProductOptionsFields } from "./product-options-fields";

const BADGE_OPTIONS: { value: ProductBadge | ""; label: string }[] = [
  { value: "", label: "None" },
  { value: "New", label: "New" },
  { value: "Best Seller", label: "Best seller" },
  { value: "Limited", label: "Limited" },
];

const SECTIONS = [
  { id: "product-information", label: "Product information" },
  { id: "product-media", label: "Media" },
  { id: "product-pricing", label: "Pricing" },
  { id: "product-inventory", label: "Inventory" },
  { id: "product-options", label: "Options" },
  { id: "product-details", label: "Product details" },
  { id: "product-organization", label: "Organization" },
  { id: "product-publishing", label: "Publishing" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

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
  content: ProductStorefrontContent;
};

type FieldKey = "title" | "price" | "compareAtPrice" | "quantity";
type FieldErrors = Partial<Record<FieldKey, string>>;

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
      categoryId: "gadgets",
      price: "",
      compareAtPrice: "",
      quantity: "",
      status: "available",
      badge: "",
      imageSrc: "",
      featured: false,
      published: true,
      content: emptyProductContent(),
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
    content: structuredClone(product.content),
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.title.trim()) errors.title = "Product name is required.";

  const price = Number(form.price);
  if (!form.price.trim() || !Number.isFinite(price) || price < 0) {
    errors.price = "Enter a selling price of 0 or more.";
  }

  if (form.compareAtPrice.trim()) {
    const compareAtPrice = Number(form.compareAtPrice);
    if (!Number.isFinite(compareAtPrice) || compareAtPrice < 0) {
      errors.compareAtPrice =
        "Enter the compare-at price as a number, or leave it blank.";
    } else if (!errors.price && compareAtPrice < price) {
      errors.compareAtPrice =
        "Compare-at price must be at least the selling price.";
    }
  }

  if (form.quantity.trim()) {
    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      errors.quantity =
        "Leave quantity blank, or enter a whole number of 0 or more.";
    }
  }

  return errors;
}

function firstErrorSection(errors: FieldErrors): SectionId | null {
  if (errors.title) return "product-information";
  if (errors.price || errors.compareAtPrice) return "product-pricing";
  if (errors.quantity) return "product-inventory";
  return null;
}

export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<FormState>(() => toForm(product));
  const [baseline] = useState<FormState>(() => toForm(product));
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploads = useRef(0);
  const [active, setActive] = useState<SectionId>("product-information");
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const bypassLeave = useRef(false);
  const collapsed = useAdminSidebarCollapsed();

  const issues = validate(form);
  const errors = showErrors ? issues : {};
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
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

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setContent(content: ProductStorefrontContent) {
    setForm((prev) => ({ ...prev, content }));
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

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setShowErrors(true);
      const section = firstErrorSection(nextErrors);
      if (section) scrollToSection(section);
      return;
    }
    if (uploading || saving) return;

    const price = Number(form.price);
    if (!Number.isInteger(price)) {
      setSaveError("Enter the price as a whole number of taka.");
      return;
    }
    const compareAtPrice = form.compareAtPrice.trim()
      ? Number(form.compareAtPrice)
      : null;
    if (compareAtPrice != null && !Number.isInteger(compareAtPrice)) {
      setSaveError("Enter the compare-at price as a whole number of taka.");
      return;
    }
    const quantity = form.quantity.trim() ? Number(form.quantity) : null;
    const draft: ProductDraft = {
      title: form.title.trim(),
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
      router.push("/admin/products");
    } catch (error) {
      setSaving(false);
      setSaveError(
        error instanceof MartApiError
          ? error.message
          : "The product could not be saved.",
      );
    }
  }

  async function removeProduct() {
    if (!product?.id || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await deleteMartProduct(product.id);
      bypassLeave.current = true;
      router.push("/admin/products");
    } catch (error) {
      setSaving(false);
      setConfirmDelete(false);
      setSaveError(
        error instanceof MartApiError
          ? error.message
          : "The product could not be deleted.",
      );
    }
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
            : "Add product information, pricing, inventory, media, and storefront details."
        }
      />
      {saveError ? (
        <p className="-mt-3 mb-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {saveError}
        </p>
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
            {form.published ? "Live" : "Hidden"}
          </span>
          <StockStatusBadge status={form.status} />
          {form.featured ? (
            <span className="text-xs font-medium text-primary">Featured</span>
          ) : null}
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View on site
          </Link>
          {product.id ? (
            confirmDelete ? (
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void removeProduct()}
                  className="h-8 rounded-full px-3 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Delete product
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-8 rounded-full px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  Keep
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="h-8 rounded-full px-3 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-red-600"
              >
                Delete
              </button>
            )
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
                  aria-invalid={errors.title ? true : undefined}
                  aria-describedby={
                    errors.title ? `${formId}-title-error` : undefined
                  }
                  className={cn(
                    adminFieldClass,
                    "h-12 text-base",
                    errors.title &&
                      "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200",
                  )}
                />
                <FieldErrorSlot
                  id={`${formId}-title-error`}
                  message={errors.title}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-subtitle`}>Subtitle</FieldLabel>
                <input
                  id={`${formId}-subtitle`}
                  value={form.subtitle}
                  onChange={(event) => setField("subtitle", event.target.value)}
                  placeholder="Short line under the name"
                  className={adminFieldClass}
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
            id="product-media"
            title="Media"
            description="The main image is the catalog thumbnail. Gallery images are the product page photos. JPG, PNG, WEBP, GIF, or AVIF, up to 5 MB."
          >
            <ImageField
              label=""
              value={form.imageSrc}
              onChange={(imageSrc) => setField("imageSrc", imageSrc)}
              confirmRemove
              onBusy={onUploadBusy}
            />
            {!form.imageSrc ? (
              <p className="mt-2 text-sm text-neutral-500">
                Add a product image before saving.
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
            id="product-pricing"
            title="Pricing"
            description="Selling price is required. Compare-at is optional and must be at least the selling price. Amounts are in taka."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor={`${formId}-price`}>
                  Selling price <RequiredMark />
                </FieldLabel>
                <input
                  id={`${formId}-price`}
                  inputMode="decimal"
                  value={form.price}
                  onChange={(event) => setField("price", event.target.value)}
                  placeholder="999"
                  aria-invalid={errors.price ? true : undefined}
                  aria-describedby={
                    errors.price ? `${formId}-price-error` : undefined
                  }
                  className={cn(
                    adminFieldClass,
                    errors.price &&
                      "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200",
                  )}
                />
                <FieldErrorSlot
                  id={`${formId}-price-error`}
                  message={errors.price}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${formId}-compare`}>
                  Compare-at price
                </FieldLabel>
                <input
                  id={`${formId}-compare`}
                  inputMode="decimal"
                  value={form.compareAtPrice}
                  onChange={(event) =>
                    setField("compareAtPrice", event.target.value)
                  }
                  placeholder="Optional"
                  aria-invalid={errors.compareAtPrice ? true : undefined}
                  aria-describedby={
                    errors.compareAtPrice
                      ? `${formId}-compare-error`
                      : `${formId}-compare-hint`
                  }
                  className={cn(
                    adminFieldClass,
                    errors.compareAtPrice &&
                      "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200",
                  )}
                />
                <FieldErrorSlot
                  id={`${formId}-compare-error`}
                  message={errors.compareAtPrice}
                />
                {!errors.compareAtPrice &&
                priceReady &&
                compareReady &&
                compareNumber > priceNumber ? (
                  <p
                    id={`${formId}-compare-hint`}
                    className="mt-1.5 text-xs text-neutral-500"
                  >
                    Selling price {formatTaka(priceNumber)} is {discount}% below
                    the compare-at price of {formatTaka(compareNumber)}.
                  </p>
                ) : null}
                {!errors.compareAtPrice &&
                priceReady &&
                compareReady &&
                compareNumber === priceNumber ? (
                  <p
                    id={`${formId}-compare-hint`}
                    className="mt-1.5 text-xs text-neutral-500"
                  >
                    Compare-at matches the selling price, so there is no higher
                    price to show.
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
          </FormSection>

          <FormSection
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
                value={form.quantity}
                onChange={(event) => setField("quantity", event.target.value)}
                placeholder="Blank = made to order"
                aria-invalid={errors.quantity ? true : undefined}
                aria-describedby={
                  errors.quantity ? `${formId}-qty-error` : `${formId}-qty-hint`
                }
                className={cn(
                  adminFieldClass,
                  errors.quantity &&
                    "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200",
                )}
              />
              <FieldErrorSlot
                id={`${formId}-qty-error`}
                message={errors.quantity}
              />
              {!errors.quantity ? (
                <p
                  id={`${formId}-qty-hint`}
                  className="mt-1.5 text-xs text-neutral-500"
                >
                  {form.quantity.trim()
                    ? `${form.quantity.trim()} in stock in the product list.`
                    : "Blank is saved as made to order."}
                </p>
              ) : null}
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
            id="product-details"
            title="Product details"
            description="Content for the product page: highlights, the details tab, specifications, and questions. Reviews stay as they are."
          >
            <ProductDetailFields
              formId={formId}
              content={form.content}
              onChange={setContent}
            />
          </FormSection>

          <FormSection
            id="product-organization"
            title="Organization"
            description="Category is required and already selected. Badge is optional."
          >
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-neutral-700">
                Category <RequiredMark />
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(["gadgets", "fashion"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={form.categoryId === id}
                    onClick={() => setField("categoryId", id)}
                    className={cn(
                      "h-11 rounded-xl px-3 text-sm font-medium ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      form.categoryId === id
                        ? "bg-primary/10 text-[#0b3d39] ring-primary/30"
                        : "bg-[#f5f6f8] text-neutral-700 ring-transparent hover:bg-neutral-100",
                    )}
                  >
                    {ADMIN_CATEGORY_LABEL[id]}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-medium text-neutral-700">
                Badge
              </p>
              <div className="flex flex-wrap gap-1.5">
                {BADGE_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={form.badge === option.value}
                    onClick={() => setField("badge", option.value)}
                    className={cn(
                      "h-9 rounded-full px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      form.badge === option.value
                        ? "bg-neutral-950 text-white"
                        : "bg-[#f5f6f8] text-neutral-600 hover:bg-neutral-200",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
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
                <div className="grid h-full place-items-center text-sm text-neutral-400">
                  No image yet
                </div>
              )}
            </div>
            <div className="space-y-2 px-4 py-3">
              <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
                Catalog preview
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <StockStatusBadge status={form.status} />
                {form.badge ? (
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                    {form.badge}
                  </span>
                ) : null}
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
                {ADMIN_CATEGORY_LABEL[form.categoryId]}
              </p>
              <p className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-neutral-950 tabular-nums">
                  {priceReady ? formatTaka(priceNumber) : "৳—"}
                </span>
                {discount != null ? (
                  <span className="text-sm text-neutral-400 line-through tabular-nums">
                    {formatTaka(compareNumber)}
                  </span>
                ) : null}
              </p>
            </div>
          </section>

          <FormSection
            id="product-publishing"
            title="Publishing"
            description="Live and Hidden are the catalog states. Featured adds a label in the product list."
          >
            <div className="space-y-2">
              <Toggle
                label="Published"
                hint={
                  form.published
                    ? "Marked Live in the product list."
                    : "Marked Hidden in the product list."
                }
                checked={form.published}
                onChange={(checked) => setField("published", checked)}
              />
              <Toggle
                label="Featured"
                hint="Shows a Featured label in the product list."
                checked={form.featured}
                onChange={(checked) => setField("featured", checked)}
              />
            </div>
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
            disabled={saving || uploading}
            className={adminButtonClass.primary}
          >
            {saving ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>

      {leaveHref ? (
        <UnsavedChangesDialog onStay={() => setLeaveHref(null)} onDiscard={confirmLeave} />
      ) : null}
    </form>
  );
}

function FormSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-32 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5"
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
          done ? "text-emerald-700" : "text-neutral-400",
        )}
      />
      <span className={done ? "text-neutral-800" : "text-neutral-600"}>
        {label}
      </span>
      {optional ? (
        <span className="text-xs text-neutral-400">Optional</span>
      ) : (
        <span className="text-xs text-neutral-400">Required</span>
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
