"use client";

import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { useDeliveryCharges } from "@/lib/mart-mock/hooks";
import { formatTaka, saveDeliveryCharges } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { FieldError } from "../_components/admin-ui";

export default function AdminDeliveryPage() {
  const stored = useDeliveryCharges();
  const [inside, setInside] = useState(String(stored.insideDhaka));
  const [outside, setOutside] = useState(String(stored.outsideDhaka));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setInside(String(stored.insideDhaka));
    setOutside(String(stored.outsideDhaka));
  }, [stored.insideDhaka, stored.outsideDhaka]);

  const insideValue = parseCharge(inside);
  const outsideValue = parseCharge(outside);
  const dirty = inside !== String(stored.insideDhaka) || outside !== String(stored.outsideDhaka);

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (insideValue == null || outsideValue == null) {
      setSaved(false);
      setError("দুই চার্জই ০ বা তার বেশি সংখ্যা হতে হবে।");
      return;
    }
    saveDeliveryCharges({ insideDhaka: insideValue, outsideDhaka: outsideValue });
    setError(null);
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-950">২টি ডেলিভারি জোন</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            জেলা ঢাকা হলে ভেতরের চার্জ, না হলে বাইরের চার্জ। সেভ হলে চেকআউট সামারি এই রেট নেয়।
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && !dirty ? <p className="text-sm font-medium text-primary">সেভ হয়েছে</p> : null}
          {dirty ? <p className="text-sm text-neutral-500">পরিবর্তন সেভ হয়নি</p> : null}
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            সেভ
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
        <ZoneCard
          id="inside-dhaka"
          icon="location_city"
          title="ঢাকার ভেতর"
          detail="জেলা ঢাকা বা Dhaka"
          value={inside}
          stored={stored.insideDhaka}
          onChange={(value) => {
            setInside(value);
            setSaved(false);
            setError(null);
          }}
        />
        <ZoneCard
          id="outside-dhaka"
          icon="public"
          title="ঢাকার বাইরে"
          detail="অন্য যেকোনো জেলা, খালি থাকলেও"
          value={outside}
          stored={stored.outsideDhaka}
          onChange={(value) => {
            setOutside(value);
            setSaved(false);
            setError(null);
          }}
        />
      </div>

      <div className="border-t border-neutral-100 px-4 py-4 sm:px-5">
        <FieldError message={error ?? undefined} />
        <p className="text-xs font-medium tracking-wide text-neutral-500">চেকআউটে যাবে</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <PreviewRow label="ঢাকা জেলা" value={insideValue} />
          <PreviewRow label="অন্য জেলা" value={outsideValue} />
        </div>
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
  onChange,
}: {
  id: string;
  icon: string;
  title: string;
  detail: string;
  value: string;
  stored: number;
  onChange: (value: string) => void;
}) {
  const changed = value !== String(stored);
  return (
    <label htmlFor={id} className="block rounded-2xl bg-[#f7f8fa] p-4 sm:p-5">
      <span className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-primary ring-1 ring-neutral-200/80">
          <MaterialIcon name={icon} className="text-[22px]" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-neutral-950">{title}</span>
          <span className="mt-0.5 block text-xs text-neutral-500">{detail}</span>
        </span>
      </span>
      <span className="relative mt-4 block">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg font-semibold text-neutral-400">
          ৳
        </span>
        <input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-14 w-full rounded-2xl border border-neutral-200 bg-white pr-4 pl-10 text-2xl font-semibold tabular-nums text-neutral-950 outline-none focus:border-primary focus:ring-3 focus:ring-primary/25"
        />
      </span>
      <span className={cn("mt-2 block text-xs", changed ? "text-neutral-500" : "text-neutral-400")}>
        {changed ? `সেভ করা আছে ${formatTaka(stored)}` : "এই রেট এখন সেভ করা"}
      </span>
    </label>
  );
}

function PreviewRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f8fa] px-4 py-3.5">
      <span className="text-sm text-neutral-600">{label}</span>
      <span className="text-lg font-semibold tabular-nums text-neutral-950">
        {value == null ? "—" : formatTaka(value)}
      </span>
    </div>
  );
}

function parseCharge(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}
