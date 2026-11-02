"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  BADGES_PER_PRODUCT_MAX,
  badgeToneClass,
  type AdminBadge,
  type AdminBadgeRef,
} from "@/lib/mart-api/badge-rules";
import { listMartBadges } from "@/lib/mart-api/badges";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

/**
 * Multi-select for a product's badges. Selection order is display order. Switched-off badges
 * are offered only when the product already had them, so an admin can keep or drop them.
 */
export function ProductBadgePicker({
  value,
  initial,
  onChange,
}: {
  value: AdminBadgeRef[];
  initial: AdminBadgeRef[];
  onChange: (next: AdminBadgeRef[]) => void;
}) {
  const [all, setAll] = useState<AdminBadge[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listMartBadges()
      .then((items) => {
        if (!cancelled) {
          setAll(items);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof MartApiError ? reason.message : "Badges could not be loaded.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const selectedIds = new Set(value.map((badge) => badge.id));
  const initialIds = new Set(initial.map((badge) => badge.id));
  const options: AdminBadgeRef[] = all
    ? all.filter((badge) => badge.isActive || selectedIds.has(badge.id) || initialIds.has(badge.id))
    : value;
  const full = value.length >= BADGES_PER_PRODUCT_MAX;

  function toggle(badge: AdminBadgeRef) {
    if (selectedIds.has(badge.id)) {
      onChange(value.filter((item) => item.id !== badge.id));
    } else if (!full) {
      onChange([...value, badge]);
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-neutral-700">Badges</p>
        <Link
          href="/admin/badges"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <MaterialIcon name="sell" className="text-[16px]" />
          Manage badges
        </Link>
      </div>

      {error ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setAttempt((count) => count + 1);
            }}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      {all === null && !error ? (
        <div className="flex gap-1.5" aria-busy="true" aria-label="Loading badges">
          {[0, 1, 2].map((key) => (
            <span key={key} className="h-9 w-20 animate-pulse rounded-full bg-neutral-100" />
          ))}
        </div>
      ) : options.length === 0 ? (
        <p className="rounded-xl bg-[#f5f6f8] px-3 py-2.5 text-xs text-neutral-500">
          No badges yet.{" "}
          <Link href="/admin/badges" className="font-medium text-primary hover:underline">
            Create one
          </Link>{" "}
          to attach it here.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Product badges">
          {options.map((badge) => {
            const on = selectedIds.has(badge.id);
            const position = value.findIndex((item) => item.id === badge.id) + 1;
            return (
              <button
                key={badge.id}
                type="button"
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => toggle(badge)}
                title={badge.isActive ? undefined : "Switched off: hidden on the storefront"}
                className={cn(
                  "inline-flex h-9 max-w-full items-center gap-1.5 rounded-full px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40",
                  on
                    ? "bg-neutral-950 text-white"
                    : "bg-[#f5f6f8] text-neutral-600 hover:bg-neutral-200",
                )}
              >
                <span
                  aria-hidden
                  className={cn("size-2.5 shrink-0 rounded-full ring-1 ring-black/10", badgeToneClass(badge.tone))}
                />
                <span className="truncate">{badge.name}</span>
                {!badge.isActive ? <span className="font-normal opacity-70">(off)</span> : null}
                {on && value.length > 1 ? (
                  <span className="ml-0.5 rounded-full bg-white/20 px-1.5 text-[10px] tabular-nums">
                    {position}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
      <p className="mt-1.5 text-xs text-neutral-500">
        Optional. Pick up to {BADGES_PER_PRODUCT_MAX}; they show in the order you pick them, and cards show the
        first two.
      </p>
    </div>
  );
}
