"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { isPrintKind, type PrintKind } from "@/lib/admin/orders-desk";
import { bulkOrderStatus, getPrintData, markOrdersPrinted, type PrintOrder } from "@/lib/mart-api/orders-desk";
import { MartApiError } from "@/lib/mart-api/products";

import { printPdfFilename } from "@/lib/admin/download-print-pdf";

import { adminButtonClass } from "../../_components/admin-ui";
import { PrintDocuments } from "./print-documents";

export function PrintDesk() {
  const params = useSearchParams();
  const ids = (params.get("ids") ?? "").split(",").map((id) => id.trim()).filter(Boolean).slice(0, 100);
  const idKey = ids.join(",");
  const requestedKind = params.get("kind");
  const kind: PrintKind = isPrintKind(requestedKind) ? requestedKind : "both";
  const router = useRouter();
  const pathname = usePathname();
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [packing, setPacking] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  function changeKind(next: string) {
    if (!isPrintKind(next)) return;
    const search = new URLSearchParams(params.toString());
    search.set("kind", next);
    router.replace(`${pathname}?${search.toString()}`, { scroll: false });
  }

  async function printNow() {
    const previousTitle = document.title;
    document.title = " ";
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
    window.setTimeout(restore, 1500);
    try {
      const result = await markOrdersPrinted(orders.map((order) => order.id));
      setNotice(result.missing.length ? `Printed. ${result.missing.length} orders were missing.` : "Marked as printed. You can print again.");
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not record the print.");
    }
  }

  async function downloadNow() {
    const root = document.getElementById("order-print");
    const sheets = [...(root?.querySelectorAll<HTMLElement>(".sheet-invoice, .sheet-label") ?? [])];
    if (sheets.length === 0) return;
    setDownloading(true);
    setError(null);
    try {
      const { downloadPrintSheets } = await import("@/lib/admin/download-print-pdf");
      await downloadPrintSheets(sheets, printPdfFilename(kind === "invoice" || kind === "label" ? kind : "both", orders.map((order) => order.number)));
    } catch (reason) {
      console.error("Download PDF failed", reason);
      setError(reason instanceof MartApiError ? reason.message : "Could not download the PDF.");
    } finally {
      setDownloading(false);
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
    <div className="space-y-4 print:space-y-0">
      <div className="print-toolbar flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Print</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Choose invoice, label, or both, then print or download. Download saves a PDF of the sheets on this page, without browser headers or footers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="What to print or download"
            value={kind}
            onChange={(event) => changeKind(event.target.value)}
            className="h-10 rounded-full border border-neutral-200 bg-white px-3 text-sm"
          >
            <option value="invoice">Invoice only</option>
            <option value="label">Label only</option>
            <option value="both">Invoice and label</option>
          </select>
          <button type="button" onClick={() => void printNow()} disabled={orders.length === 0} className={adminButtonClass.primary}>
            Print
          </button>
          <button type="button" onClick={() => void downloadNow()} disabled={downloading || orders.length === 0} className={adminButtonClass.secondary}>
            {downloading ? "Downloading…" : "Download PDF"}
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
