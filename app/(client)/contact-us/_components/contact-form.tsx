"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { contactCopy } from "../../_data/contact/contact";

export function ContactForm({ className }: { className?: string }) {
  const { form } = contactCopy;
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState({ name: "", phone: "", subject: "", message: "" });

  function handleChange(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section
      className={cn(
        "rounded-2xl p-5 sm:rounded-3xl sm:p-8",
        "bg-surface-container-lowest dark:bg-surface-container",
        "border border-outline-variant/35 dark:border-white/10",
        className,
      )}
    >
      {submitted ? (
        <div className="flex flex-col items-center justify-center py-10 text-center sm:py-16">
          <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-16 dark:bg-primary/15">
            <MaterialIcon name="check_circle" filled className="text-[30px] sm:text-[34px]" />
          </span>
          <h3 className="mb-2 text-lg font-semibold text-on-surface sm:text-xl">
            {form.successTitle}
          </h3>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-on-surface-variant sm:text-base">
            {form.successBody}
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setValues({ name: "", phone: "", subject: "", message: "" });
            }}
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            আরেকটি মেসেজ পাঠান
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-on-surface sm:text-xl">{form.title}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{form.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="px-0.5 text-sm font-medium text-on-surface-variant">
                {form.fields.name.label}
              </label>
              <Input
                required
                value={values.name}
                onChange={handleChange("name")}
                placeholder={form.fields.name.placeholder}
                className="h-11 rounded-xl border-outline-variant bg-surface px-3.5 focus-visible:border-primary focus-visible:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="px-0.5 text-sm font-medium text-on-surface-variant">
                {form.fields.phone.label}
              </label>
              <Input
                type="tel"
                required
                value={values.phone}
                onChange={handleChange("phone")}
                placeholder={form.fields.phone.placeholder}
                className="h-11 rounded-xl border-outline-variant bg-surface px-3.5 focus-visible:border-primary focus-visible:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="px-0.5 text-sm font-medium text-on-surface-variant">
              {form.fields.subject.label}
            </label>
            <Input
              required
              value={values.subject}
              onChange={handleChange("subject")}
              placeholder={form.fields.subject.placeholder}
              className="h-11 rounded-xl border-outline-variant bg-surface px-3.5 focus-visible:border-primary focus-visible:ring-primary/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="px-0.5 text-sm font-medium text-on-surface-variant">
              {form.fields.message.label}
            </label>
            <Textarea
              required
              rows={5}
              value={values.message}
              onChange={handleChange("message")}
              placeholder={form.fields.message.placeholder}
              className="rounded-xl border-outline-variant bg-surface px-3.5 py-3 focus-visible:border-primary focus-visible:ring-primary/30"
            />
          </div>

          <button
            type="submit"
            className={cn(
              "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl",
              "bg-warm-gold text-sm font-semibold text-on-surface",
              "transition-colors hover:bg-warm-gold/90 active:scale-[0.99]",
            )}
          >
            {form.cta}
            <MaterialIcon name="send" className="text-[18px]" />
          </button>
        </form>
      )}
    </section>
  );
}
