import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { WHATSAPP_HREF, contactCopy } from "../../_data/contact/contact";
import { FacebookIcon, LinkedinIcon, WhatsAppIcon } from "./brand-icons";
import { Container } from "./container";
import { MaterialIcon } from "./material-icon";
import { SiteLogo } from "./site-logo";

const shopLinks = [
  { href: "/products", label: "All Products" },
  { href: "/products", label: "Trending Gadgets" },
  { href: "/products", label: "Handmade Dresses" },
  { href: "/blogs", label: "Guides & Blog" },
] as const;

const companyLinks = [
  { href: "/about-us", label: "About Us" },
  { href: "/sustainability", label: "Sustainability" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/blogs", label: "Blog" },
] as const;

const supportLinks = [
  { href: "/faqs", label: "FAQs" },
  { href: "/shipping-returns", label: "Shipping & Returns" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/checkout", label: "Checkout" },
] as const;

const trustPoints = [
  { icon: "local_shipping", label: "Nationwide delivery" },
  { icon: "payments", label: "Cash on delivery" },
  { icon: "assignment_return", label: "Easy 3-day return" },
] as const;

const phoneChannel = contactCopy.direct.channels.find((c) => c.icon === "call");
const emailChannel = contactCopy.direct.channels.find((c) => c.icon === "mail");
const facebookLink = contactCopy.direct.social.find((s) => s.platform === "facebook");
const linkedinLink = contactCopy.direct.social.find((s) => s.platform === "linkedin");

const linkClass =
  "text-sm text-on-surface-variant transition-colors duration-200 hover:text-primary";

const socialClass = cn(
  "inline-flex size-10 items-center justify-center rounded-full",
  "bg-surface-container-low text-on-surface-variant ring-1 ring-outline-variant/35",
  "transition-colors duration-200 hover:bg-primary/10 hover:text-primary hover:ring-primary/25",
  "dark:bg-surface-container-high dark:ring-white/10",
);

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-4 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((item) => (
          <li key={`${title}-${item.label}`}>
            <Link href={item.href} className={linkClass}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "relative mt-20 w-full overflow-hidden",
        /* Same chrome surface as navbar */
        "border-t border-outline-variant/35 bg-surface-container-lowest",
        "dark:border-white/10 dark:bg-surface-container",
      )}
    >
      <Container className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        {/* Top: brand + links */}
        <div className="grid grid-cols-1 gap-10 border-b border-outline-variant/30 py-12 sm:gap-12 sm:py-14 lg:grid-cols-12 lg:gap-10 lg:py-16 dark:border-white/10">
          <div className="lg:col-span-5">
            <SiteLogo className="h-11 w-[11rem] sm:h-12 sm:w-[12.5rem] lg:h-14 lg:w-[14rem]" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-on-surface-variant sm:text-[15px]">
              Trending gadgets and handmade dresses — delivered nationwide with cash on
              delivery, so you can shop with confidence.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              {phoneChannel ? (
                <a
                  href={phoneChannel.href}
                  className="inline-flex w-fit items-center gap-2.5 text-sm text-on-surface-variant transition-colors hover:text-primary"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MaterialIcon name="call" className="text-[16px]" />
                  </span>
                  {phoneChannel.value}
                </a>
              ) : null}
              {emailChannel ? (
                <a
                  href={emailChannel.href}
                  className="inline-flex w-fit items-center gap-2.5 text-sm text-on-surface-variant transition-colors hover:text-primary"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MaterialIcon name="mail" className="text-[16px]" />
                  </span>
                  {emailChannel.value}
                </a>
              ) : null}
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className={socialClass}
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="size-[18px]" />
              </a>
              {facebookLink ? (
                <a
                  href={facebookLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialClass}
                  aria-label="Facebook"
                >
                  <FacebookIcon className="size-[18px]" />
                </a>
              ) : null}
              {linkedinLink ? (
                <a
                  href={linkedinLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialClass}
                  aria-label="LinkedIn"
                >
                  <LinkedinIcon className="size-[18px]" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:gap-6 xl:gap-10">
            <FooterColumn title="Shop" links={shopLinks} />
            <FooterColumn title="Company" links={companyLinks} />
            <div className="col-span-2 sm:col-span-1">
              <FooterColumn title="Support" links={supportLinks} />
            </div>
          </div>
        </div>

        {/* Trust + WhatsApp */}
        <div className="flex flex-col gap-6 border-b border-outline-variant/30 py-8 sm:py-9 lg:flex-row lg:items-center lg:justify-between dark:border-white/10">
          <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
            {trustPoints.map((item) => (
              <li
                key={item.label}
                className="inline-flex items-center gap-2 text-sm text-on-surface-variant"
              >
                <MaterialIcon name={item.icon} className="text-[18px] text-primary" />
                {item.label}
              </li>
            ))}
          </ul>

          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 w-full rounded-full text-sm font-semibold sm:w-auto sm:min-w-[220px]",
            )}
          >
            <WhatsAppIcon className="mr-2 size-4" />
            Chat on WhatsApp
          </a>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row sm:py-7">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <SiteLogo className="h-8 w-[8.5rem] sm:h-9 sm:w-[9.5rem]" />
            <span
              className="hidden h-4 w-px bg-outline-variant/50 sm:block dark:bg-white/15"
              aria-hidden
            />
            <p className="text-center text-xs text-on-surface-variant sm:text-left sm:text-sm">
              © {year} · All rights reserved
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-on-surface-variant">
            <Link href="/privacy-policy" className="transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link href="/shipping-returns" className="transition-colors hover:text-primary">
              Shipping
            </Link>
            <Link href="/faqs" className="transition-colors hover:text-primary">
              FAQs
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
