"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import {
  getCustomerOrderDetail,
  getCustomerOrders,
  type CustomerOrderDetail,
  type CustomerOrderSummary,
} from "@/lib/mart-api/customer";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { formatCartMoney } from "../../_lib/cart-shared";
import {
  DashboardCard,
  DashboardOrderStatusBadge,
  formatBanglaDate,
} from "../_components/dashboard-ui";

type FilterTab = "all" | "running" | "delivered" | "cancelled";

const TABS: { id: FilterTab; label: string; icon: string }[] = [
  { id: "all", label: "সকল অর্ডার", icon: "view_list" },
  { id: "running", label: "রানিং অর্ডার", icon: "local_shipping" },
  { id: "delivered", label: "ডেলিভার্ড", icon: "check_circle" },
  { id: "cancelled", label: "বাতিল", icon: "cancel" },
];

function paymentMethodLabel(method: string): string {
  const norm = method.toLowerCase();
  if (norm === "cod") return "ক্যাশ অন ডেলিভারি (COD)";
  if (norm === "bangla_qr") return "Bangla QR (অনলাইন)";
  if (norm === "bkash") return "bKash";
  if (norm === "nagad") return "Nagad";
  if (norm === "card") return "কার্ড পেমেন্ট";
  if (norm === "cash") return "নগদ (Cash)";
  if (norm === "due") return "বাকি (Due)";
  return method.toUpperCase();
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function printOrderReceipt(detail: CustomerOrderDetail): void {
  const rows = detail.items
    .map(
      (item, index) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
          <div style="font-weight:600;color:#111827;">${escapeHtml(item.title)}</div>
          ${item.sku ? `<div style="font-size:11px;color:#6b7280;">SKU: ${escapeHtml(item.sku)}</div>` : ""}
        </td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatCartMoney(item.unitPrice))}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${escapeHtml(formatCartMoney(item.lineTotal))}</td>
      </tr>`,
    )
    .join("");

  const fullAddress = [detail.address, detail.area, detail.district]
    .filter(Boolean)
    .join(", ");

  const html = `<!doctype html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <title>রসিদ #${escapeHtml(detail.number)} - Implesia Mart</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #111827; margin: 0; padding: 24px; background: #fff; }
    .sheet { max-width: 720px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0b5e56; padding-bottom: 14px; margin-bottom: 18px; }
    .brand { font-size: 20px; font-weight: 800; color: #0b5e56; }
    .muted { color: #6b7280; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; font-size: 13px; }
    .box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px; }
    th { text-align: left; padding: 8px; background: #f3f4f6; border-bottom: 1px solid #d1d5db; font-size: 12px; }
    .totals { width: 280px; margin-left: auto; font-size: 13px; }
    .totals .row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f3f4f6; }
    .totals .grand { font-size: 15px; font-weight: 800; border-top: 2px solid #111827; border-bottom: none; padding-top: 8px; margin-top: 4px; }
    .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px dashed #d1d5db; padding-top: 12px; }
    @media print { body { padding: 0; } .sheet { border: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <div class="brand">Implesia Mart</div>
        <div class="muted">অর্ডার রসিদ / ইনভয়েস</div>
      </div>
      <div style="text-align:right;font-size:13px;">
        <div><strong>অর্ডার নং:</strong> #${escapeHtml(detail.number)}</div>
        <div class="muted">তারিখ: ${escapeHtml(formatBanglaDate(detail.createdAt, true))}</div>
        <div class="muted">পেমেন্ট: ${escapeHtml(paymentMethodLabel(detail.paymentMethod))}</div>
      </div>
    </div>
    <div class="grid">
      <div class="box">
        <div style="font-weight:700;margin-bottom:4px;">ডেলিভারি ঠিকানা</div>
        <div>${escapeHtml(detail.customerName)}</div>
        <div>${escapeHtml(detail.phone)}</div>
        <div>${escapeHtml(fullAddress || "—")}</div>
      </div>
      <div class="box">
        <div style="font-weight:700;margin-bottom:4px;">কুরিয়ার ও ডেলিভারি তথ্য</div>
        <div>কুরিয়ার: ${escapeHtml(detail.courierName || "নির্ধারিত হয়নি")}</div>
        <div>ট্র্যাকিং: ${escapeHtml(detail.trackingNumber || "প্রযোজ্য নয়")}</div>
        ${detail.deliveredAt ? `<div>ডেলিভারি: ${escapeHtml(formatBanglaDate(detail.deliveredAt, true))}</div>` : ""}
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:36px;">#</th>
          <th>পণ্য</th>
          <th style="text-align:center;width:64px;">পরিমাণ</th>
          <th style="text-align:right;width:100px;">একক মূল্য</th>
          <th style="text-align:right;width:110px;">মোট</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div class="row"><span>সাবটোটাল</span><span>${escapeHtml(formatCartMoney(detail.subtotal))}</span></div>
      <div class="row"><span>ডেলিভারি চার্জ</span><span>${escapeHtml(formatCartMoney(detail.shipping))}</span></div>
      ${detail.couponDiscount > 0 ? `<div class="row"><span>কুপন ছাড়</span><span>-${escapeHtml(formatCartMoney(detail.couponDiscount))}</span></div>` : ""}
      ${detail.manualDiscount > 0 ? `<div class="row"><span>অতিরিক্ত ছাড়</span><span>-${escapeHtml(formatCartMoney(detail.manualDiscount))}</span></div>` : ""}
      <div class="row grand"><span>সর্বমোট</span><span>${escapeHtml(formatCartMoney(detail.total))}</span></div>
      <div class="row"><span>পরিশোধিত</span><span>${escapeHtml(formatCartMoney(detail.paidAmount))}</span></div>
      <div class="row"><span><strong>বাকি (Due)</strong></span><span><strong>${escapeHtml(formatCartMoney(detail.dueAmount))}</strong></span></div>
    </div>
    <div class="footer">Implesia Mart-এর সাথে কেনাকাটা করার জন্য ধন্যবাদ!</div>
  </div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  window.setTimeout(() => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  }, 1500);
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialOrderQuery = searchParams.get("order")?.trim() ?? "";

  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const [modalOrderNumber, setModalOrderNumber] = useState<string | null>(
    initialOrderQuery || null,
  );
  const [detail, setDetail] = useState<CustomerOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getCustomerOrders({ page: 1, pageSize: 50 });
        if (cancelled) return;
        setOrders(data.items);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : "অর্ডারের তালিকা লোড করা যায়নি",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchOrderDetail = useCallback(async (orderNumber: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    try {
      const data = await getCustomerOrderDetail(orderNumber);
      setDetail(data);
    } catch (e) {
      setDetailError(
        e instanceof Error ? e.message : "অর্ডারের বিস্তারিত লোড করা যায়নি।",
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!modalOrderNumber) return;
    let cancelled = false;
    void (async () => {
      setDetailLoading(true);
      setDetailError(null);
      setDetail(null);
      try {
        const data = await getCustomerOrderDetail(modalOrderNumber);
        if (!cancelled) setDetail(data);
      } catch (e) {
        if (!cancelled) {
          setDetailError(
            e instanceof Error ? e.message : "অর্ডারের বিস্তারিত লোড করা যায়নি।",
          );
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modalOrderNumber]);

  useEffect(() => {
    if (!modalOrderNumber) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOrderNumber(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [modalOrderNumber]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const st = order.status.toLowerCase();
      if (
        activeTab === "running" &&
        !["new", "confirmed", "packed", "shipped"].includes(st)
      ) {
        return false;
      }
      if (activeTab === "delivered" && st !== "delivered") return false;
      if (activeTab === "cancelled" && !["cancelled", "returned"].includes(st)) {
        return false;
      }
      if (q) {
        const matchNumber = order.number.toLowerCase().includes(q);
        const matchTitle = (order.firstItemTitle || "").toLowerCase().includes(q);
        if (!matchNumber && !matchTitle) return false;
      }
      return true;
    });
  }, [orders, activeTab, search]);

  return (
    <div className="space-y-5">
      {/* Filter & Search Header */}
      <DashboardCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-neutral-950 sm:text-xl dark:text-white">
              আমার অর্ডারসমূহ
            </h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              আপনার সমস্ত কেনাকাটা, বিস্তারিত রসিদ ও ডেলিভারি স্ট্যাটাস দেখুন
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[17px] text-neutral-400"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="অর্ডার নং বা পণ্য খুঁজুন..."
                className="h-9 w-full rounded-xl border border-neutral-200 bg-neutral-50/70 pr-3 pl-9 text-xs text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white sm:w-52 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-[#131c1b]"
              />
            </div>

            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-xl border border-neutral-200/90 bg-neutral-100/70 p-1 dark:border-white/10 dark:bg-[#0e1514]">
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
                      active
                        ? "bg-white text-emerald-800 shadow-xs dark:bg-white/10 dark:text-white"
                        : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
                    )}
                  >
                    <MaterialIcon name={tab.icon} className="text-[15px]" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Orders List */}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : loading ? (
        <DashboardCard className="py-12 text-center text-xs text-neutral-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="mt-3">অর্ডার লোড হচ্ছে...</p>
        </DashboardCard>
      ) : filteredOrders.length === 0 ? (
        <DashboardCard className="py-12 text-center">
          <MaterialIcon name="inbox" className="text-[36px] text-neutral-400" />
          <h3 className="mt-2 text-sm font-bold text-neutral-900 dark:text-white">
            কোনো অর্ডার পাওয়া যায়নি
          </h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {activeTab === "all" && !search.trim()
              ? "আপনি এখনও কোনো অর্ডার করেননি।"
              : "এই ফিল্টারে বর্তমানে কোনো অর্ডার নেই।"}
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            <MaterialIcon name="storefront" className="text-[16px]" />
            <span>শপিং শুরু করুন</span>
          </Link>
        </DashboardCard>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#131c1b]"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-neutral-50/70 px-5 py-3 text-xs dark:border-white/10 dark:bg-white/[0.02]">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-neutral-950 dark:text-white">
                    #{order.number}
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-600">•</span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {formatBanglaDate(order.createdAt, true)}
                  </span>
                </div>

                <DashboardOrderStatusBadge status={order.status} />
              </div>

              {/* Order Body */}
              <div className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3.5">
                    {order.firstItemImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={order.firstItemImage}
                        alt=""
                        className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-neutral-200/80 dark:ring-white/10"
                      />
                    ) : (
                      <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-white/5">
                        <MaterialIcon name="inventory_2" className="text-[24px]" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-neutral-900 dark:text-white">
                        {order.firstItemTitle || `অর্ডার #${order.number}`}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>মোট {order.itemsCount}টি আইটেম</span>
                        <span>•</span>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {paymentMethodLabel(order.paymentMethod || "cod")}
                        </span>
                      </div>
                      {order.courierName ? (
                        <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                          কুরিয়ার: <strong>{order.courierName}</strong>
                          {order.trackingNumber
                            ? ` (ট্র্যাকিং: ${order.trackingNumber})`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-0.5 sm:items-end">
                    <p className="text-[11px] text-neutral-400">সর্বমোট বিল</p>
                    <p className="text-lg font-extrabold tabular-nums text-neutral-950 sm:text-xl dark:text-white">
                      {formatCartMoney(order.total)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5 border-t border-neutral-100 pt-3.5 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setModalOrderNumber(order.number)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10"
                  >
                    <MaterialIcon
                      name="receipt_long"
                      className="text-[16px] text-neutral-500"
                    />
                    <span>রসিদ / বিবরণ</span>
                  </button>

                  <Link
                    href={`/dashboard/tracking?order=${encodeURIComponent(order.number)}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-800"
                  >
                    <MaterialIcon name="local_shipping" className="text-[16px]" />
                    <span>ট্র্যাকিং দেখুন</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Order Detail & Printable Receipt Modal */}
      {modalOrderNumber ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`অর্ডার বিবরণ ${modalOrderNumber}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setModalOrderNumber(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs animate-in fade-in sm:p-5"
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#131c1b]">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-neutral-50/70 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <MaterialIcon name="receipt_long" className="text-[20px]" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-neutral-950 sm:text-base dark:text-white">
                      অর্ডার রসিদ #{modalOrderNumber}
                    </h2>
                    {detail ? (
                      <DashboardOrderStatusBadge status={detail.status} />
                    ) : null}
                  </div>
                  {detail ? (
                    <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                      অর্ডার তারিখ: {formatBanglaDate(detail.createdAt, true)}
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOrderNumber(null)}
                aria-label="বন্ধ করুন"
                className="inline-flex size-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <MaterialIcon name="close" className="text-[20px]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-xs text-neutral-500">
                  <div className="size-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                  <p className="mt-3">অর্ডারের বিস্তারিত লোড হচ্ছে...</p>
                </div>
              ) : detailError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
                  <p>{detailError}</p>
                  <button
                    type="button"
                    onClick={() => void fetchOrderDetail(modalOrderNumber)}
                    className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                  >
                    আবার চেষ্টা করুন
                  </button>
                </div>
              ) : detail ? (
                <div className="space-y-5 text-xs">
                  {/* Delivery Address & Courier Info */}
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                        <MaterialIcon name="location_on" className="text-[15px] text-emerald-600" />
                        <span>ডেলিভারি ঠিকানা</span>
                      </p>
                      <p className="mt-2 font-bold text-neutral-950 dark:text-white">
                        {detail.customerName}
                      </p>
                      <p className="mt-0.5 text-neutral-600 dark:text-neutral-300">
                        {detail.phone}
                      </p>
                      <p className="mt-1 leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {[detail.address, detail.area, detail.district]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                        <MaterialIcon name="local_shipping" className="text-[15px] text-emerald-600" />
                        <span>পেমেন্ট ও কুরিয়ার তথ্য</span>
                      </p>
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-neutral-500 dark:text-neutral-400">পেমেন্ট:</span>
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {paymentMethodLabel(detail.paymentMethod)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-neutral-500 dark:text-neutral-400">কুরিয়ার:</span>
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {detail.courierName || "নির্ধারিত হয়নি"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-neutral-500 dark:text-neutral-400">ট্র্যাকিং কোড:</span>
                          <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                            {detail.trackingNumber || "প্রযোজ্য নয়"}
                          </span>
                        </div>
                        {detail.deliveredAt ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-neutral-500 dark:text-neutral-400">ডেলিভারি:</span>
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              {formatBanglaDate(detail.deliveredAt)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Itemized Product List */}
                  <div className="overflow-hidden rounded-xl border border-neutral-200/80 dark:border-white/10">
                    <div className="border-b border-neutral-100 bg-neutral-50/70 px-4 py-2.5 text-[11px] font-bold text-neutral-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300">
                      অর্ডারকৃত পণ্যসমূহ ({detail.items.length}টি লাইন)
                    </div>
                    <div className="divide-y divide-neutral-100 dark:divide-white/5">
                      {detail.items.map((item, idx) => (
                        <div
                          key={`${item.slug}-${item.sku ?? idx}`}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {item.imageSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.imageSrc}
                                alt={item.title}
                                className="size-11 shrink-0 rounded-lg object-cover ring-1 ring-neutral-200/80 dark:ring-white/10"
                              />
                            ) : (
                              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-neutral-100 text-neutral-400 dark:bg-white/5">
                                <MaterialIcon name="inventory_2" className="text-[20px]" />
                              </span>
                            )}
                            <div className="min-w-0">
                              <Link
                                href={`/products/${item.slug}`}
                                className="block truncate font-bold text-neutral-900 hover:text-emerald-700 hover:underline dark:text-white dark:hover:text-emerald-400"
                              >
                                {item.title}
                              </Link>
                              <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                                {formatCartMoney(item.unitPrice)} × {item.quantity} পিস
                                {item.sku ? ` · SKU: ${item.sku}` : ""}
                              </p>
                            </div>
                          </div>
                          <p className="shrink-0 font-bold tabular-nums text-neutral-950 dark:text-white">
                            {formatCartMoney(item.lineTotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                        <span>সাবটোটাল</span>
                        <span className="font-semibold tabular-nums">
                          {formatCartMoney(detail.subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                        <span>ডেলিভারি চার্জ</span>
                        <span className="font-semibold tabular-nums">
                          {formatCartMoney(detail.shipping)}
                        </span>
                      </div>
                      {detail.couponDiscount > 0 ? (
                        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                          <span>কুপন ছাড়</span>
                          <span className="font-semibold tabular-nums">
                            −{formatCartMoney(detail.couponDiscount)}
                          </span>
                        </div>
                      ) : null}
                      {detail.manualDiscount > 0 ? (
                        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                          <span>অতিরিক্ত ছাড়</span>
                          <span className="font-semibold tabular-nums">
                            −{formatCartMoney(detail.manualDiscount)}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between border-t border-neutral-200 pt-2.5 text-sm font-extrabold text-neutral-950 dark:border-white/10 dark:text-white">
                        <span>সর্বমোট বিল</span>
                        <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
                          {formatCartMoney(detail.total)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 pt-2">
                        <div className="rounded-lg bg-emerald-50/70 px-3 py-2 dark:bg-emerald-950/30">
                          <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                            পরিশোধিত
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-900 dark:text-emerald-200">
                            {formatCartMoney(detail.paidAmount)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-amber-50/80 px-3 py-2 dark:bg-amber-950/30">
                          <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                            বাকি (Due)
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums text-amber-950 dark:text-amber-200">
                            {formatCartMoney(detail.dueAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-neutral-100 bg-neutral-50/70 px-5 py-3.5 dark:border-white/10 dark:bg-white/[0.03]">
              <button
                type="button"
                disabled={!detail}
                onClick={() => {
                  if (detail) printOrderReceipt(detail);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-900 shadow-2xs transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                <MaterialIcon name="print" className="text-[17px]" />
                <span>রসিদ প্রিন্ট করুন</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOrderNumber(null)}
                  className="rounded-xl border border-neutral-200 px-3.5 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/10"
                >
                  বন্ধ করুন
                </button>
                <Link
                  href={`/dashboard/tracking?order=${encodeURIComponent(modalOrderNumber)}`}
                  onClick={() => setModalOrderNumber(null)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
                >
                  <MaterialIcon name="local_shipping" className="text-[16px]" />
                  <span>ট্র্যাকিং দেখুন</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardOrdersPage() {
  return (
    <Suspense
      fallback={
        <DashboardCard className="py-12 text-center text-xs text-neutral-500">
          অর্ডার লোড হচ্ছে...
        </DashboardCard>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
