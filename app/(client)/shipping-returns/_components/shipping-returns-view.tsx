"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { isExternalHref } from "@/lib/mart-mock/about-sections";
import { useShippingSections } from "@/lib/mart-mock/hooks";
import type {
  PaymentBlock,
  RefundBlock,
  ReturnsBlock,
  ShippingBlock,
  ShippingFaqContent,
  ShippingHeroContent,
  ShippingSupportContent,
} from "@/lib/mart-mock/shipping-sections";
import type { StoreDeliveryRates } from "@/lib/mart-api/catalog";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "../../_components/common/brand-icons";
import { Container } from "../../_components/common/container";
import { JsonLd } from "../../_components/common/json-ld";
import { MaterialIcon } from "../../_components/common/material-icon";

export function ShippingReturnsView({ rates }: { rates: StoreDeliveryRates }) {
  const sections = useShippingSections();
  const links = [
    {
      id: "shipping",
      label: sections.shipping.navLabel,
      icon: sections.shipping.icon,
      active: isContentActive(sections.shipping),
    },
    {
      id: "payment",
      label: sections.payment.navLabel,
      icon: sections.payment.icon,
      active: isContentActive(sections.payment),
    },
    {
      id: "returns",
      label: sections.returns.navLabel,
      icon: sections.returns.icon,
      active: isContentActive(sections.returns),
    },
    {
      id: "refund",
      label: sections.refund.navLabel,
      icon: sections.refund.icon,
      active: isContentActive(sections.refund),
    },
    {
      id: "support",
      label: sections.support.navLabel,
      icon: sections.support.icon,
      active: isContentActive(sections.support),
    },
  ].filter((item) => item.active);
  const visibleKey = links.map((item) => item.id).join(",");
  const [tracked, setTracked] = useState("shipping");
  const activeId = links.some((item) => item.id === tracked)
    ? tracked
    : (links[0]?.id ?? "");
  const questions = sections.faq.items.filter(isContentActive);
  const showContents = isContentActive(sections.contents) && links.length > 0;

  useEffect(() => {
    const elements = visibleKey
      .split(",")
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setTracked(visible.target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [visibleKey]);

  const faqJsonLd = questions.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;

  return (
    <>
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
      {isContentActive(sections.hero) ? <Hero hero={sections.hero} /> : null}

      <section className="w-full bg-[#f5f6f8] py-6 sm:py-8">
        <Container className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            {showContents ? (
              <aside className="min-w-0 lg:col-span-3">
                <div className="lg:hidden">
                  {sections.contents.title.trim() ? (
                    <p className="mb-2.5 text-sm font-semibold text-neutral-950">
                      {sections.contents.title}
                    </p>
                  ) : null}
                  <div
                    className={cn(
                      "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1",
                      "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                    )}
                  >
                    {links.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                          activeId === item.id
                            ? "border-primary bg-primary text-on-primary"
                            : "border-neutral-200/90 bg-white text-neutral-600 hover:border-primary/40 hover:text-neutral-950",
                        )}
                      >
                        <MaterialIcon
                          name={item.icon || "info"}
                          className="text-[16px]"
                        />
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="sticky top-28 hidden overflow-hidden rounded-2xl border border-neutral-200/90 bg-white lg:block">
                  <div className="border-b border-neutral-200 px-4 py-3.5">
                    {sections.contents.title.trim() ? (
                      <h2 className="text-base font-semibold text-neutral-950">
                        {sections.contents.title}
                      </h2>
                    ) : null}
                    {sections.contents.subtitle.trim() ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        {sections.contents.subtitle}
                      </p>
                    ) : null}
                  </div>
                  <nav
                    className="flex flex-col gap-1 p-2.5"
                    aria-label={sections.contents.navLabel || "শিপিং সেকশন"}
                  >
                    {links.map((item) => {
                      const active = activeId === item.id;
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                            active
                              ? "bg-primary/10 font-semibold text-primary"
                              : "font-medium text-neutral-600 hover:bg-[#f5f6f8] hover:text-neutral-950",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-full",
                              active
                                ? "bg-primary/15 text-primary"
                                : "bg-[#f5f6f8] text-neutral-500",
                            )}
                          >
                            <MaterialIcon
                              name={item.icon || "info"}
                              className="text-[18px]"
                            />
                          </span>
                          <span className="min-w-0 leading-snug">
                            {item.label}
                          </span>
                        </a>
                      );
                    })}
                  </nav>
                </div>
              </aside>
            ) : null}

            <div
              className={cn(
                "min-w-0 space-y-8 sm:space-y-10",
                showContents ? "lg:col-span-9" : "lg:col-span-12",
              )}
            >
              <DeliveryRatesCard rates={rates} />
              {isContentActive(sections.shipping) ? (
                <ShippingSection block={sections.shipping} />
              ) : null}
              {isContentActive(sections.payment) ? (
                <PaymentSection block={sections.payment} />
              ) : null}
              {isContentActive(sections.returns) ? (
                <ReturnsSection block={sections.returns} />
              ) : null}
              {isContentActive(sections.refund) ? (
                <RefundSection block={sections.refund} />
              ) : null}
              {isContentActive(sections.support) ? (
                <SupportSection support={sections.support} />
              ) : null}
              {isContentActive(sections.faq) ? (
                <FaqSection faq={sections.faq} />
              ) : null}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function Hero({ hero }: { hero: ShippingHeroContent }) {
  return (
    <section className="w-full bg-[#f5f6f8] pb-5 sm:pb-6">
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl px-4 py-8 text-center sm:px-8 sm:py-10",
            "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(43,192,181,0.22),transparent_55%)]"
          />
          <div className="relative z-10 mx-auto max-w-lg">
            {hero.eyebrow.trim() ? (
              <p className="mb-1.5 text-[11px] font-medium tracking-wide text-primary sm:text-xs">
                {hero.eyebrow}
              </p>
            ) : null}
            {hero.title.trim() ? (
              <h1 className="mb-3 text-[1.35rem] leading-[1.2] font-bold tracking-tight text-white sm:mb-4 sm:text-3xl lg:text-[2.15rem]">
                {hero.title}
              </h1>
            ) : null}
            {hero.subtitle.trim() ? (
              <p className="text-sm leading-relaxed text-white/70 sm:text-base">
                {hero.subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

function DeliveryRatesCard({ rates }: { rates: StoreDeliveryRates }) {
  const rows = [
    { label: "ঢাকার ভেতরে", value: rates.insideDhaka },
    { label: "ঢাকার শহরতলি", value: rates.dhakaSuburban },
    { label: "ঢাকার বাইরে", value: rates.outsideDhaka },
  ];
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold text-neutral-950 sm:text-base">
        ডেলিভারি চার্জ
      </h2>
      <ul className="space-y-2.5">
        {rows.map((item) => (
          <li
            key={item.label}
            className="flex flex-col gap-1 rounded-xl bg-[#f5f6f8] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
          >
            <span className="text-sm font-medium text-neutral-950">
              {item.label}
            </span>
            <span className="w-fit rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
              ৳{item.value.toLocaleString("en-US")}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-neutral-500">
        চেকআউটে এলাকা বেছে নিলে এই চার্জ যোগ হয়। ঢাকা শহরের চেয়ে শহরতলিতে একটু বেশি। ক্যাশ অন ডেলিভারি।
      </p>
    </section>
  );
}

function ShippingSection({ block }: { block: ShippingBlock }) {
  const cards = block.cards.filter(isContentActive);
  const timelines = block.timelines.filter(isContentActive);
  const notes = block.notes.filter(isContentActive);
  const showTimes = Boolean(
    block.timelinesTitle.trim() || timelines.length || notes.length,
  );

  return (
    <section id="shipping" className="scroll-mt-28">
      <SectionHeading
        icon={block.icon || "local_shipping"}
        title={block.heading}
      />
      {block.intro.trim() ? (
        <p className="mb-5 text-sm leading-relaxed text-neutral-600">
          {block.intro}
        </p>
      ) : null}
      {cards.length ? (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className={cn(
                "rounded-2xl bg-white p-4 ring-1 sm:p-5",
                card.variant === "primary"
                  ? "ring-primary/30"
                  : "ring-neutral-200/90",
              )}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MaterialIcon
                    name={card.icon || "info"}
                    className="text-[20px]"
                  />
                </span>
                {card.eyebrow.trim() ? (
                  <span className="text-[11px] font-semibold text-primary">
                    {card.eyebrow}
                  </span>
                ) : null}
              </div>
              {card.title.trim() ? (
                <h3 className="mb-1.5 text-base font-semibold text-neutral-950 sm:text-lg">
                  {card.title}
                </h3>
              ) : null}
              {card.body.trim() ? (
                <p className="text-sm leading-relaxed text-neutral-600">
                  {card.body}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {showTimes ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
          {block.timelinesTitle.trim() ? (
            <h3 className="mb-4 text-sm font-semibold text-neutral-950 sm:text-base">
              {block.timelinesTitle}
            </h3>
          ) : null}
          {timelines.length ? (
            <ul className="space-y-2.5">
              {timelines.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 rounded-xl bg-[#f5f6f8] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <span className="text-sm font-medium text-neutral-950">
                    {item.label}
                  </span>
                  <span className="w-fit rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {notes.length ? (
            <div
              className={cn(
                "space-y-3",
                timelines.length || block.timelinesTitle.trim() ? "mt-4" : "",
              )}
            >
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="flex gap-3 rounded-2xl border-l-4 border-primary bg-[#f5f6f8] p-3.5"
                >
                  <MaterialIcon
                    name={note.icon || "info"}
                    filled
                    className="mt-0.5 shrink-0 text-[20px] text-primary"
                  />
                  <div className="min-w-0">
                    {note.title.trim() ? (
                      <p className="text-sm font-semibold text-neutral-950">
                        {note.title}
                      </p>
                    ) : null}
                    {note.body.trim() ? (
                      <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">
                        {note.body}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function PaymentSection({ block }: { block: PaymentBlock }) {
  const cards = block.cards.filter(isContentActive);
  return (
    <section id="payment" className="scroll-mt-28">
      <SectionHeading icon={block.icon || "payments"} title={block.heading} />
      {block.intro.trim() ? (
        <p className="mb-5 text-sm leading-relaxed text-neutral-600">
          {block.intro}
        </p>
      ) : null}
      {cards.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MaterialIcon
                    name={card.icon || "payments"}
                    className="text-[22px]"
                  />
                </span>
                {card.badge.trim() ? (
                  <span className="rounded-full bg-[#f5f6f8] px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                    {card.badge}
                  </span>
                ) : null}
              </div>
              {card.title.trim() ? (
                <h3 className="mb-1.5 text-base font-semibold text-neutral-950 sm:text-lg">
                  {card.title}
                </h3>
              ) : null}
              {card.body.trim() ? (
                <p className="mb-3 text-sm leading-relaxed text-neutral-600">
                  {card.body}
                </p>
              ) : null}
              {card.footnote.trim() ? (
                <p className="text-xs font-semibold text-primary">
                  {card.footnote}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ReturnsSection({ block }: { block: ReturnsBlock }) {
  const rules = block.rules.filter(isContentActive);
  const special = block.special.filter(isContentActive);
  const showEligibility = Boolean(
    block.eligibilityTitle.trim() ||
    block.eligibilityBody.trim() ||
    rules.length,
  );
  return (
    <section id="returns" className="scroll-mt-28">
      <SectionHeading
        icon={block.icon || "assignment_return"}
        title={block.heading}
      />
      {showEligibility ? (
        <div className="mb-5 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
          {block.eligibilityTitle.trim() ? (
            <h3 className="mb-2 text-lg font-semibold text-neutral-950 sm:text-xl">
              {block.eligibilityTitle}
            </h3>
          ) : null}
          {block.eligibilityBody.trim() ? (
            <p className="mb-4 text-sm leading-relaxed text-neutral-600">
              {block.eligibilityBody}
            </p>
          ) : null}
          {rules.length ? (
            <ul className="space-y-2.5">
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-start gap-2.5 text-sm text-neutral-950"
                >
                  <MaterialIcon
                    name="check_circle"
                    filled
                    className="mt-0.5 shrink-0 text-[18px] text-primary"
                  />
                  <span className="leading-snug">{rule.text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {special.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {special.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90"
            >
              <div className="mb-2 flex items-center gap-2 text-primary">
                <MaterialIcon
                  name={note.icon || "info"}
                  className="text-[20px]"
                />
                {note.title.trim() ? (
                  <span className="text-sm font-semibold text-neutral-950">
                    {note.title}
                  </span>
                ) : null}
              </div>
              {note.body.trim() ? (
                <p className="text-sm leading-relaxed text-neutral-600">
                  {note.body}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function RefundSection({ block }: { block: RefundBlock }) {
  const steps = block.steps.filter(isContentActive);
  return (
    <section id="refund" className="scroll-mt-28">
      <SectionHeading
        icon={block.icon || "receipt_long"}
        title={block.heading}
      />
      {steps.length ? (
        <ol className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90"
            >
              <span className="mb-3 flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {index + 1}
              </span>
              {step.title.trim() ? (
                <h3 className="mb-1 text-sm font-semibold text-neutral-950 sm:text-base">
                  {step.title}
                </h3>
              ) : null}
              {step.body.trim() ? (
                <p className="text-sm leading-relaxed text-neutral-600">
                  {step.body}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
      {block.note.trim() ? (
        <p className="rounded-2xl border-l-4 border-primary bg-white px-4 py-3 text-sm leading-relaxed text-neutral-600">
          {block.note}
        </p>
      ) : null}
    </section>
  );
}

function SupportSection({ support }: { support: ShippingSupportContent }) {
  const showPrimary = Boolean(support.primaryLabel.trim());
  const showSecondary = Boolean(support.secondaryLabel.trim());
  const whatsapp = /wa\.me|whatsapp/i.test(support.secondaryHref);
  return (
    <section id="support" className="scroll-mt-28">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl px-4 py-7 sm:px-7 sm:py-8",
          "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(43,192,181,0.22),transparent_55%)]"
        />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            {support.title.trim() ? (
              <h2 className="mb-1.5 text-lg font-semibold text-white sm:text-xl">
                {support.title}
              </h2>
            ) : null}
            {support.subtitle.trim() ? (
              <p className="text-sm leading-relaxed text-white/70">
                {support.subtitle}
              </p>
            ) : null}
            {support.email.trim() || support.phone.trim() ? (
              <div className="mt-3 flex flex-col gap-1 text-xs text-white/55 sm:text-sm">
                {support.email.trim() ? (
                  <a
                    href={`mailto:${support.email.trim()}`}
                    className="hover:text-white"
                  >
                    {support.email}
                  </a>
                ) : null}
                {support.phone.trim() ? (
                  <a
                    href={`tel:${support.phone.replace(/\s|-/g, "")}`}
                    className="hover:text-white"
                  >
                    {support.phone}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
          {showPrimary || showSecondary ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
              {showPrimary ? (
                <SupportButton
                  label={support.primaryLabel}
                  href={support.primaryHref}
                  filled
                />
              ) : null}
              {showSecondary ? (
                <SupportButton
                  label={support.secondaryLabel}
                  href={support.secondaryHref}
                  icon={whatsapp}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SupportButton({
  label,
  href,
  filled,
  icon,
}: {
  label: string;
  href: string;
  filled?: boolean;
  icon?: boolean;
}) {
  const className = filled
    ? "inline-flex h-10 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80"
    : "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-white/20 text-sm font-semibold text-white transition-colors hover:bg-white/10";
  const content = (
    <>
      {icon ? <WhatsAppIcon className="size-4" /> : null}
      {label}
    </>
  );
  if (!href.trim()) return <span className={className}>{content}</span>;
  if (
    isExternalHref(href) ||
    href.startsWith("tel:") ||
    href.startsWith("mailto:")
  ) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function FaqSection({ faq }: { faq: ShippingFaqContent }) {
  const items = faq.items.filter(isContentActive);
  const before = faq.moreBefore.trim();
  const link = faq.moreLinkLabel.trim();
  const after = faq.moreAfter.trim();
  const more = [before, link, after].filter(Boolean).join(" ");
  return (
    <section>
      {faq.title.trim() && items.length ? (
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
          {faq.title}
        </h3>
      ) : null}
      {items.length ? (
        <Accordion
          defaultValue={[items[0]?.id ?? ""]}
          className="flex flex-col gap-3"
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
                  <span className="min-w-0 pt-1 leading-snug sm:pt-0">
                    {item.question}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 sm:px-5">
                <p className="border-t border-neutral-200 pt-3 pl-12 text-sm leading-relaxed text-neutral-600 sm:pl-13">
                  {item.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : null}
      {more ? (
        <p className="mt-5 text-center text-sm text-neutral-600">
          {before}
          {before && link ? " " : null}
          {link ? (
            faq.moreHref.trim() ? (
              isExternalHref(faq.moreHref) ? (
                <a
                  href={faq.moreHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  {link}
                </a>
              ) : (
                <Link
                  href={faq.moreHref}
                  className="font-semibold text-primary hover:underline"
                >
                  {link}
                </Link>
              )
            ) : (
              <span className="font-semibold text-primary">{link}</span>
            )
          ) : null}
          {(before || link) && after ? " " : null}
          {after}
        </p>
      ) : null}
    </section>
  );
}

function SectionHeading({ icon, title }: { icon: string; title: string }) {
  if (!title.trim()) return null;
  return (
    <h2 className="mb-4 flex items-center gap-2.5 border-b border-neutral-200 pb-3 text-xl font-semibold tracking-tight text-neutral-950 sm:mb-5 sm:text-[1.35rem]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MaterialIcon name={icon} className="text-[20px]" />
      </span>
      {title}
    </h2>
  );
}
