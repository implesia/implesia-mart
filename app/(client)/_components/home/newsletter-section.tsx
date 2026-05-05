"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Container } from "../common/container";

export function NewsletterSection() {
  return (
    <section className="py-xl">
      <Container className="px-8">
        <div className="relative flex flex-col items-center overflow-hidden rounded-[2.5rem] bg-primary-container p-16 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 -mt-48 -mr-48 size-96 rounded-full bg-on-primary-container blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-48 -ml-48 size-96 rounded-full bg-on-primary-container blur-3xl" />
          </div>
          <h2 className="relative z-10 mb-6 font-display-lg text-on-primary-container">
            Join The Collective
          </h2>
          <p className="relative z-10 mb-10 max-w-xl font-body-lg text-on-primary-container/80">
            Subscribers receive early access to limited collections, private invitations to
            regional trunk shows, and editorial inspiration.
          </p>
          <form
            className="relative z-10 flex w-full max-w-xl flex-col gap-4 md:flex-row"
            action="#"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              type="email"
              required
              placeholder="Your email address"
              className="h-auto flex-1 rounded-full border-white/20 bg-white/10 px-8 py-5 text-white placeholder:text-white/60 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-warm-gold md:text-base"
            />
            <Button
              type="submit"
              className="h-auto rounded-full bg-warm-gold px-10 py-5 font-label-md text-on-surface uppercase tracking-widest hover:scale-105 active:scale-95"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </Container>
    </section>
  );
}
