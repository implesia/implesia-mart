import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import { hero } from "../../_data/home/home";

export function HeroSection() {
  return (
    <section className="relative flex h-[870px] items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src={hero.imageSrc}
          alt={hero.imageAlt}
          fill
          priority
        
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/45 via-transparent to-transparent" />
      </div>
      <Container className="relative z-10">
        <div className="max-w-2xl">
          <span className="mb-6 inline-block rounded-full bg-warm-gold px-4 py-1 font-label-md text-white uppercase tracking-widest">
            {hero.badge}
          </span>
          <h1 className="mb-6 font-display-xl text-white">
            {hero.titleLines[0]}
            <br />
            {hero.titleLines[1]}
          </h1>
          <p className="mb-10 max-w-lg font-body-lg text-white/90">
            {hero.description}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="#collections"
              className={cn(
                "inline-flex items-center justify-center rounded-lg bg-warm-gold px-10 py-5 font-label-md text-on-surface uppercase tracking-wider shadow-lg transition-all duration-300",
                "hover:-translate-y-1 hover:bg-warm-gold/90 hover:shadow-xl active:scale-95",
              )}
            >
              {hero.primaryCta}
            </Link>
            <Link
              href="#lookbook"
              className={cn(
                "inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-10 py-5 font-label-md text-white uppercase tracking-wider backdrop-blur-md transition-all duration-300",
                "hover:bg-white hover:text-primary active:scale-95",
              )}
            >
              {hero.secondaryCta}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
