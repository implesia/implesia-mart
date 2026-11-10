import type { Metadata } from "next";
import { Suspense } from "react";

import { ReportsView } from "./_components/reports-view";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-busy="true" />}>
      <ReportsView />
    </Suspense>
  );
}
