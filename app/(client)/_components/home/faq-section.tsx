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
    <section className="py-10 sm:py-14 lg:py-xl">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center sm:mb-10">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-warm-gold/30 bg-warm-gold/10 px-3 py-1.5 text-xs font-semibold text-warm-gold">
              <MaterialIcon name="help" className="text-[16px]" />
              জিজ্ঞাসা ও উত্তর
            </span>
            <h2 className="mb-3 font-display-lg text-2xl leading-tight text-primary sm:text-3xl lg:text-4xl">
              প্রায়শই জিজ্ঞাসিত প্রশ্ন
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
              অর্ডার, পেমেন্ট, ডেলিভারি ও রিটার্ন নিয়ে সাধারণ প্রশ্নের দ্রুত
              উত্তর।
            </p>
          </div>

          <Accordion
            defaultValue={["faq-0"]}
            className="flex flex-col gap-3"
          >
            {faqSections.map((block, index) => {
              const icon = categoryIcons[block.category] ?? "help_outline";

              return (
                <AccordionItem
                  key={block.category}
                  value={`faq-${index}`}
                  className={cn(
                    "rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 dark:border-white/10 dark:bg-surface-container sm:px-5",
                  )}
                >
                  <AccordionTrigger className="gap-3 py-4 text-left text-sm font-semibold leading-snug text-on-surface hover:no-underline sm:py-5 sm:text-base">
                    <span className="mr-2 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-10">
                      <MaterialIcon name={icon} className="text-[20px]" />
                    </span>
                    <span className="min-w-0 flex-1">{block.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-relaxed text-on-surface-variant sm:pb-5 sm:text-[0.95rem]">
                    <p className="border-t border-outline-variant/30 pt-3 dark:border-white/10">
                      {block.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <div className="mt-8 flex justify-center">
            <Link
              href="/faqs"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary ring-1 ring-primary/25 transition-colors hover:bg-primary/8"
            >
              আরও প্রশ্ন দেখুন
              <MaterialIcon name="arrow_forward" className="text-[18px]" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
