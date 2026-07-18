"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { checkoutCopy } from "../../_data/checkout/checkout";

type CheckoutShippingFormProps = {
  className?: string;
};

const fieldClass =
  "h-12 rounded-xl border-outline-variant/40 bg-surface-container-lowest px-3.5 text-body-md shadow-none focus-visible:border-primary focus-visible:ring-primary/20";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block font-label-md text-on-surface">
      {children}
    </label>
  );
}

export function CheckoutShippingForm({ className }: CheckoutShippingFormProps) {
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

      <form
        className="grid grid-cols-1 gap-5 md:grid-cols-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <FieldLabel htmlFor="checkout-name">পুরো নাম</FieldLabel>
          <Input
            id="checkout-name"
            name="name"
            autoComplete="name"
            placeholder="যেমন: রাকিব হাসান"
            className={fieldClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="checkout-phone">মোবাইল নম্বর</FieldLabel>
          <Input
            id="checkout-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            className={fieldClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="checkout-district">জেলা</FieldLabel>
          <Input
            id="checkout-district"
            name="district"
            placeholder="যেমন: ঢাকা"
            className={fieldClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="checkout-area">এলাকা / থানা</FieldLabel>
          <Input
            id="checkout-area"
            name="area"
            placeholder="যেমন: ধানমন্ডি"
            className={fieldClass}
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel htmlFor="checkout-address">সম্পূর্ণ ঠিকানা</FieldLabel>
          <Textarea
            id="checkout-address"
            name="address"
            rows={3}
            placeholder="বাড়ি/ফ্ল্যাট নং, রোড, ল্যান্ডমার্ক..."
            className="min-h-[96px] resize-none rounded-xl border-outline-variant/40 bg-surface-container-lowest px-3.5 py-3 text-body-md shadow-none focus-visible:border-primary focus-visible:ring-primary/20"
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel htmlFor="checkout-notes">অর্ডার নোট (ঐচ্ছিক)</FieldLabel>
          <Textarea
            id="checkout-notes"
            name="notes"
            rows={2}
            placeholder="ডেলিভারি সংক্রান্ত কোনো বিশেষ নির্দেশনা থাকলে লিখুন"
            className="min-h-[72px] resize-none rounded-xl border-outline-variant/40 bg-surface-container-lowest px-3.5 py-3 text-body-md shadow-none focus-visible:border-primary focus-visible:ring-primary/20"
          />
        </div>
      </form>
    </section>
  );
}
