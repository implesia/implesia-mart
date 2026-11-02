"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  parsePercent,
  parseTierRows,
  percentText,
  priceLine,
  tierRowsFrom,
  type TierRow,
} from "@/lib/mart-api/pricing";
import {
  getAdminPricingSettings,
  saveAdminPricingSettings,
  type PricingSettings,
} from "@/lib/mart-api/pricing-settings";
import { MartApiError } from "@/lib/mart-api/products";
import { formatTaka } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { adminFieldClass } from "../_components/admin-ui";
import { QuantityTiersEditor } from "../_components/quantity-tiers-editor";

type Draft = { enabled: boolean; cap: string; rows: TierRow[] };

function toDraft(settings: PricingSettings): Draft {
  return {
    enabled: settings.tiersEnabled,
    cap: percentText(settings.maxDiscountPercent),
    rows: tierRowsFrom(settings.tiers),
  };
}

// Worked example for the preview: ৳1,000 regular price with a 28 % base discount.
const EXAMPLE = { regular: 1000, price: 720, basePercent: 28 };

export default function AdminPricingPage() {
  const [stored, setStored] = useState<PricingSettings | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminPricingSettings()
      .then((settings) => {
        if (cancelled) return;
        setStored(settings);
        setDraft(toDraft(settings));
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof MartApiError
              ? reason.message
              : "Discount settings could not be loaded.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cap = draft ? parsePercent(draft.cap) : null;
  const capError =
    draft && (cap == null || !draft.cap.trim())
      ? "Enter a maximum discount from 0 to 99.99%."
      : undefined;
  const parsed = draft ? parseTierRows(draft.rows) : null;
  const tierError = parsed?.error ?? undefined;
  const invalid = Boolean(capError || tierError);
  const dirty =
    stored != null &&
    draft != null &&
    JSON.stringify(draft) !== JSON.stringify(toDraft(stored));

  function edit(patch: Partial<Draft>) {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
    setSaved(false);
    setError(null);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft || invalid || saving || cap == null || !parsed?.tiers) return;
    setSaving(true);
    setError(null);
    try {
      const next = await saveAdminPricingSettings({
        tiersEnabled: draft.enabled,
        maxDiscountPercent: cap,
        tiers: parsed.tiers,
      });
      setStored(next);
      setDraft(toDraft(next));
      setSaved(true);
    } catch (reason) {
      setError(
        reason instanceof MartApiError
          ? reason.message
          : "Discount settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  const status = error
    ? error
    : stored == null
      ? "Loading"
      : invalid
        ? "Fix the highlighted fields"
        : saving
          ? "Saving"
          : dirty
            ? "Not saved yet"
            : saved
              ? "Saved"
              : "Up to date";

  const example =
    draft && parsed?.tiers && cap != null
      ? [1, ...parsed.tiers.map((tier) => tier.minQuantity)].map((quantity) =>
          priceLine({
            ...EXAMPLE,
            quantity,
            tiers: draft.enabled ? parsed.tiers : [],
            maxPercent: cap,
          }),
        )
      : [];
  const exampleQuantities = draft && parsed?.tiers
    ? [1, ...parsed.tiers.map((tier) => tier.minQuantity)]
    : [];

  return (
    <form
      onSubmit={save}
      className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
      data-testid="admin-pricing"
    >
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-neutral-950">Quantity discounts</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Each product has a regular price and a base discount %. Buying more pieces adds the
            extra % below, worked out on the regular price. The total never goes above the
            maximum.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className={cn("text-sm", error ? "text-red-600" : "text-neutral-500")}>{status}</p>
          <button
            type="submit"
            disabled={!dirty || invalid || saving || stored == null}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium",
              !dirty || invalid || saving || stored == null
                ? "bg-neutral-100 text-neutral-500"
                : "bg-neutral-950 text-white hover:bg-black",
            )}
          >
            Save
          </button>
        </div>
      </div>

      {draft ? (
        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 rounded-2xl bg-[#f7f8fa] p-4">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-neutral-950">
                  Store-wide tiers
                </span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  Off: products on store-wide tiers get only their base discount. Products with
                  custom tiers keep them.
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={draft.enabled}
                aria-label={`Store-wide tiers ${draft.enabled ? "on" : "off"}`}
                disabled={saving}
                onClick={() => edit({ enabled: !draft.enabled })}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold",
                  draft.enabled
                    ? "bg-neutral-950 text-white"
                    : "bg-white text-neutral-500 ring-1 ring-neutral-200",
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    draft.enabled ? "bg-emerald-400" : "bg-neutral-300",
                  )}
                />
                {draft.enabled ? "On" : "Off"}
              </button>
            </div>
            <div>
              <label htmlFor="pricing-cap" className="text-sm font-medium text-neutral-800">
                Maximum total discount %
              </label>
              <input
                id="pricing-cap"
                inputMode="decimal"
                value={draft.cap}
                onChange={(event) => edit({ cap: event.target.value })}
                aria-invalid={capError ? true : undefined}
                className={cn(adminFieldClass, "mt-1.5", capError && "border-red-400")}
              />
              <p className={cn("mt-1.5 text-xs", capError ? "text-red-700" : "text-neutral-500")}>
                {capError ?? "Base + quantity discount is capped here. It can never reach 100%."}
              </p>
            </div>
            <QuantityTiersEditor
              id="pricing-tiers"
              rows={draft.rows}
              onChange={(rows) => edit({ rows })}
              error={tierError}
            />
          </div>
          <div className="rounded-2xl bg-[#f7f8fa] p-4">
            <p className="text-sm font-semibold text-neutral-950">Example</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Regular {formatTaka(EXAMPLE.regular)}, base discount {EXAMPLE.basePercent}%.
            </p>
            <table className="mt-3 w-full text-sm tabular-nums">
              <thead>
                <tr className="text-left text-xs text-neutral-500">
                  <th className="py-1 font-medium">Pieces</th>
                  <th className="py-1 font-medium">Discount</th>
                  <th className="py-1 text-right font-medium">Each</th>
                </tr>
              </thead>
              <tbody>
                {example.map((line, index) => (
                  <tr key={exampleQuantities[index]} className="border-t border-neutral-200/70">
                    <td className="py-1.5">{exampleQuantities[index]}</td>
                    <td className="py-1.5">{percentText(line.totalPercent)}%</td>
                    <td className="py-1.5 text-right">{formatTaka(line.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="p-5 text-sm text-neutral-500">{error ?? "Loading discount settings…"}</p>
      )}
    </form>
  );
}
