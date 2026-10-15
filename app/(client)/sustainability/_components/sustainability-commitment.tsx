import {
  commitmentIcon,
  type SustainabilityCommitment,
} from "@/lib/mart-api/sustainability-commitment";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function SustainabilityCommitment({
  commitment,
  className,
}: {
  commitment: SustainabilityCommitment;
  className?: string;
}) {
  // Public page must respect the admin "active" toggle and skip blank cards.
  const items = commitment.items.filter(
    (item) => item.isActive && (item.title.trim() || item.description.trim()),
  );
  if (!items.length && !commitment.title.trim()) return null;

  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-6">
          {commitment.kicker.trim() ? (
            <p className="mb-2 text-xs font-semibold tracking-wide text-primary-ink uppercase">
              {commitment.kicker}
            </p>
          ) : null}
          <h2 className="mb-2 text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">
            {commitment.title}
          </h2>
          {commitment.subtitle.trim() ? (
            <p className="text-sm leading-relaxed text-neutral-600">
              {commitment.subtitle}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-neutral-200/90 bg-white p-4 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5"
            >
              <span className="mx-auto mb-2.5 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MaterialIcon
                  name={commitmentIcon(item.icon)}
                  filled
                  className="text-[20px]"
                />
              </span>
              <h3 className="mb-1 text-sm font-semibold text-neutral-950">
                {item.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-neutral-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
