import Link from "next/link";

import { contactCopy } from "../../_data/contact/contact";
import { navLinks, SITE_NAME } from "../../_data/home/home";
import { Container } from "./container";
import { FacebookIcon, LinkedinIcon } from "./brand-icons";
import { MaterialIcon } from "./material-icon";

const footerCollections = navLinks.map((l) => ({ href: l.href, label: l.label }));

const companyLinks = [
  { href: "/about-us", label: "Our Story" },
  { href: "/sustainability", label: "Sustainability" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/blogs", label: "Blog" },
];

const supportLinks = [
  { href: "/faqs", label: "FAQs" },
  { href: "/shipping-returns", label: "Shipping & Returns" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

const phoneChannel = contactCopy.direct.channels.find((c) => c.icon === "call");
const emailChannel = contactCopy.direct.channels.find((c) => c.icon === "mail");
const facebookLink = contactCopy.direct.social.find((s) => s.platform === "facebook");
const linkedinLink = contactCopy.direct.social.find((s) => s.platform === "linkedin");

const linkClass =
  "text-sm leading-relaxed text-on-surface-variant transition-colors hover:text-primary";
const iconLinkClass =
  "flex size-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-primary";

export default function Footer() {
  return (
    <footer className="mt-20 w-full border-t border-outline-variant/35 bg-surface-container-lowest dark:border-white/10 dark:bg-surface-container">
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 sm:gap-12 sm:py-16 lg:grid-cols-4 lg:gap-10 lg:py-20">
          <div className="space-y-5 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="text-xl font-bold tracking-tight text-primary">
              {SITE_NAME}
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-on-surface-variant">
              Trending and unique gadgets, delivered nationwide with cash on delivery — shop
              with complete peace of mind.
            </p>
            <div className="flex items-center gap-2">
              {phoneChannel ? (
                <a href={phoneChannel.href} className={iconLinkClass} aria-label="Call us">
                  <MaterialIcon name="call" className="text-[18px]" />
                </a>
              ) : null}
              {emailChannel ? (
                <a href={emailChannel.href} className={iconLinkClass} aria-label="Email us">
                  <MaterialIcon name="mail" className="text-[18px]" />
                </a>
              ) : null}
              {facebookLink ? (
                <a
                  href={facebookLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={iconLinkClass}
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
                  className={iconLinkClass}
                  aria-label="LinkedIn"
                >
                  <LinkedinIcon className="size-[18px]" />
                </a>
              ) : null}
            </div>
          </div>

          <div>
            <h6 className="mb-5 text-xs font-semibold tracking-widest text-primary uppercase">
              Collections
            </h6>
            <ul className="space-y-3.5">
              {footerCollections.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h6 className="mb-5 text-xs font-semibold tracking-widest text-primary uppercase">
              Company
            </h6>
            <ul className="space-y-3.5">
              {companyLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h6 className="mb-5 text-xs font-semibold tracking-widest text-primary uppercase">
              Support
            </h6>
            <ul className="space-y-3.5">
              {supportLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

      <div className="border-t border-outline-variant/35 dark:border-white/10">
        <Container className="w-full px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-on-surface-variant sm:text-left">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  );
}
