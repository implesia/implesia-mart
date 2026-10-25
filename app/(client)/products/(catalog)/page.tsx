import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { queryStoreCatalog } from "@/lib/mart-api/catalog";
import { listPublicCategoryTree } from "@/lib/mart-api/categories";
import { categoryTrail } from "@/lib/mart-api/category-tree";
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
import { productPath } from "@/lib/mart-api/product-url";

// Render per request: the Workers KV fetch/ISR cache hit its daily write limit and
// kept serving stale CMS data (old image URLs). CMS reads go straight to the API.
export const dynamic = "force-dynamic";

const DESCRIPTION =
  "ট্রেন্ডিং গ্যাজেট থেকে হাতে তৈরি গর্জিয়াস ড্রেস — ইমপ্লেসিয়া মার্টের সব প্রোডাক্ট এক জায়গায়, ক্যাশ অন ডেলিভারিতে সারাদেশে ডেলিভারি সহ।";

function breadcrumbJsonLd(trail: { slug: string; label: string }[]) {
  return {
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
      ...trail.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 3,
        name: crumb.label,
        item: absoluteUrl(`/products?category=${crumb.slug}`),
      })),
    ],
  };
}

type ProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const search = readCatalogSearch((await searchParams) ?? {});
  const tree = search.category ? await listPublicCategoryTree() : null;
  const current = search.category
    ? tree?.find((item) => item.slug === search.category)
    : undefined;
  const title = current?.label ?? catalogTitle(search);
  const description = current?.metaDescription || current?.description || DESCRIPTION;
  const canonical = current ? `/products?category=${current.slug}` : "/products";

  return {
    title: current?.metaTitle || title,
    description,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title: current?.metaTitle || title,
      description,
    },
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const search = readCatalogSearch((await searchParams) ?? {});
  const [result, categoryTree] = await Promise.all([
    queryStoreCatalog(search),
    listPublicCategoryTree(),
  ]);
  // The tree only lists visible categories, so an unknown or hidden slug is a 404. When the
  // tree itself could not be loaded we fall back to the plain listing instead of guessing.
  if (search.category && categoryTree && !categoryTree.some((item) => item.slug === search.category)) {
    notFound();
  }
  const trail = search.category && categoryTree ? categoryTrail(categoryTree, search.category) : [];
  const title = trail[trail.length - 1]?.label ?? catalogTitle(search);
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
          url: absoluteUrl(productPath(product)),
          name: product.title,
        })),
      };

  return (
    <main className="force-light w-full overflow-x-clip bg-[#f5f6f8] text-neutral-950">
      <JsonLd data={breadcrumbJsonLd(trail)} />
      {itemListJsonLd ? <JsonLd data={itemListJsonLd} /> : null}
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 pb-6 sm:pt-4 sm:pb-8">
          {result.unavailable ? (
            <CatalogUnavailable />
          ) : (
            <ProductsCatalog
              search={search}
              title={title}
              products={result.products}
              total={result.total}
              page={result.page}
              pages={result.pages}
              categoryTree={categoryTree ?? []}
              availabilityCounts={result.availabilityCounts}
              searchTruncated={result.searchTruncated}
            />
          )}
        </div>
      </Container>
    </main>
  );
}
