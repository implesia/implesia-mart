"use client";

import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { faqsCopy } from "../../_data/faqs/faqs";

export function FaqsContent({ className }: { className?: string }) {
  const { content } = faqsCopy;
  const defaultOpen = content.items
    .filter((i) => i.defaultOpen)
    .map((i) => i.id);

  return (
    <section className={cn("flex-1 max-w-4xl", className)}>
      <div className="mb-lg">
        <h2 className="mb-xs font-headline-md text-primary">{content.title}</h2>
        <p className="font-body-md text-on-surface-variant">
          {content.subtitle}
        </p>
      </div>

      <div className="mb-xl rounded-r-xl border-l-4 border-primary bg-secondary-container/30 p-md md:p-lg">
        <div className="flex items-start gap-sm">
          <MaterialIcon name="info" className="text-primary" filled />
          <div>
            <h4 className="mb-xs font-label-md text-primary uppercase">
              {content.callout.eyebrow}
            </h4>
            <p className="font-body-md text-on-surface">
              {content.callout.body}
            </p>
          </div>
        </div>
      </div>

      <Accordion defaultValue={defaultOpen} className="flex flex-col gap-sm">
        {content.items.map((it) => (
          <AccordionItem
            key={it.id}
            value={it.id}
            className="group overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
          >
            <div className="px-md md:px-lg">
              <AccordionTrigger className="py-md no-underline hover:no-underline">
                <span className="font-headline-sm text-on-surface transition-colors group-hover:text-primary">
                  {it.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-md text-body-md leading-relaxed text-on-surface-variant">
                {it.answer}
              </AccordionContent>
            </div>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-xl border-t border-outline-variant/30 pt-xl">
        <div className="relative overflow-hidden rounded-2xl bg-primary p-lg md:p-xl text-on-primary md:flex md:items-center md:justify-between md:gap-lg">
          <div className="relative z-10 text-center md:text-left">
            <h3 className="mb-xs font-headline-md">{content.helpCta.title}</h3>
            <p className="max-w-md font-body-md opacity-80">
              {content.helpCta.subtitle}
            </p>
          </div>

          <div className="relative z-10 mt-lg flex w-full flex-col gap-sm md:mt-0 md:w-auto">
            <Link href="/contact-us">
              <Button className="h-12 w-full rounded-full bg-white px-lg font-label-md text-primary uppercase tracking-widest hover:bg-surface-container-high md:w-auto">
                {content.helpCta.button}
              </Button>
            </Link>
            <div className="flex flex-col gap-xs text-center opacity-80 md:text-right">
              <span className="font-label-sm">{content.helpCta.email}</span>
              <span className="font-label-sm">{content.helpCta.phone}</span>
            </div>
          </div>

          <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-primary-container opacity-20 blur-3xl" />
        </div>
      </div>
    </section>
  );
}
