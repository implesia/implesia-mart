import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";
import { testimonials } from "../../_data/home";

export function TestimonialsSection() {
  return (
    <section className="bg-surface-container-high py-xl">
      <Container className="px-8 text-center">
        <h2 className="mb-16 font-display-lg text-primary">The Luxe Standard</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card
              key={t.id}
              className="glass-card gap-0 rounded-2xl border-0 py-0 text-left shadow-none ring-0"
            >
              <CardContent className="p-10">
                <div className="mb-6 flex gap-1 text-warm-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <MaterialIcon key={`${t.id}-star-${i}`} name="star" filled className="text-sm" />
                  ))}
                </div>
                <p className="mb-8 font-body-md text-on-surface italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <div className="size-12 overflow-hidden rounded-full">
                    <Image
                      src={t.avatarSrc}
                      alt={t.name}
                      width={48}
                      height={48}
                      className="size-full object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="font-label-md text-primary">{t.name}</h5>
                    <p className="text-xs text-outline">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
