"use client";

import { useState } from "react";

import { useHomeSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

export function NewsletterSection() {
  const { newsletter } = useHomeSections();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
    setEmail("");
  }

  return (
    <section className="w-full py-6 sm:py-8">
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl sm:rounded-3xl",
            "bg-[#062f2c] dark:bg-[#041f1d]",
            "ring-1 ring-black/10 dark:ring-primary/15",
            "px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 lg:px-14 lg:py-14",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_10%_0%,rgba(43,192,181,0.28),transparent_50%),radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(245,179,1,0.12),transparent_45%)]"
          />

          <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
              <span className="size-1.5 shrink-0 rounded-full bg-warm-gold" />
              {newsletter.eyebrow}
            </p>

            <h2 className="mb-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {newsletter.title}
            </h2>

            <p className="mx-auto mb-8 text-sm leading-relaxed text-white/70 sm:text-base">
              {newsletter.subtitle}
            </p>

            {done ? (
              <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-sm font-medium text-white">
                <MaterialIcon
                  name="check_circle"
                  filled
                  className="shrink-0 text-warm-gold"
                />
                {newsletter.success}
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex w-full flex-col gap-3 sm:flex-row sm:items-center"
              >
                <label className="relative block w-full min-w-0 flex-1">
                  <span className="sr-only">ইমেইল</span>
                  <MaterialIcon
                    name="mail"
                    className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-[20px] text-white/45"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={newsletter.placeholder}
                    className={cn(
                      "box-border h-12 w-full rounded-xl border border-white/20 bg-white/10",
                      "pl-10 pr-3 text-sm text-white outline-none sm:text-base",
                      "placeholder:text-white/40",
                      "focus:border-warm-gold focus:ring-2 focus:ring-warm-gold/30",
                    )}
                  />
                </label>

                <button
                  type="submit"
                  className={cn(
                    "inline-flex h-12 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl sm:w-auto sm:px-8",
                    "bg-warm-gold px-6 text-sm font-semibold text-on-surface",
                    "transition-colors hover:bg-warm-gold/90",
                  )}
                >
                  {newsletter.cta}
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </button>
              </form>
            )}

            <ul className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8">
              {newsletter.perks.map((perk) => (
                <li
                  key={perk.id}
                  className="flex items-center gap-2 text-xs text-white/65 sm:text-sm"
                >
                  <MaterialIcon
                    name={perk.icon}
                    className="shrink-0 text-[18px] text-warm-gold"
                  />
                  <span>{perk.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
