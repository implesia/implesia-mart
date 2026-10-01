"use client";

import Link from "next/link";

import { isExternalHref } from "@/lib/mart-mock/about-sections";
import { useFaqSections } from "@/lib/mart-mock/hooks";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "../../_components/common/brand-icons";

export function FaqsHelpCta({ className }: { className?: string }) {
  const { help } = useFaqSections();
  if (!isContentActive(help)) return null;
  const primary = help.primaryLabel.trim();
  const secondary = help.secondaryLabel.trim();
  const phoneHref = help.phone.replace(/[\s-]/g, "");

  return (
    <div className={cn("mt-8", className)}>
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
            {help.title.trim() ? (
              <h3 className="mb-1.5 text-lg font-semibold text-white sm:text-xl">{help.title}</h3>
            ) : null}
            {help.subtitle.trim() ? (
              <p className="text-sm leading-relaxed text-white/70">{help.subtitle}</p>
            ) : null}
            {help.email.trim() || help.phone.trim() ? (
              <div className="mt-3 flex flex-col gap-1 text-xs text-white/55 sm:text-sm">
                {help.email.trim() ? (
                  <a href={`mailto:${help.email.trim()}`} className="hover:text-white">
                    {help.email}
                  </a>
                ) : null}
                {help.phone.trim() ? (
                  <a href={`tel:${phoneHref}`} className="hover:text-white">
                    {help.phone}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
          {primary || secondary ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
              {primary ? (
                <HelpButton label={primary} href={help.primaryHref} filled />
              ) : null}
              {secondary ? (
                <HelpButton
                  label={secondary}
                  href={help.secondaryHref}
                  icon={/wa\.me|whatsapp/i.test(help.secondaryHref)}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HelpButton({
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
  if (isExternalHref(href) || href.startsWith("tel:") || href.startsWith("mailto:")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
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
