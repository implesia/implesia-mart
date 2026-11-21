import type { Metadata } from "next";
import { Suspense } from "react";

import { ReportLoadingSkeleton } from "../_components/report-shell";
import { SuppliersReportView } from "../_components/suppliers-report";

export const metadata: Metadata = {
  title: "Supplier Performance Report",
  robots: { index: false, follow: false },
};

export default function AdminSuppliersReportPage() {
  return (
    <Suspense fallback={<ReportLoadingSkeleton cards={4} />}>
      <SuppliersReportView />
    </Suspense>
  );
}
