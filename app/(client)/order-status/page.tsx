import type { Metadata } from "next";

import { orderStatusQuery } from "@/lib/order-lookup";
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
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));
  const initialOrder = orderStatusQuery({ number: first(params.number), order: first(params.order) });

  return (
    <main className="force-light min-h-[60vh] w-full bg-[#f5f6f8] text-neutral-950">
      <OrderStatusView initialOrder={initialOrder} />
    </main>
  );
}
