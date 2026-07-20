"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { FaqItem } from "../../_data/faqs/faqs";
import { faqsCopy } from "../../_data/faqs/faqs";

type FaqsListProps = {
  items: readonly FaqItem[] | FaqItem[];
  className?: string;
};

export function FaqsList({ items, className }: FaqsListProps) {
  if (!items.length) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-low px-5 py-10 text-center sm:px-8",
          className,
        )}
      >
        <MaterialIcon name="search_off" className="mx-auto mb-3 text-[36px] text-outline" />
        <h3 className="mb-2 text-base font-semibold text-on-surface">
          {faqsCopy.empty.title}
        </h3>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-on-surface-variant">
          {faqsCopy.empty.body}
        </p>
      </div>
    );
  }

  const defaultOpen = items[0] ? [items[0].id] : [];

  return (
    <Accordion
      key={items.map((i) => i.id).join("-")}
      defaultValue={defaultOpen}
      className={cn("flex flex-col gap-3", className)}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className={cn(
            "overflow-hidden rounded-xl border-0 sm:rounded-2xl",
            "bg-surface-container-lowest dark:bg-surface-container",
            "ring-1 ring-outline-variant/40 dark:ring-white/8",
            "has-[[aria-expanded=true]]:ring-primary/30 dark:has-[[aria-expanded=true]]:ring-primary/25",
          )}
        >
          <AccordionTrigger
            className={cn(
              "gap-3 px-3.5 py-3.5 hover:no-underline sm:gap-4 sm:px-5 sm:py-4",
              "text-left text-sm font-medium text-on-surface sm:text-base",
              "**:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:shrink-0 **:data-[slot=accordion-trigger-icon]:text-primary",
            )}
          >
            <span className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center sm:gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:mt-0 sm:size-9 sm:rounded-xl">
                <MaterialIcon name="help_outline" className="text-[18px] sm:text-[20px]" />
              </span>
              <span className="min-w-0 pt-0.5 leading-snug sm:pt-0">{item.question}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3.5 pb-3.5 sm:px-5 sm:pb-5">
            <div className="border-t border-outline-variant/30 pt-3 pl-0 text-sm leading-relaxed text-on-surface-variant sm:pl-12 dark:border-white/8 sm:text-[0.95rem]">
              {item.answer}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
