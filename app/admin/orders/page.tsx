import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { legacyOrdersRedirect } from "@/lib/admin/orders-desk";

import { OrdersOverview } from "./_components/orders-overview";

export const metadata: Metadata = {
  title: "Orders overview",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOrdersOverviewPage({ searchParams }: PageProps) {
  const raw = (await searchParams) ?? {};
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") search.set(key, value);
  }
  const target = legacyOrdersRedirect(search);
  if (target) redirect(target);
  return <OrdersOverview />;
}
