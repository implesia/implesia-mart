"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  STOCK_MOVEMENT_TYPES,
  formatDhakaDateTime,
  isStockMovementType,
  movementLabel,
  presetRange,
  type DatePreset,
  type StockMovementType,
} from "@/lib/admin/inventory";
import {
  downloadInventoryExport,
  fetchProductChoices,
  fetchStockMovements,
  recordOpeningStock,
  type ProductChoice,
  type StockMovement,
} from "@/lib/mart-api/inventory";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import {
  AdminEmpty,
  AdminLoading,
  AdminNotice,
  AdminPageHeader,
  adminButtonClass,
  adminFieldClass,
} from "../../_components/admin-ui";
import { useAdminNotify } from "../../_components/confirm-delete";
import { ExportExcelButton, ImportExcelButton } from "../_components/excel-actions";
import { InventorySubNav } from "../_components/inventory-nav";
import { InventoryPager } from "../_components/pager";
import { useInventoryWriter } from "../_components/use-inventory-role";

const PAGE_SIZE = 20;

const TYPE_CLASS: Record<StockMovementType, string> = {
  opening: "bg-info/10 text-info",
  purchase: "bg-success/10 text-success",
  sale: "bg-neutral-100 text-neutral-700",
  return: "bg-primary/10 text-primary-ink",
  cancel: "bg-warning/10 text-warning",
  adjustment: "bg-secondary/10 text-secondary",
};

export default function StockHistoryPage() {
  const canWrite = useInventoryWriter();
  const notify = useAdminNotify();
  const [opening, setOpening] = useState(false);
  const [preset, setPreset] = useState<DatePreset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [productId, setProductId] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("product_id") ?? "";
  });
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<ProductChoice[]>([]);
  const [rows, setRows] = useState<StockMovement[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const range =
    preset === "custom"
      ? { from: customFrom || null, to: customTo || null }
      : presetRange(preset, new Date());

  useEffect(() => {
    let cancelled = false;
    void fetchProductChoices()
      .then((items) => {
        if (!cancelled) setProducts(items);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchStockMovements({
      from: range.from,
      to: range.to,
      productId: productId || null,
      type: isStockMovementType(type) ? type : null,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((result) => {
        if (cancelled) return;
        setRows(result.items);
        setTotal(result.total);
        setPages(result.pages);
        setError("");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setRows([]);
        setError(reason instanceof MartApiError ? reason.message : "Could not load stock history.");
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, productId, type, page, reload]);

  const exportFile = useCallback(
    () =>
      downloadInventoryExport("movements", {
        from: range.from,
        to: range.to,
      }),
    [range.from, range.to],
  );

  const exportProducts = useCallback(
    () => downloadInventoryExport("products", { from: range.from, to: range.to }),
    [range.from, range.to],
  );

  async function recordOpening() {
    if (opening) return;
    setOpening(true);
    try {
      const result = await recordOpeningStock();
      notify(
        `Opening stock: ${result.created} recorded, ${result.alreadyRecorded} already recorded, ${result.untracked} untracked. Stock counts were not changed.`,
        "ok",
      );
      setReload((value) => value + 1);
    } catch (reason) {
      notify(reason instanceof MartApiError ? reason.message : "Could not record opening stock.", "error");
    } finally {
      setOpening(false);
    }
  }

  const flowSummary = useMemo(() => {
    const items = rows ?? [];
    let stockIn = 0;
    let stockOut = 0;
    for (const row of items) {
      if (row.quantity > 0) stockIn += row.quantity;
      else if (row.quantity < 0) stockOut += Math.abs(row.quantity);
    }
    return { stockIn, stockOut, net: stockIn - stockOut };
  }, [rows]);

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader
        title="Stock history"
        description="Every change in on-hand stock. Times are shown in Asia/Dhaka. Stock history cannot be edited."
        action={
          <div className="flex flex-wrap gap-2">
            <ExportExcelButton onExport={exportFile} filename="movements.xlsx" />
            <ExportExcelButton onExport={exportProducts} filename="products.xlsx" label="Products" />
            {canWrite ? (
              <button type="button" className={adminButtonClass.secondary} onClick={() => void recordOpening()} disabled={opening}>
                {opening ? "Recording…" : "Record opening stock"}
              </button>
            ) : null}
            <ImportExcelButton
              kinds={["opening", "stock_count", "cost_price"]}
              canConfirm={canWrite}
              onImported={() => setReload((value) => value + 1)}
            />
          </div>
        }
      />

      <InventorySubNav />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Movements</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{rows ? total : "—"}</p>
          <p className="mt-0.5 text-xs text-slate-400">Ledger entries in range</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Stock In (Page)</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-700">
            {rows ? `+${flowSummary.stockIn.toLocaleString("en-US")}` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Purchases, returns, +adj</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Stock Out (Page)</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-rose-700">
            {rows ? `−${flowSummary.stockOut.toLocaleString("en-US")}` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Sales &amp; negative adj</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Net Change (Page)</p>
          <p
            className={cn(
              "mt-2 text-2xl font-bold tabular-nums",
              flowSummary.net > 0
                ? "text-emerald-700"
                : flowSummary.net < 0
                  ? "text-rose-700"
                  : "text-slate-900",
            )}
          >
            {rows
              ? `${flowSummary.net > 0 ? "+" : ""}${flowSummary.net.toLocaleString("en-US")}`
              : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">In minus Out on page</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="space-y-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
            {(
              [
                ["week", "This week"],
                ["month", "This month"],
                ["custom", "Custom range"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={preset === id}
                onClick={() => {
                  setPreset(id);
                  setPage(1);
                }}
                className={cn(
                  "min-h-10 rounded-full px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary",
                  preset === id ? "bg-neutral-950 text-white" : "bg-white text-neutral-700 ring-1 ring-neutral-200",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {preset === "custom" ? (
              <>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-neutral-700">From</span>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(event) => {
                      setCustomFrom(event.target.value);
                      setPage(1);
                    }}
                    className={adminFieldClass}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-neutral-700">To</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(event) => {
                      setCustomTo(event.target.value);
                      setPage(1);
                    }}
                    className={adminFieldClass}
                  />
                </label>
              </>
            ) : null}
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-neutral-700">Product</span>
              <select
                value={productId}
                onChange={(event) => {
                  setProductId(event.target.value);
                  setPage(1);
                }}
                className={adminFieldClass}
              >
                <option value="">All products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-neutral-700">Type</span>
              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value);
                  setPage(1);
                }}
                className={adminFieldClass}
              >
                <option value="">All types</option>
                {STOCK_MOVEMENT_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {movementLabel(item)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {rows == null ? <AdminLoading /> : null}
        {error ? (
          <div className="p-4">
            <AdminNotice tone="warning">{error}</AdminNotice>
          </div>
        ) : null}
        {rows && rows.length === 0 && !error ? (
          <AdminEmpty title="No stock movements" detail="Purchases, sales, and adjustments show up here." />
        ) : null}
        {rows && rows.length > 0 ? (
          <>
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Stock history</caption>
                <thead className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 text-right">Qty</th>
                    <th className="px-5 py-3">Who</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((movement) => (
                    <tr key={movement.id} className="border-t border-neutral-100">
                      <td className="px-5 py-3 whitespace-nowrap text-neutral-700">
                        {formatDhakaDateTime(movement.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-medium text-neutral-950">{movement.productTitle || "—"}</span>
                        {movement.sku ? <span className="mt-0.5 block text-xs text-neutral-500">{movement.sku}</span> : null}
                      </td>
                      <td className="px-5 py-3">
                        <MovementBadge type={movement.movementType} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <QuantityText quantity={movement.quantity} />
                      </td>
                      <td className="px-5 py-3 text-neutral-700">{movement.actorId || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-neutral-100 md:hidden">
              {rows.map((movement) => (
                <li key={movement.id} className="space-y-1 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-neutral-950">{movement.productTitle || "—"}</p>
                    <QuantityText quantity={movement.quantity} />
                  </div>
                  <MovementBadge type={movement.movementType} />
                  <p className="text-sm text-neutral-600">{formatDhakaDateTime(movement.createdAt)}</p>
                  <p className="text-sm text-neutral-700">{movement.actorId || "—"}</p>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {rows ? (
          <InventoryPager page={page} pages={pages} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
        ) : null}
      </section>
    </div>
  );
}

function MovementBadge({ type }: { type: StockMovementType }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", TYPE_CLASS[type])}>
      {movementLabel(type)}
    </span>
  );
}

function QuantityText({ quantity }: { quantity: number }) {
  const tone = quantity > 0 ? "text-success" : quantity < 0 ? "text-error" : "text-neutral-700";
  const label = quantity > 0 ? `+${quantity}` : String(quantity);
  return <span className={cn("font-semibold tabular-nums", tone)}>{label}</span>;
}
