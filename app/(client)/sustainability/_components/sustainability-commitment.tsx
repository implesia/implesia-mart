import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

export function SustainabilityCommitment({ className }: { className?: string }) {
  const { commitment } = sustainabilityCopy;

  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-6">
          <p className="mb-2 text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
            {commitment.kicker}
          </p>
          <h2 className="mb-2 text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">
            {commitment.title}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600">{commitment.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {commitment.items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-neutral-200/90 bg-white p-4 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5"
            >
              <span className="mx-auto mb-2.5 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MaterialIcon name={item.icon} filled className="text-[20px]" />
              </span>
              <h3 className="mb-1 text-sm font-semibold text-neutral-950">{item.title}</h3>
              <p className="text-xs leading-relaxed text-neutral-600">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
