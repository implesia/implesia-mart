"use client";

import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BANGLA_QR_HINT, type AdvancePercent, type PaymentMethod } from "@/lib/payment";
import { cn } from "@/lib/utils";

import { BanglaQrPreview } from "../../_components/common/bangla-qr";
import { MaterialIcon } from "../../_components/common/material-icon";
import { checkoutCopy } from "../../_data/checkout/checkout";
import { formatCartMoney } from "../../_lib/cart-shared";

import { useCheckoutForm } from "./checkout-form-context";

type CheckoutPaymentMethodProps = {
  className?: string;
};

type MethodId = PaymentMethod | "online";

const PERCENT_LABEL: Record<AdvancePercent, string> = {
  25: "২৫%",
  50: "৫০%",
  75: "৭৫%",
  100: "১০০%",
};

export function CheckoutPaymentMethod({ className }: CheckoutPaymentMethodProps) {
  const {
    paymentMethod,
    setPaymentMethod,
    qrSrc,
    banglaQrOptions,
    advancePercent,
    setAdvancePercent,
    paymentReference,
    setPaymentReference,
    paymentErrors,
  } = useCheckoutForm();
  const qrOffered = Boolean(qrSrc) && banglaQrOptions.length > 0;

  const methods: {
    id: MethodId;
    title: string;
    description: string;
    icon: string;
    badge?: string;
    disabled?: boolean;
  }[] = [
    {
      id: "cod",
      title: "ক্যাশ অন ডেলিভারি",
      description: "প্রোডাক্ট হাতে পাওয়ার পর টাকা পরিশোধ করুন। আগে থেকে পেমেন্ট বাধ্যতামূলক নয়।",
      icon: "payments",
      badge: "চালু আছে",
    },
    ...(qrOffered
      ? [
          {
            id: "bangla_qr" as const,
            title: "Bangla QR",
            description:
              "QR স্ক্যান করে ২৫% / ৫০% / ৭৫% / ১০০% অগ্রিম দিন, বাকি টাকা ডেলিভারির সময় ক্যাশে।",
            icon: "qr_code_2",
          },
        ]
      : []),
    {
      id: "online",
      title: "অনলাইন পেমেন্ট",
      description: qrOffered
        ? "কার্ড পেমেন্ট এখন চালু নেই।"
        : "কার্ড / মোবাইল ব্যাংকিং এখন চালু নেই। অর্ডার COD দিয়েই করুন।",
      icon: "credit_card",
      disabled: true,
    },
  ];

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
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">
            {qrOffered ? checkoutCopy.paymentHintQr : checkoutCopy.paymentHint}
          </p>
        </div>
      </div>

      <RadioGroup
        value={paymentMethod}
        onValueChange={(v) => {
          if (v === "cod" || v === "bangla_qr") setPaymentMethod(v);
        }}
        className="gap-3"
      >
        {methods.map((item) => {
          const selected = paymentMethod === item.id;
          const disabled = Boolean(item.disabled);

          return (
            <div key={item.id} className="grid gap-3">
              <label
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

              {item.id === "bangla_qr" && selected && qrSrc ? (
                <div className="grid gap-4 rounded-2xl bg-white p-3.5 ring-1 ring-primary/30 sm:p-4">
                  <div>
                    <p id="checkout-advance-label" className="mb-2 text-sm font-medium text-neutral-700">
                      কত শতাংশ অগ্রিম দেবেন?<span className="ml-0.5 text-red-500">*</span>
                    </p>
                    <div
                      role="radiogroup"
                      aria-labelledby="checkout-advance-label"
                      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                    >
                      {banglaQrOptions.map((option) => {
                        const active = advancePercent === option.percent;
                        return (
                          <button
                            key={option.percent}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setAdvancePercent(option.percent)}
                            className={cn(
                              "min-w-0 rounded-xl px-3 py-2.5 text-left ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b5e56]",
                              active
                                ? "bg-primary/10 ring-2 ring-primary"
                                : "bg-[#f5f6f8] ring-neutral-200/90 hover:ring-primary/40",
                            )}
                          >
                            <span className="block text-sm font-semibold text-neutral-950">
                              {PERCENT_LABEL[option.percent]}
                            </span>
                            <span className="mt-0.5 block text-xs text-neutral-700">
                              এখন <span className="font-semibold text-neutral-950">{formatCartMoney(option.advance)}</span>
                            </span>
                            <span className="block text-xs text-neutral-600">
                              বাকি {formatCartMoney(option.due)}
                              {option.due > 0 ? " (COD)" : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {paymentErrors.percent ? (
                      <p className="mt-1.5 text-xs text-red-500">{paymentErrors.percent}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
                    <BanglaQrPreview src={qrSrc} />
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="text-sm leading-relaxed text-neutral-800">{BANGLA_QR_HINT}</p>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                        উপরে বেছে নেওয়া অগ্রিম টাকা পাঠান, তারপর নিচে ট্রানজেকশন আইডি বা যে নম্বর থেকে পাঠিয়েছেন সেটি লিখুন। বাকি টাকা ডেলিভারির সময় ক্যাশে দেবেন।
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label
                      htmlFor="checkout-payment-reference"
                      className="mb-1.5 block text-sm font-medium text-neutral-700"
                    >
                      ট্রানজেকশন আইডি / সেন্ডার নম্বর<span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <Input
                      id="checkout-payment-reference"
                      name="payment_reference"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="যেমন 8N7A6D5C4B বা 01XXXXXXXXX"
                      maxLength={80}
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className={cn(
                        "h-11 rounded-xl border-neutral-200 bg-[#f5f6f8] px-3.5 text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/30",
                        paymentErrors.reference && "border-red-400",
                      )}
                      aria-invalid={Boolean(paymentErrors.reference)}
                    />
                    {paymentErrors.reference ? (
                      <p className="mt-1.5 text-xs text-red-500">{paymentErrors.reference}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </RadioGroup>
    </section>
  );
}
