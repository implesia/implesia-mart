"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { checkoutCopy } from "../../_data/checkout/checkout";
import { formatCartMoney } from "../../_lib/cart";
import { rememberOrder } from "../../_lib/saved-orders";

import { useCheckoutForm } from "./checkout-form-context";

const CONFETTI = [
  {
    x: "-92px",
    y: "-128px",
    r: "140deg",
    color: "#2bc0b5",
    delay: "0.12s",
    size: 8,
  },
  {
    x: "96px",
    y: "-118px",
    r: "-120deg",
    color: "#f2c14e",
    delay: "0.18s",
    size: 7,
  },
  {
    x: "-124px",
    y: "-36px",
    r: "80deg",
    color: "#f2a3b5",
    delay: "0.22s",
    size: 6,
  },
  {
    x: "128px",
    y: "-28px",
    r: "-70deg",
    color: "#111827",
    delay: "0.16s",
    size: 5,
  },
  {
    x: "-70px",
    y: "-150px",
    r: "200deg",
    color: "#8ed4c1",
    delay: "0.28s",
    size: 9,
  },
  {
    x: "72px",
    y: "-156px",
    r: "-190deg",
    color: "#2bc0b5",
    delay: "0.24s",
    size: 6,
  },
  {
    x: "-20px",
    y: "-168px",
    r: "40deg",
    color: "#f2c14e",
    delay: "0.2s",
    size: 5,
  },
  {
    x: "18px",
    y: "-146px",
    r: "-30deg",
    color: "#f2a3b5",
    delay: "0.32s",
    size: 7,
  },
  {
    x: "-148px",
    y: "-88px",
    r: "160deg",
    color: "#8ed4c1",
    delay: "0.3s",
    size: 5,
  },
  {
    x: "150px",
    y: "-84px",
    r: "-150deg",
    color: "#f2c14e",
    delay: "0.26s",
    size: 8,
  },
] as const;

const STEPS = [
  { icon: "inventory_2", label: "অর্ডার সেভ" },
  { icon: "call", label: "কনফার্ম কল" },
  { icon: "payments", label: "হাতে পেয়ে টাকা" },
] as const;

export function CheckoutSuccess() {
  const { orderNumber, shipping, quote } = useCheckoutForm();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const firstName = shipping.name.trim().split(/\s+/)[0] ?? "";
  const title = firstName ? `অভিনন্দন, ${firstName}!` : "অভিনন্দন!";
  const itemCount = quote?.itemCount ?? 0;
  const total = quote?.total ?? 0;

  useEffect(() => {
    if (orderNumber) {
      rememberOrder({
        number: orderNumber,
        phone: shipping.phone,
        name: shipping.name,
      });
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [orderNumber, shipping.name, shipping.phone]);

  async function copyNumber() {
    if (!orderNumber) return;
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="order-celebrate fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <style>{`
        .order-celebrate .order-shade { animation: order-shade 0.35s ease both; }
        .order-celebrate .order-card { animation: order-rise 0.62s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .order-celebrate .order-badge { animation: order-pop 0.55s 0.18s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .order-celebrate .order-ring { animation: order-ring 1.15s 0.2s ease-out both; }
        .order-celebrate .order-check {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: order-draw 0.45s 0.42s ease forwards;
        }
        .order-celebrate .order-bit {
          animation: order-burst 0.95s var(--delay) cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .order-celebrate .order-line { animation: order-rise 0.5s var(--delay) both; }
        @keyframes order-shade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes order-rise {
          from { opacity: 0; transform: translateY(28px) scale(0.96); }
          to { opacity: 1; transform: none; }
        }
        @keyframes order-pop {
          0% { opacity: 0; transform: scale(0.5); }
          70% { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes order-ring {
          0% { opacity: 0.7; transform: scale(0.7); }
          100% { opacity: 0; transform: scale(1.65); }
        }
        @keyframes order-draw { to { stroke-dashoffset: 0; } }
        @keyframes order-burst {
          0% { opacity: 0; transform: translate3d(0, 8px, 0) scale(0.4); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translate3d(var(--x), var(--y), 0) rotate(var(--r)) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .order-celebrate .order-shade,
          .order-celebrate .order-card,
          .order-celebrate .order-badge,
          .order-celebrate .order-ring,
          .order-celebrate .order-bit,
          .order-celebrate .order-line { animation: none; }
          .order-celebrate .order-check { stroke-dashoffset: 0; }
          .order-celebrate .order-bit { display: none; }
        }
      `}</style>
      <div className="order-shade absolute inset-0 bg-neutral-950/55 backdrop-blur-[3px]" />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="order-card relative flex max-h-[min(100%,760px)] w-full max-w-md flex-col overflow-y-auto rounded-t-[28px] bg-white px-5 pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center shadow-2xl sm:rounded-[28px] sm:px-8 sm:pb-8"
      >
        <div className="relative mx-auto mb-5 grid size-20 place-items-center">
          {CONFETTI.map((bit) => (
            <span
              key={`${bit.x}-${bit.y}`}
              aria-hidden
              className="order-bit absolute top-1/2 left-1/2 rounded-sm"
              style={{
                width: bit.size,
                height: bit.size * 1.6,
                background: bit.color,
                ["--x" as string]: bit.x,
                ["--y" as string]: bit.y,
                ["--r" as string]: bit.r,
                ["--delay" as string]: bit.delay,
              }}
            />
          ))}
          <span className="order-ring pointer-events-none absolute inset-0 rounded-full bg-primary/30" />
          <span className="order-badge relative grid size-16 place-items-center rounded-full bg-primary text-on-primary shadow-[0_10px_30px_rgba(43,192,181,0.35)]">
            <svg viewBox="0 0 52 52" className="size-9" aria-hidden>
              <path
                className="order-check"
                d="M14 27.5 22.2 35.5 38 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <p
          className="order-line text-[11px] font-semibold tracking-[0.16em] text-primary uppercase"
          style={{ ["--delay" as string]: "0.28s" }}
        >
          অর্ডার কনফার্ম
        </p>
        <h2
          id={titleId}
          className="order-line mt-1.5 text-[1.65rem] leading-tight font-semibold tracking-tight text-neutral-950"
          style={{ ["--delay" as string]: "0.34s" }}
        >
          {title}
        </h2>
        <p
          id={descriptionId}
          className="order-line mx-auto mt-2 max-w-sm text-sm leading-relaxed text-neutral-600"
          style={{ ["--delay" as string]: "0.4s" }}
        >
          {checkoutCopy.successBody}
        </p>

        {orderNumber ? (
          <div
            className="order-line mt-5 rounded-2xl bg-[#f5f6f8] px-4 py-3.5"
            style={{ ["--delay" as string]: "0.46s" }}
          >
            <p className="text-xs text-neutral-500">অর্ডার নম্বর</p>
            <p className="mt-1 font-mono text-xl font-semibold tracking-[0.08em] text-neutral-950">
              {orderNumber}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
              এই ব্রাউজারে সেভ হয়েছে। পরে আমার অর্ডার থেকে দেখা যাবে।
            </p>
            <button
              type="button"
              onClick={() => void copyNumber()}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary"
            >
              <MaterialIcon
                name={copied ? "check" : "content_copy"}
                className="text-[14px]"
              />
              {copied ? "কপি হয়েছে" : "নম্বর কপি করুন"}
            </button>
          </div>
        ) : null}

        <div
          className="order-line mt-3 grid grid-cols-3 gap-2"
          style={{ ["--delay" as string]: "0.52s" }}
        >
          <Fact
            icon="shopping_bag"
            label="পণ্য"
            value={itemCount > 0 ? String(itemCount) : "—"}
          />
          <Fact
            icon="payments"
            label="মোট"
            value={total > 0 ? formatCartMoney(total) : "—"}
          />
          <Fact icon="local_shipping" label="পেমেন্ট" value="COD" />
        </div>

        <ol
          className="order-line mt-4 grid grid-cols-3 gap-2 text-left"
          style={{ ["--delay" as string]: "0.58s" }}
        >
          {STEPS.map((step, index) => (
            <li
              key={step.label}
              className="rounded-xl bg-primary/10 px-2.5 py-2"
            >
              <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                <span className="grid size-4 place-items-center rounded-full bg-primary text-[10px] text-on-primary">
                  {index + 1}
                </span>
                <MaterialIcon name={step.icon} className="text-[14px]" />
              </span>
              <span className="mt-1 block text-[11px] leading-snug font-medium text-neutral-800">
                {step.label}
              </span>
            </li>
          ))}
        </ol>

        <div
          className="order-line mt-5 flex flex-col gap-2"
          style={{ ["--delay" as string]: "0.64s" }}
        >
          {orderNumber ? (
            <Link
              href={`/order-status?order=${encodeURIComponent(orderNumber)}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80"
            >
              {checkoutCopy.successTrack}
            </Link>
          ) : null}
          <div className="flex gap-2">
            <Link
              href="/products"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-950 transition-colors hover:border-primary/40"
            >
              {checkoutCopy.successShop}
            </Link>
            <Link
              href="/"
              className={cn(
                "inline-flex h-11 flex-1 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-950 transition-colors hover:border-primary/40",
              )}
            >
              {checkoutCopy.successHome}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl px-2 py-2 ring-1 ring-neutral-200/90">
      <MaterialIcon name={icon} className="mx-auto text-[16px] text-primary" />
      <p className="mt-1 text-[10px] text-neutral-500">{label}</p>
      <p className="text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  );
}
