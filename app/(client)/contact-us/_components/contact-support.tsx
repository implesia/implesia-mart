"use client";

import Link from "next/link";

import { type ContactSupport } from "@/lib/mart-api/contact-support";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { iconBadge } from "../../about-us/_components/about-ui";
import { OpenBadge, useOpenStatus } from "./contact-open-badge";

/** Support hours (today highlighted, live badge only when the hours parse) plus quick links. */
export function ContactSupport({ support, className }: { support: ContactSupport | null; className?: string }) {
  const hours = support?.isActive ? support.hours.filter((h) => h.isActive && h.label.trim()) : [];
  const { status } = useOpenStatus(hours);
  if (!support?.isActive) return null;
  const quickLinks = support.quickLinks.filter((l) => l.isActive && l.label.trim());

  return (
    <aside aria-labelledby="contact-support-heading" className={cn("flex flex-col gap-5", className)}>
      <div className="rounded-3xl bg-white p-5 ring-1 ring-neutral-200/80 sm:p-6">
        <div className="flex items-start gap-3">
          <span className={iconBadge}>
            <MaterialIcon name="schedule" filled className="text-[22px]" />
          </span>
          <div className="min-w-0">
            <h2 id="contact-support-heading" className="text-lg leading-snug font-bold tracking-tight text-neutral-950 sm:text-xl">
              {support.title}
            </h2>
            {support.subtitle.trim() ? <p className="mt-1 text-sm leading-relaxed text-neutral-600">{support.subtitle}</p> : null}
          </div>
        </div>
        {hours.length ? (
          <>
            <OpenBadge rows={hours} className="mt-4" />
            <dl className="mt-4 divide-y divide-neutral-200 rounded-2xl border border-neutral-200">
              {hours.map((h, i) => {
                const today = status?.todayIndex === i;
                return (
                  <div
                    key={h.id}
                    className={cn("flex items-center justify-between gap-3 px-4 py-3 text-sm", today && "bg-primary/[0.07]")}
                  >
                    <dt className="font-semibold text-neutral-950">
                      {h.label}
                      {today ? (
                        <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary-ink">আজ</span>
                      ) : null}
                    </dt>
                    <dd className="text-right text-neutral-700">{h.value}</dd>
                  </div>
                );
              })}
            </dl>
          </>
        ) : null}
      </div>

      {quickLinks.length ? (
        <nav aria-label="দরকারি লিংক" className="rounded-3xl bg-white p-3 ring-1 ring-neutral-200/80 sm:p-4">
          <ul className="flex flex-col">
            {quickLinks.map((link) => {
              const content = (
                <>
                  <span className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-ink">
                      <MaterialIcon name={link.icon} className="text-[20px]" />
                    </span>
                    <span className="text-[15px] font-semibold text-neutral-950">{link.label}</span>
                  </span>
                  <MaterialIcon
                    name="arrow_forward"
                    className="text-[18px] text-neutral-400 transition-transform group-hover:text-primary-ink motion-safe:group-hover:translate-x-0.5"
                  />
                </>
              );
              const cls =
                "group flex min-h-12 items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-[#f5f6f8] focus-visible:outline-2 focus-visible:outline-primary-ink";
              const internal = link.href.startsWith("/") && !link.href.startsWith("//");
              return (
                <li key={link.id}>
                  {internal ? (
                    <Link href={link.href} className={cls}>{content}</Link>
                  ) : (
                    <a href={link.href} className={cls} {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {content}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </aside>
  );
}
