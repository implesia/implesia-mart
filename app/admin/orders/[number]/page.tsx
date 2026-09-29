"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

import {
  AdminCard,
  AdminLoading,
  ADMIN_ORDER_STATUS_LABEL,
  AdminPageHeader,
  adminFieldClass,
  FieldLabel,
  OrderStatusBadge,
} from "../../_components/admin-ui";

export default function AdminOrderDetailPage() {
  const params = useParams<{ number: string }>();
  const number = decodeURIComponent(params.number ?? "");
  const orders = useOrders();
  const order = orders?.find((item) => item.number === number) ?? null;
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
    if (!order) return;
    setCourierName(order.courierName);
    setTrackingNumber(order.trackingNumber);
  }, [order]);

  if (!orders) return <AdminLoading />;

  if (!order) {
    return (
      <>
        <AdminPageHeader title="Order not found" />
        <Link href="/admin/orders" className="text-sm font-medium text-primary">
          Back to orders
        </Link>
      </>
    );
  }

  const current = order;

  function changeStatus(status: OrderStatus) {
    updateOrder(current.number, {
      status,
      courierName: status === "shipped" ? courierName : current.courierName,
      trackingNumber: status === "shipped" ? trackingNumber : current.trackingNumber,
    });
  }

  function saveShipment() {
    updateOrder(current.number, { courierName, trackingNumber });
  }

  return (
    <>
      <AdminPageHeader
        title={order.number}
        description="Changing the status updates the mock state on this page."
        action={<OrderStatusBadge status={current.status} />}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <AdminCard className="lg:col-span-3">
          <h2 className="text-base font-semibold text-neutral-950">Customer</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Info label="Name" value={order.customerName} />
            <Info label="Phone" value={order.phone} />
            <Info label="Address" value={order.address} className="sm:col-span-2" />
            <Info label="Note" value={order.note.trim() ? order.note : "—"} className="sm:col-span-2" />
          </dl>
          <a
            href={whatsappHref(order.phone)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white"
          >
            Open WhatsApp
          </a>
        </AdminCard>

        <AdminCard className="lg:col-span-2">
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
          {order.status === "shipped" ? (
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <FieldLabel htmlFor="courier-name">Courier name</FieldLabel>
                <input
                  id="courier-name"
                  value={courierName}
                  onChange={(event) => setCourierName(event.target.value)}
                  onBlur={saveShipment}
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="tracking-number">Tracking</FieldLabel>
                <input
                  id="tracking-number"
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  onBlur={saveShipment}
                  className={adminFieldClass}
                />
              </div>
            </div>
          ) : null}
        </AdminCard>
      </div>

      <AdminCard className="mt-4">
        <h2 className="text-base font-semibold text-neutral-950">Items</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={`${item.slug}-${item.unitPrice}`} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-neutral-950">{item.title}</p>
                <p className="text-neutral-500">
                  {formatTaka(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums">
                {formatTaka(item.unitPrice * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4 text-sm">
          <Row label="Item total" value={formatTaka(orderItemsTotal(order))} />
          <Row label="Delivery charge" value={formatTaka(order.deliveryCharge)} />
          <Row label="Grand total" value={formatTaka(orderGrandTotal(order))} strong />
        </div>
      </AdminCard>
    </>
  );
}

function Info({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-neutral-950">{value}</dd>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "font-semibold text-neutral-950" : "text-neutral-600"}>{label}</span>
      <span className={strong ? "font-semibold text-primary" : "font-medium text-neutral-950"}>{value}</span>
    </div>
  );
}
