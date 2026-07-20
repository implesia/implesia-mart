"use client";

import { useState } from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { checkoutCopy } from "../../_data/checkout/checkout";

type CheckoutPaymentMethodProps = {
  className?: string;
};

const methods = [
  {
    id: "cod" as const,
    title: "ক্যাশ অন ডেলিভারি",
    description: "প্রোডাক্ট হাতে পাওয়ার পর টাকা পরিশোধ করুন। কোনো অগ্রিম পেমেন্ট লাগবে না।",
    icon: "payments",
    badge: "সুপারিশকৃত",
  },
  {
    id: "online" as const,
    title: "অনলাইন পেমেন্ট",
    description: "কার্ড / মোবাইল ব্যাংকিং অপশন শীঘ্রই চালু হবে। এখন COD দিয়ে অর্ডার করুন।",
    icon: "credit_card",
    disabled: true,
  },
];

export function CheckoutPaymentMethod({ className }: CheckoutPaymentMethodProps) {
  const [method, setMethod] = useState<"cod" | "online">("cod");

  return (
    <section
      className={cn(
        "rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:p-6 lg:p-8",
        className,
      )}
    >
      <div className="mb-5 flex items-start gap-3 sm:mb-6">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-10">
          <MaterialIcon
            name="account_balance_wallet"
            className="text-[20px] sm:text-[22px]"
          />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-on-surface sm:text-xl">
            {checkoutCopy.paymentTitle}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant sm:text-base">
            {checkoutCopy.paymentHint}
          </p>
        </div>
      </div>

      <RadioGroup
        value={method}
        onValueChange={(v) => {
          if (v === "online") return;
          setMethod(v as "cod" | "online");
        }}
        className="gap-3"
      >
        {methods.map((item) => {
          const selected = method === item.id;
          const disabled = Boolean(item.disabled);

          return (
            <label
              key={item.id}
              className={cn(
                "relative flex cursor-pointer gap-3 rounded-2xl border p-3.5 transition-all duration-200 sm:gap-4 sm:p-5",
                disabled && "cursor-not-allowed opacity-60",
                selected && !disabled
                  ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(43,192,181,0.25)]"
                  : "border-outline-variant/30 bg-surface-container-low/60 hover:border-outline-variant/50",
              )}
            >
              <RadioGroupItem
                value={item.id}
                disabled={disabled}
                className="mt-0.5 shrink-0 sm:mt-1"
              />
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-lowest text-primary ring-1 ring-outline-variant/20 sm:size-11">
                <MaterialIcon name={item.icon} className="text-[18px] sm:text-[22px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-sm font-semibold text-on-surface sm:text-base">
                    {item.title}
                  </span>
                  {item.badge ? (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary sm:px-2.5 sm:text-xs">
                      {item.badge}
                    </span>
                  ) : null}
                  {disabled ? (
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-semibold text-outline sm:px-2.5 sm:text-xs">
                      শীঘ্রই
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-on-surface-variant sm:text-sm sm:text-base">
                  {item.description}
                </span>
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </section>
  );
}
