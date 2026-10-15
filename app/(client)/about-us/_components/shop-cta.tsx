import type { AboutCta } from "@/lib/mart-api/about-cta";

import { Container } from "../../_components/common/container";
import { CtaLink, CtaRow } from "./about-ui";

export function ShopCta({ cta }: { cta: AboutCta }) {
  if (!cta.isActive || !cta.title.trim()) return null;
  const primary = cta.primaryCta.label.trim();
  const secondary = cta.secondaryCta.label.trim();

  return (
    <section className="w-full bg-[#f5f6f8] py-12 sm:py-16 lg:py-20" aria-labelledby="about-cta-heading">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-neutral-950 px-6 py-12 text-center sm:px-10 sm:py-16">
          <h2
            id="about-cta-heading"
            className="mx-auto max-w-[30ch] text-2xl leading-[1.35] font-bold tracking-tight text-white sm:text-3xl"
          >
            {cta.title}
          </h2>
          {cta.subtitle.trim() ? (
            <p className="mx-auto mt-3 max-w-[55ch] text-base leading-[1.7] text-white/80">
              {cta.subtitle}
            </p>
          ) : null}
          {primary || secondary ? (
            <CtaRow center>
              {primary ? <CtaLink href={cta.primaryCta.href} label={primary} /> : null}
              {secondary ? (
                <CtaLink href={cta.secondaryCta.href} label={secondary} tone="outlineDark" />
              ) : null}
            </CtaRow>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
