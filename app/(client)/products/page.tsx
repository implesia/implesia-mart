import type { Metadata } from "next";

import { Container } from "../_components/common/container";
import { products } from "../_data/products/products";
import { ProductBreadcrumbs } from "./_components/product-breadcrumbs";
import { ProductsCatalog } from "./_components/products-catalog";

export const metadata: Metadata = {
  title: "সব প্রোডাক্ট",
  description:
    "ট্রেন্ডিং গ্যাজেট থেকে হাতে তৈরি গর্জিয়াস ড্রেস — ইমপ্লেসিয়া মার্টের সব প্রোডাক্ট এক জায়গায়, ক্যাশ অন ডেলিভারিতে সারাদেশে ডেলিভারি সহ।",
};

export default function ProductsPage() {
  return (
    <main className="w-full pt-16 sm:pt-20">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="w-full py-8 lg:py-10">
          <ProductBreadcrumbs
            items={[{ label: "হোম", href: "/" }, { label: "সব প্রোডাক্ট" }]}
          />
          <ProductsCatalog products={products} />
        </div>
      </Container>
    </main>
  );
}
