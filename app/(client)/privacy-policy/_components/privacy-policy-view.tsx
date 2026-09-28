"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "../../_components/common/brand-icons";
import { MaterialIcon } from "../../_components/common/material-icon";
import { WHATSAPP_HREF } from "../../_data/contact/contact";
import { privacyPolicyCopy } from "../../_data/privacy/privacy-policy";

const SECTION_IDS = [
  "introduction",
  "collection",
  "usage",
  "sharing",
  "rights",
  "support",
] as const;

export function PrivacyPolicyView() {
  const copy = privacyPolicyCopy;
  const [activeId, setActiveId] = useState<string>("introduction");

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
              <p className="mt-4 text-xs text-white/50">
                সর্বশেষ আপডেট: {copy.lastUpdated}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-8 sm:py-10 lg:py-14">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 sm:gap-8 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
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
              <nav className="flex flex-col gap-1 p-3" aria-label="গোপনীয়তা সেকশন">
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

          <div className="min-w-0 space-y-10 sm:space-y-12 lg:col-span-9 lg:space-y-14">
            <section id="introduction" className="scroll-mt-28">
              <SectionHeading icon="info" title={copy.introduction.heading} />
              <div className="space-y-4">
                {copy.introduction.paragraphs.map((p) => (
                  <p
                    key={p}
                    className="text-sm leading-relaxed text-on-surface-variant sm:text-base"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </section>

            <section id="collection" className="scroll-mt-28">
              <SectionHeading icon="database" title={copy.collection.heading} />
              <p className="mb-5 text-sm leading-relaxed text-on-surface-variant sm:mb-6 sm:text-base">
                {copy.collection.intro}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                {copy.collection.cards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 sm:rounded-2xl sm:p-5 dark:border-white/10 dark:bg-surface-container"
                  >
                    <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                      <MaterialIcon name={card.icon} className="text-[22px]" />
                    </span>
                    <h3 className="mb-1.5 text-base font-semibold text-on-surface">
                      {card.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-on-surface-variant">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="usage" className="scroll-mt-28">
              <SectionHeading icon="query_stats" title={copy.usage.heading} />
              <p className="mb-5 text-sm leading-relaxed text-on-surface-variant sm:mb-6 sm:text-base">
                {copy.usage.intro}
              </p>
              <ul className="mb-5 space-y-2.5 sm:mb-6">
                {copy.usage.items.map((item) => (
                  <li
                    key={item.title}
                    className="flex items-start gap-2.5 rounded-xl border border-outline-variant/35 bg-surface-container-lowest px-3.5 py-3.5 sm:px-4 dark:border-white/10 dark:bg-surface-container"
                  >
                    <MaterialIcon
                      name="check_circle"
                      filled
                      className="mt-0.5 shrink-0 text-[18px] text-primary"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-on-surface-variant">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl border border-primary/25 bg-primary/8 p-4 sm:rounded-2xl sm:p-6 dark:bg-primary/12">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <MaterialIcon name="verified_user" filled className="text-[24px]" />
                  </span>
                  <h3 className="text-lg font-semibold text-on-surface sm:text-xl">
                    {copy.usage.protection.title}
                  </h3>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-on-surface-variant sm:text-base">
                  {copy.usage.protection.body}
                </p>
                <div className="flex flex-wrap gap-2">
                  {copy.usage.protection.badges.map((badge) => (
                    <span
                      key={badge.label}
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/80 px-3 py-1.5 text-xs font-semibold text-on-surface dark:bg-background/40"
                    >
                      <MaterialIcon name={badge.icon} className="text-[14px] text-primary" />
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section id="sharing" className="scroll-mt-28">
              <SectionHeading icon="share" title={copy.sharing.heading} />
              <p className="mb-4 text-sm leading-relaxed text-on-surface-variant sm:text-base">
                {copy.sharing.body}
              </p>
              <div className="flex flex-wrap gap-2">
                {copy.sharing.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary sm:text-sm"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </section>

            <section id="rights" className="scroll-mt-28">
              <SectionHeading icon="gavel" title={copy.rights.heading} />
              <p className="mb-5 text-sm leading-relaxed text-on-surface-variant sm:mb-6 sm:text-base">
                {copy.rights.intro}
              </p>
              <div className="mb-5 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4">
                {copy.rights.items.map((right) => (
                  <div
                    key={right.title}
                    className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 sm:rounded-2xl sm:p-5 dark:border-white/10 dark:bg-surface-container"
                  >
                    <div className="mb-2 flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                        <MaterialIcon name={right.icon} className="text-[20px]" />
                      </span>
                      <h3 className="text-sm font-semibold text-on-surface sm:text-base">
                        {right.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-on-surface-variant">
                      {right.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="rounded-xl bg-surface-container-low/90 p-4 dark:bg-background/35">
                  <h4 className="mb-1.5 text-sm font-semibold text-on-surface">
                    {copy.rights.retention.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {copy.rights.retention.body}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container-low/90 p-4 dark:bg-background/35">
                  <h4 className="mb-1.5 text-sm font-semibold text-on-surface">
                    {copy.rights.updates.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {copy.rights.updates.body}
                  </p>
                </div>
              </div>
            </section>

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
