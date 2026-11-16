"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { formatDhakaDateTime } from "@/lib/admin/order-timestamps";
import {
  CALL_STATUSES,
  CALL_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  isPaymentMethod,
  nextOrderStatuses,
  type CallStatus,
  type OfflineLineInput,
} from "@/lib/admin/orders-desk";
import { getDeskOrder, patchDeskOrder, replaceOrderItems } from "@/lib/mart-api/orders-desk";
import type { MartOrder, MartOrderItem } from "@/lib/mart-api/orders";
import { MartApiError } from "@/lib/mart-api/products";
import { formatTaka, whatsappHref, type OrderStatus } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  ADMIN_ORDER_STATUS_LABEL,
  AdminNotice,
  ORDER_STATUS_MARK,
  OrderStatusBadge,
  adminButtonClass,
  adminFieldClass,
} from "../../_components/admin-ui";
import { CallStatusBadge, DuplicateWarning, HistoryBadge, OriginBadge, PaymentStatusBadge } from "./order-badges";
import { ProductPicker } from "./product-picker";

const FLOW: OrderStatus[] = ["new", "confirmed", "packed", "shipped", "delivered"];

const COURIERS = ["Steadfast", "Pathao", "RedX", "Paperfly", "Sundarban Courier", "SA Paribahan", "eCourier", "Delivery Tiger", "Carrybee", "Bangladesh Post"] as const;

type DraftLine = {
  key: string;
  productId: string | null;
  variantId: string | null;
  title: string;
  imageSrc: string;
  sku: string;
  quantity: string;
  unitPrice: string;
  priceEdited: boolean;
  selection: MartOrderItem["selection"];
};

function linesFrom(order: MartOrder): DraftLine[] {
  return order.items.map((item) => ({
    key: item.id,
    productId: item.productId,
    variantId: item.variantId,
    title: item.title,
    imageSrc: item.imageSrc,
    sku: item.sku,
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
    priceEdited: true,
    selection: item.selection,
  }));
}

export function OrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<MartOrder | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [courier, setCourier] = useState("");
  const [customCourier, setCustomCourier] = useState(false);
  const [tracking, setTracking] = useState("");
  const [notes, setNotes] = useState("");
  const [drafts, setDrafts] = useState<DraftLine[]>([]);
  const [discount, setDiscount] = useState("0");
  const [delivery, setDelivery] = useState("0");
  const [savingItems, setSavingItems] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getDeskOrder(orderId)
      .then((next) => {
        if (cancelled) return;
        setOrder(next);
        setCourier(next.courierName);
        setCustomCourier(next.courierName.trim().length > 0 && !COURIERS.includes(next.courierName as (typeof COURIERS)[number]));
        setTracking(next.trackingNumber);
        setNotes(next.notes);
        setDrafts(linesFrom(next));
        setDiscount(String(next.manualDiscount));
        setDelivery(String(next.shipping));
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        if (reason instanceof MartApiError && reason.message === "Order not found") setMissing(true);
        else setError(reason instanceof MartApiError ? reason.message : "Could not load this order.");
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!order && !missing && !error) {
    return <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-busy="true" />;
  }
  if (!order) {
    return (
      <section className="rounded-2xl bg-white px-5 py-16 text-center ring-1 ring-neutral-200/90">
        <h1 className="text-lg font-semibold">{missing ? "Order not found" : "Could not load the order"}</h1>
        <p className="mt-1 text-sm text-neutral-500">{error ?? "This order is not in the list."}</p>
        <Link href="/admin/orders/list" className="mt-4 inline-flex text-sm font-medium text-primary">Back to orders</Link>
      </section>
    );
  }

  const next = order.nextStatuses ?? nextOrderStatuses(order.status, null);
  const editable = order.status === "new";
  const placed = formatDhakaDateTime(order.orderedAt ?? order.createdAt);

  async function changeStatus(status: OrderStatus) {
    if ((status === "cancelled" || status === "returned") && !window.confirm(`Mark ${order!.number} as ${ADMIN_ORDER_STATUS_LABEL[status]}? Stock goes back. This is not a delete.`)) return;
    try {
      const saved = await patchDeskOrder(order!.id, { status });
      setOrder(saved);
      setNotice(`Status set to ${ADMIN_ORDER_STATUS_LABEL[status]}.`);
      setError(null);
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not update this order.");
    }
  }

  async function saveCall(status: CallStatus) {
    try {
      const saved = await patchDeskOrder(order!.id, { callStatus: status });
      setOrder(saved);
      setError(null);
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not update the call status.");
    }
  }

  async function saveShipment() {
    try {
      const saved = await patchDeskOrder(order!.id, { courierName: courier, trackingNumber: tracking });
      setOrder(saved);
      setNotice("Courier saved.");
      setError(null);
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not save the courier.");
    }
  }

  async function saveNotes() {
    try {
      const saved = await patchDeskOrder(order!.id, { notes });
      setOrder(saved);
      setNotice("Note saved.");
      setError(null);
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not save the note.");
    }
  }

  async function saveItems() {
    const missingProduct = drafts.some((line) => !line.productId);
    if (missingProduct) {
      setError("A product on this order was removed, so the lines cannot be replaced.");
      return;
    }
    const items: OfflineLineInput[] = drafts.map((line) => ({
      productId: line.productId!,
      variantId: line.variantId,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      priceEdited: line.priceEdited,
    }));
    setSavingItems(true);
    try {
      const saved = await replaceOrderItems(order!.id, {
        items,
        manualDiscount: Number(discount) || 0,
        deliveryCharge: delivery.trim() ? Number(delivery) : null,
      });
      setOrder(saved);
      setDrafts(linesFrom(saved));
      setDiscount(String(saved.manualDiscount));
      setDelivery(String(saved.shipping));
      setNotice("Items saved. Totals are from the server.");
      setError(null);
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not update the items.");
    } finally {
      setSavingItems(false);
    }
  }

  return (
    <div className="space-y-4">
      {notice ? <AdminNotice tone="success">{notice}</AdminNotice> : null}
      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
      {order.duplicateWarning ? <DuplicateWarning /> : null}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500">Order</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{order.number}</h1>
              <OrderStatusBadge status={order.status} />
              <OriginBadge origin={order.origin} />
            </div>
            <p className="mt-1 text-sm text-neutral-500">{placed}</p>
            {order.printedAt ? <p className="mt-1 text-xs text-neutral-500">Printed {formatDhakaDateTime(order.printedAt)}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {next.map((status) => (
              <button key={status} type="button" onClick={() => void changeStatus(status)} className={status === "cancelled" || status === "returned" ? adminButtonClass.secondary : adminButtonClass.primary}>
                {status === "confirmed" ? "Confirm" : status === "packed" ? "Mark packed" : status === "shipped" ? "Mark shipped" : status === "delivered" ? "Mark delivered" : ADMIN_ORDER_STATUS_LABEL[status]}
              </button>
            ))}
            <Link href={`/admin/orders/print?ids=${order.id}&kind=both`} className={adminButtonClass.secondary}>Print</Link>
          </div>
        </div>
        <Timeline order={order} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold">Items</h2>
              {order.couponCode ? (
                <p className="text-xs text-neutral-600">Coupon {order.couponCode}{order.couponDiscount != null ? ` · −${formatTaka(order.couponDiscount)}` : ""}</p>
              ) : null}
            </div>
            {editable ? (
              <div className="mt-3">
                <ProductPicker
                  label="Add a product"
                  onPick={(choice) => {
                    setDrafts((current) => [
                      ...current,
                      {
                        key: `${choice.productId}:${choice.variantId ?? "new"}:${current.length}`,
                        productId: choice.productId,
                        variantId: choice.variantId,
                        title: choice.title,
                        imageSrc: choice.imageSrc,
                        sku: choice.sku,
                        quantity: "1",
                        unitPrice: String(choice.unitPrice),
                        priceEdited: false,
                        selection: [],
                      },
                    ]);
                  }}
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-neutral-500">Items can be edited only while the order is new.</p>
            )}
            <ul className="mt-3 divide-y divide-neutral-100">
              {(editable ? drafts : linesFrom(order)).map((line) => (
                <li key={line.key} className="flex gap-3 py-3">
                  {line.imageSrc ? (
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      <Image src={line.imageSrc} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                  ) : <span className="size-14 shrink-0 rounded-xl bg-neutral-100" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.title}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {[line.sku, ...line.selection.map((choice) => choice.label)].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {editable ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input aria-label={`Quantity for ${line.title}`} value={line.quantity} onChange={(event) => setDrafts((current) => current.map((item) => item.key === line.key ? { ...item, quantity: event.target.value } : item))} className={cn(adminFieldClass, "w-20")} />
                        <input aria-label={`Price for ${line.title}`} value={line.unitPrice} onChange={(event) => setDrafts((current) => current.map((item) => item.key === line.key ? { ...item, unitPrice: event.target.value, priceEdited: true } : item))} className={cn(adminFieldClass, "w-28")} />
                        <button type="button" className="text-sm text-red-600" onClick={() => setDrafts((current) => current.filter((item) => item.key !== line.key))}>Remove</button>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm tabular-nums">{line.quantity} × {formatTaka(Number(line.unitPrice))}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {editable ? (
              <div className="mt-3 grid gap-3 border-t border-neutral-100 pt-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-neutral-700">
                  Discount
                  <input value={discount} onChange={(event) => setDiscount(event.target.value)} className={cn(adminFieldClass, "mt-1.5")} />
                </label>
                <label className="text-sm font-medium text-neutral-700">
                  Delivery charge
                  <input value={delivery} onChange={(event) => setDelivery(event.target.value)} className={cn(adminFieldClass, "mt-1.5")} />
                </label>
                <button type="button" disabled={savingItems} onClick={() => void saveItems()} className={cn(adminButtonClass.primary, "sm:col-span-2")}>
                  {savingItems ? "Saving…" : "Save items"}
                </button>
                <p className="text-xs text-neutral-500 sm:col-span-2">Saving sends the lines to the server. Totals and stock come back from that response.</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold">Activity</h2>
            {order.activity.length === 0 ? <p className="mt-2 text-sm text-neutral-500">No activity yet.</p> : (
              <ol className="mt-3 space-y-3">
                {order.activity.map((entry) => (
                  <li key={entry.id}>
                    <p className="text-sm text-neutral-950">{entry.summary}</p>
                    <p className="text-xs text-neutral-500">{entry.actorName || "Staff"} · {formatDhakaDateTime(entry.createdAt)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold">Customer</h2>
            <p className="mt-2 font-medium">{order.customerName}</p>
            <p className="text-sm text-neutral-600">{order.phone}</p>
            {order.email ? <p className="text-sm text-neutral-600">{order.email}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {order.customerHistory ? <HistoryBadge history={order.customerHistory} /> : null}
              <CallStatusBadge status={order.callStatus} />
            </div>
            <label className="mt-3 block text-sm font-medium text-neutral-700" htmlFor="call-status">
              Call status
              <select id="call-status" value={order.callStatus} onChange={(event) => void saveCall(event.target.value as CallStatus)} className={cn(adminFieldClass, "mt-1.5")}>
                {CALL_STATUSES.map((status) => (
                  <option key={status} value={status}>{CALL_STATUS_LABEL[status]}</option>
                ))}
              </select>
            </label>
            <a href={whatsappHref(order.phone)} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
              <MaterialIcon name="chat" className="text-[18px]" /> WhatsApp
            </a>
            <h3 className="mt-4 text-sm font-semibold">Shipping</h3>
            <p className="mt-1 text-sm text-neutral-700">{order.address}</p>
            <p className="text-sm text-neutral-500">{order.area}, {order.district}</p>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold">Payment</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Info label="Method" value={isPaymentMethod(order.paymentMethod) ? PAYMENT_METHOD_LABEL[order.paymentMethod] : order.paymentMethod} />
              <div className="flex items-center justify-between"><dt className="text-neutral-500">Status</dt><dd><PaymentStatusBadge status={order.paymentStatus} /></dd></div>
              <Info label="Subtotal" value={formatTaka(order.subtotal)} />
              {order.couponDiscount ? <Info label="Coupon" value={`−${formatTaka(order.couponDiscount)}`} /> : null}
              <Info label="Discount" value={formatTaka(order.manualDiscount)} />
              <Info label="Delivery" value={formatTaka(order.shipping)} />
              <Info label="Total" value={formatTaka(order.total)} />
              <Info label="Paid" value={formatTaka(order.paidAmount)} />
              <div className="flex items-center justify-between border-t border-neutral-100 pt-2">
                <dt className="font-semibold">Due</dt>
                <dd className="text-base font-bold tabular-nums">{formatTaka(order.dueAmount)}</dd>
              </div>
              {order.paymentReference ? <Info label="Reference" value={order.paymentReference} /> : null}
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold">Courier</h2>
            <label className="mt-3 block text-sm font-medium text-neutral-700" htmlFor="courier-name">
              Courier
              <select
                id="courier-name"
                value={customCourier ? "__other__" : courier}
                onChange={(event) => {
                  if (event.target.value === "__other__") {
                    setCustomCourier(true);
                    if (COURIERS.includes(courier as (typeof COURIERS)[number])) setCourier("");
                    return;
                  }
                  setCustomCourier(false);
                  setCourier(event.target.value);
                }}
                className={cn(adminFieldClass, "mt-1.5")}
              >
                <option value="">Select a courier</option>
                {COURIERS.map((name) => <option key={name} value={name}>{name}</option>)}
                <option value="__other__">Other</option>
              </select>
            </label>
            {customCourier ? (
              <input aria-label="Courier name" value={courier} onChange={(event) => setCourier(event.target.value)} className={cn(adminFieldClass, "mt-2")} />
            ) : null}
            <label className="mt-3 block text-sm font-medium text-neutral-700" htmlFor="tracking-number">
              Tracking / consignment ID
              <input id="tracking-number" value={tracking} onChange={(event) => setTracking(event.target.value)} className={cn(adminFieldClass, "mt-1.5")} />
            </label>
            <button type="button" onClick={() => void saveShipment()} className={cn(adminButtonClass.secondary, "mt-3")}>Save courier</button>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold">Notes</h2>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={cn(adminFieldClass, "mt-3 h-auto py-2")} />
            <button type="button" onClick={() => void saveNotes()} className={cn(adminButtonClass.secondary, "mt-3")}>Save note</button>
          </section>
        </div>
      </div>
    </div>
  );
}

function Timeline({ order }: { order: MartOrder }) {
  const closed = order.status === "cancelled" || order.status === "returned";
  const steps = closed
    ? [
        { id: "placed", label: "Order placed", detail: formatDhakaDateTime(order.orderedAt ?? order.createdAt), state: "done" as const },
        { id: order.status, label: ADMIN_ORDER_STATUS_LABEL[order.status], detail: order.status === "returned" ? formatDhakaDateTime(order.returnedAt) : "Stock was put back.", state: "current" as const },
      ]
    : FLOW.map((step, index) => {
        const current = FLOW.indexOf(order.status);
        const state = index < current ? "done" as const : index === current ? "current" as const : "upcoming" as const;
        const detail = step === "delivered" ? formatDhakaDateTime(order.deliveredAt) : step === "new" ? formatDhakaDateTime(order.orderedAt ?? order.createdAt) : "";
        return { id: step, label: step === "new" ? "Order placed" : ADMIN_ORDER_STATUS_LABEL[step], detail, state };
      });
  return (
    <ol className="mt-4">
      {steps.map((step, index) => (
        <li key={step.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3">
          <span className="flex flex-col items-center">
            <span className={cn("mt-1 size-2.5 rounded-full ring-4", step.state === "upcoming" ? "bg-neutral-300 ring-neutral-100" : step.state === "done" ? "bg-emerald-600 ring-emerald-50" : cn(ORDER_STATUS_MARK[order.status], "ring-white"))} />
            {index < steps.length - 1 ? <span className="w-px flex-1 bg-neutral-200" /> : null}
          </span>
          <span className={cn("pb-4", index === steps.length - 1 && "pb-0")}>
            <span className="block text-sm font-semibold">{step.label}</span>
            {step.detail && step.detail !== "—" ? <span className="mt-0.5 block text-xs text-neutral-500">{step.detail}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
