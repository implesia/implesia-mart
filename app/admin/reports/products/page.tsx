import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductsReportView } from "../_components/products-report";
import { ReportLoadingSkeleton } from "../_components/report-shell";

export const metadata: Metadata = {
  title: "Product Profitability Report",
  robots: { index: false, follow: false },
};

export default function AdminProductsReportPage() {
  return (
    <Suspense fallback={<ReportLoadingSkeleton cards={4} />}>
      <ProductsReportView />
    </Suspense>
  );
}
