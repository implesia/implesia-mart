import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { CtaLink, CtaRow } from "../../about-us/_components/about-ui";

/** Closing card in the About/Sustainability style. Copy is fixed; the chat link comes from the CMS hero. */
export function ContactCta({ chat }: { chat?: { label: string; href: string } }) {
  return (
    <section className="w-full bg-[#f5f6f8] py-12 sm:py-16 lg:py-20" aria-labelledby="contact-cta-heading">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-neutral-950 px-6 py-12 text-center sm:px-10 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(40rem_18rem_at_50%_0%,rgba(43,192,181,0.25),transparent_65%)]"
          />
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/10 text-[#8ed4c1] ring-1 ring-white/15">
            <MaterialIcon name="support_agent" className="text-[26px]" />
          </span>
          <h2 id="contact-cta-heading" className="mx-auto mt-5 max-w-[30ch] text-2xl leading-[1.35] font-bold tracking-tight text-white sm:text-3xl">
            এখনো কিছু জানার আছে?
          </h2>
          <p className="mx-auto mt-3 max-w-[55ch] text-base leading-[1.7] text-white/80">
            অর্ডার, ডেলিভারি বা প্রোডাক্ট — যেকোনো প্রশ্নে মেসেজ দিন, অথবা প্রশ্নোত্তর পেজটি দেখে নিন।
          </p>
          <CtaRow center>
            {chat?.label.trim() && chat.href.trim() ? <CtaLink href={chat.href} label={chat.label} /> : null}
            <CtaLink href="/faqs" label="প্রশ্নোত্তর দেখুন" tone="outlineDark" />
          </CtaRow>
        </div>
      </Container>
    </section>
  );
}
