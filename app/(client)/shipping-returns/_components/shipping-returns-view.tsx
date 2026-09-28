"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "../../_components/common/brand-icons";
import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { WHATSAPP_HREF } from "../../_data/contact/contact";
import { shippingReturnsCopy } from "../../_data/shipping/shipping-returns";

const SECTION_IDS = ["shipping", "payment", "returns", "refund", "support"] as const;

export function ShippingReturnsView() {
  const copy = shippingReturnsCopy;
  const [activeId, setActiveId] = useState<string>("shipping");

  useEffect(() => {
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      Boolean,
    ) as HTMLElement[];

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
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
              <p className="mb-1.5 text-[11px] font-medium tracking-wide text-primary sm:text-xs">
                {copy.hero.eyebrow}
              </p>
              <h1 className="mb-3 text-[1.35rem] leading-[1.2] font-bold tracking-tight text-white sm:mb-4 sm:text-3xl lg:text-[2.15rem]">
                {copy.hero.title}
              </h1>
              <p className="text-sm leading-relaxed text-white/70 sm:text-base">
                {copy.hero.subtitle}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="w-full bg-[#f5f6f8] py-6 sm:py-8">
        <Container className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <aside className="min-w-0 lg:col-span-3">
              <div className="lg:hidden">
                <p className="mb-2.5 text-sm font-semibold text-neutral-950">{copy.nav.title}</p>
                <div
                  className={cn(
                    "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1",
                    "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                  )}
                >
                  {copy.nav.items.map((item) => {
                    const active = activeId === item.id;
                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                          active
                            ? "border-primary bg-primary text-on-primary"
                            : "border-neutral-200/90 bg-white text-neutral-600 hover:border-primary/40 hover:text-neutral-950",
                        )}
                      >
                        <MaterialIcon name={item.icon} className="text-[16px]" />
                        {item.label}
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="sticky top-28 hidden overflow-hidden rounded-2xl border border-neutral-200/90 bg-white lg:block">
                <div className="border-b border-neutral-200 px-4 py-3.5">
                  <h2 className="text-base font-semibold text-neutral-950">{copy.nav.title}</h2>
                  <p className="mt-1 text-xs text-neutral-500">{copy.nav.subtitle}</p>
                </div>
                <nav className="flex flex-col gap-1 p-2.5" aria-label="শিপিং সেকশন">
                  {copy.nav.items.map((item) => {
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
                            active ? "bg-primary/15 text-primary" : "bg-[#f5f6f8] text-neutral-500",
                          )}
                        >
                          <MaterialIcon name={item.icon} className="text-[18px]" />
                        </span>
                        <span className="min-w-0 leading-snug">{item.label}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>

            <div className="min-w-0 space-y-8 sm:space-y-10 lg:col-span-9">
              <section id="shipping" className="scroll-mt-28">
                <SectionHeading icon="local_shipping" title={copy.shipping.heading} />
                <p className="mb-5 text-sm leading-relaxed text-neutral-600">{copy.shipping.intro}</p>

                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  {copy.shipping.cards.map((card) => (
                    <div
                      key={card.title}
                      className={cn(
                        "rounded-2xl bg-white p-4 ring-1 sm:p-5",
                        card.variant === "primary"
                          ? "ring-primary/30"
                          : "ring-neutral-200/90",
                      )}
                    >
                      <div className="mb-3 flex items-center gap-2.5">
                        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <MaterialIcon name={card.icon} className="text-[20px]" />
                        </span>
                        <span className="text-[11px] font-semibold text-primary">
                          {card.eyebrow}
                        </span>
                      </div>
                      <h3 className="mb-1.5 text-base font-semibold text-neutral-950 sm:text-lg">
                        {card.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-neutral-600">{card.body}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
                  <h3 className="mb-4 text-sm font-semibold text-neutral-950 sm:text-base">
                    {copy.shipping.timelinesTitle}
                  </h3>
                  <ul className="space-y-2.5">
                    {copy.shipping.timelines.map((t) => (
                      <li
                        key={t.label}
                        className="flex flex-col gap-1 rounded-xl bg-[#f5f6f8] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                      >
                        <span className="text-sm font-medium text-neutral-950">{t.label}</span>
                        <span className="w-fit rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
                          {t.value}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 space-y-3">
                    {copy.shipping.notes.map((note) => (
                      <div
                        key={note.title}
                        className="flex gap-3 rounded-2xl border-l-4 border-primary bg-[#f5f6f8] p-3.5"
                      >
                        <MaterialIcon
                          name={note.icon}
                          filled
                          className="mt-0.5 shrink-0 text-[20px] text-primary"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-950">{note.title}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">
                            {note.body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section id="payment" className="scroll-mt-28">
                <SectionHeading icon="payments" title={copy.payment.heading} />
                <p className="mb-5 text-sm leading-relaxed text-neutral-600">{copy.payment.intro}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  {copy.payment.cards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <MaterialIcon name={card.icon} className="text-[22px]" />
                        </span>
                        <span className="rounded-full bg-[#f5f6f8] px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                          {card.badge}
                        </span>
                      </div>
                      <h3 className="mb-1.5 text-base font-semibold text-neutral-950 sm:text-lg">
                        {card.title}
                      </h3>
                      <p className="mb-3 text-sm leading-relaxed text-neutral-600">{card.body}</p>
                      {card.footnote ? (
                        <p className="text-xs font-semibold text-primary">{card.footnote}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>

              <section id="returns" className="scroll-mt-28">
                <SectionHeading icon="assignment_return" title={copy.returns.heading} />

                <div className="mb-5 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
                  <h3 className="mb-2 text-lg font-semibold text-neutral-950 sm:text-xl">
                    {copy.returns.eligibilityTitle}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-neutral-600">
                    {copy.returns.eligibilityBody}
                  </p>
                  <ul className="space-y-2.5">
                    {copy.returns.rules.map((rule) => (
                      <li key={rule} className="flex items-start gap-2.5 text-sm text-neutral-950">
                        <MaterialIcon
                          name="check_circle"
                          filled
                          className="mt-0.5 shrink-0 text-[18px] text-primary"
                        />
                        <span className="leading-snug">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  {copy.returns.special.map((note) => (
                    <div
                      key={note.title}
                      className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90"
                    >
                      <div className="mb-2 flex items-center gap-2 text-primary">
                        <MaterialIcon name={note.icon} className="text-[20px]" />
                        <span className="text-sm font-semibold text-neutral-950">{note.title}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-neutral-600">{note.body}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="refund" className="scroll-mt-28">
                <SectionHeading icon="receipt_long" title={copy.refund.heading} />
                <ol className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  {copy.refund.steps.map((step, index) => (
                    <li
                      key={step.title}
                      className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90"
                    >
                      <span className="mb-3 flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                      <h3 className="mb-1 text-sm font-semibold text-neutral-950 sm:text-base">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-neutral-600">{step.body}</p>
                    </li>
                  ))}
                </ol>
                <p className="rounded-2xl border-l-4 border-primary bg-white px-4 py-3 text-sm leading-relaxed text-neutral-600">
                  {copy.refund.note}
                </p>
              </section>

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
                      <h2 className="mb-1.5 text-lg font-semibold text-white sm:text-xl">
                        {copy.support.title}
                      </h2>
                      <p className="text-sm leading-relaxed text-white/70">{copy.support.subtitle}</p>
                      <div className="mt-3 flex flex-col gap-1 text-xs text-white/55 sm:text-sm">
                        <a
                          href={`mailto:${copy.support.email}`}
                          className="hover:text-white"
                        >
                          {copy.support.email}
                        </a>
                        <a
                          href={`tel:${copy.support.phone.replace(/\s|-/g, "")}`}
                          className="hover:text-white"
                        >
                          {copy.support.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
                      <Link
                        href="/contact-us"
                        className="inline-flex h-10 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80"
                      >
                        {copy.support.cta}
                      </Link>
                      <a
                        href={WHATSAPP_HREF}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-white/20 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                      >
                        <WhatsAppIcon className="size-4" />
                        {copy.support.whatsapp}
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
                  {copy.miniFaq.title}
                </h3>
                <Accordion
                  defaultValue={[copy.miniFaq.items[0]?.id ?? ""]}
                  className="flex flex-col gap-3"
                >
                  {copy.miniFaq.items.map((item) => (
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
                          <span className="min-w-0 pt-1 leading-snug sm:pt-0">{item.q}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 sm:px-5">
                        <p className="border-t border-neutral-200 pt-3 pl-12 text-sm leading-relaxed text-neutral-600 sm:pl-13">
                          {item.a}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <p className="mt-5 text-center text-sm text-neutral-600">
                  আরও প্রশ্ন থাকলে{" "}
                  <Link href="/faqs" className="font-semibold text-primary hover:underline">
                    প্রশ্নোত্তর পেজ
                  </Link>{" "}
                  দেখুন।
                </p>
              </section>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function SectionHeading({ icon, title }: { icon: string; title: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 border-b border-neutral-200 pb-3 text-xl font-semibold tracking-tight text-neutral-950 sm:mb-5 sm:text-[1.35rem]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MaterialIcon name={icon} className="text-[20px]" />
      </span>
      {title}
    </h2>
  );
}
