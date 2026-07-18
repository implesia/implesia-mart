"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { checkoutCopy } from "../../_data/checkout/checkout";

import { useCheckoutForm } from "./checkout-form-context";

type CheckoutShippingFormProps = {
  className?: string;
};

const fieldClass =
  "h-12 rounded-xl border-outline-variant/40 bg-surface-container-lowest px-3.5 text-body-md shadow-none focus-visible:border-primary focus-visible:ring-primary/20";

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
    <label htmlFor={htmlFor} className="mb-2 block font-label-md text-on-surface">
      {children}
      {required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-label-sm text-red-500">{message}</p>;
}

export function CheckoutShippingForm({ className }: CheckoutShippingFormProps) {
  const { shipping, setShippingField, errors } = useCheckoutForm();

  return (
    <section
      className={cn(
        "rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8",
        className,
      )}
    >
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MaterialIcon name="local_shipping" className="text-[22px]" />
        </span>
        <div>
          <h2 className="font-headline-sm text-on-surface">{checkoutCopy.shippingTitle}</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {checkoutCopy.shippingHint}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
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

        <div>
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

        <div className="md:col-span-2">
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

        <div>
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

        <div>
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

        <div className="md:col-span-2">
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
              "min-h-[96px] resize-none rounded-xl border-outline-variant/40 bg-surface-container-lowest px-3.5 py-3 text-body-md shadow-none focus-visible:border-primary focus-visible:ring-primary/20",
              errors.address && "border-red-400",
            )}
            aria-invalid={Boolean(errors.address)}
          />
          <FieldError message={errors.address} />
        </div>

        <div className="md:col-span-2">
          <FieldLabel htmlFor="checkout-notes">অর্ডার নোট (ঐচ্ছিক)</FieldLabel>
          <Textarea
            id="checkout-notes"
            name="notes"
            rows={2}
            placeholder="ডেলিভারি সংক্রান্ত কোনো বিশেষ নির্দেশনা থাকলে লিখুন"
            value={shipping.notes}
            onChange={(e) => setShippingField("notes", e.target.value)}
            className="min-h-[72px] resize-none rounded-xl border-outline-variant/40 bg-surface-container-lowest px-3.5 py-3 text-body-md shadow-none focus-visible:border-primary focus-visible:ring-primary/20"
          />
        </div>
      </div>
    </section>
  );
}
