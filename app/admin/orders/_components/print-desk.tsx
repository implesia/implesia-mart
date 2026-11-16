"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { isPrintKind } from "@/lib/admin/orders-desk";
import { bulkOrderStatus, getPrintData, markOrdersPrinted, type PrintOrder } from "@/lib/mart-api/orders-desk";
import { MartApiError } from "@/lib/mart-api/products";

import { adminButtonClass } from "../../_components/admin-ui";
import { PrintDocuments } from "./print-documents";

export function PrintDesk() {
  const params = useSearchParams();
  const ids = (params.get("ids") ?? "").split(",").map((id) => id.trim()).filter(Boolean).slice(0, 100);
  const idKey = ids.join(",");
  const requestedKind = params.get("kind");
  const kind = isPrintKind(requestedKind) ? requestedKind : "both";
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [packing, setPacking] = useState(false);

  useEffect(() => {
    const nextIds = idKey.split(",").filter(Boolean);
    if (nextIds.length === 0) return;
    let cancelled = false;
    void getPrintData(nextIds)
      .then((next) => {
        if (!cancelled) {
          setOrders(next.orders);
          setMissing(next.missing);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof MartApiError ? reason.message : "Could not load print data.");
      });
    return () => {
      cancelled = true;
    };
  }, [idKey]);

  async function printNow() {
    window.print();
    try {
      const result = await markOrdersPrinted(orders.map((order) => order.id));
      setNotice(result.missing.length ? `Printed. ${result.missing.length} orders were missing.` : "Marked as printed. You can print again.");
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not record the print.");
    }
  }

  async function markPacked() {
    setPacking(true);
    try {
      const results = await bulkOrderStatus("packed", orders.map((order) => order.id));
      const failed = results.filter((row) => !row.ok);
      setNotice(failed.length ? failed.map((row) => row.error).filter(Boolean).join(" ") : "Marked packed.");
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not mark these packed.");
    } finally {
      setPacking(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="print-toolbar flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Print</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {kind === "invoice" ? "A4 invoice" : kind === "label" ? "4×6 packet label" : "Invoice and label"}, one order per page. In the print dialog, choose Save as PDF to download.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void printNow()} disabled={orders.length === 0} className={adminButtonClass.primary}>
            Print and download PDF
          </button>
          <button type="button" onClick={() => void markPacked()} disabled={packing || orders.length === 0} className={adminButtonClass.secondary}>
            {packing ? "Saving…" : "Mark packed"}
          </button>
          <Link href="/admin/orders/ready-to-pack" className={adminButtonClass.secondary}>Back</Link>
        </div>
      </div>
      {notice ? <p role="status" className="print:hidden text-sm text-emerald-800">{notice}</p> : null}
      {error ? <p role="alert" className="print:hidden text-sm text-red-600">{error}</p> : null}
      {missing.length > 0 ? <p className="print:hidden text-sm text-amber-800">{missing.length} orders were not found.</p> : null}
      {ids.length === 0 ? <p className="text-sm text-neutral-600">Select orders to print.</p> : null}
      {orders.length > 0 ? <PrintDocuments orders={orders} kind={kind === "invoice" || kind === "label" ? kind : "both"} /> : null}
    </div>
  );
}
