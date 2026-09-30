"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { useOrders } from "@/lib/mart-mock/hooks";
import {
  formatTaka,
  ORDER_STATUSES,
  orderGrandTotal,
  orderItemsTotal,
  updateOrder,
  whatsappHref,
  type OrderStatus,
} from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  ADMIN_ORDER_STATUS_LABEL,
  AdminLoading,
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
  cancelled: "This order will not be delivered.",
  returned: "The customer sent this back.",
};

const FLOW: OrderStatus[] = ["new", "confirmed", "shipped", "delivered"];

export default function AdminOrderDetailPage() {
  const params = useParams<{ number: string }>();
  const number = decodeURIComponent(params.number ?? "");
  const orders = useOrders();
  const order = orders?.find((item) => item.number === number) ?? null;
  const [draft, setDraft] = useState<{ number: string; courier: string; tracking: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!orders) return <DetailSkeleton />;

  if (!order) {
    return (
      <section className="rounded-2xl bg-white px-5 py-16 text-center ring-1 ring-neutral-200/90">
        <h1 className="text-lg font-semibold text-neutral-950">Order not found</h1>
        <p className="mt-1 text-sm text-neutral-500">This number is not in the order list.</p>
        <Link href="/admin/orders" className="mt-4 inline-flex text-sm font-medium text-primary">
          Back to orders
        </Link>
      </section>
    );
  }

  const shipment =
    draft?.number === order.number
      ? { courier: draft.courier, tracking: draft.tracking }
      : { courier: order.courierName, tracking: order.trackingNumber };
  const shipmentDirty = shipment.courier !== order.courierName || shipment.tracking !== order.trackingNumber;
  const showShipment = order.status === "shipped" || order.courierName.trim().length > 0 || order.trackingNumber.trim().length > 0;
  const closed = order.status === "cancelled" || order.status === "returned";

  function changeStatus(status: OrderStatus) {
    updateOrder(order!.number, {
      status,
      courierName: status === "shipped" ? shipment.courier : order!.courierName,
      trackingNumber: status === "shipped" ? shipment.tracking : order!.trackingNumber,
    });
    setNotice(`Status set to ${ADMIN_ORDER_STATUS_LABEL[status]}.`);
  }

  function saveShipment() {
    updateOrder(order!.number, {
      courierName: shipment.courier,
      trackingNumber: shipment.tracking,
    });
    setNotice("Shipment saved.");
  }

  return (
    <div className="space-y-4">
      {order.note.trim() ? (
        <AdminNotice tone="warning">
          <span className="font-semibold">Delivery note. </span>
          {order.note}
        </AdminNotice>
      ) : null}
      {notice ? <AdminNotice tone="success">{notice}</AdminNotice> : null}

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
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <p className="text-3xl font-semibold tracking-tight tabular-nums text-neutral-950">{formatTaka(orderGrandTotal(order))}</p>
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
                <li key={`${item.slug}-${item.unitPrice}`} className="border-b border-neutral-100 last:border-b-0">
                  <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      <Image src={item.imageSrc} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link href={`/admin/products/${item.slug}`} className="block truncate text-sm font-semibold text-neutral-950 hover:text-primary">
                        {item.title}
                      </Link>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500">{item.slug}</span>
                      <span className="mt-1 block text-xs text-neutral-600">
                        {formatTaka(item.unitPrice)} × {item.quantity}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-950">
                      {formatTaka(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-neutral-100 px-4 py-4 text-sm sm:px-5">
              <TotalLine label="Subtotal" value={formatTaka(orderItemsTotal(order))} />
              <TotalLine label="Delivery" value={formatTaka(order.deliveryCharge)} />
              <TotalLine label="Total" value={formatTaka(orderGrandTotal(order))} strong />
            </dl>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold text-neutral-950">Customer</h2>
            <p className="mt-3 text-base font-semibold text-neutral-950">{order.customerName}</p>
            <a href={`tel:${order.phone}`} className="mt-1 inline-flex text-sm font-medium text-primary">
              {order.phone}
            </a>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">{order.address}</p>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold text-neutral-950">Fulfillment</h2>
            <div className="mt-3">
              <FieldLabel htmlFor="order-status">Status</FieldLabel>
              <select
                id="order-status"
                value={order.status}
                onChange={(event) => changeStatus(event.target.value as OrderStatus)}
                className={adminFieldClass}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ADMIN_ORDER_STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </div>
            {showShipment && order.status === "shipped" ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-neutral-100 pt-4">
                <div>
                  <FieldLabel htmlFor="courier-name">Courier</FieldLabel>
                  <input
                    id="courier-name"
                    value={shipment.courier}
                    onChange={(event) =>
                      setDraft({ number: order.number, courier: event.target.value, tracking: shipment.tracking })
                    }
                    placeholder="Courier name"
                    className={adminFieldClass}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="tracking-number">Tracking number</FieldLabel>
                  <input
                    id="tracking-number"
                    value={shipment.tracking}
                    onChange={(event) =>
                      setDraft({ number: order.number, courier: shipment.courier, tracking: event.target.value })
                    }
                    placeholder="Tracking number"
                    className={adminFieldClass}
                  />
                </div>
                <button type="button" onClick={saveShipment} disabled={!shipmentDirty} className={adminButtonClass.primary}>
                  Save shipment
                </button>
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
              <Info label="Amount" value={formatTaka(orderGrandTotal(order))} />
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold text-neutral-950">Delivery</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <Info label="Address" value={order.address} />
              <Info label="Charge" value={formatTaka(order.deliveryCharge)} />
              <Info label="Courier" value={order.courierName.trim() || "Not assigned"} />
              <Info label="Tracking" value={order.trackingNumber.trim() || "Not assigned"} />
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
          {
            id: status,
            label: ADMIN_ORDER_STATUS_LABEL[status],
            detail: STATUS_HINT[status],
            state: "current" as const,
          },
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
            <span className="sr-only">{step.state}</span>
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
