import type { Metadata } from "next";
import { Suspense } from "react";

import { OrdersList } from "../_components/orders-list";

export const metadata: Metadata = {
  title: "Order list",
  robots: { index: false, follow: false },
};

export default function AdminOrderListPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-busy="true" />}>
      <OrdersList />
    </Suspense>
  );
}
