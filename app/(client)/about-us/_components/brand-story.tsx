"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { aboutCopy } from "../../_data/about/about";

export function BrandStory({ className }: { className?: string }) {
  const { story } = aboutCopy;

  return (
    <section className={cn("bg-surface py-xl", className)}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-xl lg:grid-cols-2">
          <div className="space-y-8">
            <h2 className="font-headline-md text-primary">{story.title}</h2>
            <div className="space-y-6 font-body-lg text-on-surface-variant">
              {story.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            <div className="pt-2">
              <Button className="h-12 rounded-lg bg-primary-container px-8 font-label-md text-on-primary-container shadow-lg hover:bg-primary-container/95 hover:shadow-xl">
                {story.cta}
              </Button>
            </div>
          </div>

          <div className="grid h-[520px] grid-cols-2 gap-6 lg:h-[600px]">
            <div className="pt-10">
              <div className="relative h-full overflow-hidden rounded-xl shadow-lg">
                <Image
                  src={story.images[0].src}
                  alt={story.images[0].alt}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="pb-10">
              <div className="relative h-full overflow-hidden rounded-xl shadow-lg">
                <Image
                  src={story.images[1].src}
                  alt={story.images[1].alt}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

