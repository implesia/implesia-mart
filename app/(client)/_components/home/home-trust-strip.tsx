"use client";

import Link from "next/link";

import { useHomeSections } from "@/lib/mart-mock/hooks";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

export function HomeTrustStrip() {
  const { trust } = useHomeSections();
  if (trust.length === 0) return null;

  return (
    <section
      className="bg-[#f5f6f8] pb-6 sm:pb-8"
      aria-label="স্টোর প্রতিশ্রুতি"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-3 divide-x divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
          {trust.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href || "/shipping-returns"}
                className="flex h-full flex-col items-center justify-center gap-1 px-1.5 py-3 text-center text-[11px] leading-tight font-medium text-neutral-800 transition-colors hover:bg-neutral-50 hover:text-neutral-950 sm:flex-row sm:gap-2.5 sm:px-3 sm:py-4 sm:text-left sm:text-sm sm:leading-normal"
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
