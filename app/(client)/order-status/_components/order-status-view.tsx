"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  findPublicOrder,
  formatTaka,
  ORDER_STATUS_LABEL,
  orderGrandTotal,
  type MockOrder,
} from "@/lib/mart-mock/store";

import { Container } from "../../_components/common/container";

const fieldClass =
  "h-11 rounded-xl border-neutral-200 bg-[#f5f6f8] px-3.5 text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/30";

export function OrderStatusView({ initialOrder = "" }: { initialOrder?: string }) {
  const [number, setNumber] = useState(initialOrder);
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<MockOrder | "missing" | null>(null);

  function lookup(event: React.FormEvent) {
    event.preventDefault();
    const order = findPublicOrder(number, phone);
    setResult(order ?? "missing");
  }

  return (
    <Container className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold text-neutral-950">অর্ডার স্ট্যাটাস</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          অর্ডার নম্বর আর ফোন মিললে স্ট্যাটাস, আইটেম আর মোট দেখাবে। লগইন লাগে না।
        </p>

        <form
          onSubmit={lookup}
          className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5"
        >
          <label htmlFor="order-number" className="mb-1.5 block text-sm font-medium text-neutral-700">
            অর্ডার নম্বর
          </label>
          <Input
            id="order-number"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            placeholder="IM-1001"
            className={fieldClass}
          />
          <label htmlFor="order-phone" className="mt-4 mb-1.5 block text-sm font-medium text-neutral-700">
            ফোন
          </label>
          <Input
            id="order-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="numeric"
            placeholder="01XXXXXXXXX"
            className={fieldClass}
          />
          <button
            type="submit"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-white hover:bg-primary/80"
          >
            স্ট্যাটাস দেখুন
          </button>
        </form>

        {result === "missing" ? (
          <p className="mt-4 rounded-2xl bg-white px-4 py-6 text-center text-sm font-medium text-neutral-700 ring-1 ring-neutral-200/90">
            পাওয়া যায়নি
          </p>
        ) : null}

        {result && result !== "missing" ? (
          <section className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-neutral-950">{result.number}</p>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {ORDER_STATUS_LABEL[result.status]}
              </span>
            </div>
            <ul className="mt-4 flex flex-col gap-3">
              {result.items.map((item) => (
                <li key={item.slug} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 text-neutral-800">
                    {item.title}
                    <span className="text-neutral-500"> × {item.quantity}</span>
                  </span>
                  <span className={cn("shrink-0 font-medium tabular-nums")}>
                    {formatTaka(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
              <span className="text-sm font-semibold text-neutral-950">মোট</span>
              <span className="text-base font-semibold text-primary">
                {formatTaka(orderGrandTotal(result))}
              </span>
            </div>
          </section>
        ) : null}
      </div>
    </Container>
  );
}
