"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { privacyPolicyCopy } from "../../_data/privacy/privacy-policy";

export function PolicyContent({ className }: { className?: string }) {
  const s = privacyPolicyCopy.sections;

  return (
    <article
      className={cn(
        "md:col-span-9 space-y-xl rounded-xl border border-border/60 bg-card p-lg md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      <section id="introduction" className="scroll-mt-32">
        <h2 className="mb-md font-headline-md text-primary">{s.introduction.title}</h2>
        <div className="space-y-md text-body-md leading-relaxed text-on-surface-variant">
          {s.introduction.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>

      <section id="collection" className="scroll-mt-32">
        <h2 className="mb-md font-headline-md text-primary">{s.collection.title}</h2>
        <div className="grid gap-md md:grid-cols-3">
          {s.collection.cards.map((c) => (
            <div
              key={c.title}
              className="rounded-lg border border-outline-variant bg-surface-container-low p-md"
            >
              <MaterialIcon name={c.icon} className="mb-sm text-primary" />
              <h3 className="mb-xs font-headline-sm text-on-surface">{c.title}</h3>
              <p className="text-label-sm text-outline">{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="usage" className="scroll-mt-32">
        <h2 className="mb-md font-headline-md text-primary">{s.usage.title}</h2>
        <ul className="space-y-sm">
          {s.usage.items.map((it) => (
            <li key={it.title} className="flex items-start gap-base">
              <MaterialIcon name="check_circle" className="mt-1 text-primary" filled />
              <span className="text-on-surface-variant">
                <strong className="text-primary">{it.title}:</strong> {it.description}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section id="protection" className="scroll-mt-32 rounded-xl bg-primary-container p-lg text-on-primary-container">
        <div className="mb-md flex items-center gap-md">
          <MaterialIcon name="verified_user" className="text-4xl" filled />
          <h2 className="font-headline-md">{s.protection.title}</h2>
        </div>
        <p className="mb-md font-body-lg">{s.protection.body}</p>
        <div className="flex flex-wrap gap-md opacity-90">
          {s.protection.badges.map((b) => (
            <div key={b.label} className="flex items-center gap-xs text-xs tracking-widest uppercase">
              <MaterialIcon name={b.icon} className="text-sm" />
              {b.label}
            </div>
          ))}
        </div>
      </section>

      <section id="sharing" className="scroll-mt-32">
        <h2 className="mb-md font-headline-md text-primary">{s.sharing.title}</h2>
        <p className="mb-md text-body-md leading-relaxed text-on-surface-variant">{s.sharing.body}</p>
        <div className="flex flex-wrap gap-base">
          {s.sharing.chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-surface-container-high px-4 py-2 text-label-md text-primary"
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section id="cookies" className="scroll-mt-32">
        <h2 className="mb-md font-headline-md text-primary">{s.cookies.title}</h2>
        <div className="space-y-md border-l-4 border-primary pl-6">
          <p className="font-body-lg italic text-on-surface-variant">“{s.cookies.quote}”</p>
          <p className="text-body-md text-outline">{s.cookies.body}</p>
        </div>
      </section>

      <section id="rights" className="scroll-mt-32">
        <h2 className="mb-md font-headline-md text-primary">{s.rights.title}</h2>
        <div className="grid gap-lg md:grid-cols-2">
          {s.rights.items.map((r) => (
            <div key={r.title} className="space-y-sm">
              <div className="flex items-center gap-base">
                <MaterialIcon name={r.icon} className="text-primary" />
                <span className="font-semibold text-on-surface">{r.title}</span>
              </div>
              <p className="text-sm text-outline">{r.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-lg border-t border-border/60 pt-md md:grid-cols-2">
        <section>
          <h4 className="mb-base font-label-md text-primary uppercase">{s.retentionUpdates.retentionTitle}</h4>
          <p className="text-sm text-outline">{s.retentionUpdates.retentionBody}</p>
        </section>
        <section>
          <h4 className="mb-base font-label-md text-primary uppercase">{s.retentionUpdates.updatesTitle}</h4>
          <p className="text-sm text-outline">{s.retentionUpdates.updatesBody}</p>
        </section>
      </div>

      <Card className="border-border/70 bg-surface-container-low">
        <CardContent className="p-lg text-center">
          <h2 className="mb-base font-headline-md text-primary">{s.support.title}</h2>
          <p className="mb-lg text-body-md text-outline">{s.support.body}</p>

          <div className="mb-lg flex flex-col items-center justify-center gap-lg md:flex-row">
            <div className="flex items-center gap-base">
              <MaterialIcon name="mail" className="text-primary" />
              <span className="font-medium text-on-surface">{s.support.email}</span>
            </div>
            <div className="flex items-center gap-base">
              <MaterialIcon name="call" className="text-primary" />
              <span className="font-medium text-on-surface">{s.support.phone}</span>
            </div>
          </div>

          <Link href="/contact-us">
            <Button className="h-12 rounded-full px-lg font-label-md shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:scale-95">
              {s.support.cta}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </article>
  );
}

