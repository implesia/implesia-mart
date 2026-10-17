import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { queryStoreCatalog } from "@/lib/mart-api/catalog";
import {
  catalogHref,
  catalogTitle,
  readCatalogSearch,
} from "@/lib/mart-api/catalog-query";
import { absoluteUrl } from "@/lib/seo";

import { Container } from "../../_components/common/container";
import { JsonLd } from "../../_components/common/json-ld";
import { CatalogUnavailable } from "../_components/catalog-unavailable";
import { ProductsCatalog } from "../_components/products-catalog";

// Render per request: the Workers KV fetch/ISR cache hit its daily write limit and
// kept serving stale CMS data (old image URLs). CMS reads go straight to the API.
export const dynamic = "force-dynamic";

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

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const search = readCatalogSearch((await searchParams) ?? {});
  const title = catalogTitle(search);

  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: "/products" },
    openGraph: {
      url: "/products",
      title,
      description: DESCRIPTION,
    },
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const search = readCatalogSearch((await searchParams) ?? {});
  const result = await queryStoreCatalog(search);
  if (!result.unavailable && result.pages > 0 && search.page > result.pages) {
    redirect(catalogHref({ ...search, page: result.pages }));
  }

  const itemListJsonLd = result.unavailable
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "ItemList",
        numberOfItems: result.products.length,
        itemListElement: result.products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(`/products/${product.slug}`),
          name: product.title,
        })),
      };

  return (
    <main className="force-light w-full overflow-x-clip bg-[#f5f6f8] text-neutral-950">
      <JsonLd data={breadcrumbJsonLd} />
      {itemListJsonLd ? <JsonLd data={itemListJsonLd} /> : null}
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 pb-6 sm:pt-4 sm:pb-8">
          {result.unavailable ? (
            <CatalogUnavailable />
          ) : (
            <ProductsCatalog
              search={search}
              title={catalogTitle(search)}
              products={result.products}
              total={result.total}
              page={result.page}
              pages={result.pages}
              categoryCounts={result.categoryCounts}
              availabilityCounts={result.availabilityCounts}
              searchTruncated={result.searchTruncated}
            />
          )}
        </div>
      </Container>
    </main>
  );
}
