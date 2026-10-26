import { cardToProduct } from "@/lib/mart-api/catalog-product";
import { productPath } from "@/lib/mart-api/product-url";
import { blogHref, searchHref, type SearchResults } from "@/lib/mart-api/search";

export const SEARCH_PRODUCT_LIMIT = 5;
export const SEARCH_BLOG_LIMIT = 3;

export type SearchOption = {
  id: string;
  kind: "product" | "blog" | "all";
  href: string;
  title: string;
  detail: string;
  image: string;
};

function taka(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

/**
 * The rows of the header dropdown: up to five products, up to three posts, then one
 * "see all results" row that always goes to the results page. `[]` before any answer.
 */
export function buildSearchOptions(
  results: SearchResults | null,
  query: string,
  idPrefix: string,
): SearchOption[] {
  if (!results) return [];
  const options: SearchOption[] = [
    ...results.products.items.slice(0, SEARCH_PRODUCT_LIMIT).map((card, index): SearchOption => {
      const product = cardToProduct(card);
      return {
        id: `${idPrefix}-p${index}`,
        kind: "product",
        href: productPath(product),
        title: product.title,
        detail: taka(product.price),
        image: product.imageSrc,
      };
    }),
    ...results.blogs.items.slice(0, SEARCH_BLOG_LIMIT).map(
      (post, index): SearchOption => ({
        id: `${idPrefix}-b${index}`,
        kind: "blog",
        href: blogHref(post.slug),
        title: post.title,
        detail: post.readTime || post.publishedAt,
        image: post.coverImage,
      }),
    ),
  ];
  options.push({
    id: `${idPrefix}-all`,
    kind: "all",
    href: searchHref(query),
    title: `“${query}” এর সব ফলাফল দেখুন`,
    detail: "",
    image: "",
  });
  return options;
}
