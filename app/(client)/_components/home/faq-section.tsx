import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqPublic, FaqPublicItem } from "@/lib/mart-api/faq";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

const categoryIcons: Record<string, string> = {
  "অর্ডার ট্র্যাকিং": "package_2",
  "পেমেন্ট ও ক্যাশ অন ডেলিভারি": "payments",
  "রিটার্ন ও রিপ্লেসমেন্ট": "assignment_return",
  "কাস্টমার সাপোর্ট": "support_agent",
  "প্রোডাক্ট কোয়ালিটি": "verified",
  "ডেলিভারি সময়": "schedule",
};

function FaqColumn({
  items,
  idPrefix,
  defaultValue,
}: {
  items: FaqPublicItem[];
  idPrefix: string;
  defaultValue?: string;
}) {
  return (
    <Accordion
      defaultValue={defaultValue ? [defaultValue] : []}
      className="flex flex-col gap-3"
    >
      {items.map((block) => {
        const icon = categoryIcons[block.category] ?? "help_outline";
        const value = `${idPrefix}-${block.id}`;
        return (
          <AccordionItem
            key={value}
            value={value}
            className="border-b border-neutral-200"
          >
            <AccordionTrigger className="gap-3 py-4 text-left text-sm font-semibold leading-snug text-neutral-950 hover:no-underline sm:py-[1.125rem] sm:text-[15px] dark:text-white">
              <span className="flex size-9 shrink-0 items-center justify-center text-primary">
                <MaterialIcon name={icon} className="text-[18px]" />
              </span>
              <span className="min-w-0 flex-1">{block.question}</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-sm leading-relaxed text-neutral-600 sm:pb-5 sm:text-[15px] dark:text-white/70">
              <p className="pl-12">
                {block.answer}
              </p>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

export function FaqSection({ section }: { section: FaqPublic }) {
  if (section.items.length === 0) return null;
  const columns = [
    section.items.filter((_, index) => index % 2 === 0),
    section.items.filter((_, index) => index % 2 === 1),
  ];

  return (
    <section
      className="bg-[#f7f8f8] py-6 sm:py-8 dark:bg-background"
      aria-labelledby="home-faq-heading"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-neutral-500 uppercase dark:text-white/50">
            {section.kicker}
          </p>
          <h2
            id="home-faq-heading"
            className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl dark:text-white"
          >
            {section.title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-white/65">
            {section.subtitle}
          </p>
        </div>

        <div className="grid items-start gap-3 md:grid-cols-2 md:gap-4">
          {columns.map((items, index) => (
            <FaqColumn
              key={index === 0 ? "left" : "right"}
              items={items}
              idPrefix={index === 0 ? "left" : "right"}
              defaultValue={
                index === 0 && items[0] ? `left-${items[0].id}` : undefined
              }
            />
          ))}
        </div>

        <div className="mt-8">
          <Link
            href={section.moreHref || "/faqs"}
            className="inline-flex min-h-6 items-center gap-1.5 text-sm font-semibold text-neutral-950 transition-colors hover:text-neutral-600 dark:text-white dark:hover:text-white/70"
          >
            {section.moreLabel}
            <MaterialIcon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
