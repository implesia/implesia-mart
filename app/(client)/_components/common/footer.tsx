"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  copyrightLine,
  isExternalFooterHref,
  safeContactHref,
  safeFooterHref,
  type FooterConfig,
  type FooterLink,
} from "@/lib/footer-view";
import { contactChannel, type ContactDetails } from "@/lib/mart-api/contact-details";
import { cn } from "@/lib/utils";
import { FacebookIcon, LinkedinIcon, WhatsAppIcon } from "./brand-icons";
import { Container } from "./container";
import { MaterialIcon } from "./material-icon";
import { SiteLogo } from "./site-logo";

const linkClass =
  "text-sm text-white/75 transition-colors duration-200 hover:text-white";

const legalClass =
  "inline-flex min-h-11 items-center rounded-md px-2 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white";

const socialClass = cn(
  "inline-flex size-10 items-center justify-center rounded-full",
  "bg-white/10 text-white",
  "transition-colors duration-200 hover:bg-white hover:text-neutral-950",
);

/** One footer link: a site path uses the router, anything else is a plain anchor. */
function FooterAnchor({ item, className }: { item: FooterLink; className: string }) {
  const href = safeFooterHref(item.href);
  if (!href) return null;
  if (isExternalFooterHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {item.label}
      </a>
    );
  }
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {item.label}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {item.label}
    </a>
  );
}

function FooterColumn({ title, links }: { title: string; links: readonly FooterLink[] }) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold tracking-[0.12em] text-white uppercase sm:text-base">
        {title}
      </h2>
      <ul className="space-y-3">
        {links.map((item, index) => (
          <li key={`${index}-${item.label}`}>
            <FooterAnchor item={item} className={linkClass} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The storefront footer. All content comes from `config` (admin-managed through the API);
 * phone, email, WhatsApp and social links come from the contact details, which stay the
 * single source for them.
 */
export default function Footer({
  details,
  config,
}: {
  details: ContactDetails | null;
  config: FooterConfig;
}) {
  const year = new Date().getFullYear();
  const phoneChannel = config.showContact ? contactChannel(details, "call") : undefined;
  const emailChannel = config.showContact ? contactChannel(details, "mail") : undefined;
  const chatChannel = contactChannel(details, "chat");
  const facebookLink = details?.isActive
    ? details.social.find((item) => item.platform === "facebook" && item.isActive && item.href)
    : undefined;
  const linkedinLink = details?.isActive
    ? details.social.find((item) => item.platform === "linkedin" && item.isActive && item.href)
    : undefined;
  const whatsAppHref = safeContactHref(chatChannel?.href ?? "");
  const facebookHref = safeContactHref(facebookLink?.href ?? "");
  const linkedinHref = safeContactHref(linkedinLink?.href ?? "");
  const phoneHref = safeContactHref(phoneChannel?.href ?? "");
  const emailHref = safeContactHref(emailChannel?.href ?? "");
  const showSocialRow = config.showSocial && Boolean(whatsAppHref || facebookHref || linkedinHref);
  const showContactList = Boolean(phoneHref || emailHref);
  const showCta = config.showWhatsappCta && Boolean(whatsAppHref);
  const custom = config.logoSrc ? { src: config.logoSrc, alt: config.logoAlt } : undefined;
  const sections = config.sections;
  const hasTrust = config.trustPoints.length > 0 || showCta;

  return (
    <footer
      aria-label={config.brandName}
      className="relative mt-10 w-full overflow-hidden bg-neutral-950 text-white sm:mt-12 lg:mt-14"
    >
      <Container className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        {/* Top: brand + links */}
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 py-12 sm:gap-12 sm:py-14 lg:grid-cols-12 lg:gap-10 lg:py-16">
          <div className={sections.length > 0 ? "lg:col-span-5" : "lg:col-span-12"}>
            <SiteLogo
              tone="onDark"
              custom={custom}
              label={config.brandName}
              className="h-11 w-[11rem] sm:h-12 sm:w-[12.5rem] lg:h-14 lg:w-[14rem]"
            />
            {config.description ? (
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/75 sm:text-[15px]">
                {config.description}
              </p>
            ) : null}
            {config.address ? (
              <p className="mt-4 flex max-w-sm items-start gap-2.5 text-sm leading-relaxed whitespace-pre-line text-white/75">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                  <MaterialIcon name="location_on" className="text-[16px]" />
                </span>
                <span className="pt-1">{config.address}</span>
              </p>
            ) : null}

            {showContactList ? (
              <div className="mt-6 flex flex-col gap-2.5">
                {phoneChannel && phoneHref ? (
                  <a
                    href={phoneHref}
                    className="inline-flex w-fit items-center gap-2.5 text-sm text-white/75 transition-colors hover:text-white"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white">
                      <MaterialIcon name="call" className="text-[16px]" />
                    </span>
                    {phoneChannel.value}
                  </a>
                ) : null}
                {emailChannel && emailHref ? (
                  <a
                    href={emailHref}
                    className="inline-flex w-fit items-center gap-2.5 text-sm text-white/75 transition-colors hover:text-white"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white">
                      <MaterialIcon name="mail" className="text-[16px]" />
                    </span>
                    {emailChannel.value}
                  </a>
                ) : null}
              </div>
            ) : null}

            {showSocialRow ? (
              <div className="mt-6 flex items-center gap-2.5">
                {whatsAppHref ? (
                  <a
                    href={whatsAppHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={socialClass}
                    aria-label="WhatsApp"
                  >
                    <WhatsAppIcon className="size-[18px]" />
                  </a>
                ) : null}
                {facebookHref ? (
                  <a
                    href={facebookHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={socialClass}
                    aria-label="Facebook"
                  >
                    <FacebookIcon className="size-[18px]" />
                  </a>
                ) : null}
                {linkedinHref ? (
                  <a
                    href={linkedinHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={socialClass}
                    aria-label="LinkedIn"
                  >
                    <LinkedinIcon className="size-[18px]" />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          {sections.length > 0 ? (
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:gap-6 xl:gap-10">
              {sections.map((section, index) => (
                <div
                  key={`${index}-${section.title}`}
                  className={
                    index === sections.length - 1 && sections.length % 2 === 1
                      ? "col-span-2 sm:col-span-1"
                      : undefined
                  }
                >
                  <FooterColumn title={section.title} links={section.links} />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Trust + WhatsApp */}
        {hasTrust ? (
          <div className="flex flex-col gap-6 border-b border-white/10 py-8 sm:py-9 lg:flex-row lg:items-center lg:justify-between">
            <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
              {config.trustPoints.map((item, index) => (
                <li
                  key={`${index}-${item.label}`}
                  className="inline-flex items-center gap-2 text-sm text-white/75"
                >
                  <MaterialIcon name={item.icon} className="text-[18px] text-white" />
                  {item.label}
                </li>
              ))}
            </ul>

            {showCta ? (
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 w-full rounded-full bg-white text-sm font-semibold text-neutral-950 hover:bg-neutral-100 sm:w-auto sm:min-w-[220px]",
                )}
              >
                <WhatsAppIcon className="mr-2 size-4" />
                WhatsApp-এ চ্যাট
              </a>
            ) : null}
          </div>
        ) : null}

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:flex-row sm:pt-7 sm:pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <SiteLogo
              tone="onDark"
              custom={custom}
              label={config.brandName}
              className="h-8 w-36 sm:h-9 sm:w-[10.125rem]"
            />
            <span className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden />
            <p className="text-center text-xs text-white/75 sm:text-left sm:text-sm">
              {copyrightLine(config.copyrightText, year)}
            </p>
          </div>

          {config.legalLinks.length > 0 ? (
            <nav
              aria-label="Legal"
              className="flex flex-wrap items-center justify-center gap-x-1 text-sm text-white/75 sm:gap-x-2 sm:text-xs"
            >
              {config.legalLinks.map((item, index) => (
                <FooterAnchor key={`${index}-${item.label}`} item={item} className={legalClass} />
              ))}
            </nav>
          ) : null}
        </div>
      </Container>
    </footer>
  );
}
