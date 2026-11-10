"use client";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import type { PeriodChange } from "@/lib/admin/reports";
import { cn } from "@/lib/utils";

export type SummaryCardModel = {
  label: string;
  value: string;
  hint: string;
  change: PeriodChange;
};

export function SummaryCards({ cards }: { cards: SummaryCardModel[] }) {
  return (
    <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-2xl bg-white px-4 py-3.5 ring-1 ring-neutral-200/90">
          <h2 className="text-sm text-neutral-600">{card.label}</h2>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 tabular-nums">{card.value}</p>
          <ChangeLine change={card.change} />
          <p className="mt-1 text-xs leading-4 text-neutral-600">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}

export function ChangeLine({ change }: { change: PeriodChange }) {
  const tone =
    change.direction === "up"
      ? "text-success"
      : change.direction === "down"
        ? "text-error"
        : "text-neutral-600";
  const icon =
    change.direction === "down" ? "arrow_downward" : change.direction === "up" ? "arrow_upward" : "remove";
  const spoken =
    change.direction == null
      ? "No comparison. The previous period was zero or unavailable."
      : `${change.direction === "up" ? "Up" : change.direction === "down" ? "Down" : "No change"} ${change.text} versus the previous period`;
  return (
    <p className={cn("mt-1.5 flex items-center gap-1 text-xs font-medium", tone)}>
      <MaterialIcon name={icon} className="text-[14px]" />
      <span aria-label={spoken}>{change.text}</span>
    </p>
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
