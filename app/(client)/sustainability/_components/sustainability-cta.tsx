import type { SustainabilityCta as Cta } from "@/lib/mart-api/sustainability-cta";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { CtaLink, CtaRow } from "../../about-us/_components/about-ui";

/** Closing call to action, same dark card as the About page CTA, with a leaf accent. */
export function SustainabilityCta({ cta }: { cta: Cta }) {
  if (!cta.title.trim()) return null;
  const primary = cta.primaryCta.label.trim();
  const secondary = cta.secondaryCta.label.trim();

  return (
    <section className="w-full bg-[#f5f6f8] pb-12 sm:pb-16 lg:pb-20" aria-labelledby="sustain-cta-heading">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-neutral-950 px-6 py-12 text-center sm:px-10 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(40rem_18rem_at_50%_0%,rgba(43,192,181,0.25),transparent_65%)]"
          />
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/10 text-[#8ed4c1] ring-1 ring-white/15">
            <MaterialIcon name="eco" className="text-[26px]" />
          </span>
          <h2
            id="sustain-cta-heading"
            className="mx-auto mt-5 max-w-[30ch] text-2xl leading-[1.35] font-bold tracking-tight text-white sm:text-3xl"
          >
            {cta.title}
          </h2>
          {cta.subtitle.trim() ? (
            <p className="mx-auto mt-3 max-w-[55ch] text-base leading-[1.7] text-white/80">{cta.subtitle}</p>
          ) : null}
          {primary || secondary ? (
            <CtaRow center>
              {primary ? <CtaLink href={cta.primaryCta.href} label={primary} /> : null}
              {secondary ? <CtaLink href={cta.secondaryCta.href} label={secondary} tone="outlineDark" /> : null}
            </CtaRow>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
