import type { Metadata } from "next";

import { Container } from "../_components/common/container";
import { ProductBreadcrumbs } from "../products/_components/product-breadcrumbs";
import { ShippingReturnsView } from "./_components/shipping-returns-view";

export const metadata: Metadata = {
  title: "শিপিং ও রিটার্ন",
  description:
    "ইমপ্লেসিয়া মার্ট — সারাদেশে ডেলিভারি, ক্যাশ অন ডেলিভারি, ৩ দিনের ইজি রিটার্ন ও রিফান্ড নীতিমালা।",
  alternates: { canonical: "/shipping-returns" },
};

export default function ShippingReturnsPage() {
  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 sm:pt-4 lg:pt-5">
          <ProductBreadcrumbs
            items={[{ label: "হোম", href: "/" }, { label: "শিপিং ও রিটার্ন" }]}
          />
        </div>
      </Container>
      <ShippingReturnsView />
    </main>
  );
}
