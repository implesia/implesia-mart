import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";
import { organicHighlight } from "../../_data/home/home";

export function OrganicHighlightSection() {
  return (
    <section id="organic" className="bg-white py-xl">
      <Container className="grid items-center gap-20 px-8 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-4">
          {organicHighlight.images.map((img) => (
            <Image
              key={img.alt}
              src={img.src}
              alt={img.alt}
              width={400}
              height={320}
              className={cn("w-full rounded-2xl object-cover", img.className)}
            />
          ))}
        </div>
        <div className="space-y-8">
          <span className="inline-block border-b-2 border-warm-gold pb-2 font-label-md tracking-[0.2em] text-primary-container uppercase">
            {organicHighlight.kicker}
          </span>
          <h2 className="font-display-lg leading-tight text-primary">
            {organicHighlight.title}
          </h2>
          <p className="font-body-lg text-on-surface-variant">
            {organicHighlight.description}
          </p>
          <ul className="space-y-4">
            {organicHighlight.bullets.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-4 text-on-surface"
              >
                <MaterialIcon name={item.icon} className="text-warm-gold" />
                <span className="font-label-md">{item.label}</span>
              </li>
            ))}
          </ul>
          <Link
            href="#story"
            className={cn(
              "inline-flex items-center justify-center rounded-lg bg-primary px-10 py-5 font-label-md text-white uppercase tracking-widest shadow-md transition-colors",
              "hover:bg-primary/90 active:scale-[0.98]",
            )}
          >
            {organicHighlight.cta}
          </Link>
        </div>
      </Container>
    </section>
  );
}
