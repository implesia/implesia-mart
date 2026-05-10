"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

export function NewsletterSection() {
  return (
    <section className="relative overflow-hidden py-[120px]">
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-warm-gold/20 blur-3xl" />
      </div>

      <Container className="relative z-10 px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[40px] border border-white/10 bg-primary px-6 py-16 shadow-2xl md:px-14 md:py-24"
        >
          {/* Decorative Layers */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full bg-warm-gold/20 blur-3xl" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%)]" />
          </div>

          {/* Badge */}
          <div className="relative z-10 mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2 backdrop-blur-xl">
              <span className="size-2 rounded-full bg-warm-gold animate-pulse" />

              <span className="font-label-sm uppercase tracking-[0.25em] text-white/80">
                Exclusive Access
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <h2 className="mb-6 font-display-xl leading-tight text-white">
              Join The Collective
            </h2>

            <p className="mx-auto mb-12 max-w-2xl font-body-lg leading-relaxed text-white/70">
              Get early access to exclusive collections, premium launches,
              private events, curated inspiration, and luxury experiences
              tailored for our members.
            </p>
          </div>

          {/* Form */}
          <form
            action="#"
            onSubmit={(e) => e.preventDefault()}
            className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-3 backdrop-blur-2xl md:flex-row"
          >
            {/* Input */}
            <div className="relative flex-1">
              <MaterialIcon
                name="mail"
                className="absolute top-1/2 left-5 -translate-y-1/2 text-white/50"
              />

              <Input
                type="email"
                required
                placeholder="Enter your email address"
                className="h-16 rounded-2xl border-0 bg-transparent pl-14 text-base text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-warm-gold"
              />
            </div>

            {/* Button */}
            <Button
              type="submit"
              className="group h-16 rounded-2xl bg-warm-gold px-8 font-label-md text-on-surface uppercase tracking-[0.2em] transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-warm-gold/30 active:scale-95"
            >
              Subscribe

              <MaterialIcon
                name="arrow_forward"
                className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
              />
            </Button>
          </form>

          {/* Bottom Features */}
          <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <MaterialIcon name="verified" className="text-warm-gold" />
              Premium Updates
            </div>

            <div className="flex items-center gap-2">
              <MaterialIcon name="local_shipping" className="text-warm-gold" />
              Early Product Access
            </div>

            <div className="flex items-center gap-2">
              <MaterialIcon name="shield" className="text-warm-gold" />
              No Spam Guarantee
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}