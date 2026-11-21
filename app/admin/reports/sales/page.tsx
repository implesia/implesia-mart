import type { Metadata } from "next";
import { Suspense } from "react";

import { ReportLoadingSkeleton } from "../_components/report-shell";
import { SalesChannelsReportView } from "../_components/sales-channels-report";

export const metadata: Metadata = {
  title: "Sales & Channels Report",
  robots: { index: false, follow: false },
};

export default function AdminSalesReportPage() {
  return (
    <Suspense fallback={<ReportLoadingSkeleton cards={4} />}>
      <SalesChannelsReportView />
    </Suspense>
  );
}
