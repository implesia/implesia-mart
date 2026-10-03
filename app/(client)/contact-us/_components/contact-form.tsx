"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type ContactForm } from "@/lib/mart-api/contact-form";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

export function ContactForm({
  form,
  whatsappHref,
  className,
}: {
  form: ContactForm | null;
  whatsappHref: string;
  className?: string;
}) {
  const [values, setValues] = useState({ name: "", phone: "", subject: "", message: "" });
  if (!form?.isActive) return null;

  function handleChange(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const composed = [
      `হ্যালো, আমি ${values.name}।`,
      `ফোন: ${values.phone}`,
      `বিষয়: ${values.subject}`,
      "",
      values.message,
    ].join("\n");
    const href = whatsAppChatHref(whatsappHref, composed);
    if (!href) return;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6",
        className,
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
            {form.title}
          </h2>
          {form.subtitle.trim() ? (
            <p className="mt-1 text-sm text-neutral-600">{form.subtitle}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="px-0.5 text-sm font-medium text-neutral-700">
              {form.fields.name.label}
            </label>
            <Input
              required
              value={values.name}
              onChange={handleChange("name")}
              placeholder={form.fields.name.placeholder}
              className="h-11 rounded-xl border-neutral-200 bg-[#f5f6f8] px-3.5 focus-visible:border-primary focus-visible:ring-primary/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="px-0.5 text-sm font-medium text-neutral-700">
              {form.fields.phone.label}
            </label>
            <Input
              type="tel"
              required
              value={values.phone}
              onChange={handleChange("phone")}
              placeholder={form.fields.phone.placeholder}
              className="h-11 rounded-xl border-neutral-200 bg-[#f5f6f8] px-3.5 focus-visible:border-primary focus-visible:ring-primary/30"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="px-0.5 text-sm font-medium text-neutral-700">
            {form.fields.subject.label}
          </label>
          <Input
            required
            value={values.subject}
            onChange={handleChange("subject")}
            placeholder={form.fields.subject.placeholder}
            className="h-11 rounded-xl border-neutral-200 bg-[#f5f6f8] px-3.5 focus-visible:border-primary focus-visible:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="px-0.5 text-sm font-medium text-neutral-700">
            {form.fields.message.label}
          </label>
          <Textarea
            required
            rows={5}
            value={values.message}
            onChange={handleChange("message")}
            placeholder={form.fields.message.placeholder}
            className="rounded-xl border-neutral-200 bg-[#f5f6f8] px-3.5 py-3 focus-visible:border-primary focus-visible:ring-primary/30"
          />
        </div>

        <button
          type="submit"
          className={cn(
            "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full",
            "bg-primary text-sm font-semibold text-on-primary",
            "transition-colors hover:bg-primary/80",
          )}
        >
          {form.cta}
          <MaterialIcon name="chat" className="text-[18px]" />
        </button>
        {form.hint.trim() ? (
          <p className="text-center text-xs text-neutral-500">{form.hint}</p>
        ) : null}
      </form>
    </section>
  );
}

function whatsAppChatHref(destination: string, text: string) {
  const number = destination.match(/wa\.me\/(\d+)/)?.[1];
  if (!number) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
