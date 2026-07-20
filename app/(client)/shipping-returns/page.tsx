import type { Metadata } from "next";

import { ShippingReturnsView } from "./_components/shipping-returns-view";

export const metadata: Metadata = {
  title: "শিপিং ও রিটার্ন",
  description:
    "ইমপ্লেসিয়া মার্ট — সারাদেশে ডেলিভারি, ক্যাশ অন ডেলিভারি, ৩ দিনের ইজি রিটার্ন ও রিফান্ড নীতিমালা।",
  alternates: { canonical: "/shipping-returns" },
};

export default function ShippingReturnsPage() {
  return (
    <main className="w-full overflow-x-hidden bg-background pt-16 text-on-surface sm:pt-20">
      <ShippingReturnsView />
    </main>
  );
}
