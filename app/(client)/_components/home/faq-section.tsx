"use client";

import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";
import { faqSections } from "../../_data/home/home";

const categoryIcons: Record<string, string> = {
  "অর্ডার ট্র্যাকিং": "package_2",
  "পেমেন্ট ও ক্যাশ অন ডেলিভারি": "payments",
  "রিটার্ন ও রিপ্লেসমেন্ট": "assignment_return",
  "কাস্টমার সাপোর্ট": "support_agent",
  "প্রোডাক্ট কোয়ালিটি": "verified",
  "ডেলিভারি সময়": "schedule",
};

export function FaqSection() {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16 lg:py-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-background dark:bg-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(43,192,181,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(61,212,200,0.07),transparent_55%)]"
      />

      <Container className="relative px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center sm:mb-10 lg:mb-12">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-warm-gold/30 bg-warm-gold/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-warm-gold">
              <MaterialIcon name="help" className="text-[16px]" />
              জিজ্ঞাসা ও উত্তর
            </span>
            <h2 className="mb-3 font-display-lg text-[1.65rem] leading-tight text-primary sm:text-[2.1rem] lg:text-[2.35rem]">
              প্রায়শই জিজ্ঞাসিত প্রশ্ন
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
              অর্ডার, পেমেন্ট, ডেলিভারি ও রিটার্ন নিয়ে সাধারণ প্রশ্নের দ্রুত
              উত্তর।
            </p>
          </div>

          <Accordion
            defaultValue={["faq-0"]}
            className="flex flex-col gap-3 sm:gap-3.5"
          >
            {faqSections.map((block, index) => {
              const icon =
                categoryIcons[block.category] ?? "help_outline";

              return (
                <AccordionItem
                  key={block.category}
                  value={`faq-${index}`}
                  className={cn(
                    "overflow-hidden rounded-2xl border-0",
                    "bg-surface-container-lowest dark:bg-surface-container",
                    "ring-1 ring-outline-variant/40 dark:ring-white/8",
                    "shadow-[0_6px_20px_rgba(15,40,38,0.04)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)]",
                    "transition-[box-shadow,ring-color] duration-200",
                    "has-[[aria-expanded=true]]:ring-primary/30 has-[[aria-expanded=true]]:shadow-[0_10px_28px_rgba(43,192,181,0.12)]",
                    "dark:has-[[aria-expanded=true]]:ring-primary/25",
                  )}
                >
                  <AccordionTrigger
                    className={cn(
                      "gap-3 px-4 py-4 hover:no-underline sm:gap-4 sm:px-5 sm:py-5",
                      "text-left font-label-md text-[0.95rem] leading-snug text-on-surface sm:text-base",
                      "**:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-primary",
                    )}
                  >
                    <span className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-3.5">
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/14 sm:mt-0 sm:size-10">
                        <MaterialIcon name={icon} className="text-[20px] sm:text-[22px]" />
                      </span>
                      <span className="min-w-0 pt-1 sm:pt-0">{block.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 sm:px-5 sm:pb-5">
                    <div className="border-t border-outline-variant/30 pt-3 pl-12 text-sm leading-relaxed text-on-surface-variant dark:border-white/8 sm:pl-13 sm:text-[0.95rem] sm:leading-relaxed">
                      {block.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <div className="mt-8 flex justify-center sm:mt-10">
            <Link
              href="/faqs"
              className={cn(
                "group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold",
                "text-primary ring-1 ring-primary/25 transition-colors",
                "hover:bg-primary/8 hover:ring-primary/40 dark:hover:bg-primary/12",
              )}
            >
              আরও প্রশ্ন দেখুন
              <MaterialIcon
                name="arrow_forward"
                className="text-[18px] transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
