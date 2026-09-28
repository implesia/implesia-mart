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
    description: "প্রোডাক্ট হাতে পাওয়ার পর টাকা পরিশোধ করুন। আগে থেকে পেমেন্ট বাধ্যতামূলক নয়।",
    icon: "payments",
    badge: "চালু আছে",
  },
  {
    id: "online" as const,
    title: "অনলাইন পেমেন্ট",
    description: "কার্ড / মোবাইল ব্যাংকিং এখন চালু নেই। অর্ডার COD দিয়েই করুন।",
    icon: "credit_card",
    disabled: true,
  },
];

export function CheckoutPaymentMethod({ className }: CheckoutPaymentMethodProps) {
  const [method, setMethod] = useState<"cod" | "online">("cod");

  return (
    <section className={cn("rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5", className)}>
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MaterialIcon name="account_balance_wallet" className="text-[20px]" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
            {checkoutCopy.paymentTitle}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">{checkoutCopy.paymentHint}</p>
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
                "relative flex cursor-pointer gap-3 rounded-2xl p-3.5 ring-1 transition-colors sm:gap-4 sm:p-4",
                disabled && "cursor-not-allowed opacity-60",
                selected && !disabled
                  ? "bg-primary/5 ring-primary/30"
                  : "bg-[#f5f6f8] ring-neutral-200/90 hover:ring-primary/30",
              )}
            >
              <RadioGroupItem
                value={item.id}
                disabled={disabled}
                className="mt-0.5 shrink-0 sm:mt-1"
              />
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-primary ring-1 ring-neutral-200/90">
                <MaterialIcon name={item.icon} className="text-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-neutral-950">{item.title}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {item.badge}
                    </span>
                  ) : null}
                  {disabled ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-500 ring-1 ring-neutral-200">
                      শীঘ্রই আসছে
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-neutral-600 sm:text-sm">
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
