import type { Metadata } from "next";

import { Container } from "../_components/common/container";
import { JsonLd } from "../_components/common/json-ld";
import { products, readCatalogQuery } from "../_data/products/products";
import { ProductBreadcrumbs } from "./_components/product-breadcrumbs";
import { ProductsCatalog } from "./_components/products-catalog";
import { absoluteUrl } from "@/lib/seo";

const DESCRIPTION =
  "ট্রেন্ডিং গ্যাজেট থেকে হাতে তৈরি গর্জিয়াস ড্রেস — ইমপ্লেসিয়া মার্টের সব প্রোডাক্ট এক জায়গায়, ক্যাশ অন ডেলিভারিতে সারাদেশে ডেলিভারি সহ।";

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "হোম", item: absoluteUrl("/") },
    {
      "@type": "ListItem",
      position: 2,
      name: "সব প্রোডাক্ট",
      item: absoluteUrl("/products"),
    },
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

type ProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const params = (await searchParams) ?? {};
  const catalog = readCatalogQuery({
    category: firstParam(params.category),
    view: firstParam(params.view),
  });

  return {
    title: catalog.title,
    description: DESCRIPTION,
    alternates: { canonical: "/products" },
    openGraph: {
      url: "/products",
      title: catalog.title,
      description: DESCRIPTION,
    },
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = (await searchParams) ?? {};
  const catalog = readCatalogQuery({
    category: firstParam(params.category),
    view: firstParam(params.view),
  });
  const focused = catalog.title !== "সব প্রোডাক্ট";

  return (
    <main className="w-full overflow-x-hidden">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div className="w-full py-5 sm:py-8 lg:py-10">
          <ProductBreadcrumbs
            items={
              focused
                ? [
                    { label: "হোম", href: "/" },
                    { label: "সব প্রোডাক্ট", href: "/products" },
                    { label: catalog.title },
                  ]
                : [{ label: "হোম", href: "/" }, { label: "সব প্রোডাক্ট" }]
            }
          />
          <ProductsCatalog
            key={`${catalog.category ?? "all"}-${catalog.view ?? "all"}`}
            products={products}
            initialCategory={catalog.category}
            initialSort={catalog.sort}
            initialBadge={catalog.badge}
            initialCollectionTitle={
              catalog.category
                ? undefined
                : catalog.view
                  ? catalog.title
                  : undefined
            }
          />
        </div>
      </Container>
    </main>
  );
}
