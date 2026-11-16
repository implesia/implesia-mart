import type { Metadata } from "next";

import { CreateOrder } from "../_components/create-order";

export const metadata: Metadata = {
  title: "Create order",
  robots: { index: false, follow: false },
};

export default function AdminCreateOrderPage() {
  return <CreateOrder />;
}
