import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { contactCopy } from "../../_data/contact/contact";

export function ContactSupport({ className }: { className?: string }) {
  const { support } = contactCopy;

  return (
    <section
      className={cn(
        "w-full bg-surface-container-low py-10 sm:py-14 lg:py-xl dark:bg-surface-container",
        className,
      )}
    >
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "grid grid-cols-1 gap-8 rounded-2xl p-6 sm:rounded-3xl sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-10",
            "bg-surface-container-lowest dark:bg-surface-container-high",
            "border border-outline-variant/35 dark:border-white/10",
          )}
        >
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/15">
                <MaterialIcon name="schedule" filled className="text-[22px]" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-on-surface sm:text-lg">
                  {support.title}
                </h2>
                <p className="text-xs text-on-surface-variant sm:text-sm">{support.subtitle}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {support.hours.map((h) => (
                <div
                  key={h.label}
                  className="flex items-center justify-between rounded-xl border border-outline-variant/30 px-4 py-3 dark:border-white/10"
                >
                  <span className="text-sm font-medium text-on-surface">{h.label}</span>
                  <span className="text-sm text-on-surface-variant">{h.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-3">
            {support.quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex items-center justify-between gap-3 rounded-xl border border-outline-variant/30 px-4 py-3.5 dark:border-white/10",
                  "transition-colors hover:border-primary/30 dark:hover:border-primary/25",
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/15">
                    <MaterialIcon name={link.icon} className="text-[18px]" />
                  </span>
                  <span className="text-sm font-medium text-on-surface">{link.label}</span>
                </span>
                <MaterialIcon
                  name="arrow_forward"
                  className="text-[18px] text-on-surface-variant transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
