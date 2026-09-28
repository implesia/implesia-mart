import Link from "next/link";

import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "../../_components/common/brand-icons";
import { WHATSAPP_HREF } from "../../_data/contact/contact";
import { faqsCopy } from "../../_data/faqs/faqs";

export function FaqsHelpCta({ className }: { className?: string }) {
  const { helpCta } = faqsCopy;

  return (
    <div className={cn("mt-8", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl px-4 py-7 sm:px-7 sm:py-8",
          "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(43,192,181,0.22),transparent_55%)]"
        />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <h3 className="mb-1.5 text-lg font-semibold text-white sm:text-xl">{helpCta.title}</h3>
            <p className="text-sm leading-relaxed text-white/70">{helpCta.subtitle}</p>
            <div className="mt-3 flex flex-col gap-1 text-xs text-white/55 sm:text-sm">
              <a href={`mailto:${helpCta.email}`} className="hover:text-white">
                {helpCta.email}
              </a>
              <a href={`tel:${helpCta.phone.replace(/\s|-/g, "")}`} className="hover:text-white">
                {helpCta.phone}
              </a>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
            <Link
              href="/contact-us"
              className="inline-flex h-10 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80"
            >
              {helpCta.button}
            </Link>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-white/20 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <WhatsAppIcon className="size-4" />
              {helpCta.whatsapp}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
