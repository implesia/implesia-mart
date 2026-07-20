import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "../../_components/common/brand-icons";
import { MaterialIcon } from "../../_components/common/material-icon";
import { WHATSAPP_HREF } from "../../_data/contact/contact";
import { faqsCopy } from "../../_data/faqs/faqs";

export function FaqsHelpCta({ className }: { className?: string }) {
  const { helpCta } = faqsCopy;

  return (
    <div className={cn("mt-8 border-t border-outline-variant/30 pt-8 sm:mt-10 sm:pt-10", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl px-5 py-8 sm:rounded-3xl sm:px-8 sm:py-10 md:px-10",
          "bg-[#062f2c] text-white",
          "ring-1 ring-black/10 dark:ring-primary/15",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_0%,rgba(43,192,181,0.28),transparent_55%),radial-gradient(ellipse_40%_40%_at_0%_100%,rgba(245,179,1,0.12),transparent_50%)]"
        />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="max-w-lg text-center md:text-left">
            <h3 className="mb-2 text-xl font-semibold sm:text-2xl">{helpCta.title}</h3>
            <p className="text-sm leading-relaxed text-white/70 sm:text-base">
              {helpCta.subtitle}
            </p>
            <div className="mt-4 flex flex-col items-center gap-1.5 text-xs text-white/60 sm:text-sm md:items-start">
              <a
                href={`mailto:${helpCta.email}`}
                className="transition-colors hover:text-white"
              >
                {helpCta.email}
              </a>
              <a
                href={`tel:${helpCta.phone.replace(/\s|-/g, "")}`}
                className="transition-colors hover:text-white"
              >
                {helpCta.phone}
              </a>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center md:w-auto md:flex-col md:justify-end">
            <Link
              href="/contact-us"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 w-full rounded-full bg-white text-sm font-semibold text-[#062f2c] hover:bg-white/90 sm:h-12 md:min-w-[200px]",
              )}
            >
              <MaterialIcon name="mail" className="mr-2 text-[18px]" />
              {helpCta.button}
            </Link>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-11 w-full rounded-full border-white/25 bg-white/10 text-sm font-semibold text-white hover:bg-white/15 sm:h-12 md:min-w-[200px]",
              )}
            >
              <WhatsAppIcon className="mr-2 size-4" />
              {helpCta.whatsapp}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
