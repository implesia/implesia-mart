import Link from "next/link";

import { MaterialIcon } from "./material-icon";
import { navLinks, SITE_NAME } from "../../_data/home/home";

const footerCollections = navLinks.map((l) => ({ href: l.href, label: l.label }));

const companyLinks = [
  { href: "#story", label: "Our Story" },
  { href: "#sustainability", label: "Sustainability" },
  { href: "#contact", label: "Contact Us" },
];

const supportLinks = [
  { href: "#shipping", label: "Shipping & Returns" },
  { href: "#privacy", label: "Privacy Policy" },
];

export default function Footer() {
  return (
    <footer className="mt-20 w-full border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-16 px-10 py-20 md:grid-cols-4">
        <div className="space-y-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-primary"
          >
            {SITE_NAME}
          </Link>
          <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            Defining the modern standard of excellence across fashion, technology, and organic
            lifestyle since 2024.
          </p>
          <div className="flex gap-4">
            <Link
              href="#"
              className="text-neutral-400 transition-colors hover:text-primary"
              aria-label="Web"
            >
              <MaterialIcon name="public" />
            </Link>
            <Link
              href="#"
              className="text-neutral-400 transition-colors hover:text-primary"
              aria-label="Security"
            >
              <MaterialIcon name="shield" />
            </Link>
            <Link
              href="#"
              className="text-neutral-400 transition-colors hover:text-primary"
              aria-label="Policies"
            >
              <MaterialIcon name="policy" />
            </Link>
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
      <div className="mx-auto max-w-[1440px] border-t border-neutral-200 px-10 py-10 text-center md:text-left dark:border-neutral-800">
        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          © 2024 {SITE_NAME}. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
