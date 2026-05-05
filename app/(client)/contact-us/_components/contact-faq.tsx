"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import { contactCopy } from "../../_data/contact/contact";

export function ContactFaq({ className }: { className?: string }) {
  const { faq } = contactCopy;
  const defaultOpen = faq.items[0]?.id ? [faq.items[0].id] : [];

  return (
    <section className={cn("bg-surface-container py-xl", className)}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-lg text-center">
          <h2 className="font-headline-md text-primary">{faq.title}</h2>
          <p className="mt-xs text-outline">{faq.subtitle}</p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion
            defaultValue={defaultOpen}
            className="flex flex-col gap-sm"
          >
            {faq.items.map((it) => (
              <AccordionItem
                key={it.id}
                value={it.id}
                className="overflow-hidden rounded-xl border border-border/70 bg-surface-container-lowest px-0"
              >
                <div className="px-md">
                  <AccordionTrigger className="py-md no-underline hover:no-underline">
                    <span className="font-headline-sm text-on-surface">{it.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-md text-body-md text-on-surface-variant">
                    {it.answer}
                  </AccordionContent>
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

