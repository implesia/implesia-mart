import type { Metadata } from "next";

import { DEFAULT_DESCRIPTION, pageMetadata } from "@/lib/seo";

import { OrderStatusView } from "./_components/order-status-view";

export const metadata: Metadata = pageMetadata({
  title: "অর্ডার স্ট্যাটাস",
  description: DEFAULT_DESCRIPTION,
  path: "/order-status",
  noindex: { follow: false },
});

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
