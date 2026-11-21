import type { Metadata } from "next";
import { Suspense } from "react";

import { ReportsOverviewPage } from "./_components/overview-report";
import { ReportLoadingSkeleton } from "./_components/report-shell";

export const metadata: Metadata = {
  title: "Reports Overview",
  robots: { index: false, follow: false },
};

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<ReportLoadingSkeleton cards={8} />}>
      <ReportsOverviewPage />
    </Suspense>
  );
}
