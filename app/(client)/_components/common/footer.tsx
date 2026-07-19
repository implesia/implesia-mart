import Link from "next/link";

import { contactCopy } from "../../_data/contact/contact";
import { navLinks, SITE_NAME } from "../../_data/home/home";
import { FacebookIcon, LinkedinIcon } from "./brand-icons";
import { MaterialIcon } from "./material-icon";

const footerCollections = navLinks.map((l) => ({ href: l.href, label: l.label }));

const companyLinks = [
  { href: "/about-us", label: "Our Story" },
  { href: "/sustainability", label: "Sustainability" },
  { href: "/contact-us", label: "Contact Us" },
];

const supportLinks = [
  { href: "/shipping-returns", label: "Shipping & Returns" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

const socialChannels = contactCopy.direct.channels.filter(
  (c) => c.icon === "call" || c.icon === "mail",
);
const socialLinks = contactCopy.direct.social;

export default function Footer() {
  return (
    <footer className="mt-20 w-full border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-10 py-20 md:grid-cols-4">
        <div className="space-y-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-primary"
          >
            {SITE_NAME}
          </Link>
          <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            সারাদেশে ট্রেন্ডিং ও ইউনিক গ্যাজেট, ক্যাশ অন ডেলিভারিতে নিশ্চিন্তে অর্ডার করুন।
          </p>
          <div className="flex gap-4">
            {socialChannels.map((c) => (
              <a
                key={c.icon}
                href={c.href}
                className="text-neutral-400 transition-colors hover:text-primary"
                aria-label={c.title}
              >
                <MaterialIcon name={c.icon} />
              </a>
            ))}
            <a
              href={socialLinks[0].href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 transition-colors hover:text-primary"
              aria-label={socialLinks[0].label}
            >
              <FacebookIcon className="size-[22px]" />
            </a>
            <a
              href={socialLinks[1].href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 transition-colors hover:text-primary"
              aria-label={socialLinks[1].label}
            >
              <LinkedinIcon className="size-[22px]" />
            </a>
          </div>
        </div>
        <div>
          <h6 className="mb-6 text-xs font-semibold tracking-widest text-primary uppercase">
            Collections
          </h6>
          <ul className="space-y-4">
            {footerCollections.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm leading-relaxed text-neutral-500 underline transition-colors hover:text-primary dark:text-neutral-400 dark:hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h6 className="mb-6 text-xs font-semibold tracking-widest text-primary uppercase">
            Company
          </h6>
          <ul className="space-y-4">
            {companyLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm leading-relaxed text-neutral-500 underline transition-colors hover:text-primary dark:text-neutral-400 dark:hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h6 className="mb-6 text-xs font-semibold tracking-widest text-primary uppercase">
            Support
          </h6>
          <ul className="space-y-4">
            {supportLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm leading-relaxed text-neutral-500 underline transition-colors hover:text-primary dark:text-neutral-400 dark:hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-neutral-200 px-10 py-10 text-center md:text-left dark:border-neutral-800">
        <p className="text-sm text-center leading-relaxed text-neutral-500 dark:text-neutral-400">
          © 2024 {SITE_NAME}. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
