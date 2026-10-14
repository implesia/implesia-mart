"use client";

import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { getBannerSettings, updateBannerSettings, type BannerSettingsInput } from "@/lib/mart-api/hero";
import { cn } from "@/lib/utils";

import { adminButtonClass, adminFieldClass, AdminLoading, FieldError, FieldLabel } from "../../_components/admin-ui";
import { sameFormSnapshot } from "../../_components/form-close-guard";

type TextKey = "brandName" | "trustLine" | "ariaLabel" | "previousLabel" | "nextLabel" | "slideLabel";
type NumberKey = "autoplayDelayMs" | "transitionSpeedMs";
type FlagKey = "pauseOnHover" | "loop" | "keyboardEnabled" | "disableOnInteraction" | "crossFade";

const TEXT_FIELDS: { key: TextKey; label: string; help: string; max: number; wide?: boolean }[] = [
  { key: "brandName", label: "Brand name", help: "Small label above the slides and in the fallback banner.", max: 80 },
  { key: "trustLine", label: "Trust line", help: "One short promise shown under the slides, e.g. delivery or returns.", max: 200, wide: true },
  { key: "previousLabel", label: "Previous button label", help: "Read by screen readers on the ‹ button.", max: 80 },
  { key: "nextLabel", label: "Next button label", help: "Read by screen readers on the › button.", max: 80 },
  { key: "slideLabel", label: "Dot label", help: "Prefix for each dot, e.g. “Slide” → “Slide 2”.", max: 40 },
  { key: "ariaLabel", label: "Section name (screen readers)", help: "Names the whole banner region.", max: 120 },
];

const NUMBER_FIELDS: { key: NumberKey; label: string; help: string; min: number; max: number }[] = [
  { key: "autoplayDelayMs", label: "Time per slide (ms)", help: "1000–60000. 6500 ≈ 6.5 seconds.", min: 1000, max: 60000 },
  { key: "transitionSpeedMs", label: "Transition speed (ms)", help: "100–5000.", min: 100, max: 5000 },
];

const FLAG_FIELDS: { key: FlagKey; label: string }[] = [
  { key: "crossFade", label: "Fade between slides (instead of sliding)" },
  { key: "loop", label: "Loop back to the first slide" },
  { key: "pauseOnHover", label: "Pause while the pointer is over the banner" },
  { key: "keyboardEnabled", label: "Allow arrow keys to change slides" },
  { key: "disableOnInteraction", label: "Stop autoplay after a visitor changes slide" },
];

export function validateBannerSettings(draft: BannerSettingsInput): Partial<Record<TextKey | NumberKey, string>> {
  const errors: Partial<Record<TextKey | NumberKey, string>> = {};
  for (const field of TEXT_FIELDS) {
    const value = draft[field.key].trim();
    if (!value) errors[field.key] = "Required.";
    else if (value.length > field.max) errors[field.key] = `Keep it under ${field.max} characters.`;
  }
  for (const field of NUMBER_FIELDS) {
    const value = draft[field.key];
    if (!Number.isInteger(value) || value < field.min || value > field.max) {
      errors[field.key] = `Use a whole number from ${field.min} to ${field.max}.`;
    }
  }
  return errors;
}

export function BannerSettingsEditor() {
  const [saved, setSaved] = useState<BannerSettingsInput | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let live = true;
    getBannerSettings()
      .then((value) => live && setSaved(value))
      .catch((error: unknown) => live && setLoadError(error instanceof Error ? error.message : "Could not load banner settings."));
    return () => {
      live = false;
    };
  }, []);

  if (loadError) {
    return <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{loadError}</p>;
  }
  if (!saved) return <div className="mb-4"><AdminLoading /></div>;
  return <BannerSettingsForm saved={saved} onSaved={setSaved} />;
}

function BannerSettingsForm({
  saved,
  onSaved,
}: {
  saved: BannerSettingsInput;
  onSaved: (next: BannerSettingsInput) => void;
}) {
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [touched, setTouched] = useState(false);
  const baseId = useId();
  const dirty = !sameFormSnapshot(saved, draft);
  const errors = validateBannerSettings(draft);
  const invalid = Object.keys(errors).length > 0;

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function set<K extends keyof BannerSettingsInput>(key: K, value: BannerSettingsInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice(null);
  }

  async function save() {
    setTouched(true);
    if (invalid || !dirty) return;
    setSaving(true);
    try {
      const next = await updateBannerSettings(draft);
      onSaved(next);
      setDraft(next);
      setNotice({ ok: true, text: "Saved. The home page updates within about a minute." });
    } catch (error) {
      setNotice({ ok: false, text: error instanceof Error ? error.message : "Could not save banner settings." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-labelledby={`${baseId}-title`}
      className="mb-4 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
    >
      <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
        <h2 id={`${baseId}-title`} className="text-base font-semibold text-neutral-950">
          Banner settings
        </h2>
        <p className="mt-0.5 text-sm text-neutral-600">Text and behaviour shared by every slide.</p>
      </div>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        className="grid gap-5 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <div className="min-w-0 space-y-5">
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-neutral-950">Text</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {TEXT_FIELDS.map((field) => {
                const id = `${baseId}-${field.key}`;
                const error = touched ? errors[field.key] : undefined;
                return (
                  <div key={field.key} className={field.wide ? "sm:col-span-2" : undefined}>
                    <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                    <input
                      id={id}
                      value={draft[field.key]}
                      maxLength={field.max}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={`${id}-help`}
                      onChange={(event) => set(field.key, event.target.value)}
                      className={cn(adminFieldClass, error && "border-red-400")}
                    />
                    <p id={`${id}-help`} className="mt-1 text-xs text-neutral-600">{field.help}</p>
                    <FieldError message={error} />
                  </div>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-neutral-950">Autoplay</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {NUMBER_FIELDS.map((field) => {
                const id = `${baseId}-${field.key}`;
                const error = touched ? errors[field.key] : undefined;
                return (
                  <div key={field.key}>
                    <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                    <input
                      id={id}
                      type="number"
                      inputMode="numeric"
                      min={field.min}
                      max={field.max}
                      step={100}
                      value={Number.isNaN(draft[field.key]) ? "" : draft[field.key]}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={`${id}-help`}
                      onChange={(event) => set(field.key, event.target.valueAsNumber)}
                      className={cn(adminFieldClass, error && "border-red-400")}
                    />
                    <p id={`${id}-help`} className="mt-1 text-xs text-neutral-600">{field.help}</p>
                    <FieldError message={error} />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid gap-2">
              {FLAG_FIELDS.map((field) => (
                <label key={field.key} className="flex items-center gap-2.5 text-sm text-neutral-800">
                  <input
                    type="checkbox"
                    checked={draft[field.key]}
                    onChange={(event) => set(field.key, event.target.checked)}
                    className="size-4 rounded accent-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  />
                  {field.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <BannerPreview draft={draft} />

        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <button type="submit" disabled={!dirty || saving} className={adminButtonClass.primary}>
            {saving ? "Saving…" : "Save banner settings"}
          </button>
          {dirty && !saving ? (
            <button type="button" onClick={() => { setDraft(saved); setTouched(false); }} className={adminButtonClass.secondary}>
              Discard changes
            </button>
          ) : null}
          {dirty && !saving ? <p className="text-xs text-neutral-600">Not saved yet.</p> : null}
          {notice ? (
            <p role={notice.ok ? "status" : "alert"} className={notice.ok ? "text-sm font-medium text-emerald-800" : "text-sm text-red-700"}>
              {notice.text}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function BannerPreview({ draft }: { draft: BannerSettingsInput }) {
  return (
    <div aria-label="Preview" role="group" className="min-w-0">
      <p className="mb-2 text-sm font-semibold text-neutral-950">Preview</p>
      <div className="rounded-2xl bg-[#071820] p-4 text-white">
        <p className="truncate text-[11px] font-semibold tracking-[0.16em] text-[#8ed4c1] uppercase">
          {draft.brandName.trim() || "Implesia Mart"}
        </p>
        <p className="mt-2 text-lg font-semibold">Slide title</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-1.5 w-5 rounded-full bg-white" />
            <span className="size-1.5 rounded-full bg-white/45" />
          </span>
          <span className="flex gap-1.5">
            <span title={draft.previousLabel} className="grid size-7 place-items-center rounded-full bg-white/15">
              <MaterialIcon name="chevron_left" className="text-[18px]" />
            </span>
            <span title={draft.nextLabel} className="grid size-7 place-items-center rounded-full bg-white/15">
              <MaterialIcon name="chevron_right" className="text-[18px]" />
            </span>
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-neutral-700">{draft.trustLine.trim() || "—"}</p>
      <p className="mt-2 text-xs text-neutral-600">
        {draft.crossFade ? "Fades" : "Slides"} every {(draft.autoplayDelayMs / 1000 || 0).toFixed(1)} s ·
        buttons: “{draft.previousLabel}” / “{draft.nextLabel}”
      </p>
    </div>
  );
}
