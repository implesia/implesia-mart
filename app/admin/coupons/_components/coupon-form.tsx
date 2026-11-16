"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  couponToForm,
  couponWriteBody,
  emptyCouponForm,
  validateCouponForm,
  type CouponField,
  type CouponFormValues,
} from "@/lib/admin/coupons";
import { generateCouponCode as makeCode } from "@/lib/coupons";
import { createCoupon, getCoupon, loadCouponCatalog, updateCoupon } from "@/lib/mart-api/coupons";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import { adminButtonClass, adminFieldClass, FieldLabel } from "../../_components/admin-ui";
import { useInventoryWriter } from "../../inventory/_components/use-inventory-role";

type Choice = { id: string; label: string };

export function CouponForm({ couponId }: { couponId?: string }) {
  const router = useRouter();
  const formId = useId();
  const canWrite = useInventoryWriter();
  const [values, setValues] = useState<CouponFormValues>(emptyCouponForm);
  const [errors, setErrors] = useState<Partial<Record<CouponField, string>>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(Boolean(couponId));
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Choice[]>([]);
  const [categories, setCategories] = useState<Choice[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    void loadCouponCatalog().then(
      (catalog) => {
        if (cancelled) return;
        setProducts(catalog.products.map((item) => ({ id: item.id, label: item.title })));
        setCategories(catalog.categories);
      },
      (error: unknown) => {
        if (cancelled) return;
        setFormError(
          error instanceof MartApiError
            ? `${error.message} Reload to try again.`
            : "Could not load products and categories. Reload to try again.",
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!couponId) return;
    let cancelled = false;
    void getCoupon(couponId)
      .then((coupon) => {
        if (!cancelled) setValues(couponToForm(coupon));
      })
      .catch((error: unknown) => {
        if (!cancelled) setFormError(error instanceof MartApiError ? error.message : "Could not load this coupon.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [couponId]);

  function set<K extends CouponField>(key: K, value: CouponFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function toggle(list: "productIds" | "categoryIds", id: string) {
    setValues((current) => {
      const has = current[list].includes(id);
      return { ...current, [list]: has ? current[list].filter((item) => item !== id) : [...current[list], id] };
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite || saving) return;
    const nextErrors = validateCouponForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const body = couponWriteBody(values);
    if (!body) return;
    setSaving(true);
    setFormError("");
    try {
      const saved = couponId ? await updateCoupon(couponId, body) : await createCoupon(body);
      router.push(`/admin/coupons/${saved.id}`);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof MartApiError ? error.message : "Could not save the coupon.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-busy="true" />;
  }

  const locked = !canWrite;

  return (
    <form onSubmit={(event) => void save(event)} className="space-y-4" noValidate>
      {locked ? (
        <p className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
          You can view this coupon. An editor can create or change coupons.
        </p>
      ) : null}
      {formError ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <section className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <Field
          id={`${formId}-code`}
          label="Code"
          help="Customers type this at checkout. 3–32 letters, numbers, hyphens, or underscores. Generate avoids I, O, 0, and 1."
          error={errors.code}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id={`${formId}-code`}
              data-testid="coupon-code-input"
              value={values.code}
              disabled={locked}
              onChange={(event) => set("code", event.target.value.toUpperCase())}
              className={cn(adminFieldClass, "uppercase")}
              autoComplete="off"
            />
            <button
              type="button"
              data-testid="coupon-generate"
              disabled={locked}
              onClick={() => set("code", makeCode())}
              className={adminButtonClass.secondary}
            >
              <MaterialIcon name="casino" className="text-[18px]" />
              Generate code
            </button>
          </div>
        </Field>

        <Field
          id={`${formId}-type`}
          label="Discount type"
          help="Percent takes a share of the product total. Fixed takes a set amount of taka off."
        >
          <select
            id={`${formId}-type`}
            value={values.discountType}
            disabled={locked}
            onChange={(event) => set("discountType", event.target.value === "fixed" ? "fixed" : "percent")}
            className={adminFieldClass}
          >
            <option value="percent">Percent</option>
            <option value="fixed">Fixed amount (৳)</option>
          </select>
        </Field>

        <Field
          id={`${formId}-value`}
          label={values.discountType === "percent" ? "Percent" : "Amount (৳)"}
          help={
            values.discountType === "percent"
              ? "10 means 10% off the product total. Use 0 only together with free delivery."
              : "100 means ৳100 off the product total. Use 0 only together with free delivery."
          }
          error={errors.value}
        >
          <input
            id={`${formId}-value`}
            inputMode="decimal"
            value={values.value}
            disabled={locked}
            onChange={(event) => set("value", event.target.value)}
            className={adminFieldClass}
          />
        </Field>

        {values.discountType === "percent" ? (
          <Field
            id={`${formId}-cap`}
            label="Maximum discount (৳)"
            help="The most taka this percent can take off. Leave empty for no cap. Not used for a fixed amount."
            error={errors.maxDiscount}
          >
            <input
              id={`${formId}-cap`}
              inputMode="decimal"
              value={values.maxDiscount}
              disabled={locked}
              onChange={(event) => set("maxDiscount", event.target.value)}
              className={adminFieldClass}
              placeholder="No cap"
            />
          </Field>
        ) : null}

        <Field
          id={`${formId}-min`}
          label="Minimum order (৳)"
          help="Leave empty for no minimum. Compared with the merchandise after the quantity discount, before this coupon and before delivery."
          error={errors.minOrderAmount}
        >
          <input
            id={`${formId}-min`}
            inputMode="decimal"
            value={values.minOrderAmount}
            disabled={locked}
            onChange={(event) => set("minOrderAmount", event.target.value)}
            className={adminFieldClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id={`${formId}-start`}
            label="Starts (Asia/Dhaka)"
            help="When the coupon starts working. Leave empty to start immediately. Time is Bangladesh time."
            error={errors.startsAt}
          >
            <input
              id={`${formId}-start`}
              type="datetime-local"
              value={values.startsAt}
              disabled={locked}
              onChange={(event) => set("startsAt", event.target.value)}
              className={adminFieldClass}
            />
          </Field>
          <Field
            id={`${formId}-end`}
            label="Ends (Asia/Dhaka)"
            help="When it stops. Leave empty for no end date. The end must be after the start."
            error={errors.endsAt}
          >
            <input
              id={`${formId}-end`}
              type="datetime-local"
              value={values.endsAt}
              disabled={locked}
              onChange={(event) => set("endsAt", event.target.value)}
              className={adminFieldClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id={`${formId}-total-limit`}
            label="Total use limit"
            help="How many orders can use this code in total. Leave empty for no limit."
            error={errors.usageLimitTotal}
          >
            <input
              id={`${formId}-total-limit`}
              inputMode="numeric"
              value={values.usageLimitTotal}
              disabled={locked}
              onChange={(event) => set("usageLimitTotal", event.target.value)}
              className={adminFieldClass}
              placeholder="No limit"
            />
          </Field>
          <Field
            id={`${formId}-phone-limit`}
            label="Uses per customer"
            help="How many times one phone number can use it. Leave empty for no limit."
            error={errors.usageLimitPerPhone}
          >
            <input
              id={`${formId}-phone-limit`}
              inputMode="numeric"
              value={values.usageLimitPerPhone}
              disabled={locked}
              onChange={(event) => set("usageLimitPerPhone", event.target.value)}
              className={adminFieldClass}
              placeholder="No limit"
            />
          </Field>
        </div>

        <Check
          checked={values.firstOrderOnly}
          disabled={locked}
          onChange={(checked) => set("firstOrderOnly", checked)}
          label="First order only"
          help="Only a phone number that has never ordered before can use this code."
        />
        <Check
          checked={values.freeDelivery}
          disabled={locked}
          onChange={(checked) => set("freeDelivery", checked)}
          label="Free delivery"
          help="When the coupon is valid, the delivery charge becomes ৳0."
        />
        <Check
          checked={values.isActive}
          disabled={locked}
          onChange={(checked) => set("isActive", checked)}
          label="Active"
          help="Turn off to stop the coupon without deleting it. Dates still decide scheduled and expired."
        />
      </section>

      <Picker
        title="Products"
        help="Leave empty to allow every product. Otherwise the cart must include one of these."
        query={productQuery}
        onQuery={setProductQuery}
        choices={products}
        selected={values.productIds}
        disabled={locked}
        onToggle={(id) => toggle("productIds", id)}
      />
      <Picker
        title="Categories"
        help="Leave empty to allow every category. A chosen category also includes its subcategories."
        query={categoryQuery}
        onQuery={setCategoryQuery}
        choices={categories}
        selected={values.categoryIds}
        disabled={locked}
        onToggle={(id) => toggle("categoryIds", id)}
      />

      <div className="flex flex-wrap gap-2">
        <button type="submit" data-testid="coupon-save" disabled={locked || saving} className={adminButtonClass.primary}>
          {saving ? "Saving…" : couponId ? "Save changes" : "Create coupon"}
        </button>
        <Link href="/admin/coupons" className={adminButtonClass.secondary}>
          Back to coupons
        </Link>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  help,
  error,
  children,
}: {
  id: string;
  label: string;
  help: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      <p id={`${id}-help`} className="mt-1.5 text-xs leading-relaxed text-neutral-500">
        {help}
      </p>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Check({
  checked,
  disabled,
  onChange,
  label,
  help,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  help: string;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 accent-primary"
      />
      <span>
        <span className="block text-sm font-medium text-neutral-800">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{help}</span>
      </span>
    </label>
  );
}

function Picker({
  title,
  help,
  query,
  onQuery,
  choices,
  selected,
  disabled,
  onToggle,
}: {
  title: string;
  help: string;
  query: string;
  onQuery: (value: string) => void;
  choices: Choice[];
  selected: string[];
  disabled: boolean;
  onToggle: (id: string) => void;
}) {
  const needle = query.trim().toLowerCase();
  const shown = choices.filter((choice) => !needle || choice.label.toLowerCase().includes(needle)).slice(0, 40);
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
      <h2 className="text-sm font-semibold text-neutral-950">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">{help}</p>
      <input
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder={`Search ${title.toLowerCase()}`}
        className={cn(adminFieldClass, "mt-3")}
      />
      <ul className="mt-3 max-h-52 space-y-1 overflow-y-auto">
        {shown.length === 0 ? <li className="px-1 py-2 text-sm text-neutral-500">Nothing matches.</li> : null}
        {shown.map((choice) => (
          <li key={choice.id}>
            <label className="flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm hover:bg-neutral-50">
              <input
                type="checkbox"
                checked={selected.includes(choice.id)}
                disabled={disabled}
                onChange={() => onToggle(choice.id)}
                className="size-4 accent-primary"
              />
              <span className="min-w-0 truncate">{choice.label}</span>
            </label>
          </li>
        ))}
      </ul>
      {selected.length > 0 ? (
        <p className="mt-2 text-xs text-neutral-600">{selected.length} selected</p>
      ) : (
        <p className="mt-2 text-xs text-neutral-500">None selected — every {title.toLowerCase().replace(/s$/, "")} is allowed.</p>
      )}
    </section>
  );
}
