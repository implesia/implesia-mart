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
          ? "Saving"
          : dirty
            ? "Not saved yet"
            : saved
              ? "Saved"
              : "Up to date";

  return (
    <form
      onSubmit={save}
      className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
    >
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-neutral-950">Delivery zones</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Turn any zone off, or all three. Checkout hides a closed zone. An address
            can still use a farther zone that is on. If none fit, the order cannot be placed.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p
            className={cn(
              "text-sm",
              error ? "text-red-600" : "text-neutral-500",
            )}
          >
            {status}
          </p>
          <button
            type="submit"
            disabled={!dirty || invalid || saving || stored == null}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium",
              !dirty || invalid || saving || stored == null
                ? "bg-neutral-100 text-neutral-400"
                : "bg-neutral-950 text-white hover:bg-black",
            )}
          >
            Save
          </button>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-3">
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
        <p className="mx-4 mb-1 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 sm:mx-5">
          All three zones are off. Customers cannot place a delivery order until you turn one on.
        </p>
      ) : null}

      <div className="flex flex-col gap-1 border-t border-neutral-100 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-neutral-500">Customer sees</p>
        <p className="font-medium text-neutral-950">
          City {zoneOffer(insideOn, insideValue)}
          <span className="mx-2 text-neutral-300">·</span>
          Suburban {zoneOffer(suburbanOn, suburbanValue)}
          <span className="mx-2 text-neutral-300">·</span>
          Outside {zoneOffer(outsideOn, outsideValue)}
        </p>
      </div>
    </form>
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
        "rounded-2xl bg-[#f7f8fa] p-4 ring-1 sm:p-5",
        invalid ? "ring-red-200" : changed ? "ring-amber-200" : "ring-transparent",
        !on && "bg-neutral-100",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-primary ring-1 ring-neutral-200/80">
          <MaterialIcon name={icon} className="text-[22px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-neutral-950">{title}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{detail}</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={`${title} ${on ? "on" : "off"}`}
          disabled={disabled}
          onClick={onToggle}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold",
            on ? "bg-neutral-950 text-white" : "bg-white text-neutral-500 ring-1 ring-neutral-200",
            disabled && "opacity-60",
          )}
        >
          <span className={cn("size-2 rounded-full", on ? "bg-emerald-400" : "bg-neutral-300")} />
          {on ? "On" : "Off"}
        </button>
      </div>
      <label htmlFor={id} className="relative mt-4 block">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg font-semibold text-neutral-400">
          ৳
        </span>
        <input
          id={id}
          inputMode="numeric"
          value={value}
          aria-invalid={invalid}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-14 w-full rounded-2xl border border-neutral-200 bg-white pr-4 pl-10 text-2xl font-semibold tabular-nums text-neutral-950 outline-none focus:border-primary focus:ring-3 focus:ring-primary/25 disabled:text-neutral-400"
        />
      </label>
      <span className={cn("mt-2 block text-xs", invalid ? "text-red-600" : "text-neutral-500")}>
        {invalid
          ? "Use 0 or a larger whole number, up to 1,000,000."
          : !on
            ? "Off. Customers cannot choose this zone."
            : changed && stored != null
              ? `Was ${formatTaka(stored)}`
              : stored == null
                ? "Loading"
                : "On"}
      </span>
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
