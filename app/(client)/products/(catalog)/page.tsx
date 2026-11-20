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
import { absoluteUrl, pageMetadata } from "@/lib/seo";

import { Container } from "../../_components/common/container";
import { JsonLd } from "../../_components/common/json-ld";
import { CatalogUnavailable } from "../_components/catalog-unavailable";
import { ProductsCatalog } from "../_components/products-catalog";
import { productPath } from "@/lib/mart-api/product-url";

// Render per request: the Workers KV fetch/ISR cache hit its daily write limit and
// kept serving stale CMS data (old image URLs). CMS reads go straight to the API.
export const dynamic = "force-dynamic";

const DESCRIPTION =
  "ইমপ্লেসিয়া মার্টে ইলেকট্রনিক্স ও প্রয়োজনীয় হোম অ্যাপ্লায়েন্সের নির্ভরযোগ্য সংগ্রহ। পছন্দের পণ্যটি অর্ডার করুন সহজেই, ক্যাশ অন ডেলিভারিতে সারা বাংলাদেশে পণ্য পৌঁছে যাবে আপনার ঠিকানায়।";

function breadcrumbJsonLd(trail: { slug: string; label: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "All Products",
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
  const description =
    current?.metaDescription || current?.description || DESCRIPTION;
  // Self-canonical per page (category + page only; sort, filters and search fold into it).
  const params = new URLSearchParams();
  if (current) params.set("category", current.slug);
  if (search.page > 1) params.set("page", String(search.page));
  const query = params.toString();
  const canonical = query ? `/products?${query}` : "/products";
  const pageTitle = current?.metaTitle || title;

  return pageMetadata({
    title:
      search.page > 1
        ? `${pageTitle} — Page ${search.page}`
        : pageTitle,
    description,
    path: canonical,
  });
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const search = readCatalogSearch((await searchParams) ?? {});
  const [result, categoryTree] = await Promise.all([
    queryStoreCatalog(search),
    listPublicCategoryTree(),
  ]);
  // The tree only lists visible categories, so an unknown or hidden slug is a 404. When the
  // tree itself could not be loaded we fall back to the plain listing instead of guessing.
  if (
    search.category &&
    categoryTree &&
    !categoryTree.some((item) => item.slug === search.category)
  ) {
    notFound();
  }
  const trail =
    search.category && categoryTree
      ? categoryTrail(categoryTree, search.category)
      : [];
  const title = trail[trail.length - 1]?.label ?? catalogTitle(search);
  // proxy.ts already answers an out-of-range page with a real 307; this is the fallback
  // (after the loading shell has streamed it can only be a meta refresh).
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
            />
          )}
        </div>
      </Container>
    </main>
  );
}
