import Link from "next/link";
import type { ReactNode } from "react";

import { isExternalHref } from "@/lib/mart-mock/about-sections";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

/**
 * Shared building blocks for the About page so every section uses the same
 * rhythm (spacing, measure, type scale) as the home page tokens.
 */

export function AboutSection({
  id,
  labelledBy,
  tone = "muted",
  className,
  children,
}: {
  id?: string;
  labelledBy?: string;
  tone?: "muted" | "white";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "w-full py-12 sm:py-16 lg:py-20",
        tone === "white" ? "bg-white" : "bg-[#f5f6f8]",
        className,
      )}
    >
      <Container className="px-4 sm:px-6 lg:px-8">{children}</Container>
    </section>
  );
}

export function SectionHeader({
  id,
  kicker,
  title,
  subtitle,
  align = "left",
  className,
}: {
  id: string;
  kicker?: string;
  title?: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}) {
  if (!title?.trim() && !kicker?.trim() && !subtitle?.trim()) return null;
  return (
    <header
      className={cn(
        "max-w-[40rem]",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {kicker?.trim() ? <Kicker>{kicker}</Kicker> : null}
      {title?.trim() ? (
        <h2
          id={id}
          className="text-2xl leading-[1.35] font-bold tracking-tight text-neutral-950 sm:text-[1.75rem] lg:text-3xl"
        >
          {title}
        </h2>
      ) : null}
      {subtitle?.trim() ? (
        <p className="mt-3 text-base leading-[1.7] text-neutral-600">{subtitle}</p>
      ) : null}
    </header>
  );
}

export function Kicker({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <p
      className={cn(
        "mb-3 text-sm font-semibold tracking-wide",
        onDark ? "text-[#8ed4c1]" : "text-primary-ink",
      )}
    >
      {children}
    </p>
  );
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-[65ch] space-y-4 text-base leading-[1.7] text-neutral-700", className)}>
      {children}
    </div>
  );
}

type CtaTone = "primary" | "outline" | "outlineDark";

const CTA_TONE: Record<CtaTone, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary/85",
  outline: "border border-neutral-300 bg-white text-neutral-950 hover:border-neutral-500",
  outlineDark: "border border-white/30 text-white hover:bg-white/10",
};

export function CtaLink({
  href,
  label,
  tone = "primary",
  className,
}: {
  href: string;
  label: string;
  tone?: CtaTone;
  className?: string;
}) {
  const cls = cn(
    "inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full px-6 text-[15px] font-semibold transition-colors motion-reduce:transition-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    tone === "outlineDark" ? "focus-visible:outline-white" : "focus-visible:outline-primary-ink",
    CTA_TONE[tone],
    className,
  );
  const content = (
    <>
      {label}
      {tone === "primary" ? <MaterialIcon name="arrow_forward" className="text-[18px]" /> : null}
    </>
  );
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {content}
        <span className="sr-only"> (নতুন ট্যাবে খুলবে)</span>
      </a>
    );
  }
  return (
    <Link href={href || "/"} className={cls}>
      {content}
    </Link>
  );
}

export function CtaRow({ children, center = false }: { children: ReactNode; center?: boolean }) {
  return (
    <div
      className={cn(
        "mt-8 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap",
        center && "min-[480px]:justify-center",
      )}
    >
      {children}
    </div>
  );
}

/** Storefront shows a single image per section: the first CMS image that has a src. */
export function sectionImage<T extends { src: string }>(image: T | null | undefined): T | undefined {
  return image?.src?.trim() ? image : undefined;
}

export const iconBadge =
  "flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-ink";
