"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "../../_components/common/brand-icons";
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
      {/* Hero */}
      <section className="w-full pt-6 pb-6 sm:pt-8 sm:pb-8 lg:pt-10 lg:pb-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-2xl px-5 py-10 text-center sm:rounded-3xl sm:px-10 sm:py-12 md:px-14 md:py-14",
              "bg-[#062f2c] dark:bg-[#041f1d]",
              "ring-1 ring-black/10 dark:ring-primary/15",
              "shadow-[0_20px_50px_rgba(6,47,44,0.18)]",
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_10%_0%,rgba(43,192,181,0.3),transparent_50%),radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(245,179,1,0.14),transparent_45%)]"
            />
            <div className="relative z-10 mx-auto max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/90 backdrop-blur-sm">
                <span className="size-1.5 shrink-0 rounded-full bg-warm-gold" />
                {copy.hero.eyebrow}
              </span>
              <h1 className="mb-3 text-2xl leading-tight font-semibold text-white sm:text-3xl lg:text-4xl">
                {copy.hero.title}
              </h1>
              <p className="text-sm leading-relaxed text-white/70 sm:text-base">
                {copy.hero.subtitle}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="w-full py-8 sm:py-10 lg:py-14">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 sm:gap-8 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
          {/* Nav */}
          <aside className="min-w-0 lg:col-span-3">
            <div className="lg:hidden">
              <p className="mb-2.5 text-sm font-semibold text-on-surface">{copy.nav.title}</p>
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
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant",
                      )}
                    >
                      <MaterialIcon name={item.icon} className="text-[16px]" />
                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="sticky top-[7.25rem] sm:top-[8.75rem] lg:top-[10rem] hidden overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-lowest lg:block dark:border-white/10 dark:bg-surface-container">
              <div className="border-b border-outline-variant/30 bg-surface-container-low/80 px-5 py-5 dark:border-white/10">
                <h2 className="text-base font-semibold text-on-surface">{copy.nav.title}</h2>
                <p className="mt-1 text-xs text-outline">{copy.nav.subtitle}</p>
              </div>
              <nav className="flex flex-col gap-1 p-3" aria-label="শিপিং সেকশন">
                {copy.nav.items.map((item) => {
                  const active = activeId === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm transition-colors",
                        active
                          ? "bg-primary/10 font-semibold text-primary"
                          : "font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          active
                            ? "bg-primary/15 text-primary"
                            : "bg-surface-container text-outline",
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

          {/* Content */}
          <div className="min-w-0 space-y-10 sm:space-y-12 lg:col-span-9 lg:space-y-14">
            {/* Shipping */}
            <section id="shipping" className="scroll-mt-28">
              <SectionHeading icon="local_shipping" title={copy.shipping.heading} />
              <p className="mb-5 text-sm leading-relaxed text-on-surface-variant sm:mb-6 sm:text-base">
                {copy.shipping.intro}
              </p>

              <div className="mb-5 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4">
                {copy.shipping.cards.map((card) => (
                  <div
                    key={card.title}
                    className={cn(
                      "rounded-xl border p-4 sm:rounded-2xl sm:p-5",
                      card.variant === "primary"
                        ? "border-primary/25 bg-primary/8 dark:bg-primary/12"
                        : "border-outline-variant/35 bg-surface-container-lowest dark:border-white/10 dark:bg-surface-container",
                    )}
                  >
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                        <MaterialIcon name={card.icon} className="text-[20px]" />
                      </span>
                      <span className="text-[11px] font-semibold tracking-wide text-primary uppercase">
                        {card.eyebrow}
                      </span>
                    </div>
                    <h3 className="mb-1.5 text-base font-semibold text-on-surface sm:text-lg">
                      {card.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-on-surface-variant">{card.body}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 sm:rounded-2xl sm:p-5 dark:border-white/10 dark:bg-surface-container">
                <h3 className="mb-4 text-sm font-semibold text-on-surface sm:text-base">
                  {copy.shipping.timelinesTitle}
                </h3>
                <ul className="space-y-2.5">
                  {copy.shipping.timelines.map((t) => (
                    <li
                      key={t.label}
                      className="flex flex-col gap-1 rounded-xl bg-surface-container-low/90 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 dark:bg-background/35"
                    >
                      <span className="text-sm font-medium text-on-surface">{t.label}</span>
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
                      className="flex gap-3 rounded-xl border-l-4 border-primary bg-primary/5 p-3.5 dark:bg-primary/10"
                    >
                      <MaterialIcon
                        name={note.icon}
                        filled
                        className="mt-0.5 shrink-0 text-[20px] text-primary"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface">{note.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-on-surface-variant">
                          {note.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Payment */}
            <section id="payment" className="scroll-mt-28">
              <SectionHeading icon="payments" title={copy.payment.heading} />
              <p className="mb-5 text-sm leading-relaxed text-on-surface-variant sm:mb-6 sm:text-base">
                {copy.payment.intro}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {copy.payment.cards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 sm:rounded-2xl sm:p-5 dark:border-white/10 dark:bg-surface-container"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                        <MaterialIcon name={card.icon} className="text-[24px]" />
                      </span>
                      <span className="rounded-full bg-surface-container px-2.5 py-1 text-[10px] font-bold tracking-wide text-outline uppercase">
                        {card.badge}
                      </span>
                    </div>
                    <h3 className="mb-1.5 text-base font-semibold text-on-surface sm:text-lg">
                      {card.title}
                    </h3>
                    <p className="mb-3 text-sm leading-relaxed text-on-surface-variant">
                      {card.body}
                    </p>
                    {card.footnote ? (
                      <p className="text-xs font-semibold text-primary">{card.footnote}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            {/* Returns */}
            <section id="returns" className="scroll-mt-28">
              <SectionHeading icon="assignment_return" title={copy.returns.heading} />

              <div className="mb-5 rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 sm:mb-6 sm:rounded-2xl sm:p-6 dark:border-white/10 dark:bg-surface-container">
                <h3 className="mb-2 text-lg font-semibold text-on-surface sm:text-xl">
                  {copy.returns.eligibilityTitle}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-on-surface-variant sm:text-base">
                  {copy.returns.eligibilityBody}
                </p>
                <ul className="space-y-2.5">
                  {copy.returns.rules.map((rule) => (
                    <li key={rule} className="flex items-start gap-2.5 text-sm text-on-surface">
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
                    className="rounded-xl border border-outline-variant/35 bg-surface-container-low/80 p-4 dark:border-white/10 dark:bg-surface-container"
                  >
                    <div className="mb-2 flex items-center gap-2 text-primary">
                      <MaterialIcon name={note.icon} className="text-[20px]" />
                      <span className="text-sm font-semibold text-on-surface">{note.title}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-on-surface-variant">{note.body}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Refund */}
            <section id="refund" className="scroll-mt-28">
              <SectionHeading icon="receipt_long" title={copy.refund.heading} />
              <ol className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                {copy.refund.steps.map((step, index) => (
                  <li
                    key={step.title}
                    className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 sm:rounded-2xl dark:border-white/10 dark:bg-surface-container"
                  >
                    <span className="mb-3 flex size-8 items-center justify-center rounded-full bg-primary/12 text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <h3 className="mb-1 text-sm font-semibold text-on-surface sm:text-base">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-on-surface-variant">{step.body}</p>
                  </li>
                ))}
              </ol>
              <p className="rounded-xl bg-primary/5 px-4 py-3 text-sm leading-relaxed text-on-surface-variant dark:bg-primary/10">
                {copy.refund.note}
              </p>
            </section>

            {/* Support */}
            <section id="support" className="scroll-mt-28">
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl px-5 py-8 sm:rounded-3xl sm:px-8 sm:py-10",
                  "bg-[#062f2c] text-white ring-1 ring-black/10",
                )}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_0%,rgba(43,192,181,0.28),transparent_55%),radial-gradient(ellipse_40%_40%_at_0%_100%,rgba(245,179,1,0.12),transparent_50%)]"
                />
                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-lg text-center md:text-left">
                    <h2 className="mb-2 text-xl font-semibold sm:text-2xl">{copy.support.title}</h2>
                    <p className="text-sm leading-relaxed text-white/70 sm:text-base">
                      {copy.support.subtitle}
                    </p>
                    <div className="mt-4 flex flex-col items-center gap-2 text-sm text-white/75 md:items-start">
                      <a
                        href={`tel:${copy.support.phone.replace(/\s|-/g, "")}`}
                        className="inline-flex items-center gap-2 transition-colors hover:text-white"
                      >
                        <MaterialIcon name="call" className="text-[18px]" />
                        {copy.support.phone}
                      </a>
                      <a
                        href={`mailto:${copy.support.email}`}
                        className="inline-flex items-center gap-2 transition-colors hover:text-white"
                      >
                        <MaterialIcon name="mail" className="text-[18px]" />
                        {copy.support.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center md:w-auto md:flex-col">
                    <Link
                      href="/contact-us"
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "h-11 w-full rounded-full bg-white text-sm font-semibold text-[#062f2c] hover:bg-white/90 sm:h-12 md:min-w-[200px]",
                      )}
                    >
                      {copy.support.cta}
                    </Link>
                    <a
                      href={WHATSAPP_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ size: "lg", variant: "outline" }),
                        "h-11 w-full rounded-full border-white/25 bg-white/10 text-sm font-semibold text-white hover:bg-white/15 sm:h-12 md:min-w-[200px]",
                      )}
                    >
                      <WhatsAppIcon className="mr-2 size-4" />
                      {copy.support.whatsapp}
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Mini FAQ */}
            <section>
              <h3 className="mb-4 text-center text-lg font-semibold text-on-surface sm:mb-6 sm:text-xl">
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
                    className={cn(
                      "overflow-hidden rounded-xl border-0 sm:rounded-2xl",
                      "bg-surface-container-lowest dark:bg-surface-container",
                      "ring-1 ring-outline-variant/40 dark:ring-white/8",
                      "has-[[aria-expanded=true]]:ring-primary/30",
                    )}
                  >
                    <AccordionTrigger
                      className={cn(
                        "gap-3 px-3.5 py-3.5 hover:no-underline sm:px-5 sm:py-4",
                        "text-left text-sm font-medium text-on-surface sm:text-base",
                        "**:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-primary",
                      )}
                    >
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="px-3.5 pb-3.5 sm:px-5 sm:pb-5">
                      <p className="border-t border-outline-variant/30 pt-3 text-sm leading-relaxed text-on-surface-variant dark:border-white/8">
                        {item.a}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <p className="mt-5 text-center text-sm text-on-surface-variant">
                আরও প্রশ্ন থাকলে{" "}
                <Link href="/faqs" className="font-semibold text-primary hover:underline">
                  প্রশ্নোত্তর পেজ
                </Link>{" "}
                দেখুন।
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ icon, title }: { icon: string; title: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 border-b border-outline-variant/30 pb-3 text-xl font-semibold tracking-tight text-on-background sm:mb-5 sm:gap-3 sm:pb-4 sm:text-2xl">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-10">
        <MaterialIcon name={icon} className="text-[20px] sm:text-[22px]" />
      </span>
      {title}
    </h2>
  );
}
