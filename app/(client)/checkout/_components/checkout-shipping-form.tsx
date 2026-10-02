"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { checkoutCopy } from "../../_data/checkout/checkout";

import type { DeliveryZone } from "@/lib/mart-api/delivery";

import { useCheckoutForm } from "./checkout-form-context";

type CheckoutShippingFormProps = {
  className?: string;
};

const fieldClass =
  "h-11 rounded-xl border-neutral-200 bg-[#f5f6f8] px-3.5 text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/30";

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-neutral-700">
      {children}
      {required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-500">{message}</p>;
}

const ZONES: { id: DeliveryZone; label: string; hint: string }[] = [
  { id: "inside", label: "ঢাকার ভেতরে", hint: "শহরের মূল এলাকা" },
  { id: "suburban", label: "ঢাকার শহরতলি", hint: "সাভার, কেরানীগঞ্জ, ধামরাই" },
  { id: "outside", label: "ঢাকার বাইরে", hint: "অন্য সব জেলা" },
];

export function CheckoutShippingForm({ className }: CheckoutShippingFormProps) {
  const { shipping, setShippingField, errors, rates, deliveryZone, chooseDeliveryZone, pricingBusy } =
    useCheckoutForm();
  const prices: Record<DeliveryZone, number | null> = {
    inside: rates?.insideDhaka ?? null,
    suburban: rates?.dhakaSuburban ?? null,
    outside: rates?.outsideDhaka ?? null,
  };

  return (
    <section className={cn("rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5", className)}>
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MaterialIcon name="local_shipping" className="text-[20px]" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
            {checkoutCopy.shippingTitle}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">{checkoutCopy.shippingHint}</p>
        </div>
      </div>

      <fieldset className="mb-5">
        <legend className="mb-2 text-sm font-medium text-neutral-700">ডেলিভারি এলাকা</legend>
        <div className="grid gap-2">
          {ZONES.map((zone) => {
            const selected = deliveryZone === zone.id;
            const price = prices[zone.id];
            return (
              <label
                key={zone.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 ring-1",
                  selected ? "bg-primary/10 ring-primary" : "bg-[#f5f6f8] ring-transparent",
                )}
              >
                <input
                  type="radio"
                  name="delivery-zone"
                  value={zone.id}
                  checked={selected}
                  disabled={pricingBusy}
                  onChange={() => chooseDeliveryZone(zone.id)}
                  className="size-4 accent-primary"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-neutral-950">{zone.label}</span>
                  <span className="block text-xs text-neutral-500">{zone.hint}</span>
                </span>
                <span className="text-sm font-semibold tabular-nums text-neutral-950">
                  {price == null ? "—" : `৳${price.toLocaleString("en-US")}`}
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          জেলা ও এলাকা দেখে চার্জ ঠিক হয়। ঢাকা শহরের চেয়ে দূরের এলাকায় একটু বেশি। সস্তা জোন বেছে নিলেও ঠিকানা দূর হলে সেই চার্জই বসবে।
        </p>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <FieldLabel htmlFor="checkout-name" required>
            পুরো নাম
          </FieldLabel>
          <Input
            id="checkout-name"
            name="name"
            autoComplete="name"
            placeholder="যেমন: রাকিব হাসান"
            value={shipping.name}
            onChange={(e) => setShippingField("name", e.target.value)}
            className={cn(fieldClass, errors.name && "border-red-400")}
            aria-invalid={Boolean(errors.name)}
          />
          <FieldError message={errors.name} />
        </div>

        <div className="min-w-0">
          <FieldLabel htmlFor="checkout-phone" required>
            মোবাইল নম্বর
          </FieldLabel>
          <Input
            id="checkout-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            value={shipping.phone}
            onChange={(e) => setShippingField("phone", e.target.value)}
            className={cn(fieldClass, errors.phone && "border-red-400")}
            aria-invalid={Boolean(errors.phone)}
          />
          <FieldError message={errors.phone} />
        </div>

        <div className="min-w-0 sm:col-span-2">
          <FieldLabel htmlFor="checkout-email">ইমেইল (ঐচ্ছিক)</FieldLabel>
          <Input
            id="checkout-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="example@gmail.com"
            value={shipping.email}
            onChange={(e) => setShippingField("email", e.target.value)}
            className={cn(fieldClass, errors.email && "border-red-400")}
            aria-invalid={Boolean(errors.email)}
          />
          <FieldError message={errors.email} />
        </div>

        <div className="min-w-0">
          <FieldLabel htmlFor="checkout-district" required>
            জেলা
          </FieldLabel>
          <Input
            id="checkout-district"
            name="district"
            placeholder="যেমন: ঢাকা"
            value={shipping.district}
            onChange={(e) => setShippingField("district", e.target.value)}
            className={cn(fieldClass, errors.district && "border-red-400")}
            aria-invalid={Boolean(errors.district)}
          />
          <FieldError message={errors.district} />
        </div>

        <div className="min-w-0">
          <FieldLabel htmlFor="checkout-area" required>
            এলাকা / থানা
          </FieldLabel>
          <Input
            id="checkout-area"
            name="area"
            placeholder="যেমন: ধানমন্ডি"
            value={shipping.area}
            onChange={(e) => setShippingField("area", e.target.value)}
            className={cn(fieldClass, errors.area && "border-red-400")}
            aria-invalid={Boolean(errors.area)}
          />
          <FieldError message={errors.area} />
        </div>

        <div className="min-w-0 sm:col-span-2">
          <FieldLabel htmlFor="checkout-address" required>
            সম্পূর্ণ ঠিকানা
          </FieldLabel>
          <Textarea
            id="checkout-address"
            name="address"
            rows={3}
            placeholder="বাড়ি/ফ্ল্যাট নং, রোড, ল্যান্ডমার্ক..."
            value={shipping.address}
            onChange={(e) => setShippingField("address", e.target.value)}
            className={cn(
              "min-h-[88px] resize-none rounded-xl border-neutral-200 bg-[#f5f6f8] px-3.5 py-3 text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/30",
              errors.address && "border-red-400",
            )}
            aria-invalid={Boolean(errors.address)}
          />
          <FieldError message={errors.address} />
        </div>

        <div className="min-w-0 sm:col-span-2">
          <FieldLabel htmlFor="checkout-notes">অর্ডার নোট (ঐচ্ছিক)</FieldLabel>
          <Textarea
            id="checkout-notes"
            name="notes"
            rows={2}
            placeholder="ডেলিভারি সংক্রান্ত কোনো বিশেষ নির্দেশনা থাকলে লিখুন"
            value={shipping.notes}
            onChange={(e) => setShippingField("notes", e.target.value)}
            className="min-h-[68px] resize-none rounded-xl border-neutral-200 bg-[#f5f6f8] px-3.5 py-3 text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/30"
          />
        </div>
      </div>
    </section>
  );
}
