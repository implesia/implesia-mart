"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { contactCopy } from "../../_data/contact/contact";

export function ContactFaq({ className }: { className?: string }) {
  const { faq } = contactCopy;
  const defaultOpen = faq.items[0]?.id ? [faq.items[0].id] : [];

  return (
    <section className={cn("w-full py-10 sm:py-14 lg:py-xl", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <h2 className="mb-3 text-2xl leading-tight font-semibold text-primary sm:text-3xl">
            {faq.title}
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant sm:text-base">
            {faq.subtitle}
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion defaultValue={defaultOpen} className="flex flex-col gap-3">
            {faq.items.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className={cn(
                  "overflow-hidden rounded-2xl border-0",
                  "bg-surface-container-lowest dark:bg-surface-container",
                  "ring-1 ring-outline-variant/40 dark:ring-white/8",
                  "has-[[aria-expanded=true]]:ring-primary/30 dark:has-[[aria-expanded=true]]:ring-primary/25",
                )}
              >
                <AccordionTrigger
                  className={cn(
                    "gap-3 px-4 py-4 hover:no-underline sm:gap-4 sm:px-5 sm:py-5",
                    "text-left text-[0.95rem] font-medium text-on-surface sm:text-base",
                    "**:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-primary",
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:mt-0 dark:bg-primary/14">
                      <MaterialIcon name="help_outline" className="text-[20px]" />
                    </span>
                    <span className="min-w-0 pt-1 sm:pt-0">{item.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 sm:px-5 sm:pb-5">
                  <div className="border-t border-outline-variant/30 pt-3 pl-12 text-sm leading-relaxed text-on-surface-variant dark:border-white/8 sm:pl-13 sm:text-[0.95rem]">
                    {item.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
}
