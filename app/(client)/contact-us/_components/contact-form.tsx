"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
  LIMITS,
  composeWhatsAppMessage,
  validateContact,
  validateField,
  whatsAppChatHref,
  type ContactErrors,
  type ContactValues,
} from "@/lib/contact/contact-rules";
import { type ContactForm as Form } from "@/lib/mart-api/contact-form";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

/** Quick subjects; the subject stays free text, a chip only fills it in. */
export const CONTACT_TOPICS = ["অর্ডার স্ট্যাটাস", "ডেলিভারি", "রিটার্ন ও এক্সচেঞ্জ", "প্রোডাক্ট তথ্য", "পেমেন্ট"] as const;

const EMPTY: ContactValues = { name: "", phone: "", subject: "", message: "" };
type Phase = "idle" | "sending" | "sent" | "blocked" | "unavailable";

const inputCls = cn(
  "block w-full rounded-xl border bg-white px-4 text-base text-neutral-950 placeholder:text-neutral-500",
  "transition-[border-color,box-shadow] outline-none motion-reduce:transition-none",
  "focus:border-primary-ink focus:ring-4 focus:ring-primary/20",
);

function Field({
  inputId,
  label,
  error,
  errorId,
  hint,
  children,
}: {
  inputId: string;
  label: string;
  error?: string;
  errorId: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-semibold text-neutral-800">
          {label}
          <span aria-hidden className="ml-0.5 text-red-600">*</span>
        </label>
        {hint}
      </div>
      {children}
      {error ? (
        <p id={errorId} className="mt-1.5 flex items-start gap-1 text-sm font-medium text-red-700">
          <MaterialIcon name="error" className="mt-0.5 text-[16px]" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Validates inline, then hands the message to WhatsApp (the CMS number from the
 * hero). There is no backend inbox, so nothing is stored on our side. A filled
 * honeypot is treated as sent without opening anything.
 */
export function ContactForm({ form, whatsappHref, className }: { form: Form | null; whatsappHref: string; className?: string }) {
  const uid = useId();
  const [values, setValues] = useState<ContactValues>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ContactValues, boolean>>>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("");
  const [chatHref, setChatHref] = useState("");
  const honeypot = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const focusAfterRender = useRef<"name" | "done" | null>(null);

  // Move focus only after the form / success panel has actually rendered.
  useEffect(() => {
    const target = focusAfterRender.current;
    if (!target) return;
    focusAfterRender.current = null;
    if (target === "done") doneRef.current?.focus();
    else formRef.current?.querySelector<HTMLElement>("input[name=name]")?.focus();
  }, [phase]);

  if (!form?.isActive) return null;
  const f = form.fields;
  const id = (k: string) => `${uid}-${k}`;

  function set(field: keyof ContactValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  }
  function blur(field: keyof ContactValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, values[field]) }));
  }

  function finish(next: Phase, message: string) {
    setPhase(next);
    setStatus(message);
    if (next === "sent") focusAfterRender.current = "done";
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (phase === "sending") return;
    const found = validateContact(values);
    setErrors(found);
    setTouched({ name: true, phone: true, subject: true, message: true });
    const invalid = (Object.keys(found) as (keyof ContactValues)[]).filter((k) => found[k]);
    if (invalid.length) {
      setStatus(`${invalid.length.toLocaleString("bn-BD")}টি ঘর ঠিক করুন।`);
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(invalid[0]))}`)?.focus();
      return;
    }
    if (honeypot.current?.value) {
      finish("sent", "মেসেজ পাঠানো হয়েছে।");
      return;
    }
    const href = whatsAppChatHref(whatsappHref, composeWhatsAppMessage(values));
    if (!href) {
      finish("unavailable", "এই মুহূর্তে হোয়াটসঅ্যাপ নাম্বার পাওয়া যাচ্ছে না। কল বা ইমেইল করুন।");
      return;
    }
    setChatHref(href);
    setPhase("sending");
    setStatus("হোয়াটসঅ্যাপ খোলা হচ্ছে…");
    // Must open inside the click; "noopener" would make window.open return null.
    const win = window.open(href, "_blank");
    if (win) win.opener = null;
    setTimeout(
      () =>
        win
          ? finish("sent", "হোয়াটসঅ্যাপে আপনার মেসেজ তৈরি — সেখানে Send চাপুন।")
          : finish("blocked", "নতুন ট্যাব খোলা যায়নি। নিচের বোতাম চেপে হোয়াটসঅ্যাপ খুলুন।"),
      500,
    );
  }

  function reset() {
    setValues(EMPTY);
    setErrors({});
    setTouched({});
    setPhase("idle");
    setStatus("");
    focusAfterRender.current = "name";
  }

  const fieldError = (k: keyof ContactValues) => (touched[k] ? errors[k] : undefined);
  const describedBy = (k: keyof ContactValues, extra?: string) =>
    [fieldError(k) ? id(`${k}-error`) : "", extra ?? ""].filter(Boolean).join(" ") || undefined;
  const count = values.message.trim().length;
  const FALLBACK_LABELS = { name: "নাম", phone: "ফোন নাম্বার", subject: "বিষয়", message: "মেসেজ" };
  const fieldProps = (k: keyof ContactValues) => ({
    inputId: id(k),
    label: f[k].label || FALLBACK_LABELS[k],
    error: fieldError(k),
    errorId: id(`${k}-error`),
  });

  const border = (k: keyof ContactValues) =>
    fieldError(k) ? "border-red-500 focus:border-red-600 focus:ring-red-500/20" : touched[k] && values[k].trim() ? "border-emerald-500/60" : "border-neutral-300";

  return (
    <section aria-labelledby="contact-form-heading" className={cn("rounded-3xl bg-white p-5 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.3)] ring-1 ring-neutral-200/80 sm:p-8", className)}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#128C7E]">
          <MaterialIcon name="chat" filled className="text-[22px]" />
        </span>
        <div>
          <h2 id="contact-form-heading" className="text-xl leading-snug font-bold tracking-tight text-neutral-950 sm:text-2xl">
            {form.title}
          </h2>
          {form.subtitle.trim() ? <p className="mt-1 text-[15px] leading-relaxed text-neutral-600">{form.subtitle}</p> : null}
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      {phase === "sent" ? (
        <div className="mt-6 rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white">
            <MaterialIcon name="check" className="text-[30px]" />
          </span>
          <h3 ref={doneRef} tabIndex={-1} className="mt-4 text-lg font-bold text-neutral-950 outline-none">
            ধন্যবাদ, {values.name.trim() || "আপনার মেসেজ"} তৈরি!
          </h3>
          <p className="mx-auto mt-2 max-w-[40ch] text-[15px] leading-relaxed text-neutral-700">{status}</p>
          <div className="mt-5 flex flex-col justify-center gap-3 min-[420px]:flex-row">
            {chatHref ? (
              <a href={chatHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-5 text-[15px] font-semibold text-neutral-950 hover:bg-[#20bd5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-ink">
                আবার খুলুন
                <MaterialIcon name="open_in_new" className="text-[18px]" />
              </a>
            ) : null}
            <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-300 bg-white px-5 text-[15px] font-semibold text-neutral-950 hover:border-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-ink">
              আরেকটি মেসেজ লিখুন
            </button>
          </div>
        </div>
      ) : (
        <form ref={formRef} onSubmit={submit} noValidate className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field {...fieldProps("name")}>
              <input
                id={id("name")}
                name="name"
                autoComplete="name"
                required
                maxLength={LIMITS.name}
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                onBlur={() => blur("name")}
                placeholder={f.name.placeholder}
                aria-invalid={!!fieldError("name")}
                aria-describedby={describedBy("name")}
                className={cn(inputCls, "h-12", border("name"))}
              />
            </Field>
            <Field {...fieldProps("phone")}>
              <input
                id={id("phone")}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                onBlur={() => blur("phone")}
                placeholder={f.phone.placeholder}
                aria-invalid={!!fieldError("phone")}
                aria-describedby={describedBy("phone")}
                className={cn(inputCls, "h-12", border("phone"))}
              />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-neutral-800">দ্রুত টপিক বেছে নিন</legend>
            <div className="flex flex-wrap gap-2">
              {CONTACT_TOPICS.map((topic) => {
                const active = values.subject.trim() === topic;
                return (
                  <button
                    key={topic}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      set("subject", active ? "" : topic);
                      if (!active) setErrors((prev) => ({ ...prev, subject: undefined }));
                    }}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-1 rounded-full border px-4 text-sm font-semibold transition-colors motion-reduce:transition-none",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-ink",
                      active
                        ? "border-primary-ink bg-primary-ink text-white"
                        : "border-neutral-300 bg-white text-neutral-800 hover:border-primary/60 hover:bg-primary/5",
                    )}
                  >
                    {active ? <MaterialIcon name="check" className="text-[16px]" /> : null}
                    {topic}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Field {...fieldProps("subject")}>
            <input
              id={id("subject")}
              name="subject"
              required
              maxLength={LIMITS.subject}
              value={values.subject}
              onChange={(e) => set("subject", e.target.value)}
              onBlur={() => blur("subject")}
              placeholder={f.subject.placeholder}
              aria-invalid={!!fieldError("subject")}
              aria-describedby={describedBy("subject")}
              className={cn(inputCls, "h-12", border("subject"))}
            />
          </Field>

          <Field
            {...fieldProps("message")}
            hint={
              <span
                id={id("count")}
                className={cn("text-xs tabular-nums", count > LIMITS.message ? "font-bold text-red-700" : count > LIMITS.message * 0.9 ? "text-amber-700" : "text-neutral-500")}
              >
                {count.toLocaleString("bn-BD")}/{LIMITS.message.toLocaleString("bn-BD")}
                <span className="sr-only"> অক্ষর</span>
              </span>
            }
          >
            <textarea
              id={id("message")}
              name="message"
              required
              rows={5}
              value={values.message}
              onChange={(e) => set("message", e.target.value)}
              onBlur={() => blur("message")}
              placeholder={f.message.placeholder}
              aria-invalid={!!fieldError("message")}
              aria-describedby={describedBy("message", id("count"))}
              className={cn(inputCls, "min-h-36 resize-y py-3 leading-relaxed", border("message"))}
            />
          </Field>

          {/* Honeypot: hidden from people and assistive tech, bots fill it. */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor={id("website")}>Website</label>
            <input ref={honeypot} id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          {phase === "blocked" || phase === "unavailable" ? (
            <div className="flex flex-col gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 font-medium">
                <MaterialIcon name="warning" className="mt-0.5 text-[18px]" />
                {status}
              </p>
              {phase === "blocked" && chatHref ? (
                <a href={chatHref} target="_blank" rel="noopener noreferrer" onClick={() => finish("sent", "হোয়াটসঅ্যাপে আপনার মেসেজ তৈরি — সেখানে Send চাপুন।")} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-4 font-semibold text-neutral-950">
                  হোয়াটসঅ্যাপ খুলুন
                  <MaterialIcon name="open_in_new" className="text-[16px]" />
                </a>
              ) : null}
            </div>
          ) : null}

          {Object.values(errors).some(Boolean) && Object.keys(touched).length === 4 ? (
            <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-red-200">
              <MaterialIcon name="error" className="text-[18px]" />
              লাল চিহ্নিত ঘরগুলো ঠিক করে আবার চেষ্টা করুন।
            </p>
          ) : null}

          <button
            type="submit"
            disabled={phase === "sending"}
            aria-busy={phase === "sending"}
            className={cn(
              "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6",
              "bg-primary text-[15px] font-semibold text-on-primary shadow-lg shadow-primary/25 transition-colors motion-reduce:transition-none",
              "hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-ink disabled:cursor-wait disabled:opacity-80",
            )}
          >
            {phase === "sending" ? (
              <>
                <span aria-hidden className="size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />
                খোলা হচ্ছে…
              </>
            ) : (
              <>
                {form.cta || "পাঠান"}
                <MaterialIcon name="send" className="text-[18px]" />
              </>
            )}
          </button>
          {form.hint.trim() ? (
            <p className="flex items-center justify-center gap-1.5 text-center text-sm text-neutral-600">
              <MaterialIcon name="lock" className="text-[16px]" />
              {form.hint}
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}
