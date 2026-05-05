"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { contactCopy } from "../../_data/contact/contact";

export function ContactForm({ className }: { className?: string }) {
  const { form } = contactCopy;

  return (
    <section
      className={cn(
        "rounded-xl border border-border/60 bg-surface-container-lowest p-lg shadow-sm",
        className
      )}
    >
      <form className="space-y-md" onSubmit={(e) => e.preventDefault()}>
        <h2 className="font-headline-sm text-on-surface">{form.title}</h2>

          <div className="grid grid-cols-1 gap-md md:grid-cols-2">
            <div className="space-y-xs">
              <label className="px-xs font-label-md text-on-surface-variant">
                {form.fields.name.label}
              </label>
              <Input
                placeholder={form.fields.name.placeholder}
                className="h-11 rounded-lg border border-outline-variant bg-surface px-sm ring-0 focus-visible:border-primary focus-visible:ring-0"
              />
            </div>
            <div className="space-y-xs">
              <label className="px-xs font-label-md text-on-surface-variant">
                {form.fields.email.label}
              </label>
              <Input
                type="email"
                placeholder={form.fields.email.placeholder}
                className="h-11 rounded-lg border border-outline-variant bg-surface px-sm ring-0 focus-visible:border-primary focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-xs">
            <label className="px-xs font-label-md text-on-surface-variant">
              {form.fields.subject.label}
            </label>
            <Input
              placeholder={form.fields.subject.placeholder}
              className="h-11 rounded-lg border border-outline-variant bg-surface px-sm ring-0 focus-visible:border-primary focus-visible:ring-0"
            />
          </div>

          <div className="space-y-xs">
            <label className="px-xs font-label-md text-on-surface-variant">
              {form.fields.message.label}
            </label>
            <Textarea
              rows={6}
              placeholder={form.fields.message.placeholder}
              className="rounded-lg border border-outline-variant bg-surface px-sm ring-0 focus-visible:border-primary focus-visible:ring-0"
            />
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-lg bg-tertiary px-lg font-label-md text-on-tertiary shadow-md transition-all duration-300 hover:bg-tertiary/90 active:scale-95"
          >
            {form.cta}
          </Button>
      </form>
    </section>
  );
}

