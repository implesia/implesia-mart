import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";

import { getStoreProduct, getStoreProductById } from "@/lib/mart-api/catalog";
import { parseProductRef, productPath } from "@/lib/mart-api/product-url";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

import { JsonLd } from "../../_components/common/json-ld";
import { ProductDetailLayout } from "../_components/product-detail-view";

// Render per request: the Workers KV fetch/ISR cache hit its daily write limit and
// kept serving stale CMS data (old image URLs). CMS reads go straight to the API.
export const dynamic = "force-dynamic";

/**
 * `/products/{id}` is the canonical URL. A legacy `/products/{slug}` (old links,
 * blog content, search results) answers 308 to the id URL. Unknown, unpublished or
 * malformed refs are 404. The id route never redirects elsewhere, so no loops.
 */
const resolveProduct = cache(async (ref: string) => {
  const parsed = parseProductRef(ref);
  if (parsed.kind === "invalid") notFound();
  if (parsed.kind === "slug") {
    const bySlug = await getStoreProduct(parsed.slug);
    if (!bySlug) notFound();
    permanentRedirect(productPath(bySlug));
  }
  const product = await getStoreProductById(parsed.id);
  if (!product) notFound();
  if (!parsed.canonical) permanentRedirect(productPath(product));
  return product;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ref: string }>;
}): Promise<Metadata> {
  const { ref } = await params;
  const product = await resolveProduct(ref);

  const url = productPath(product);
  const keywords = [product.title, product.subtitle, product.tagline].filter(
    (value): value is string => Boolean(value),
  );

  return {
    title: product.title,
    description: product.description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: product.title,
      description: product.description,
      images: product.imageSrc
        ? [{ url: product.imageSrc, alt: product.imageAlt, width: 900, height: 900 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description,
      images: product.imageSrc ? [product.imageSrc] : undefined,
    },
  };
}

function availability(status: string) {
  if (status === "coming-soon") return "https://schema.org/PreOrder";
  if (status === "sold-out") return "https://schema.org/OutOfStock";
  return "https://schema.org/InStock";
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const product = await resolveProduct(ref);

  const productUrl = absoluteUrl(productPath(product));
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.imageSrc ? [absoluteUrl(product.imageSrc)] : undefined,
    sku: product.id,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price: product.price,
      availability: availability(product.status),
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: product.breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? absoluteUrl(item.href) : productUrl,
    })),
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <ProductDetailLayout product={product} />
    </>
  );
}
