"use client";

import { useParams } from "next/navigation";

import { OrderDetail } from "../_components/order-detail";

export default function AdminOrderDetailPage() {
  const params = useParams<{ number: string }>();
  const orderId = decodeURIComponent(params.number ?? "");
  return <OrderDetail orderId={orderId} />;
}
