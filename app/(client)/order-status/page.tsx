import type { Metadata } from "next";

import { OrderStatusView } from "./_components/order-status-view";

export const metadata: Metadata = {
  title: "অর্ডার স্ট্যাটাস",
  robots: { index: false, follow: false },
};

type OrderStatusPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderStatusPage({ searchParams }: OrderStatusPageProps) {
  const params = (await searchParams) ?? {};
  const raw = params.order;
  const initialOrder = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  return (
    <main className="force-light min-h-[60vh] w-full bg-[#f5f6f8] text-neutral-950">
      <OrderStatusView initialOrder={initialOrder} />
    </main>
  );
}
