import type { Metadata } from "next";
import { Suspense } from "react";

import { DeliveryCouponsReportView } from "../_components/delivery-coupons-report";
import { ReportLoadingSkeleton } from "../_components/report-shell";

export const metadata: Metadata = {
  title: "Delivery, Returns & Coupons Report",
  robots: { index: false, follow: false },
};

export default function AdminDeliveryCouponsReportPage() {
  return (
    <Suspense fallback={<ReportLoadingSkeleton cards={4} />}>
      <DeliveryCouponsReportView />
    </Suspense>
  );
}
