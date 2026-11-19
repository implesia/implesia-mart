"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Package, Printer, ChevronDown } from "lucide-react";

import { formatDhakaDateTime } from "@/lib/admin/order-timestamps";
import { listReadyToPack } from "@/lib/mart-api/orders-desk";
import type { MartOrder } from "@/lib/mart-api/orders";
import { MartApiError } from "@/lib/mart-api/products";
import { formatTaka } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { AdminPageHeader } from "../../_components/admin-ui";
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
    <div className="min-w-0 space-y-4 pb-10">
      <AdminPageHeader
        title="Ready to Pack"
        description="Confirmed orders. Print an invoice, a 4×6 label, or both, then mark them packed."
      />

      {error ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm" aria-busy="true">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-100">
            <Package className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-900">Nothing to pack</h2>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">
            Confirm an order and it will wait here for you to print the invoice or label.
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => setSelected(allSelected ? [] : ids)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Select all {total > items.length ? `(${items.length} of ${total} visible)` : ""}
            </label>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <select
                  aria-label="What to print"
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                  className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-auto"
                >
                  <option value="invoice">Invoice Only</option>
                  <option value="label">Shipping Label Only</option>
                  <option value="both">Invoice & Label</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>

              <Link
                href={selected.length ? `/admin/orders/print?ids=${selected.join(",")}&kind=${kind}` : "/admin/orders/ready-to-pack"}
                aria-disabled={selected.length === 0}
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-sm transition-all",
                  selected.length
                    ? "bg-slate-900 hover:bg-slate-800"
                    : "pointer-events-none bg-slate-300 text-slate-500"
                )}
              >
                <Printer className="h-4 w-4" />
                Print {selected.length > 0 ? `(${selected.length})` : ""}
              </Link>
            </div>
          </div>

          {/* Responsive Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[768px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-12 px-4 py-3 font-semibold">#</th>
                  <th className="w-12 px-4 py-3 font-semibold">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-4 py-3 font-semibold">Order Details</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((order, index) => {
                  const isSelected = selected.includes(order.id);
                  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  
                  return (
                    <tr key={order.id} className={cn("group transition-colors hover:bg-slate-50/80", isSelected && "bg-indigo-50/30")}>
                      <td className="px-4 py-3 text-xs font-medium tabular-nums text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          aria-label={`Select ${order.number}`}
                          onChange={(event) =>
                            setSelected((current) =>
                              event.target.checked ? [...current, order.id] : current.filter((id) => id !== order.id)
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-slate-900 transition-colors hover:text-indigo-600">
                          {order.number}
                        </Link>
                        <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                          {formatDhakaDateTime(order.orderedAt ?? order.createdAt)}
                        </span>
                        <span className="mt-1.5 inline-block">
                          <OriginBadge origin={order.origin} />
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block text-sm font-medium text-slate-800">{order.customerName}</span>
                        <span className="block text-[11px] font-medium text-slate-500">{order.phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/60">
                          {totalItems} {totalItems === 1 ? "item" : "items"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold tabular-nums text-slate-900">
                          {formatTaka(order.total)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}