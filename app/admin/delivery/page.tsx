"use client";

import { useEffect, useState, type FormEvent } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  getAdminDeliveryRates,
  saveAdminDeliveryRates,
  type DeliveryRates,
} from "@/lib/mart-api/delivery";
import { MartApiError } from "@/lib/mart-api/products";
import { formatTaka } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

export default function AdminDeliveryPage() {
  const [stored, setStored] = useState<DeliveryRates | null>(null);
  const [draft, setDraft] = useState<{
    key: string;
    inside: string;
    suburban: string;
    outside: string;
    insideOn: boolean;
    suburbanOn: boolean;
    outsideOn: boolean;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminDeliveryRates()
      .then((rates) => {
        if (!cancelled) {
          setStored(rates);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof MartApiError
              ? reason.message
              : "Delivery rates could not be loaded.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const storedKey = stored
    ? `${stored.insideDhaka}|${stored.dhakaSuburban}|${stored.outsideDhaka}|${stored.insideEnabled}|${stored.suburbanEnabled}|${stored.outsideEnabled}`
    : "";
  const usingDraft = draft?.key === storedKey;
  const inside = usingDraft ? draft.inside : stored ? String(stored.insideDhaka) : "";
  const suburban = usingDraft ? draft.suburban : stored ? String(stored.dhakaSuburban) : "";
  const outside = usingDraft ? draft.outside : stored ? String(stored.outsideDhaka) : "";
  const insideOn = usingDraft ? draft.insideOn : (stored?.insideEnabled ?? true);
  const suburbanOn = usingDraft ? draft.suburbanOn : (stored?.suburbanEnabled ?? true);
  const outsideOn = usingDraft ? draft.outsideOn : (stored?.outsideEnabled ?? true);
  
  const insideValue = parseCharge(inside);
  const suburbanValue = parseCharge(suburban);
  const outsideValue = parseCharge(outside);
  
  const dirty =
    stored != null &&
    (inside !== String(stored.insideDhaka) ||
      suburban !== String(stored.dhakaSuburban) ||
      outside !== String(stored.outsideDhaka) ||
      insideOn !== stored.insideEnabled ||
      suburbanOn !== stored.suburbanEnabled ||
      outsideOn !== stored.outsideEnabled);
  const invalid =
    stored != null &&
    (insideValue == null || suburbanValue == null || outsideValue == null);
  const openCount = [insideOn, suburbanOn, outsideOn].filter(Boolean).length;

  function edit(next: {
    inside: string;
    suburban: string;
    outside: string;
    insideOn: boolean;
    suburbanOn: boolean;
    outsideOn: boolean;
  }) {
    setDraft({ key: storedKey, ...next });
    setSaved(false);
    setError(null);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (insideValue == null || suburbanValue == null || outsideValue == null || saving) return;
    setSaving(true);
    setError(null);
    try {
      const next = await saveAdminDeliveryRates({
        insideDhaka: insideValue,
        dhakaSuburban: suburbanValue,
        outsideDhaka: outsideValue,
        insideEnabled: insideOn,
        suburbanEnabled: suburbanOn,
        outsideEnabled: outsideOn,
      });
      setStored(next);
      setDraft(null);
      setSaved(true);
    } catch (reason) {
      setError(
        reason instanceof MartApiError
          ? reason.message
          : "Delivery rates could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  const status = error
    ? error
    : stored == null
      ? "Loading rates"
      : invalid
        ? "Enter all three rates"
        : saving
          ? "Saving..."
          : dirty
            ? "Unsaved changes"
            : saved
              ? "Saved successfully"
              : "Up to date";

  return (
    <div className="w-full pb-10">
      <form onSubmit={save} className="overflow-hidden bg-white shadow-sm ring-1 ring-neutral-200/90 sm:rounded-2xl">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-neutral-100 bg-white/90 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-neutral-950">Delivery zones</h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              Turn any zone off, or all three. Checkout hides a closed zone. If none fit, the order cannot be placed.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <p className={cn("text-xs font-semibold", error ? "text-red-600" : dirty ? "text-amber-600" : "text-emerald-600")}>
              {status}
            </p>
            <button
              type="submit"
              disabled={!dirty || invalid || saving || stored == null}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg px-5 text-sm font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                !dirty || invalid || saving || stored == null
                  ? "bg-neutral-100 text-neutral-400"
                  : "bg-neutral-950 text-white hover:bg-neutral-800 active:scale-95",
              )}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        {/* Main Content - Full Width Grid */}
        <div className="p-4 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <ZoneCard
              id="inside-dhaka"
              icon="location_city"
              title="Inside Dhaka"
              detail="Dhaka city. Dhanmondi, Uttara, Mirpur, Gulshan, and the rest of the city centre."
              value={inside}
              stored={stored?.insideDhaka ?? null}
              on={insideOn}
              invalid={inside.trim() !== "" && insideValue == null}
              disabled={stored == null || saving}
              onChange={(value) =>
                edit({ inside: value, suburban, outside, insideOn, suburbanOn, outsideOn })
              }
              onToggle={() =>
                edit({ inside, suburban, outside, insideOn: !insideOn, suburbanOn, outsideOn })
              }
            />
            <ZoneCard
              id="dhaka-suburban"
              icon="maps_home_work"
              title="Dhaka Suburban"
              detail="Still in Dhaka district, but farther out. Savar, Keraniganj, Dhamrai, Dohar, Nawabganj."
              value={suburban}
              stored={stored?.dhakaSuburban ?? null}
              on={suburbanOn}
              invalid={suburban.trim() !== "" && suburbanValue == null}
              disabled={stored == null || saving}
              onChange={(value) =>
                edit({ inside, suburban: value, outside, insideOn, suburbanOn, outsideOn })
              }
              onToggle={() =>
                edit({ inside, suburban, outside, insideOn, suburbanOn: !suburbanOn, outsideOn })
              }
            />
            <ZoneCard
              id="outside-dhaka"
              icon="public"
              title="Outside Dhaka"
              detail="Every other district. A blank district counts as outside."
              value={outside}
              stored={stored?.outsideDhaka ?? null}
              on={outsideOn}
              invalid={outside.trim() !== "" && outsideValue == null}
              disabled={stored == null || saving}
              onChange={(value) =>
                edit({ inside, suburban, outside: value, insideOn, suburbanOn, outsideOn })
              }
              onToggle={() =>
                edit({ inside, suburban, outside, insideOn, suburbanOn, outsideOn: !outsideOn })
              }
            />
          </div>

          {openCount === 0 ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-900 ring-1 ring-amber-200/60">
              <MaterialIcon name="warning" className="text-[18px] text-amber-600" />
              All three zones are off. Customers cannot place a delivery order until you turn one on.
            </div>
          ) : null}
        </div>

        {/* Customer Preview Footer */}
        <div className="flex flex-col gap-2 border-t border-neutral-200/80 bg-neutral-950 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <MaterialIcon name="visibility" className="text-[16px]" />
            Customer sees
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-white">
            <span className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1">
              City <span className={insideOn && insideValue != null ? "text-white" : "text-neutral-500"}>{zoneOffer(insideOn, insideValue)}</span>
            </span>
            <span className="text-neutral-600">·</span>
            <span className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1">
              Suburban <span className={suburbanOn && suburbanValue != null ? "text-white" : "text-neutral-500"}>{zoneOffer(suburbanOn, suburbanValue)}</span>
            </span>
            <span className="text-neutral-600">·</span>
            <span className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1">
              Outside <span className={outsideOn && outsideValue != null ? "text-white" : "text-neutral-500"}>{zoneOffer(outsideOn, outsideValue)}</span>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}

function ZoneCard({
  id,
  icon,
  title,
  detail,
  value,
  stored,
  on,
  invalid,
  disabled,
  onChange,
  onToggle,
}: {
  id: string;
  icon: string;
  title: string;
  detail: string;
  value: string;
  stored: number | null;
  on: boolean;
  invalid: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  const changed = stored != null && value !== String(stored);
  
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border p-4 transition-all duration-200",
        invalid 
          ? "border-red-300 bg-red-50/30 ring-1 ring-red-400" 
          : changed 
            ? "border-amber-300 bg-amber-50/30 ring-1 ring-amber-400" 
            : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md",
        !on && "opacity-60 grayscale-[30%] bg-neutral-50",
      )}
    >
      {/* Header & Toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg ring-1",
            on ? "bg-primary/10 text-primary ring-primary/20" : "bg-neutral-100 text-neutral-500 ring-neutral-200"
          )}>
            <MaterialIcon name={icon} className="text-[18px]" />
          </div>
          <div>
            <span className="block text-sm font-semibold text-neutral-950">{title}</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-neutral-500">{detail}</span>
          </div>
        </div>
        
        {/* Toggle Switch */}
        <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={on}
            disabled={disabled}
            onChange={onToggle}
            aria-label={`${title} ${on ? "on" : "off"}`}
          />
          <div className="h-5 w-9 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-neutral-950 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40 peer-disabled:opacity-50"></div>
        </label>
      </div>

      {/* Price Input */}
      <div className="mt-4">
        <label htmlFor={id} className="relative block">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-neutral-400">
            ৳
          </span>
          <input
            id={id}
            inputMode="numeric"
            value={value}
            aria-invalid={invalid}
            disabled={disabled || !on}
            onChange={(event) => onChange(event.target.value)}
            className={cn(
              "h-11 w-full rounded-lg border bg-white pr-3 pl-8 text-lg font-bold tabular-nums outline-none transition-colors",
              invalid
                ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-neutral-200 text-neutral-950 focus:border-primary focus:ring-2 focus:ring-primary/20",
              "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
            )}
          />
        </label>
        
        {/* Helper Text */}
        <div className="mt-1.5 flex h-4 items-center">
          {invalid ? (
            <span className="text-[11px] font-medium text-red-600">
              Use 0 or a larger whole number, up to 1,000,000.
            </span>
          ) : !on ? (
            <span className="text-[11px] text-neutral-500">
              Off. Customers cannot choose this zone.
            </span>
          ) : changed && stored != null ? (
            <span className="text-[11px] font-medium text-amber-600">
              Previously {formatTaka(stored)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function zoneOffer(on: boolean, amount: number | null) {
  if (!on) return "Off";
  if (amount == null) return "—";
  return formatTaka(amount);
}

function parseCharge(value: string) {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const amount = Number(trimmed);
  if (!Number.isSafeInteger(amount) || amount > 1_000_000) return null;
  return amount;
}