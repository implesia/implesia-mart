import type { Metadata } from "next";
import { Suspense } from "react";

import { PrintDesk } from "../_components/print-desk";

export const metadata: Metadata = {
  title: "Print orders",
  robots: { index: false, follow: false },
};

export default function AdminPrintOrdersPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white" aria-busy="true" />}>
      <PrintDesk />
    </Suspense>
  );
}
