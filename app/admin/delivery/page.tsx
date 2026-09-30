"use client";

import { useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { useDeliveryCharges } from "@/lib/mart-mock/hooks";
import { formatTaka, saveDeliveryCharges } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

export default function AdminDeliveryPage() {
  const stored = useDeliveryCharges();
  const storedKey = `${stored.insideDhaka}|${stored.outsideDhaka}`;
  const [draft, setDraft] = useState<{
    key: string;
    inside: string;
    outside: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);

  const inside = draft?.key === storedKey ? draft.inside : String(stored.insideDhaka);
  const outside = draft?.key === storedKey ? draft.outside : String(stored.outsideDhaka);
  const insideValue = parseCharge(inside);
  const outsideValue = parseCharge(outside);
  const dirty = inside !== String(stored.insideDhaka) || outside !== String(stored.outsideDhaka);
  const invalid = insideValue == null || outsideValue == null;

  function edit(next: { inside: string; outside: string }) {
    setDraft({ key: storedKey, ...next });
    setSaved(false);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (insideValue == null || outsideValue == null) return;
    saveDeliveryCharges({ insideDhaka: insideValue, outsideDhaka: outsideValue });
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-neutral-950">Two rates</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Checkout picks the rate from the customer’s district.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-neutral-500">
            {invalid ? "Enter both rates" : dirty ? "Not saved yet" : saved ? "Saved" : "Up to date"}
          </p>
          <button
            type="submit"
            disabled={!dirty || invalid}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium",
              !dirty || invalid
                ? "bg-neutral-100 text-neutral-400"
                : "bg-neutral-950 text-white hover:bg-black",
            )}
          >
            Save rates
          </button>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
        <ZoneCard
          id="inside-dhaka"
          icon="location_city"
          title="Inside Dhaka"
          detail="District is ঢাকা or Dhaka."
          value={inside}
          stored={stored.insideDhaka}
          invalid={inside.trim() !== "" && insideValue == null}
          onChange={(value) => edit({ inside: value, outside })}
        />
        <ZoneCard
          id="outside-dhaka"
          icon="public"
          title="Outside Dhaka"
          detail="Every other district. A blank district counts as outside."
          value={outside}
          stored={stored.outsideDhaka}
          invalid={outside.trim() !== "" && outsideValue == null}
          onChange={(value) => edit({ inside, outside: value })}
        />
      </div>

      <div className="flex flex-col gap-1 border-t border-neutral-100 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-neutral-500">Customer sees</p>
        <p className="font-medium text-neutral-950">
          Dhaka {insideValue == null ? "—" : formatTaka(insideValue)}
          <span className="mx-2 text-neutral-300">·</span>
          Other districts {outsideValue == null ? "—" : formatTaka(outsideValue)}
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
  invalid,
  onChange,
}: {
  id: string;
  icon: string;
  title: string;
  detail: string;
  value: string;
  stored: number;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const changed = value !== String(stored);
  return (
    <label
      htmlFor={id}
      className={cn(
        "block rounded-2xl bg-[#f7f8fa] p-4 ring-1 sm:p-5",
        invalid ? "ring-red-200" : changed ? "ring-amber-200" : "ring-transparent",
      )}
    >
      <span className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-primary ring-1 ring-neutral-200/80">
          <MaterialIcon name={icon} className="text-[22px]" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-neutral-950">{title}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{detail}</span>
        </span>
      </span>
      <span className="relative mt-4 block">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg font-semibold text-neutral-400">
          ৳
        </span>
        <input
          id={id}
          inputMode="decimal"
          value={value}
          aria-invalid={invalid}
          onChange={(event) => onChange(event.target.value)}
          className="h-14 w-full rounded-2xl border border-neutral-200 bg-white pr-4 pl-10 text-2xl font-semibold tabular-nums text-neutral-950 outline-none focus:border-primary focus:ring-3 focus:ring-primary/25"
        />
      </span>
      <span className={cn("mt-2 block text-xs", invalid ? "text-red-600" : "text-neutral-500")}>
        {invalid
          ? "Use 0 or a larger number."
          : changed
            ? `Was ${formatTaka(stored)}`
            : "Saved"}
      </span>
    </label>
  );
}

function parseCharge(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}
