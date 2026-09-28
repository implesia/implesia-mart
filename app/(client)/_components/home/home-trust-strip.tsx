import Link from "next/link";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

const items = [
  {
    icon: "payments",
    label: "ক্যাশ অন ডেলিভারি",
    href: "/shipping-returns",
  },
  {
    icon: "local_shipping",
    label: "সারাদেশে ডেলিভারি",
    href: "/shipping-returns",
  },
  {
    icon: "assignment_return",
    label: "৩ দিন ইজি রিটার্ন",
    href: "/shipping-returns",
  },
] as const;

export function HomeTrustStrip() {
  return (
    <section
      className="bg-[#f5f6f8] pb-6 sm:pb-8"
      aria-label="স্টোর প্রতিশ্রুতি"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-1 divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="flex items-center justify-center gap-2.5 px-4 py-3.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 hover:text-neutral-950 sm:py-4"
              >
                <MaterialIcon name={item.icon} className="text-[20px] text-primary" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
