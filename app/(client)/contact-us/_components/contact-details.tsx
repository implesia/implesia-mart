import Link from "next/link";

import { type ContactDetails } from "@/lib/mart-api/contact-details";
import { cn } from "@/lib/utils";

import { FacebookIcon, LinkedinIcon } from "../../_components/common/brand-icons";
import { MaterialIcon } from "../../_components/common/material-icon";

const socialIcons = {
  facebook: FacebookIcon,
  linkedin: LinkedinIcon,
} as const;

export function ContactDetails({
  details,
  className,
}: {
  details: ContactDetails | null;
  className?: string;
}) {
  if (!details?.isActive) return null;
  const channels = details.channels.filter((item) => item.isActive);
  const social = details.social.filter(
    (item) => item.href.trim() && item.isActive && item.platform in socialIcons,
  );

  return (
    <div className={cn("flex flex-col justify-center gap-5", className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
          {details.title}
        </h2>
        {details.subtitle.trim() ? (
          <p className="mt-1 text-sm text-neutral-600">{details.subtitle}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
        {channels.map((c) => {
          const isInternal = c.href.startsWith("/");
          const content = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MaterialIcon name={c.icon} filled className="text-[20px]" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  {c.title}
                </h3>
                <p className="mt-0.5 truncate text-sm font-medium text-neutral-950">{c.value}</p>
              </div>
            </>
          );
          const linkClass = cn(
            "group flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4",
            "transition-colors hover:border-primary/40",
          );

          return isInternal ? (
            <Link key={c.id} href={c.href} className={linkClass}>
              {content}
            </Link>
          ) : (
            <a
              key={c.id}
              href={c.href}
              {...(c.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={linkClass}
            >
              {content}
            </a>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
        {details.badge.trim() ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700">
            <MaterialIcon name="payments" className="text-[16px] text-primary" filled />
            {details.badge}
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {social.map((s) => {
            const Icon = socialIcons[s.platform];
            return (
              <a
                key={s.platform}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label || s.platform}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full",
                  "border border-neutral-200/90 bg-white text-neutral-600",
                  "transition-colors hover:border-primary/40 hover:text-primary",
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
