import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { type ContactFaq as Faq } from "@/lib/mart-api/contact-faq";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function ContactFaq({
  faq,
  className,
}: {
  faq: Faq | null;
  className?: string;
}) {
  if (!faq?.isActive) return null;
  const items = faq.items.filter((item) => item.isActive);
  const defaultOpen = items[0]?.id ? [items[0].id] : [];

  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-6">
          <h2 className="mb-2 text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">
            {faq.title}
          </h2>
          {faq.subtitle.trim() ? (
            <p className="text-sm leading-relaxed text-neutral-600">{faq.subtitle}</p>
          ) : null}
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion defaultValue={defaultOpen} className="flex flex-col gap-3">
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
                    <span className="min-w-0 pt-1 sm:pt-0">{item.question}</span>
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
        </div>
      </Container>
    </section>
  );
}
