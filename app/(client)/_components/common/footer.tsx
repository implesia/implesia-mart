"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { contactChannel, type ContactDetails } from "@/lib/mart-api/contact-details";
import { cn } from "@/lib/utils";
import { productsHref } from "../../_data/products/catalog-meta";
import { FacebookIcon, LinkedinIcon, WhatsAppIcon } from "./brand-icons";
import { Container } from "./container";
import { MaterialIcon } from "./material-icon";
import { SiteLogo } from "./site-logo";

const shopLinks = [
  { href: productsHref(), label: "সব প্রোডাক্ট" },
  { href: productsHref({ category: "gadgets" }), label: "ট্রেন্ডিং গ্যাজেট" },
  { href: productsHref({ category: "fashion" }), label: "গর্জিয়াস ড্রেস" },
  { href: "/blogs", label: "গাইড ও ব্লগ" },
] as const;

const companyLinks = [
  { href: "/about-us", label: "আমাদের সম্পর্কে" },
  { href: "/sustainability", label: "সাসটেইনেবিলিটি" },
  { href: "/contact-us", label: "যোগাযোগ" },
  { href: "/blogs", label: "ব্লগ" },
] as const;

const supportLinks = [
  { href: "/order-status", label: "আমার অর্ডার" },
  { href: "/faqs", label: "প্রশ্নোত্তর" },
  { href: "/shipping-returns", label: "শিপিং ও রিটার্ন" },
  { href: "/privacy-policy", label: "গোপনীয়তা নীতি" },
  { href: "/checkout", label: "চেকআউট" },
] as const;

const trustPoints = [
  { icon: "local_shipping", label: "সারাদেশে ডেলিভারি" },
  { icon: "payments", label: "ক্যাশ অন ডেলিভারি" },
  { icon: "assignment_return", label: "৩ দিনের ইজি রিটার্ন" },
] as const;

const linkClass =
  "text-sm text-white/75 transition-colors duration-200 hover:text-white";

const socialClass = cn(
  "inline-flex size-10 items-center justify-center rounded-full",
  "bg-white/10 text-white",
  "transition-colors duration-200 hover:bg-white hover:text-neutral-950",
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
      <h3 className="mb-4 text-[11px] font-semibold tracking-[0.16em] text-white uppercase">
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

export default function Footer({ details }: { details: ContactDetails | null }) {
  const year = new Date().getFullYear();
  const phoneChannel = contactChannel(details, "call");
  const emailChannel = contactChannel(details, "mail");
  const chatChannel = contactChannel(details, "chat");
  const facebookLink = details?.isActive
    ? details.social.find((item) => item.platform === "facebook" && item.isActive && item.href)
    : undefined;
  const linkedinLink = details?.isActive
    ? details.social.find((item) => item.platform === "linkedin" && item.isActive && item.href)
    : undefined;
  const whatsAppHref = chatChannel?.href ?? "";

  return (
    <footer className="relative mt-10 w-full overflow-hidden bg-neutral-950 text-white sm:mt-12 lg:mt-14">
      <Container className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        {/* Top: brand + links */}
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 py-12 sm:gap-12 sm:py-14 lg:grid-cols-12 lg:gap-10 lg:py-16">
          <div className="lg:col-span-5">
            <SiteLogo
              tone="onDark"
              className="h-11 w-[11rem] sm:h-12 sm:w-[12.5rem] lg:h-14 lg:w-[14rem]"
            />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/75 sm:text-[15px]">
              ট্রেন্ডিং গ্যাজেট আর হাতে তৈরি গর্জিয়াস ড্রেস — ক্যাশ অন ডেলিভারিতে
              সারাদেশে, নিশ্চিন্তে কিনুন।
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              {phoneChannel ? (
                <a
                  href={phoneChannel.href}
                  className="inline-flex w-fit items-center gap-2.5 text-sm text-white/75 transition-colors hover:text-white"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white">
                    <MaterialIcon name="call" className="text-[16px]" />
                  </span>
                  {phoneChannel.value}
                </a>
              ) : null}
              {emailChannel ? (
                <a
                  href={emailChannel.href}
                  className="inline-flex w-fit items-center gap-2.5 text-sm text-white/75 transition-colors hover:text-white"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white">
                    <MaterialIcon name="mail" className="text-[16px]" />
                  </span>
                  {emailChannel.value}
                </a>
              ) : null}
            </div>

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
              {facebookLink?.href ? (
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
              {linkedinLink?.href ? (
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
            <FooterColumn title="শপ" links={shopLinks} />
            <FooterColumn title="কোম্পানি" links={companyLinks} />
            <div className="col-span-2 sm:col-span-1">
              <FooterColumn title="সাপোর্ট" links={supportLinks} />
            </div>
          </div>
        </div>

        {/* Trust + WhatsApp */}
        <div className="flex flex-col gap-6 border-b border-white/10 py-8 sm:py-9 lg:flex-row lg:items-center lg:justify-between">
          <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
            {trustPoints.map((item) => (
              <li
                key={item.label}
                className="inline-flex items-center gap-2 text-sm text-white/75"
              >
                <MaterialIcon name={item.icon} className="text-[18px] text-white" />
                {item.label}
              </li>
            ))}
          </ul>

          {whatsAppHref ? (
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

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row sm:py-7">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <SiteLogo
              tone="onDark"
              className="h-8 w-[8.5rem] sm:h-9 sm:w-[9.5rem]"
            />
            <span className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden />
            <p className="text-center text-xs text-white/75 sm:text-left sm:text-sm">
              © {year} · সর্বস্বত্ব সংরক্ষিত
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/75">
            <Link href="/privacy-policy" className="transition-colors hover:text-white">
              গোপনীয়তা
            </Link>
            <Link href="/shipping-returns" className="transition-colors hover:text-white">
              শিপিং
            </Link>
            <Link href="/order-status" className="transition-colors hover:text-white">
              আমার অর্ডার
            </Link>
            <Link href="/faqs" className="transition-colors hover:text-white">
              প্রশ্নোত্তর
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
