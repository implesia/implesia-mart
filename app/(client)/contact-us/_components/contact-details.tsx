import Link from "next/link";

import { copyValueFor } from "@/lib/contact/contact-rules";
import { type ContactDetails } from "@/lib/mart-api/contact-details";
import { cn } from "@/lib/utils";

import { FacebookIcon, LinkedinIcon } from "../../_components/common/brand-icons";
import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { iconBadge } from "../../about-us/_components/about-ui";
import { CopyButton } from "./copy-button";

const socialIcons = { facebook: FacebookIcon, linkedin: LinkedinIcon } as const;

/** What tapping the card does, so the action is obvious before tapping. */
function actionLabel(href: string) {
  if (href.startsWith("tel:")) return "ট্যাপ করে কল করুন";
  if (href.startsWith("mailto:")) return "ইমেইল লিখুন";
  if (/wa\.me\//.test(href)) return "চ্যাট শুরু করুন";
  if (/maps|goo\.gl\/maps/.test(href)) return "ম্যাপে দেখুন";
  return "বিস্তারিত দেখুন";
}

export function contactChannels(details: ContactDetails | null) {
  if (!details?.isActive) return [];
  return details.channels.filter((c) => c.isActive && c.value.trim());
}

/**
 * Quick-contact cards. The whole card is the link (stretched), and the copy
 * button sits above it, so there is no nested interactive content.
 */
export function ContactDetails({ details, overlap = false }: { details: ContactDetails | null; overlap?: boolean }) {
  const channels = contactChannels(details);
  if (!details?.isActive || (!channels.length && !details.title.trim())) return null;
  const social = details.social.filter((s) => s.href.trim() && s.isActive && s.platform in socialIcons);

  return (
    <section
      aria-labelledby="contact-direct-heading"
      className={cn("relative z-10 w-full", overlap ? "-mt-16 sm:-mt-20 lg:-mt-24" : "pt-12 sm:pt-16")}
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)] ring-1 ring-neutral-200/80 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="contact-direct-heading" className="text-xl leading-[1.35] font-bold tracking-tight text-neutral-950 sm:text-2xl">
                {details.title}
              </h2>
              {details.subtitle.trim() ? <p className="mt-1.5 text-base text-neutral-600">{details.subtitle}</p> : null}
            </div>
            {details.badge.trim() ? (
              <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-[13px] font-semibold text-primary-ink">
                <MaterialIcon name="payments" filled className="text-[16px]" />
                {details.badge}
              </p>
            ) : null}
          </div>

          {channels.length ? (
            <ul className={cn("mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2", channels.length >= 4 && "lg:grid-cols-4", channels.length === 3 && "lg:grid-cols-3")}>
              {channels.map((c) => {
                const copy = copyValueFor(c.href, c.value);
                const internal = c.href.startsWith("/") && !c.href.startsWith("//");
                const external = /^https?:/.test(c.href);
                const linkCls =
                  "after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none";
                const title = (
                  <span className="block text-sm font-semibold text-neutral-600">{c.title}</span>
                );
                return (
                  <li
                    key={c.id}
                    className={cn(
                      "group relative flex min-h-[5.5rem] items-center gap-3 rounded-2xl border border-neutral-200 bg-[#fafbfc] p-4",
                      channels.length >= 3 && "lg:flex-col lg:items-start lg:gap-4 lg:p-5",
                      "transition-[border-color,box-shadow,transform] duration-200 motion-reduce:transition-none",
                      "hover:border-primary/40 hover:shadow-md motion-safe:hover:-translate-y-0.5",
                      "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-primary-ink",
                    )}
                  >
                    <span className={cn(iconBadge, "transition-colors group-hover:bg-primary group-hover:text-on-primary")}>
                      <MaterialIcon name={c.icon} filled className="text-[22px]" />
                    </span>
                    <span className="min-w-0 flex-1 lg:w-full">
                      {c.href.trim() ? (
                        internal ? (
                          <Link href={c.href} className={linkCls}>{title}</Link>
                        ) : (
                          <a href={c.href} className={linkCls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                            {title}
                            {external ? <span className="sr-only"> (নতুন ট্যাবে খুলবে)</span> : null}
                          </a>
                        )
                      ) : (
                        title
                      )}
                      <span className={cn("mt-0.5 block font-bold text-neutral-950 [overflow-wrap:anywhere]", c.value.includes("@") ? "text-sm min-[400px]:text-[15px]" : "text-[15px]")}>
                        {c.value}
                      </span>
                      {c.href.trim() ? (
                        <span aria-hidden className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-ink">
                          {actionLabel(c.href)}
                          <MaterialIcon name="arrow_forward" className="text-[14px] transition-transform motion-safe:group-hover:translate-x-0.5" />
                        </span>
                      ) : null}
                    </span>
                    {copy ? <CopyButton value={copy} label={c.title} className={channels.length >= 3 ? "lg:absolute lg:top-4 lg:right-4" : undefined} /> : null}
                  </li>
                );
              })}
            </ul>
          ) : null}

          {social.length ? (
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-5">
              <span className="text-sm font-medium text-neutral-600">সোশ্যাল মিডিয়ায় আমরা</span>
              {social.map((s) => {
                const Icon = socialIcons[s.platform];
                return (
                  <a
                    key={s.platform}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.label || s.platform} (নতুন ট্যাবে খুলবে)`}
                    className="flex size-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-primary/50 hover:text-primary-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-ink"
                  >
                    <Icon className="size-[18px]" />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
