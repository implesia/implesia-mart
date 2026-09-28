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
          "rounded-2xl border border-dashed border-neutral-300 bg-white px-5 py-10 text-center",
          className,
        )}
      >
        <MaterialIcon name="search_off" className="mx-auto mb-3 text-[32px] text-neutral-400" />
        <h3 className="mb-2 text-base font-semibold text-neutral-950">{faqsCopy.empty.title}</h3>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-neutral-600">
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
          className="overflow-hidden rounded-2xl border-0 bg-white ring-1 ring-neutral-200/90 has-[[aria-expanded=true]]:ring-primary/30"
        >
          <AccordionTrigger
            className={cn(
              "gap-3 px-4 py-4 hover:no-underline sm:gap-4 sm:px-5",
              "text-left text-sm font-medium text-neutral-950 sm:text-[15px]",
              "**:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-primary",
            )}
          >
            <span className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:mt-0">
                <MaterialIcon name="help_outline" className="text-[18px]" />
              </span>
              <span className="min-w-0 pt-1 leading-snug sm:pt-0">{item.question}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 sm:px-5">
            <div className="border-t border-neutral-200 pt-3 pl-12 text-sm leading-relaxed text-neutral-600 sm:pl-13">
              {item.answer}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
