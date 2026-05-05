"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { aboutCopy } from "../../_data/about/about";

export function NewsletterCta({ className }: { className?: string }) {
  const { newsletter } = aboutCopy;

  return (
    <section className={cn("bg-surface-container-high py-xl", className)}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Card className="border-border/60 bg-card shadow-xl">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center lg:px-24 lg:py-20">
            <h2 className="font-display-lg text-primary">{newsletter.title}</h2>
            <p className="mt-6 max-w-2xl font-body-lg text-on-surface-variant">
              {newsletter.subtitle}
            </p>

            <form
              className="mt-12 flex w-full max-w-lg flex-col gap-4 sm:flex-row"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                type="email"
                placeholder={newsletter.placeholder}
                className="h-12 flex-1 rounded-lg bg-surface ring-1 ring-foreground/10 focus-visible:ring-2"
              />
              <Button className="h-12 rounded-lg bg-primary px-8 font-label-md text-white hover:bg-primary-container">
                {newsletter.cta}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

