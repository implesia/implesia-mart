import Link from "next/link";

import { cn } from "@/lib/utils";

import { FacebookIcon, LinkedinIcon } from "../../_components/common/brand-icons";
import { MaterialIcon } from "../../_components/common/material-icon";
import { contactCopy } from "../../_data/contact/contact";

const socialIcons = {
  facebook: FacebookIcon,
  linkedin: LinkedinIcon,
} as const;

export function ContactDetails({ className }: { className?: string }) {
  const { direct } = contactCopy;

  return (
    <div className={cn("flex flex-col justify-center gap-6", className)}>
      <div>
        <h2 className="text-lg font-semibold text-on-surface sm:text-xl">{direct.title}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{direct.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {direct.channels.map((c) => {
          const isInternal = c.href.startsWith("/");
          const content = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105 dark:bg-primary/15">
                <MaterialIcon name={c.icon} filled className="text-[20px]" />
              </span>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                  {c.title}
                </h4>
                <p className="mt-0.5 truncate text-sm font-medium text-on-surface">{c.value}</p>
              </div>
            </>
          );
          const linkClass = cn(
            "group flex items-center gap-3 rounded-2xl p-4",
            "bg-surface-container-lowest dark:bg-surface-container",
            "border border-outline-variant/35 dark:border-white/10",
            "transition-colors hover:border-primary/30 dark:hover:border-primary/25",
          );

          return isInternal ? (
            <Link key={c.title} href={c.href} className={linkClass}>
              {content}
            </Link>
          ) : (
            <a key={c.title} href={c.href} className={linkClass}>
              {content}
            </a>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 pt-5 dark:border-white/10">
        <div className="inline-flex items-center gap-2 rounded-full border border-warm-gold/30 bg-warm-gold/10 px-3.5 py-1.5 text-xs font-semibold text-warm-gold">
          <MaterialIcon name="verified" className="text-[16px]" filled />
          {direct.badge}
        </div>

        <div className="flex items-center gap-2.5">
          {direct.social.map((s) => {
            const Icon = socialIcons[s.platform];
            return (
              <a
                key={s.platform}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full",
                  "bg-surface-container-lowest text-on-surface-variant dark:bg-surface-container",
                  "border border-outline-variant/35 dark:border-white/10",
                  "transition-colors hover:border-primary/30 hover:text-primary dark:hover:border-primary/25",
                )}
              >
                <Icon className="size-4" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
