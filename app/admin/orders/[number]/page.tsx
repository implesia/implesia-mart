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
  AdminLoading,
  ADMIN_ORDER_STATUS_LABEL,
  adminFieldClass,
  FieldLabel,
  OrderStatusBadge,
} from "../../_components/admin-ui";

const STATUS_HINT: Record<OrderStatus, string> = {
  new: "Check the phone and address, then confirm.",
  confirmed: "Hand it to the courier, then mark it shipped.",
  shipped: "Mark delivered once the customer has it.",
  delivered: "Completed.",
  cancelled: "This order will not be delivered.",
  returned: "The customer sent this back.",
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ number: string }>();
  const number = decodeURIComponent(params.number ?? "");
  const orders = useOrders();
  const order = orders?.find((item) => item.number === number) ?? null;
  const [draft, setDraft] = useState<{
    number: string;
    courier: string;
    tracking: string;
  } | null>(null);

  if (!orders) return <AdminLoading />;

  if (!order) {
    return (
      <section className="rounded-2xl bg-white px-5 py-10 text-center ring-1 ring-neutral-200/90">
        <h1 className="text-lg font-semibold text-neutral-950">
          Order not found
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          This number is not in the order list.
        </p>
        <Link
          href="/admin/orders"
          className="mt-4 inline-flex text-sm font-medium text-primary"
        >
          Back to orders
        </Link>
      </section>
    );
  }

  const shipment =
    draft?.number === order.number
      ? { courier: draft.courier, tracking: draft.tracking }
      : { courier: order.courierName, tracking: order.trackingNumber };
  const shipmentDirty =
    shipment.courier !== order.courierName ||
    shipment.tracking !== order.trackingNumber;
  const showShipment =
    order.status === "shipped" ||
    order.courierName.trim().length > 0 ||
    order.trackingNumber.trim().length > 0;

  function changeStatus(status: OrderStatus) {
    updateOrder(order!.number, {
      status,
      courierName: status === "shipped" ? shipment.courier : order!.courierName,
      trackingNumber:
        status === "shipped" ? shipment.tracking : order!.trackingNumber,
    });
  }

  function saveShipment() {
    updateOrder(order!.number, {
      courierName: shipment.courier,
      trackingNumber: shipment.tracking,
    });
  }

  return (
    <div className="space-y-3">
      {order.note.trim() ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 ring-1 ring-amber-200">
          <span className="font-semibold">Delivery note. </span>
          {order.note}
        </p>
      ) : null}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 ring-1 ring-neutral-200/90">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-neutral-950">
              {order.number}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {formatPlaced(order.createdAt)}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-neutral-500">
            To collect · cash on delivery
          </p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-neutral-950">
            {formatTaka(orderGrandTotal(order))}
          </p>
        </div>
      </section>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="order-2 min-w-0 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90 xl:order-1">
          <div className="border-b border-neutral-100 px-4 py-2.5">
            <h2 className="text-sm font-semibold text-neutral-950">
              {order.items.length === 1
                ? "1 item"
                : `${order.items.length} items`}
            </h2>
          </div>
          <ul>
            {order.items.map((item) => (
              <li
                key={`${item.slug}-${item.unitPrice}`}
                className="border-b border-neutral-100 last:border-b-0"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    <Image
                      src={item.imageSrc}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${item.slug}`}
                      className="block truncate text-sm font-semibold text-neutral-950 hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    <span className="mt-0.5 block text-xs text-neutral-500">
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
          <dl className="space-y-2 border-t border-neutral-100 px-4 py-3 text-sm">
            <TotalLine
              label="Items"
              value={formatTaka(orderItemsTotal(order))}
            />
            <TotalLine
              label="Delivery"
              value={formatTaka(order.deliveryCharge)}
            />
            <TotalLine
              label="Total"
              value={formatTaka(orderGrandTotal(order))}
              strong
            />
          </dl>
        </section>

        <div className="order-1 space-y-3 xl:order-2">
          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90">
            <h2 className="text-sm font-semibold text-neutral-950">Customer</h2>
            <p className="mt-2 text-base font-semibold text-neutral-950">
              {order.customerName}
            </p>
            <a
              href={`tel:${order.phone}`}
              className="mt-1 block text-sm font-medium text-primary"
            >
              {order.phone}
            </a>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              {order.address}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`tel:${order.phone}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-neutral-950 px-4 text-sm font-medium text-white"
              >
                <MaterialIcon name="call" className="text-[18px]" />
                Call
              </a>
              <a
                href={whatsappHref(order.phone)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-sm font-medium text-white"
              >
                <MaterialIcon name="chat" className="text-[18px]" />
                WhatsApp
              </a>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90">
            <FieldLabel htmlFor="order-status">Status</FieldLabel>
            <select
              id="order-status"
              value={order.status}
              onChange={(event) =>
                changeStatus(event.target.value as OrderStatus)
              }
              className={adminFieldClass}
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ADMIN_ORDER_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">
              {STATUS_HINT[order.status]}
            </p>

            {showShipment && order.status === "shipped" ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-neutral-100 pt-4">
                <div>
                  <FieldLabel htmlFor="courier-name">Courier</FieldLabel>
                  <input
                    id="courier-name"
                    value={shipment.courier}
                    onChange={(event) =>
                      setDraft({
                        number: order.number,
                        courier: event.target.value,
                        tracking: shipment.tracking,
                      })
                    }
                    placeholder="Courier name"
                    className={adminFieldClass}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="tracking-number">
                    Tracking number
                  </FieldLabel>
                  <input
                    id="tracking-number"
                    value={shipment.tracking}
                    onChange={(event) =>
                      setDraft({
                        number: order.number,
                        courier: shipment.courier,
                        tracking: event.target.value,
                      })
                    }
                    placeholder="Tracking number"
                    className={adminFieldClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={saveShipment}
                  disabled={!shipmentDirty}
                  className={cn(
                    "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium",
                    shipmentDirty
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-400",
                  )}
                >
                  Save shipment
                </button>
              </div>
            ) : null}
            {showShipment && order.status !== "shipped" ? (
              <dl className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
                <div>
                  <dt className="text-neutral-500">Courier</dt>
                  <dd className="font-medium text-neutral-950">
                    {order.courierName.trim() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Tracking number</dt>
                  <dd className="font-medium text-neutral-950">
                    {order.trackingNumber.trim() || "—"}
                  </dd>
                </div>
              </dl>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function TotalLine({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt
        className={
          strong ? "font-semibold text-neutral-950" : "text-neutral-500"
        }
      >
        {label}
      </dt>
      <dd
        className={cn(
          "tabular-nums",
          strong
            ? "text-base font-semibold text-neutral-950"
            : "font-medium text-neutral-800",
        )}
      >
        {value}
      </dd>
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
