import type { Metadata } from "next";
import { Suspense } from "react";

import { ProfitLossReportView } from "../_components/profit-loss-report";
import { ReportLoadingSkeleton } from "../_components/report-shell";

export const metadata: Metadata = {
  title: "Profit & Loss Statement",
  robots: { index: false, follow: false },
};

export default function AdminProfitLossReportPage() {
  return (
    <Suspense fallback={<ReportLoadingSkeleton cards={4} />}>
      <ProfitLossReportView />
    </Suspense>
  );
}
