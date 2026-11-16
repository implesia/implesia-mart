"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatDhakaDateTime } from "@/lib/admin/order-timestamps";
import { listReadyToPack } from "@/lib/mart-api/orders-desk";
import type { MartOrder } from "@/lib/mart-api/orders";
import { MartApiError } from "@/lib/mart-api/products";
import { formatTaka } from "@/lib/mart-mock/store";

import { AdminEmpty, AdminPageHeader } from "../../_components/admin-ui";
import { OriginBadge } from "./order-badges";

export function ReadyToPack() {
  const [items, setItems] = useState<MartOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [kind, setKind] = useState("both");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void listReadyToPack({ page: 1, pageSize: 50, status: "confirmed" })
      .then((next) => {
        if (!cancelled) {
          setItems(next.items);
          setTotal(next.total);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof MartApiError ? reason.message : "Could not load orders ready to pack.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ids = items.map((order) => order.id);
  const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader
        title="Ready to pack"
        description="Confirmed orders. Print an invoice, a 4×6 label, or both, then mark them packed."
      />
      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
      {loading ? <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-busy="true" /> : null}
      {!loading && items.length === 0 ? <AdminEmpty title="Nothing to pack" detail="Confirm an order and it will wait here." /> : null}
      {items.length > 0 ? (
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
          <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 sm:flex-row sm:items-center">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allSelected}
                aria-label="Select all"
                onChange={() => setSelected(allSelected ? [] : ids)}
              />
              Select all{total > items.length ? ` on this page (${items.length} of ${total})` : ""}
            </label>
            <select aria-label="What to print" value={kind} onChange={(event) => setKind(event.target.value)} className="h-10 rounded-full border border-neutral-200 px-3 text-sm">
              <option value="invoice">Invoice</option>
              <option value="label">Label</option>
              <option value="both">Invoice and label</option>
            </select>
            <Link
              href={selected.length ? `/admin/orders/print?ids=${selected.join(",")}&kind=${kind}` : "/admin/orders/ready-to-pack"}
              aria-disabled={selected.length === 0}
              className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-white ${selected.length ? "bg-neutral-950" : "pointer-events-none bg-neutral-300"}`}
            >
              Print and download PDF
            </Link>
          </div>
          <ul className="divide-y divide-neutral-100">
            {items.map((order) => (
              <li key={order.id} className="flex items-start gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.includes(order.id)}
                  aria-label={`Select ${order.number}`}
                  onChange={(event) => setSelected((current) => event.target.checked ? [...current, order.id] : current.filter((id) => id !== order.id))}
                />
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-neutral-950 hover:text-primary">{order.number}</Link>
                  <p className="truncate text-sm text-neutral-600">{order.customerName} · {order.phone}</p>
                  <p className="text-xs text-neutral-500">{formatDhakaDateTime(order.orderedAt ?? order.createdAt)} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} pcs</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <OriginBadge origin={order.origin} />
                  <span className="text-sm font-semibold tabular-nums">{formatTaka(order.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
