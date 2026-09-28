"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "../../_components/common/brand-icons";
import { Container } from "../../_components/common/container";
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
              <p className="mt-4 text-xs text-white/50">সর্বশেষ আপডেট: {copy.lastUpdated}</p>
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
                <nav className="flex flex-col gap-1 p-2.5" aria-label="গোপনীয়তা সেকশন">
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
              <section id="introduction" className="scroll-mt-28">
                <SectionHeading icon="info" title={copy.introduction.heading} />
                <div className="space-y-4">
                  {copy.introduction.paragraphs.map((p) => (
                    <p key={p} className="text-sm leading-relaxed text-neutral-600">
                      {p}
                    </p>
                  ))}
                </div>
              </section>

              <section id="collection" className="scroll-mt-28">
                <SectionHeading icon="database" title={copy.collection.heading} />
                <p className="mb-5 text-sm leading-relaxed text-neutral-600">{copy.collection.intro}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  {copy.collection.cards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5"
                    >
                      <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MaterialIcon name={card.icon} className="text-[22px]" />
                      </span>
                      <h3 className="mb-1.5 text-base font-semibold text-neutral-950">{card.title}</h3>
                      <p className="text-sm leading-relaxed text-neutral-600">{card.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="usage" className="scroll-mt-28">
                <SectionHeading icon="query_stats" title={copy.usage.heading} />
                <p className="mb-5 text-sm leading-relaxed text-neutral-600">{copy.usage.intro}</p>
                <ul className="mb-5 space-y-2.5">
                  {copy.usage.items.map((item) => (
                    <li
                      key={item.title}
                      className="flex items-start gap-2.5 rounded-2xl bg-white px-3.5 py-3.5 ring-1 ring-neutral-200/90 sm:px-4"
                    >
                      <MaterialIcon
                        name="check_circle"
                        filled
                        className="mt-0.5 shrink-0 text-[18px] text-primary"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="rounded-2xl border-l-4 border-primary bg-white p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MaterialIcon name="verified_user" filled className="text-[22px]" />
                    </span>
                    <h3 className="text-lg font-semibold text-neutral-950">
                      {copy.usage.protection.title}
                    </h3>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-neutral-600">
                    {copy.usage.protection.body}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {copy.usage.protection.badges.map((badge) => (
                      <span
                        key={badge.label}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f6f8] px-3 py-1.5 text-xs font-semibold text-neutral-950"
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
                <p className="mb-4 text-sm leading-relaxed text-neutral-600">{copy.sharing.body}</p>
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
                <p className="mb-5 text-sm leading-relaxed text-neutral-600">{copy.rights.intro}</p>
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  {copy.rights.items.map((right) => (
                    <div
                      key={right.title}
                      className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5"
                    >
                      <div className="mb-2 flex items-center gap-2.5">
                        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <MaterialIcon name={right.icon} className="text-[20px]" />
                        </span>
                        <h3 className="text-sm font-semibold text-neutral-950 sm:text-base">
                          {right.title}
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed text-neutral-600">{right.description}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90">
                    <h4 className="mb-1.5 text-sm font-semibold text-neutral-950">
                      {copy.rights.retention.title}
                    </h4>
                    <p className="text-sm leading-relaxed text-neutral-600">
                      {copy.rights.retention.body}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90">
                    <h4 className="mb-1.5 text-sm font-semibold text-neutral-950">
                      {copy.rights.updates.title}
                    </h4>
                    <p className="text-sm leading-relaxed text-neutral-600">{copy.rights.updates.body}</p>
                  </div>
                </div>
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
                        <a href={`mailto:${copy.support.email}`} className="hover:text-white">
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
