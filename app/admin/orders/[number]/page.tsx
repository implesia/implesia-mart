"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { getOrder, patchOrder, type MartOrder } from "@/lib/mart-api/orders";
import { MartApiError } from "@/lib/mart-api/products";
import { formatTaka, ORDER_STATUSES, whatsappHref, type OrderStatus } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  ADMIN_ORDER_STATUS_LABEL,
  AdminNotice,
  adminButtonClass,
  adminFieldClass,
  FieldLabel,
  ORDER_STATUS_MARK,
  OrderStatusBadge,
  PaymentBadge,
} from "../../_components/admin-ui";

const STATUS_HINT: Record<OrderStatus, string> = {
  new: "Check the phone and address, then confirm.",
  confirmed: "Hand it to the courier, then mark it shipped.",
  shipped: "Mark delivered once the customer has it.",
  delivered: "Completed.",
  cancelled: "Stock was returned once. Cancelling again does not add more.",
  returned: "Stock was returned once.",
};

const FLOW: OrderStatus[] = ["new", "confirmed", "shipped", "delivered"];

export default function AdminOrderDetailPage() {
  const params = useParams<{ number: string }>();
  const orderId = decodeURIComponent(params.number ?? "");
  const [order, setOrder] = useState<MartOrder | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    let cancelled = false;
    void getOrder(orderId)
      .then((next) => {
        if (cancelled) return;
        setOrder(next);
        setCourier(next.courierName);
        setTracking(next.trackingNumber);
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

  if (!order && !missing && !error) return <DetailSkeleton />;

  if (!order) {
    return (
      <section className="rounded-2xl bg-white px-5 py-16 text-center ring-1 ring-neutral-200/90">
        <h1 className="text-lg font-semibold text-neutral-950">{missing ? "Order not found" : "Could not load the order"}</h1>
        <p className="mt-1 text-sm text-neutral-500">{error ?? "This order is not in the list."}</p>
        <Link href="/admin/orders" className="mt-4 inline-flex text-sm font-medium text-primary">Back to orders</Link>
      </section>
    );
  }

  const closed = order.status === "cancelled" || order.status === "returned";
  const shipmentDirty = courier !== order.courierName || tracking !== order.trackingNumber;
  const showShipment = order.status === "shipped" || order.courierName.trim().length > 0 || order.trackingNumber.trim().length > 0;

  async function changeStatus(status: OrderStatus) {
    try {
      const saved = await patchOrder(order!.id, {
        status,
        courierName: status === "shipped" ? courier : undefined,
        trackingNumber: status === "shipped" ? tracking : undefined,
      });
      setOrder(saved);
      setNotice(`Status set to ${ADMIN_ORDER_STATUS_LABEL[status]}.`);
      setError(null);
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not update this order.");
    }
  }

  async function saveShipment() {
    try {
      const saved = await patchOrder(order!.id, { courierName: courier, trackingNumber: tracking });
      setOrder(saved);
      setNotice("Shipment saved.");
      setError(null);
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not update this order.");
    }
  }

  return (
    <div className="space-y-4">
      {order.notes.trim() ? (
        <AdminNotice tone="warning">
          <span className="font-semibold">Delivery note. </span>
          {order.notes}
        </AdminNotice>
      ) : null}
      {notice ? <AdminNotice tone="success">{notice}</AdminNotice> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <section className="rounded-2xl bg-white px-4 py-4 ring-1 ring-neutral-200/90 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-500">Order</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">{order.number}</h1>
              <OrderStatusBadge status={order.status} />
              <PaymentBadge />
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              Placed {formatPlaced(order.createdAt)}
              <span className="text-neutral-300"> · </span>
              {closed ? "Not collected" : "To collect"}
              <span className="text-neutral-300"> · </span>
              {order.anonymous ? "Anonymous" : "Account"}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <p className="text-3xl font-semibold tracking-tight tabular-nums text-neutral-950">{formatTaka(order.total)}</p>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${order.phone}`} className={adminButtonClass.primary}>
                <MaterialIcon name="call" className="text-[18px]" />
                Call
              </a>
              <a href={whatsappHref(order.phone)} target="_blank" rel="noreferrer" className={cn(adminButtonClass.primary, "bg-[#128C7E] hover:bg-[#0f7a6e]")}>
                <MaterialIcon name="chat" className="text-[18px]" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold text-neutral-950">Progress</h2>
            <p className="mt-1 text-xs text-neutral-500">{STATUS_HINT[order.status]}</p>
            <Lifecycle status={order.status} placed={order.createdAt} />
          </section>

          <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
            <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold text-neutral-950">
                {order.items.length === 1 ? "1 item" : `${order.items.length} items`}
              </h2>
            </div>
            <ul>
              {order.items.map((item) => (
                <li key={item.id} className="border-b border-neutral-100 last:border-b-0">
                  <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      {item.imageSrc ? <Image src={item.imageSrc} alt="" fill sizes="56px" className="object-cover" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      {item.productId ? (
                        <Link href={`/admin/products/${item.productId}`} className="block truncate text-sm font-semibold text-neutral-950 hover:text-primary">
                          {item.title}
                        </Link>
                      ) : (
                        <span className="block truncate text-sm font-semibold text-neutral-950">{item.title}</span>
                      )}
                      <span className="mt-1 block text-xs text-neutral-600">
                        {formatTaka(item.unitPrice)} × {item.quantity}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-950">{formatTaka(item.lineTotal)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-neutral-100 px-4 py-4 text-sm sm:px-5">
              <TotalLine label="Subtotal" value={formatTaka(order.subtotal)} />
              <TotalLine label={order.deliveryZone === "inside" ? "Delivery, inside Dhaka" : "Delivery, outside Dhaka"} value={formatTaka(order.shipping)} />
              <TotalLine label="Total" value={formatTaka(order.total)} strong />
            </dl>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold text-neutral-950">Customer</h2>
            <p className="mt-3 text-base font-semibold text-neutral-950">{order.customerName}</p>
            <a href={`tel:${order.phone}`} className="mt-1 inline-flex text-sm font-medium text-primary">{order.phone}</a>
            {order.email ? <p className="mt-1 text-sm text-neutral-600">{order.email}</p> : null}
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              {order.address}
              <span className="mt-1 block text-neutral-500">{order.area}, {order.district}</span>
            </p>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold text-neutral-950">Fulfillment</h2>
            <div className="mt-3">
              <FieldLabel htmlFor="order-status">Status</FieldLabel>
              <select id="order-status" value={order.status} onChange={(event) => void changeStatus(event.target.value as OrderStatus)} className={adminFieldClass}>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>{ADMIN_ORDER_STATUS_LABEL[status]}</option>
                ))}
              </select>
            </div>
            {showShipment && order.status === "shipped" ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-neutral-100 pt-4">
                <div>
                  <FieldLabel htmlFor="courier-name">Courier</FieldLabel>
                  <input id="courier-name" value={courier} onChange={(event) => setCourier(event.target.value)} placeholder="Courier name" className={adminFieldClass} />
                </div>
                <div>
                  <FieldLabel htmlFor="tracking-number">Tracking number</FieldLabel>
                  <input id="tracking-number" value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="Tracking number" className={adminFieldClass} />
                </div>
                <button type="button" onClick={() => void saveShipment()} disabled={!shipmentDirty} className={adminButtonClass.primary}>Save shipment</button>
              </div>
            ) : null}
            {showShipment && order.status !== "shipped" ? (
              <dl className="mt-4 space-y-3 border-t border-neutral-100 pt-4 text-sm">
                <Info label="Courier" value={order.courierName.trim() || "—"} />
                <Info label="Tracking number" value={order.trackingNumber.trim() || "—"} />
              </dl>
            ) : null}
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold text-neutral-950">Payment</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <Info label="Method" value="Cash on delivery" />
              <Info label="Status" value={closed ? "Not collected" : "To collect"} />
              <Info label="Amount" value={formatTaka(order.total)} />
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

function Lifecycle({ status, placed }: { status: OrderStatus; placed: string }) {
  const steps =
    status === "cancelled" || status === "returned"
      ? [
          { id: "placed", label: "Order placed", detail: formatPlaced(placed), state: "done" as const },
          { id: status, label: ADMIN_ORDER_STATUS_LABEL[status], detail: STATUS_HINT[status], state: "current" as const },
        ]
      : FLOW.map((step, index) => {
          const current = FLOW.indexOf(status);
          const state = index < current ? "done" : index === current ? "current" : "upcoming";
          return {
            id: step,
            label: step === "new" ? "Order placed" : ADMIN_ORDER_STATUS_LABEL[step],
            detail: index === 0 ? formatPlaced(placed) : state === "current" ? STATUS_HINT[step] : "Not reached",
            state,
          } as const;
        });

  return (
    <ol className="mt-4">
      {steps.map((step, index) => (
        <li key={step.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3">
          <span className="flex flex-col items-center">
            <span className={cn("mt-1 size-2.5 rounded-full ring-4", stepDot(step.state, step.id, status))} aria-hidden />
            {index < steps.length - 1 ? <span className="w-px flex-1 bg-neutral-200" /> : null}
          </span>
          <span className={cn("pb-4", index === steps.length - 1 && "pb-0")}>
            <span className="block text-sm font-semibold text-neutral-950">{step.label}</span>
            <span className="mt-0.5 block text-xs text-neutral-500">{step.detail}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function stepDot(state: "done" | "current" | "upcoming", id: string, status: OrderStatus) {
  if (state === "upcoming") return "bg-neutral-300 ring-neutral-100";
  if (state === "done") return "bg-emerald-600 ring-emerald-50";
  const key = (ORDER_STATUSES as readonly string[]).includes(id) ? (id as OrderStatus) : status;
  return cn(ORDER_STATUS_MARK[key], "ring-white");
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-neutral-950">{value}</dd>
    </div>
  );
}

function TotalLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3", strong && "border-t border-neutral-100 pt-2")}>
      <dt className={strong ? "font-semibold text-neutral-950" : "text-neutral-500"}>{label}</dt>
      <dd className={cn("tabular-nums", strong ? "text-base font-semibold text-neutral-950" : "font-medium text-neutral-800")}>{value}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading order">
      <div className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-80 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
        <div className="h-80 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
      </div>
    </div>
  );
}

function formatPlaced(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
