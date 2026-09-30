import type { Metadata } from "next";

import { DashboardView } from "./_components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return <DashboardView />;
}
