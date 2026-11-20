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

import { adminButtonClass, adminFieldClass } from "../../_components/admin-ui";
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
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-neutral-900" aria-busy="true" />
    );
  }

  const locked = !canWrite;

  // Real-time Preview Value
  const previewDiscount =
    values.discountType === "percent"
      ? `${values.value || "0"}% OFF`
      : `৳${values.value || "0"} OFF`;

  return (
    <form onSubmit={(event) => void save(event)} className="space-y-6" noValidate>
      {locked ? (
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300">
          <MaterialIcon name="lock" className="text-[18px] text-neutral-400" />
          <span>You have view-only access. An editor role is required to make changes.</span>
        </div>
      ) : null}

      {formError ? (
        <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700">
          <MaterialIcon name="error_outline" className="text-[20px] shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}

      {/* Live Coupon Preview Ticket */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6 dark:border-primary/30 dark:from-primary/15">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <MaterialIcon name="confirmation_number" className="text-[24px]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold tracking-wider text-neutral-950 dark:text-white uppercase">
                  {values.code || "VOUCHERCODE"}
                </span>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                  {previewDiscount}
                </span>
                {values.freeDelivery ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <MaterialIcon name="local_shipping" className="text-[12px]" />
                    Free Delivery
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
                {Number(values.minOrderAmount) > 0
                  ? `Min. order ৳${Number(values.minOrderAmount).toLocaleString("en-US")}`
                  : "No minimum purchase required"}
                {values.maxDiscount ? ` · Max discount cap ৳${values.maxDiscount}` : ""}
                {values.firstOrderOnly ? " · 1st order only" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border",
                values.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
              )}
            >
              <span className={cn("size-2 rounded-full", values.isActive ? "bg-emerald-500" : "bg-neutral-400")} />
              {values.isActive ? "Will be Active" : "Disabled (Inactive)"}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Code & Basic Setup */}
      <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-white/10 dark:bg-neutral-900 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3.5 dark:border-white/5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MaterialIcon name="pin" className="text-[16px]" />
          </span>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Coupon Code & Status</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Coupon Code */}
          <div className="sm:col-span-2">
            <Field
              id={`${formId}-code`}
              label="Coupon Code"
              help="Customers type this at checkout. 3–32 letters, numbers, hyphens, or underscores."
              error={errors.code}
            >
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <MaterialIcon
                    name="sell"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-neutral-400"
                  />
                  <input
                    id={`${formId}-code`}
                    data-testid="coupon-code-input"
                    value={values.code}
                    disabled={locked}
                    onChange={(event) => set("code", event.target.value.toUpperCase())}
                    className={cn(
                      adminFieldClass,
                      "pl-9 font-mono font-bold tracking-wider uppercase text-neutral-900 focus:border-primary focus:ring-primary/20 dark:text-white"
                    )}
                    placeholder="e.g. FLASH20"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="button"
                  data-testid="coupon-generate"
                  disabled={locked}
                  onClick={() => set("code", makeCode())}
                  className={cn(
                    adminButtonClass.secondary,
                    "shrink-0 gap-2 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  )}
                >
                  <MaterialIcon name="casino" className="text-[18px]" />
                  <span>Generate Code</span>
                </button>
              </div>
            </Field>
          </div>

          {/* Active Status Checkbox */}
          <div className="sm:col-span-2 rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4 dark:border-white/10 dark:bg-neutral-800/40">
            <Check
              checked={values.isActive}
              disabled={locked}
              onChange={(checked) => set("isActive", checked)}
              label="Enable this coupon"
              help="Turn off to temporarily stop customers from using this code without deleting it."
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: Discount & Pricing Rules */}
      <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-white/10 dark:bg-neutral-900 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3.5 dark:border-white/5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MaterialIcon name="percent" className="text-[16px]" />
          </span>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Discount & Pricing Rules</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Discount Type */}
          <Field
            id={`${formId}-type`}
            label="Discount Type"
            help="Percentage takes a relative cut; Fixed amount subtracts a flat Taka discount."
          >
            <select
              id={`${formId}-type`}
              value={values.discountType}
              disabled={locked}
              onChange={(event) => set("discountType", event.target.value === "fixed" ? "fixed" : "percent")}
              className={cn(adminFieldClass, "cursor-pointer focus:border-primary")}
            >
              <option value="percent">Percentage Discount (%)</option>
              <option value="fixed">Fixed Amount Discount (৳)</option>
            </select>
          </Field>

          {/* Discount Value */}
          <Field
            id={`${formId}-value`}
            label={values.discountType === "percent" ? "Discount Percentage (%)" : "Discount Amount (৳)"}
            help={
              values.discountType === "percent"
                ? "e.g. 15 for 15% off. Use 0 only if providing free delivery without product discount."
                : "e.g. 100 for ৳100 off. Use 0 only if providing free delivery without product discount."
            }
            error={errors.value}
          >
            <div className="relative">
              <input
                id={`${formId}-value`}
                inputMode="decimal"
                value={values.value}
                disabled={locked}
                onChange={(event) => set("value", event.target.value)}
                placeholder={values.discountType === "percent" ? "10" : "100"}
                className={cn(adminFieldClass, "pr-8 font-semibold focus:border-primary")}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                {values.discountType === "percent" ? "%" : "৳"}
              </span>
            </div>
          </Field>

          {/* Maximum Discount Cap (if percent) */}
          {values.discountType === "percent" ? (
            <Field
              id={`${formId}-cap`}
              label="Maximum Discount Cap (৳)"
              help="The highest discount this coupon can provide. Leave empty for no ceiling."
              error={errors.maxDiscount}
            >
              <div className="relative">
                <input
                  id={`${formId}-cap`}
                  inputMode="decimal"
                  value={values.maxDiscount}
                  disabled={locked}
                  onChange={(event) => set("maxDiscount", event.target.value)}
                  className={cn(adminFieldClass, "pr-8 focus:border-primary")}
                  placeholder="No limit"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                  ৳
                </span>
              </div>
            </Field>
          ) : null}

          {/* Minimum Order Amount */}
          <Field
            id={`${formId}-min`}
            label="Minimum Purchase Requirement (৳)"
            help="Cart total must equal or exceed this amount before the coupon can be applied. 0 = no minimum."
            error={errors.minOrderAmount}
          >
            <div className="relative">
              <input
                id={`${formId}-min`}
                inputMode="decimal"
                value={values.minOrderAmount}
                disabled={locked}
                onChange={(event) => set("minOrderAmount", event.target.value)}
                className={cn(adminFieldClass, "pr-8 focus:border-primary")}
                placeholder="0"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                ৳
              </span>
            </div>
          </Field>
        </div>

        {/* Additional Perk Toggles */}
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4 dark:border-white/10 dark:bg-neutral-800/40">
            <Check
              checked={values.freeDelivery}
              disabled={locked}
              onChange={(checked) => set("freeDelivery", checked)}
              label="Free Shipping / Delivery"
              help="Sets delivery fee to ৳0 when this coupon is applied at checkout."
            />
          </div>

          <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4 dark:border-white/10 dark:bg-neutral-800/40">
            <Check
              checked={values.firstOrderOnly}
              disabled={locked}
              onChange={(checked) => set("firstOrderOnly", checked)}
              label="First-time customers only"
              help="Valid only for customer phone numbers with zero previous orders."
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: Schedule & Usage Limits */}
      <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-white/10 dark:bg-neutral-900 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3.5 dark:border-white/5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MaterialIcon name="schedule" className="text-[16px]" />
          </span>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Schedule & Usage Quota</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Start Date */}
          <Field
            id={`${formId}-start`}
            label="Start Date & Time (Dhaka Time)"
            help="When the code becomes redeemable. Leave empty to activate immediately."
            error={errors.startsAt}
          >
            <input
              id={`${formId}-start`}
              type="datetime-local"
              value={values.startsAt}
              disabled={locked}
              onChange={(event) => set("startsAt", event.target.value)}
              className={cn(adminFieldClass, "focus:border-primary")}
            />
          </Field>

          {/* End Date */}
          <Field
            id={`${formId}-end`}
            label="Expiration Date & Time (Dhaka Time)"
            help="When the code expires. Leave blank for indefinite validity."
            error={errors.endsAt}
          >
            <input
              id={`${formId}-end`}
              type="datetime-local"
              value={values.endsAt}
              disabled={locked}
              onChange={(event) => set("endsAt", event.target.value)}
              className={cn(adminFieldClass, "focus:border-primary")}
            />
          </Field>

          {/* Total Usage Limit */}
          <Field
            id={`${formId}-total-limit`}
            label="Total Usage Limit"
            help="Max number of times this code can be used across all shoppers. Leave empty for unlimited."
            error={errors.usageLimitTotal}
          >
            <input
              id={`${formId}-total-limit`}
              inputMode="numeric"
              value={values.usageLimitTotal}
              disabled={locked}
              onChange={(event) => set("usageLimitTotal", event.target.value)}
              className={cn(adminFieldClass, "focus:border-primary")}
              placeholder="e.g. 500 (Leave empty for unlimited)"
            />
          </Field>

          {/* Per Phone Usage Limit */}
          <Field
            id={`${formId}-phone-limit`}
            label="Per-Customer Usage Limit"
            help="Max times a single customer phone number can redeem this voucher."
            error={errors.usageLimitPerPhone}
          >
            <input
              id={`${formId}-phone-limit`}
              inputMode="numeric"
              value={values.usageLimitPerPhone}
              disabled={locked}
              onChange={(event) => set("usageLimitPerPhone", event.target.value)}
              className={cn(adminFieldClass, "focus:border-primary")}
              placeholder="e.g. 1 (Leave empty for unlimited)"
            />
          </Field>
        </div>
      </section>

      {/* SECTION 4: Product & Category Eligibility */}
      <section className="grid gap-5 md:grid-cols-2">
        <Picker
          title="Product Eligibility"
          help="Leave empty to apply to all products. Otherwise cart must contain at least one of these."
          icon="inventory_2"
          query={productQuery}
          onQuery={setProductQuery}
          choices={products}
          selected={values.productIds}
          disabled={locked}
          onToggle={(id) => toggle("productIds", id)}
        />
        <Picker
          title="Category Eligibility"
          help="Leave empty to allow all categories. Selecting a category includes its subcategories."
          icon="category"
          query={categoryQuery}
          onQuery={setCategoryQuery}
          choices={categories}
          selected={values.categoryIds}
          disabled={locked}
          onToggle={(id) => toggle("categoryIds", id)}
        />
      </section>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-200/80 dark:border-white/10">
        <button
          type="submit"
          data-testid="coupon-save"
          disabled={locked || saving}
          className={cn(
            adminButtonClass.primary,
            "min-w-32 bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer"
          )}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Saving…</span>
            </span>
          ) : (
            <span>{couponId ? "Save changes" : "Create coupon"}</span>
          )}
        </button>
        <Link
          href="/admin/coupons"
          className={cn(adminButtonClass.secondary, "cursor-pointer hover:bg-neutral-100")}
        >
          Cancel & Back
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
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
        {label}
      </label>
      {children}
      <p id={`${id}-help`} className="text-[11px] leading-relaxed text-neutral-500">
        {help}
      </p>
      {error ? (
        <p role="alert" className="text-xs font-semibold text-red-600">
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
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4.5 rounded accent-primary cursor-pointer"
      />
      <div>
        <span className="block text-sm font-semibold text-neutral-900 dark:text-white">
          {label}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
          {help}
        </span>
      </div>
    </label>
  );
}

function Picker({
  title,
  help,
  icon,
  query,
  onQuery,
  choices,
  selected,
  disabled,
  onToggle,
}: {
  title: string;
  help: string;
  icon: string;
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
    <section className="flex flex-col rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-white/5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MaterialIcon name={icon} className="text-[16px]" />
          </span>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{title}</h3>
        </div>
        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          {selected.length} selected
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-neutral-500">{help}</p>

      <div className="relative mt-3">
        <MaterialIcon
          name="search"
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-neutral-400"
        />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder={`Search ${title.toLowerCase()}...`}
          className={cn(adminFieldClass, "pl-8 text-xs h-8.5 focus:border-primary")}
        />
      </div>

      <ul className="mt-3 max-h-48 flex-1 space-y-1 overflow-y-auto divide-y divide-neutral-50 dark:divide-white/5 pr-1">
        {shown.length === 0 ? (
          <li className="py-4 text-center text-xs text-neutral-400">No matching items.</li>
        ) : null}
        {shown.map((choice) => {
          const isSelected = selected.includes(choice.id);
          return (
            <li key={choice.id} className="pt-1 first:pt-0">
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                  isSelected
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => onToggle(choice.id)}
                  className="size-3.5 rounded accent-primary cursor-pointer"
                />
                <span className="min-w-0 truncate">{choice.label}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 pt-2 border-t border-neutral-100 text-[11px] text-neutral-400 dark:border-white/5">
        {selected.length > 0 ? (
          <span className="text-primary font-medium">{selected.length} items specifically targeted</span>
        ) : (
          <span>No restrictions — applies to every item</span>
        )}
      </div>
    </section>
  );
}
