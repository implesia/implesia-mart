import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Container } from "../common/container";
import { faqSections } from "../../_data/home/home";

export function FaqSection() {
  return (
    <section className="py-xl">
      <Container className="px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <span className="mb-4 block font-label-md tracking-[0.2em] text-warm-gold uppercase">
              জিজ্ঞাসা ও উত্তর
            </span>
            <h2 className="font-display-lg text-primary">প্রায়শই জিজ্ঞাসিত প্রশ্ন</h2>
          </div>
          <div className="space-y-6">
            {faqSections.map((block, index) => (
              <div
                key={block.category}
                className="border-b border-surface-container-highest pb-6"
              >
                {/* <h3 className="mb-4 font-label-md text-outline uppercase tracking-widest">
                  {block.category}
                </h3> */}
                <Accordion defaultValue={[]} className="w-full">
                  <AccordionItem value={`faq-${index}`} className="border-0">
                    <AccordionTrigger className="py-4 font-headline-sm text-on-surface hover:no-underline [&_svg]:text-primary">
                      {block.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 font-body-md leading-relaxed text-on-surface-variant">
                      {block.answer}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
