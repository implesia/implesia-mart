"use client";

import Link from "next/link";

import type { TrustBenefit } from "@/lib/mart-api/trust";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

// Literal class names so Tailwind keeps them. Three items (the seed) keep the original layout.
const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
};
const MANY_COLUMNS = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";

export function HomeTrustStrip({ items }: { items: TrustBenefit[] }) {
  if (items.length === 0) return null;

  return (
    <section
      className="bg-[#f5f6f8] pb-6 sm:pb-8"
      aria-label="স্টোর প্রতিশ্রুতি"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <ul
          className={`grid ${COLUMNS[items.length] ?? MANY_COLUMNS} divide-x divide-neutral-200 border-y border-neutral-200`}
        >
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href || "/shipping-returns"}
                className="flex h-full flex-col items-center justify-center gap-1 px-1.5 py-3 text-center text-[11px] leading-tight font-medium text-neutral-800 transition-colors hover:text-neutral-950 sm:flex-row sm:gap-2.5 sm:px-3 sm:py-4 sm:text-left sm:text-sm sm:leading-normal"
              >
                <MaterialIcon name={item.icon} className="text-[18px] text-primary sm:text-[20px]" />
                <span className="min-w-0">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
