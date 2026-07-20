import type { Metadata } from "next";

import { Container } from "../_components/common/container";
import { JsonLd } from "../_components/common/json-ld";
import { products } from "../_data/products/products";
import { ProductBreadcrumbs } from "./_components/product-breadcrumbs";
import { ProductsCatalog } from "./_components/products-catalog";
import { absoluteUrl } from "@/lib/seo";

const TITLE = "সব প্রোডাক্ট";
const DESCRIPTION =
  "ট্রেন্ডিং গ্যাজেট থেকে হাতে তৈরি গর্জিয়াস ড্রেস — ইমপ্লেসিয়া মার্টের সব প্রোডাক্ট এক জায়গায়, ক্যাশ অন ডেলিভারিতে সারাদেশে ডেলিভারি সহ।";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/products" },
  openGraph: { url: "/products", title: TITLE, description: DESCRIPTION },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "হোম", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "সব প্রোডাক্ট", item: absoluteUrl("/products") },
  ],
};

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: products.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: absoluteUrl(`/products/${product.slug}`),
    name: product.title,
  })),
};

export default function ProductsPage() {
  return (
    <main className="w-full overflow-x-hidden pt-16 sm:pt-20">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div className="w-full py-5 sm:py-8 lg:py-10">
          <ProductBreadcrumbs
            items={[{ label: "হোম", href: "/" }, { label: "সব প্রোডাক্ট" }]}
          />
          <ProductsCatalog products={products} />
        </div>
      </Container>
    </main>
  );
}
