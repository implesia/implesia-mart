import type { Metadata } from "next";
import { Suspense } from "react";

import { InventoryReportView } from "../_components/inventory-report";
import { ReportLoadingSkeleton } from "../_components/report-shell";

export const metadata: Metadata = {
  title: "Inventory & Stock Valuation",
  robots: { index: false, follow: false },
};

export default function AdminInventoryReportPage() {
  return (
    <Suspense fallback={<ReportLoadingSkeleton cards={4} />}>
      <InventoryReportView />
    </Suspense>
  );
}
