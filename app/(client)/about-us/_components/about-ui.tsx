import Image from "next/image";
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

/** Highlights the last two words of a CMS title (only when it has 4+ words). */
export function splitTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 4) return { lead: title.trim(), tail: "" };
  return { lead: words.slice(0, -2).join(" "), tail: words.slice(-2).join(" ") };
}

/** CMS title with its last two words in brand ink. */
export function HighlightTitle({ title, onDark = false }: { title: string; onDark?: boolean }) {
  const { lead, tail } = splitTitle(title);
  return (
    <>
      {lead}
      {tail ? (
        <>
          {" "}
          <span className={onDark ? "text-[#8ed4c1]" : "text-primary-ink"}>{tail}</span>
        </>
      ) : null}
    </>
  );
}

/** Soft brand glow + faint dot grid behind a hero. Decorative only. */
export function HeroBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_85%_10%,rgba(20,184,166,0.16),transparent_60%),radial-gradient(40rem_24rem_at_0%_100%,rgba(20,184,166,0.10),transparent_60%),linear-gradient(180deg,#ffffff_0%,#f5f6f8_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(180deg,black,transparent_70%)]"
      />
    </>
  );
}

export function EyebrowPill({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-[13px] font-semibold text-primary-ink shadow-sm ring-1 ring-primary/25">
      <span aria-hidden className="size-1.5 rounded-full bg-primary" />
      {children}
    </p>
  );
}

/**
 * A single CMS photo in a white frame with a soft shadow and a tilted brand
 * shape behind it. Fixed aspect ratio, so no layout shift.
 */
export function FramedPhoto({
  src,
  alt,
  sizes,
  priority = false,
  tilt = "right",
  aspect = "aspect-[4/3] lg:aspect-[5/4]",
  className,
  children,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  tilt?: "left" | "right";
  aspect?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[30rem] md:max-w-none", className)}>
      <div
        aria-hidden
        className={cn(
          "absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/25 via-primary/10 to-transparent sm:-inset-4",
          tilt === "right" ? "rotate-3" : "-rotate-3",
        )}
      />
      <div className="rounded-[1.75rem] bg-white p-2 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] ring-1 ring-neutral-200/80">
        <div className={cn("relative overflow-hidden rounded-[1.25rem] bg-neutral-100", aspect)}>
          <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
        </div>
      </div>
      {children}
    </div>
  );
}
