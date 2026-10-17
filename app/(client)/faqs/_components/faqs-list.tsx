"use client";

import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/mart-api/faq-items";
import type { FaqListing } from "@/lib/mart-api/faq-listing";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

export function FaqsEmpty({ listing, className }: { listing: FaqListing | null; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-neutral-300 bg-white px-5 py-10 text-center",
        className,
      )}
    >
      <MaterialIcon name="search_off" className="mx-auto mb-3 text-[32px] text-neutral-400" />
      {listing?.isActive && listing.emptyTitle.trim() ? (
        <h3 className="mb-2 text-base font-semibold text-neutral-950">{listing.emptyTitle}</h3>
      ) : null}
      {listing?.isActive && listing.emptyBody.trim() ? (
        <p className="mx-auto max-w-md text-sm leading-relaxed text-neutral-600">
          {listing.emptyBody}
        </p>
      ) : null}
    </div>
  );
}

/** One accordion of questions; several can be open at once. */
export function FaqsList({
  items,
  listing,
  openFirst = true,
  className,
}: {
  items: FaqItem[];
  listing: FaqListing | null;
  openFirst?: boolean;
  className?: string;
}) {
  if (!items.length) return <FaqsEmpty listing={listing} className={className} />;

  const defaultOpen = openFirst && items[0] ? [items[0].id] : [];

  return (
    <Accordion
      key={items.map((item) => item.id).join("-")}
      multiple
      defaultValue={defaultOpen}
      className={cn("flex flex-col gap-3", className)}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          id={`faq-${item.id}`}
          className="scroll-mt-28 overflow-hidden rounded-2xl border-0 bg-white ring-1 ring-neutral-200/90 transition-shadow has-[[aria-expanded=true]]:shadow-[0_12px_32px_-20px_rgba(15,23,42,0.35)] has-[[aria-expanded=true]]:ring-primary/40"
        >
          <AccordionTrigger
            className={cn(
              "min-h-14 gap-3 px-4 py-4 hover:no-underline sm:gap-4 sm:px-5",
              "text-left text-[15px] font-semibold text-neutral-950",
              "focus-visible:ring-primary/40",
              "**:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-primary-ink",
            )}
          >
            <span className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <span
                aria-hidden
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-ink sm:mt-0"
              >
                <MaterialIcon name="help_outline" className="text-[18px]" />
              </span>
              <span className="min-w-0 pt-1 leading-snug sm:pt-0">{item.question}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 sm:px-5">
            <div className="border-t border-neutral-200 pt-3 text-[15px] leading-relaxed text-neutral-700 sm:pl-12">
              <p className="whitespace-pre-line">{item.answer}</p>
              {item.link?.href && item.link.label ? (
                <Link
                  href={item.link.href}
                  className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-full font-semibold text-primary-ink no-underline! hover:underline! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-ink"
                >
                  {item.link.label}
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </Link>
              ) : null}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
