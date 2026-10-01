"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isExternalHref } from "@/lib/mart-mock/about-sections";
import { usePrivacySections } from "@/lib/mart-mock/hooks";
import type {
  PrivacyCollection,
  PrivacyHeroContent,
  PrivacyIntroduction,
  PrivacyRights,
  PrivacySharing,
  PrivacySupportContent,
  PrivacyUsage,
} from "@/lib/mart-mock/privacy-sections";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "../../_components/common/brand-icons";
import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function PrivacyPolicyView() {
  const sections = usePrivacySections();
  const links = [
    {
      id: "introduction",
      label: sections.introduction.navLabel,
      icon: sections.introduction.icon,
      active: isContentActive(sections.introduction),
    },
    {
      id: "collection",
      label: sections.collection.navLabel,
      icon: sections.collection.icon,
      active: isContentActive(sections.collection),
    },
    {
      id: "usage",
      label: sections.usage.navLabel,
      icon: sections.usage.icon,
      active: isContentActive(sections.usage),
    },
    {
      id: "sharing",
      label: sections.sharing.navLabel,
      icon: sections.sharing.icon,
      active: isContentActive(sections.sharing),
    },
    {
      id: "rights",
      label: sections.rights.navLabel,
      icon: sections.rights.icon,
      active: isContentActive(sections.rights),
    },
    {
      id: "support",
      label: sections.support.navLabel,
      icon: sections.support.icon,
      active: isContentActive(sections.support),
    },
  ].filter((item) => item.active);
  const visibleKey = links.map((item) => item.id).join(",");
  const [tracked, setTracked] = useState("introduction");
  const activeId = links.some((item) => item.id === tracked)
    ? tracked
    : (links[0]?.id ?? "");
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

  return (
    <>
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
                    aria-label={sections.contents.navLabel || "গোপনীয়তা সেকশন"}
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
              {isContentActive(sections.introduction) ? (
                <Introduction block={sections.introduction} />
              ) : null}
              {isContentActive(sections.collection) ? (
                <Collection block={sections.collection} />
              ) : null}
              {isContentActive(sections.usage) ? (
                <Usage block={sections.usage} />
              ) : null}
              {isContentActive(sections.sharing) ? (
                <Sharing block={sections.sharing} />
              ) : null}
              {isContentActive(sections.rights) ? (
                <Rights block={sections.rights} />
              ) : null}
              {isContentActive(sections.support) ? (
                <Support support={sections.support} />
              ) : null}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function Hero({ hero }: { hero: PrivacyHeroContent }) {
  const updated = [hero.updatedLabel.trim(), hero.lastUpdated.trim()]
    .filter(Boolean)
    .join(" ");
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
            {hero.lastUpdated.trim() ? (
              <p className="mt-4 text-xs text-white/50">{updated}</p>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Introduction({ block }: { block: PrivacyIntroduction }) {
  const paragraphs = block.paragraphs.filter(isContentActive);
  return (
    <section id="introduction" className="scroll-mt-28">
      <SectionHeading icon={block.icon || "info"} title={block.heading} />
      {paragraphs.length ? (
        <div className="space-y-4">
          {paragraphs.map((item) => (
            <p
              key={item.id}
              className="text-sm leading-relaxed text-neutral-600"
            >
              {item.text}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Collection({ block }: { block: PrivacyCollection }) {
  const cards = block.cards.filter(isContentActive);
  return (
    <section id="collection" className="scroll-mt-28">
      <SectionHeading icon={block.icon || "database"} title={block.heading} />
      {block.intro.trim() ? (
        <p className="mb-5 text-sm leading-relaxed text-neutral-600">
          {block.intro}
        </p>
      ) : null}
      {cards.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5"
            >
              <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MaterialIcon
                  name={card.icon || "info"}
                  className="text-[22px]"
                />
              </span>
              {card.title.trim() ? (
                <h3 className="mb-1.5 text-base font-semibold text-neutral-950">
                  {card.title}
                </h3>
              ) : null}
              {card.description.trim() ? (
                <p className="text-sm leading-relaxed text-neutral-600">
                  {card.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Usage({ block }: { block: PrivacyUsage }) {
  const items = block.items.filter(isContentActive);
  const badges = block.protection.badges.filter(isContentActive);
  const showProtection =
    isContentActive(block.protection) &&
    Boolean(
      block.protection.title.trim() ||
      block.protection.body.trim() ||
      badges.length,
    );
  return (
    <section id="usage" className="scroll-mt-28">
      <SectionHeading
        icon={block.icon || "query_stats"}
        title={block.heading}
      />
      {block.intro.trim() ? (
        <p className="mb-5 text-sm leading-relaxed text-neutral-600">
          {block.intro}
        </p>
      ) : null}
      {items.length ? (
        <ul className="mb-5 space-y-2.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2.5 rounded-2xl bg-white px-3.5 py-3.5 ring-1 ring-neutral-200/90 sm:px-4"
            >
              <MaterialIcon
                name="check_circle"
                filled
                className="mt-0.5 shrink-0 text-[18px] text-primary"
              />
              <div className="min-w-0">
                {item.title.trim() ? (
                  <p className="text-sm font-semibold text-neutral-950">
                    {item.title}
                  </p>
                ) : null}
                {item.description.trim() ? (
                  <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {showProtection ? (
        <div className="rounded-2xl border-l-4 border-primary bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MaterialIcon
                name={block.protection.icon || "verified_user"}
                filled
                className="text-[22px]"
              />
            </span>
            {block.protection.title.trim() ? (
              <h3 className="text-lg font-semibold text-neutral-950">
                {block.protection.title}
              </h3>
            ) : null}
          </div>
          {block.protection.body.trim() ? (
            <p className="mb-4 text-sm leading-relaxed text-neutral-600">
              {block.protection.body}
            </p>
          ) : null}
          {badges.length ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f6f8] px-3 py-1.5 text-xs font-semibold text-neutral-950"
                >
                  <MaterialIcon
                    name={badge.icon || "lock"}
                    className="text-[14px] text-primary"
                  />
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Sharing({ block }: { block: PrivacySharing }) {
  const chips = block.chips.filter(isContentActive);
  return (
    <section id="sharing" className="scroll-mt-28">
      <SectionHeading icon={block.icon || "share"} title={block.heading} />
      {block.body.trim() ? (
        <p className="mb-4 text-sm leading-relaxed text-neutral-600">
          {block.body}
        </p>
      ) : null}
      {chips.length ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip.id}
              className="rounded-full bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary sm:text-sm"
            >
              {chip.label}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Rights({ block }: { block: PrivacyRights }) {
  const items = block.items.filter(isContentActive);
  const notes = [block.retention, block.updates].filter(
    (note) => isContentActive(note) && (note.title.trim() || note.body.trim()),
  );
  return (
    <section id="rights" className="scroll-mt-28">
      <SectionHeading icon={block.icon || "gavel"} title={block.heading} />
      {block.intro.trim() ? (
        <p className="mb-5 text-sm leading-relaxed text-neutral-600">
          {block.intro}
        </p>
      ) : null}
      {items.length ? (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5"
            >
              <div className="mb-2 flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MaterialIcon
                    name={item.icon || "info"}
                    className="text-[20px]"
                  />
                </span>
                {item.title.trim() ? (
                  <h3 className="text-sm font-semibold text-neutral-950 sm:text-base">
                    {item.title}
                  </h3>
                ) : null}
              </div>
              {item.description.trim() ? (
                <p className="text-sm leading-relaxed text-neutral-600">
                  {item.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {notes.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {notes.map((note, index) => (
            <div
              key={`${note.title}-${index}`}
              className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90"
            >
              {note.title.trim() ? (
                <h4 className="mb-1.5 text-sm font-semibold text-neutral-950">
                  {note.title}
                </h4>
              ) : null}
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

function Support({ support }: { support: PrivacySupportContent }) {
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
