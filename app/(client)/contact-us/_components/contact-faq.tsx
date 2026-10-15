import Link from "next/link";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { type ContactFaq as Faq } from "@/lib/mart-api/contact-faq";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { AboutSection, SectionHeader } from "../../about-us/_components/about-ui";

/** FAQ teaser from the contact CMS, with a link to the full /faqs page. */
export function ContactFaq({ faq }: { faq: Faq | null }) {
  if (!faq?.isActive) return null;
  const items = faq.items.filter((item) => item.isActive && item.question.trim());
  if (!items.length) return null;

  return (
    <AboutSection tone="white" labelledBy="contact-faq-heading">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-14">
        <div>
          <SectionHeader id="contact-faq-heading" kicker="প্রশ্নোত্তর" title={faq.title} subtitle={faq.subtitle} />
          <Link
            href="/faqs"
            className="mt-6 inline-flex min-h-12 items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-5 text-[15px] font-semibold text-neutral-950 transition-colors hover:border-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-ink"
          >
            সব প্রশ্নোত্তর দেখুন
            <MaterialIcon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
        <Accordion defaultValue={[items[0].id]} className="flex flex-col gap-3">
          {items.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="overflow-hidden rounded-2xl border-0 bg-[#f5f6f8] ring-1 ring-neutral-200/90 transition-shadow has-[[aria-expanded=true]]:bg-white has-[[aria-expanded=true]]:shadow-md has-[[aria-expanded=true]]:ring-primary/30"
            >
              <AccordionTrigger
                className={cn(
                  "min-h-14 gap-3 px-4 py-4 hover:no-underline sm:px-5",
                  "text-left text-[15px] font-semibold text-neutral-950",
                  "**:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-primary-ink",
                )}
              >
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 sm:px-5">
                <p className="text-[15px] leading-[1.75] text-neutral-700">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </AboutSection>
  );
}
