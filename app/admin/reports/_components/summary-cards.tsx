"use client";

import type { PeriodChange } from "@/lib/admin/reports";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
  CircleDollarSign,
  Percent,
  Package,
  CheckCircle2,
  RotateCcw,
  TrendingDown as ReturnRateIcon,
} from "lucide-react";

export type SummaryCardModel = {
  label: string;
  value: string;
  hint: string;
  change: PeriodChange;
};

// Map labels to beautiful, distinct icons and colors
const CARD_STYLES: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  "Net sales": { icon: Wallet, tone: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  Profit: { icon: CircleDollarSign, tone: "bg-indigo-50 text-indigo-600 ring-indigo-100" },
  Margin: { icon: Percent, tone: "bg-violet-50 text-violet-600 ring-violet-100" },
  "Units sold": { icon: Package, tone: "bg-sky-50 text-sky-600 ring-sky-100" },
  Delivered: { icon: CheckCircle2, tone: "bg-teal-50 text-teal-600 ring-teal-100" },
  Returned: { icon: RotateCcw, tone: "bg-amber-50 text-amber-600 ring-amber-100" },
  "Return rate": { icon: ReturnRateIcon, tone: "bg-rose-50 text-rose-600 ring-rose-100" },
};

const DEFAULT_STYLE = { icon: TrendingUp, tone: "bg-slate-100 text-slate-600 ring-slate-200" };

export function SummaryCards({ cards }: { cards: SummaryCardModel[] }) {
  return (
    <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const style = CARD_STYLES[card.label] ?? DEFAULT_STYLE;
        const Icon = style.icon;

        return (
          <article
            key={card.label}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-slate-300 hover:shadow-md"
          >
            {/* Subtle background glow on hover */}
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-slate-50 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

            <div className="relative">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {card.label}
                </h2>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-colors",
                    style.tone
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>

              <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                {card.value}
              </p>

              <div className="mt-1.5 flex items-center gap-2">
                <ChangeLine change={card.change} />
              </div>

              <p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-500">
                {card.hint}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function ChangeLine({ change }: { change: PeriodChange }) {
  const isUp = change.direction === "up";
  const isDown = change.direction === "down";
  const isFlat = !isUp && !isDown;

  const toneClass = isUp
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
    : isDown
      ? "bg-rose-50 text-rose-700 ring-rose-200/60"
      : "bg-slate-100 text-slate-600 ring-slate-200/60";

  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  const spoken =
    change.direction == null
      ? "No comparison. The previous period was zero or unavailable."
      : `${isUp ? "Up" : isDown ? "Down" : "No change"} ${change.text} versus the previous period`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset",
        toneClass
      )}
      aria-label={spoken}
    >
      <Icon className="h-3 w-3" />
      {change.text}
    </span>
  );
}

export function summaryCardsFrom(input: {
  netSales: string;
  profit: string;
  margin: string;
  units: string;
  delivered: string;
  returned: string;
  returnRate: string;
  changes: {
    netSales: PeriodChange;
    profit: PeriodChange;
    margin: PeriodChange;
    units: PeriodChange;
    delivered: PeriodChange;
    returned: PeriodChange;
    returnRate: PeriodChange;
  };
}): SummaryCardModel[] {
  return [
    { label: "Net sales", value: input.netSales, hint: "Delivered orders, including delivery", change: input.changes.netSales },
    { label: "Profit", value: input.profit, hint: "Known-cost lines only. Delivery is not included", change: input.changes.profit },
    { label: "Margin", value: input.margin, hint: "Profit divided by known-cost revenue", change: input.changes.margin },
    { label: "Units sold", value: input.units, hint: "Pieces on delivered orders", change: input.changes.units },
    { label: "Delivered", value: input.delivered, hint: "Counted on the delivered date", change: input.changes.delivered },
    { label: "Returned", value: input.returned, hint: "Counted on the returned date", change: input.changes.returned },
    { label: "Return rate", value: input.returnRate, hint: "Returned divided by delivered", change: input.changes.returnRate },
  ];
}