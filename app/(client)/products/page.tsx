import type { Metadata } from "next";

import { loadStoreCatalog } from "@/lib/mart-api/catalog";
import { absoluteUrl } from "@/lib/seo";

import { Container } from "../_components/common/container";
import { JsonLd } from "../_components/common/json-ld";
import { readCatalogQuery } from "../_data/products/products";
import { ProductsCatalog } from "./_components/products-catalog";

export const revalidate = 60;

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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = (await searchParams) ?? {};
  const catalog = readCatalogQuery({
    category: firstParam(params.category),
    view: firstParam(params.view),
  });
  const catalogLoad = await loadStoreCatalog();
  const products = catalogLoad.products;
  const query = firstParam(params.q)?.trim() ?? "";
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

  return (
    <main className="force-light w-full bg-[#f5f6f8] text-neutral-950">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-2 pb-3 sm:pt-2.5 sm:pb-4">
          {catalogLoad.unavailable ? (
            <section
              role="alert"
              className="rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-12 text-center"
            >
              <h1 className="text-xl font-semibold">প্রোডাক্ট লোড করা যায়নি</h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
                সংযোগে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।
              </p>
            </section>
          ) : (
            <ProductsCatalog
              key={`${catalog.category ?? "all"}-${catalog.view ?? "all"}-${query}`}
              products={products}
              initialCategory={catalog.category}
              initialSort={catalog.sort}
              initialBadge={catalog.badge}
              initialView={catalog.view}
              initialQuery={query}
              initialCollectionTitle={
                query
                  ? "খোঁজার ফল"
                  : catalog.category
                    ? undefined
                    : catalog.view
                      ? catalog.title
                      : undefined
              }
            />
          )}
        </div>
      </Container>
    </main>
  );
}
