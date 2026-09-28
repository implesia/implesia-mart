import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { contactCopy } from "../../_data/contact/contact";

export function ContactSupport({ className }: { className?: string }) {
  const { support } = contactCopy;

  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 lg:grid-cols-2 lg:gap-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MaterialIcon name="schedule" filled className="text-[20px]" />
              </span>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-neutral-950 sm:text-lg">
                  {support.title}
                </h2>
                <p className="text-xs text-neutral-600 sm:text-sm">{support.subtitle}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {support.hours.map((h) => (
                <div
                  key={h.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200/90 px-4 py-3"
                >
                  <span className="text-sm font-medium text-neutral-950">{h.label}</span>
                  <span className="text-right text-sm text-neutral-600">{h.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-2.5">
            {support.quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex items-center justify-between gap-3 rounded-xl border border-neutral-200/90 px-4 py-3.5",
                  "transition-colors hover:border-primary/40",
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MaterialIcon name={link.icon} className="text-[18px]" />
                  </span>
                  <span className="text-sm font-medium text-neutral-950">{link.label}</span>
                </span>
                <MaterialIcon
                  name="arrow_forward"
                  className="text-[18px] text-neutral-400 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
