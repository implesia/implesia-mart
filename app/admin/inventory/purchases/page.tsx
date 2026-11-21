"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { formatDhakaDate, formatTakaAmount, grandTotal } from "@/lib/admin/inventory";
import {
  downloadInventoryExport,
  fetchPurchases,
  fetchSuppliers,
  type Purchase,
  type Supplier,
} from "@/lib/mart-api/inventory";
import { MartApiError } from "@/lib/mart-api/products";

import {
  AdminEmpty,
  AdminLoading,
  AdminNotice,
  AdminPageHeader,
  adminButtonClass,
  adminFieldClass,
} from "../../_components/admin-ui";
import { ExportExcelButton, ImportExcelButton } from "../_components/excel-actions";
import { InventorySubNav } from "../_components/inventory-nav";
import { InventoryPager } from "../_components/pager";
import { useInventoryWriter } from "../_components/use-inventory-role";

function invoiceTotal(purchase: Purchase) {
  return grandTotal(purchase.items.map((item) => ({ quantity: item.quantity, unitCost: item.unitCost })));
}

const PAGE_SIZE = 20;

export default function PurchasesPage() {
  const canWrite = useInventoryWriter();
  const [supplierId, setSupplierId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rows, setRows] = useState<Purchase[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchSuppliers({ page: 1, pageSize: 100 })
      .then((result) => {
        if (!cancelled) setSuppliers(result.items);
      })
      .catch(() => {
        if (!cancelled) setSuppliers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    void fetchPurchases({
      supplierId: supplierId || null,
      from: from || null,
      to: to || null,
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
        setError(reason instanceof MartApiError ? reason.message : "Could not load purchases.");
      });
    return () => {
      cancelled = true;
    };
  }, [supplierId, from, to, page, reload]);

  const exportFile = useCallback(
    () =>
      downloadInventoryExport("purchases", {
        from: from || null,
        to: to || null,
      }),
    [from, to],
  );

  const pageSummary = useMemo(() => {
    const items = rows ?? [];
    let spend = 0;
    let units = 0;
    for (const p of items) {
      spend += invoiceTotal(p);
      units += p.items.reduce((sum, line) => sum + line.quantity, 0);
    }
    return { spend, units };
  }, [rows]);

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader
        title="Purchases"
        description="Stock you bought. The server updates on-hand quantity and cost price when a purchase is saved. Excel export uses the date range."
        action={
          <div className="flex flex-wrap gap-2">
            <ExportExcelButton onExport={exportFile} filename="purchases.xlsx" />
            <ImportExcelButton
              kinds={["purchases"]}
              canConfirm={canWrite}
              onImported={() => setReload((value) => value + 1)}
            />
            {canWrite ? (
              <Link href="/admin/inventory/purchases/new" className={adminButtonClass.primary}>
                <MaterialIcon name="add" className="text-[18px]" />
                New purchase
              </Link>
            ) : null}
          </div>
        }
      />

      <InventorySubNav />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Purchases</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{rows ? total : "—"}</p>
          <p className="mt-0.5 text-xs text-slate-400">Matching invoices</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Purchase Spend</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[#0b3d39]">
            {rows ? formatTakaAmount(pageSummary.spend) : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Current page total</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Units Purchased</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-700">
            {rows ? `+${pageSummary.units.toLocaleString("en-US")}` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Stock received on page</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Suppliers</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{suppliers.length}</p>
          <p className="mt-0.5 text-xs text-slate-400">Available vendors</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="grid gap-3 border-b border-neutral-100 px-4 py-4 sm:grid-cols-3 sm:px-5">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-neutral-700">Supplier</span>
            <select
              value={supplierId}
              onChange={(event) => {
                setSupplierId(event.target.value);
                setPage(1);
              }}
              className={adminFieldClass}
            >
              <option value="">All suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-neutral-700">From</span>
            <input
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
              className={adminFieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-neutral-700">To</span>
            <input
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
              className={adminFieldClass}
            />
          </label>
        </div>

        {rows == null ? <AdminLoading /> : null}
        {error ? (
          <div className="p-4">
            <AdminNotice tone="warning">{error}</AdminNotice>
          </div>
        ) : null}
        {rows && rows.length === 0 && !error ? (
          <AdminEmpty title="No purchases in this view" detail="Record a purchase when stock arrives." />
        ) : null}
        {rows && rows.length > 0 ? (
          <>
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Purchases</caption>
                <thead className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Supplier</th>
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((purchase) => (
                    <tr key={purchase.id} className="border-t border-neutral-100">
                      <td className="px-5 py-3 whitespace-nowrap text-neutral-700">
                        {formatDhakaDate(purchase.purchasedOn)}
                      </td>
                      <td className="px-5 py-3 font-medium text-neutral-950">{purchase.supplierName}</td>
                      <td className="px-5 py-3 text-neutral-700">{purchase.invoiceNo || "—"}</td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums text-neutral-950">
                        {formatTakaAmount(invoiceTotal(purchase))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-neutral-100 md:hidden">
              {rows.map((purchase) => (
                <li key={purchase.id} className="space-y-1 px-4 py-4">
                  <p className="font-semibold text-neutral-950">{purchase.supplierName}</p>
                  <p className="text-sm text-neutral-600">{formatDhakaDate(purchase.purchasedOn)}</p>
                  <p className="text-sm text-neutral-700">Invoice {purchase.invoiceNo || "—"}</p>
                  <p className="text-sm font-medium tabular-nums">{formatTakaAmount(invoiceTotal(purchase))}</p>
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
