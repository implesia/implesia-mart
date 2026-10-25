"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";

import { WHATSAPP_HREF } from "@/app/(client)/_data/contact/contact";
import {
  orderPhoneDigits,
  readSavedOrders,
  rememberOrder,
  type SavedOrder,
} from "@/app/(client)/_lib/saved-orders";
import { Input } from "@/components/ui/input";
import { MartApiError } from "@/lib/mart-api/products";
import { lookupPublicOrder, type PublicOrder } from "@/lib/mart-api/orders";
import type { OrderStatus } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { formatCartMoney } from "../../_lib/cart-shared";
import { productPath } from "@/lib/mart-api/product-url";

const fieldClass =
  "h-11 rounded-xl border-neutral-200 bg-[#f5f6f8] px-3.5 text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/30";

const FLOW = [
  { id: "new", label: "সেভ হয়েছে", hint: "অর্ডার আমাদের কাছে আছে" },
  { id: "confirmed", label: "কনফার্ম", hint: "মোবাইলে কল বা মেসেজ হবে" },
  { id: "shipped", label: "পাঠানো", hint: "কুরিয়ার বের হয়েছে" },
  { id: "delivered", label: "হাতে পৌঁছেছে", hint: "দেখে তারপর টাকা দিন" },
] as const;

const ZONE_LABEL = {
  inside: "ঢাকার ভেতরে",
  suburban: "ঢাকার শহরতলি",
  outside: "ঢাকার বাইরে",
} as const;

const CLOSED: Partial<Record<OrderStatus, { title: string; body: string }>> = {
  cancelled: {
    title: "এই অর্ডার বাতিল",
    body: "নতুন করে নিতে হলে আবার অর্ডার করুন, অথবা হোয়াটসঅ্যাপে জানান।",
  },
  returned: {
    title: "এই অর্ডার ফেরত এসেছে",
    body: "রিটার্ন নিয়ে কিছু জানতে হোয়াটসঅ্যাপ বা কল করুন।",
  },
};

function maskPhone(phone: string) {
  if (phone.length < 8) return phone;
  return `${phone.slice(0, 3)}••••${phone.slice(-3)}`;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function supportHref(number: string) {
  const text = encodeURIComponent(`আমার অর্ডার ${number} এর আপডেট জানতে চাই।`);
  const join = WHATSAPP_HREF.includes("?") ? "&" : "?";
  return `${WHATSAPP_HREF}${join}text=${text}`;
}

function lookupMessage(error: unknown) {
  const message = error instanceof MartApiError ? error.message : "";
  if (message === "Order not found") {
    return "অর্ডার নম্বর বা মোবাইল মিলছে না। নম্বরটা কনফার্মের সময় যেটা দেখেছিলেন, সেটা দিন।";
  }
  if (message.includes("reach"))
    return "এখন সংযোগ হয়নি। একটু পরে আবার চেষ্টা করুন।";
  return "অর্ডার নম্বর আর ১১ সংখ্যার মোবাইল দিন।";
}

export function OrderStatusView({
  initialOrder = "",
}: {
  initialOrder?: string;
}) {
  const [saved, setSaved] = useState<SavedOrder[]>([]);
  const [number, setNumber] = useState(initialOrder);
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<PublicOrder | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const requestId = useRef(0);
  const resultRef = useRef<HTMLElement>(null);

  async function runLookup(rawNumber: string, rawPhone: string) {
    const nextNumber = rawNumber.replace(/\s+/g, "").toUpperCase();
    const nextPhone = orderPhoneDigits(rawPhone);
    setNumber(nextNumber);
    setPhone(nextPhone);
    if (!/^IM-[0-9A-F]{8}$/.test(nextNumber)) {
      setResult(null);
      setError(
        "অর্ডার নম্বর IM- দিয়ে শুরু, তারপর ৮টা অক্ষর। যেমন IM-9F216D67।",
      );
      return;
    }
    if (!/^01\d{9}$/.test(nextPhone)) {
      setResult(null);
      setError("১১ সংখ্যার মোবাইল দিন, যেমন 01XXXXXXXXX।");
      return;
    }

    const id = requestId.current + 1;
    requestId.current = id;
    setPending(true);
    setError("");
    try {
      const order = await lookupPublicOrder(nextNumber, nextPhone);
      if (id !== requestId.current) return;
      rememberOrder({
        number: order.number,
        phone: nextPhone,
        name: order.customerName,
        placedAt: order.createdAt,
      });
      setSaved(readSavedOrders());
      setResult(order);
      window.setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 40);
    } catch (cause) {
      if (id !== requestId.current) return;
      setResult(null);
      setError(lookupMessage(cause));
    } finally {
      if (id === requestId.current) setPending(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const stored = readSavedOrders();
      setSaved(stored);
      const wanted = initialOrder.replace(/\s+/g, "").toUpperCase();
      const match = wanted
        ? stored.find((item) => item.number === wanted)
        : stored[0];
      if (!match) {
        if (wanted) setNumber(wanted);
        return;
      }
      void runLookup(match.number, match.phone);
    });
    return () => {
      cancelled = true;
    };
  }, [initialOrder]);

  return (
    <Container className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-xl">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
          লগইন লাগে না
        </p>
        <h1 className="mt-1 text-[1.7rem] font-semibold tracking-tight text-neutral-950">
          আমার অর্ডার
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          অর্ডার নম্বর আর চেকআউটে দেওয়া মোবাইল মিললে স্ট্যাটাস দেখাবে। একই
          ব্রাউজারে অর্ডার করলে নম্বর সেভ থাকে।
        </p>

        {saved.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-neutral-500">
              এই ব্রাউজারে
            </p>
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {saved.map((item) => {
                const active = result?.number === item.number;
                return (
                  <li key={item.number} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => void runLookup(item.number, item.phone)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-2xl px-3 py-2 text-left ring-1 transition-colors",
                        active
                          ? "bg-primary/10 ring-primary"
                          : "bg-white ring-neutral-200 hover:ring-primary/40",
                      )}
                    >
                      <span className="block font-mono text-xs font-semibold tracking-wide text-neutral-950">
                        {item.number}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-neutral-500">
                        {item.name || maskPhone(item.phone)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void runLookup(number, phone);
          }}
          className="mt-4 rounded-[24px] bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5"
        >
          <label
            htmlFor="order-number"
            className="mb-1.5 block text-sm font-medium text-neutral-800"
          >
            অর্ডার নম্বর
          </label>
          <Input
            id="order-number"
            value={number}
            onChange={(event) => setNumber(event.target.value.toUpperCase())}
            placeholder="IM-9F216D67"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "order-lookup-error" : undefined}
            className={cn(fieldClass, "font-mono tracking-wide uppercase")}
          />
          <label
            htmlFor="order-phone"
            className="mt-4 mb-1.5 block text-sm font-medium text-neutral-800"
          >
            মোবাইল নম্বর
          </label>
          <Input
            id="order-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="numeric"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? "order-phone-hint order-lookup-error" : "order-phone-hint"
            }
            className={fieldClass}
          />
          <p
            id="order-phone-hint"
            className="mt-2 text-xs leading-relaxed text-neutral-500"
          >
            যে নম্বর দিয়ে অর্ডার করেছেন, সেটাই দিন। ভুল ফোন দিলে অর্ডার খুলবে
            না।
          </p>
          <button
            type="submit"
            disabled={pending}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80 disabled:opacity-60"
          >
            {pending ? "দেখা হচ্ছে…" : "স্ট্যাটাস দেখুন"}
          </button>
        </form>

        {error ? (
          <p
            id="order-lookup-error"
            role="alert"
            className="mt-4 rounded-2xl bg-white px-4 py-4 text-sm leading-relaxed text-neutral-800 ring-1 ring-neutral-200/90"
          >
            {error}
          </p>
        ) : null}

        {result ? (
          <OrderCard
            order={result}
            cardRef={resultRef}
            pending={pending}
            onRefresh={() => void runLookup(result.number, phone)}
          />
        ) : null}
      </div>
    </Container>
  );
}

function OrderCard({
  order,
  cardRef,
  pending,
  onRefresh,
}: {
  order: PublicOrder;
  cardRef: RefObject<HTMLElement | null>;
  pending: boolean;
  onRefresh: () => void;
}) {
  const closed = CLOSED[order.status];
  const rank = FLOW.findIndex((step) => step.id === order.status);
  const firstName = order.customerName.trim().split(/\s+/)[0] ?? "";

  return (
    <section
      ref={cardRef}
      aria-live="polite"
      className="order-found mt-4 rounded-[24px] bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5"
    >
      <style>{`
        .order-found { animation: order-found 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes order-found {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .order-found { animation: none; }
        }
      `}</style>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-neutral-500">
            {formatWhen(order.createdAt)}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">
            {firstName ? `${firstName}, আপনার অর্ডার` : "আপনার অর্ডার"}
          </h2>
          <p className="mt-1 font-mono text-sm font-semibold tracking-[0.08em] text-neutral-950">
            {order.number}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {closed?.title ?? FLOW[rank]?.label ?? order.status}
        </span>
      </div>

      {closed ? (
        <p className="mt-4 rounded-2xl bg-[#f5f6f8] px-3.5 py-3 text-sm leading-relaxed text-neutral-700">
          {closed.body}
        </p>
      ) : (
        <ol className="mt-5">
          {FLOW.map((step, index) => {
            const finished = order.status === "delivered";
            const done = finished || rank > index;
            const now = !finished && rank === index;
            return (
              <li key={step.id} className="grid grid-cols-[1.35rem_1fr] gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
                      done || now
                        ? "bg-primary text-on-primary"
                        : "bg-neutral-100 text-neutral-400",
                    )}
                  >
                    {done ? (
                      <MaterialIcon name="check" className="text-[13px]" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  {index < FLOW.length - 1 ? (
                    <span
                      className={cn(
                        "my-1 w-px flex-1",
                        done ? "bg-primary" : "bg-neutral-200",
                      )}
                      style={{ minHeight: 22 }}
                    />
                  ) : null}
                </div>
                <div className={cn(index < FLOW.length - 1 ? "pb-3" : "")}>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      now || done ? "text-neutral-950" : "text-neutral-400",
                    )}
                  >
                    {step.label}
                  </p>
                  {now || (finished && index === FLOW.length - 1) ? (
                    <p className="text-xs text-neutral-500">{step.hint}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {order.courierName || order.trackingNumber ? (
        <div className="mt-4 rounded-2xl bg-primary/10 px-3.5 py-3 text-sm">
          <p className="text-xs font-medium text-primary">কুরিয়ার</p>
          {order.courierName ? (
            <p className="mt-1 font-medium text-neutral-950">
              {order.courierName}
            </p>
          ) : null}
          {order.trackingNumber ? (
            <p className="mt-0.5 font-mono text-neutral-800">
              {order.trackingNumber}
            </p>
          ) : null}
        </div>
      ) : null}

      <ul className="mt-4 flex flex-col gap-3 border-t border-neutral-100 pt-4">
        {order.items.map((item) => (
          <li
            key={`${item.slug}-${item.title}`}
            className="flex items-center gap-3"
          >
            {item.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageSrc}
                alt=""
                className="size-12 shrink-0 rounded-xl bg-[#f5f6f8] object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <Link
                href={productPath({ id: item.productId, slug: item.slug })}
                className="line-clamp-2 text-sm font-medium text-neutral-950"
              >
                {item.title}
              </Link>
              <p className="text-xs text-neutral-500">× {item.quantity}</p>
              {item.selection.length > 0 ? (
                <p className="text-xs text-primary">
                  {item.selection
                    .map((choice) => `${choice.name}: ${choice.label}`)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums text-neutral-950">
              {formatCartMoney(item.lineTotal)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-1.5 border-t border-neutral-100 pt-4 text-sm">
        <Row label="পণ্য" value={formatCartMoney(order.subtotal)} />
        <Row label="ডেলিভারি" value={formatCartMoney(order.shipping)} />
        <div className="flex items-center justify-between pt-1">
          <dt className="font-semibold text-neutral-950">
            মোট · ক্যাশ অন ডেলিভারি
          </dt>
          <dd className="text-base font-semibold text-primary">
            {formatCartMoney(order.total)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 rounded-2xl bg-[#f5f6f8] px-3.5 py-3 text-sm leading-relaxed text-neutral-700">
        <p className="font-medium text-neutral-950">
          {ZONE_LABEL[order.deliveryZone]} · {maskPhone(order.phone)}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          href={supportHref(order.number)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary/80"
        >
          হোয়াটসঅ্যাপে জানান
        </a>
        <button
          type="button"
          onClick={onRefresh}
          disabled={pending}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-950 hover:border-primary/40 disabled:opacity-60"
        >
          {pending ? "দেখা হচ্ছে…" : "আপডেট দেখুন"}
        </button>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-neutral-600">
      <dt>{label}</dt>
      <dd className="tabular-nums text-neutral-950">{value}</dd>
    </div>
  );
}
