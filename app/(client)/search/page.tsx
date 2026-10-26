import type { Metadata } from "next";
import Link from "next/link";

import { cardToProduct } from "@/lib/mart-api/catalog-product";
import { catalogHref, readCatalogSearch } from "@/lib/mart-api/catalog-query";
import {
  cleanSearchQuery,
  fetchSearch,
  searchHref,
  type SearchResults,
} from "@/lib/mart-api/search";

import { Container } from "../_components/common/container";
import { CatalogUnavailable } from "../products/_components/catalog-unavailable";
import { ProductsGrid } from "../products/_components/products-grid";
import { SearchBlogs } from "./_components/search-blogs";

// The answer depends on the query string and on live catalog data.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readPage(raw: string | undefined) {
  if (!raw || !/^\d+$/.test(raw.trim())) return 1;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 1 && value <= 1000 ? value : 1;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const q = cleanSearchQuery(first((await searchParams)?.q));
  return {
    title: q ? `“${q}” - খোঁজার ফল` : "খুঁজুন",
    // Result pages are endless and thin: keep them out of the index, let crawlers follow links.
    robots: { index: false, follow: true },
  };
}

async function load(q: string, page: number): Promise<SearchResults | null> {
  try {
    // Blogs are shown with the first page only; later pages walk the products.
    return await fetchSearch({
      q,
      type: page > 1 ? "products" : "all",
      page,
      pageSize: PAGE_SIZE,
    });
  } catch {
    return null;
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const raw = (await searchParams) ?? {};
  const q = cleanSearchQuery(first(raw.q));
  const page = readPage(first(raw.page));
  const results = q ? await load(q, page) : null;

  return (
    <main className="force-light w-full overflow-x-clip bg-[#f5f6f8] text-neutral-950">
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-4 pb-10 sm:pt-6">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {q ? `“${q}” এর খোঁজার ফল` : "খুঁজুন"}
          </h1>

          {!q ? (
            <section className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-12 text-center">
              <p className="text-sm text-neutral-600">
                উপরের সার্চ বক্সে প্রোডাক্ট বা ব্লগের নাম লিখুন।
              </p>
              <Link
                href="/products"
                className="mt-4 inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold"
              >
                সব প্রোডাক্ট দেখুন
              </Link>
            </section>
          ) : results === null ? (
            <div className="mt-6">
              <CatalogUnavailable />
            </div>
          ) : (
            <Results results={results} q={q} page={page} />
          )}
        </div>
      </Container>
    </main>
  );
}

function Results({ results, q, page }: { results: SearchResults; q: string; page: number }) {
  const { products, blogs } = results;
  const nothing = products.total === 0 && blogs.total === 0;
  if (page > 1 && products.items.length === 0 && products.total > 0) {
    // A page past the end: send the shopper to the last real one.
    return (
      <p className="mt-6 text-sm text-neutral-600">
        <Link className="font-semibold text-primary underline" href={searchHref(q, Math.max(1, products.pages))}>
          শেষ পৃষ্ঠায় যান
        </Link>
      </p>
    );
  }
  if (nothing) {
    return (
      <section className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-12 text-center">
        <p className="text-base font-semibold">কিছু পাওয়া যায়নি।</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
          বানান যাচাই করুন, অন্য শব্দ লিখুন, বা কম শব্দ দিয়ে খুঁজুন।
        </p>
        <Link
          href="/products"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold"
        >
          সব প্রোডাক্ট দেখুন
        </Link>
      </section>
    );
  }
  const filtered = catalogHref({ ...readCatalogSearch({ q }) });
  return (
    <div className="mt-4 space-y-10">
      {products.total > 0 ? (
        <section aria-labelledby="search-products">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="search-products" className="text-base font-semibold">
              প্রোডাক্ট ({products.total.toLocaleString("en-US")})
            </h2>
            <Link href={filtered} className="inline-flex min-h-6 items-center text-sm font-semibold text-primary underline">
              ফিল্টারসহ দেখুন
            </Link>
          </div>
          <ProductsGrid products={products.items.map(cardToProduct)} />
          {products.pages > 1 ? (
            <nav aria-label="পৃষ্ঠা" className="mt-6 flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link className="font-semibold text-primary underline" href={searchHref(q, page - 1)}>
                  আগের পৃষ্ঠা
                </Link>
              ) : (
                <span />
              )}
              <span className="text-neutral-600">
                {page} / {products.pages}
              </span>
              {page < products.pages ? (
                <Link className="font-semibold text-primary underline" href={searchHref(q, page + 1)}>
                  পরের পৃষ্ঠা
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </section>
      ) : null}
      {page === 1 && blogs.total > 0 ? <SearchBlogs posts={blogs.items} total={blogs.total} /> : null}
    </div>
  );
}
