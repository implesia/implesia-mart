import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "../../_components/common/json-ld";
import { ProductBreadcrumbs } from "../_components/product-breadcrumbs";
import { ProductDetailsTabs } from "../_components/product-details-tabs";
import { ProductGallery } from "../_components/product-gallery";
import { ProductInfo } from "../_components/product-info";
import { ProductMobileBuyBar } from "../_components/product-mobile-buy-bar";
import { ProductSupportPanel } from "../_components/product-support-panel";
import { RelatedProducts } from "../_components/related-products";
import { getProductDetailBySlug } from "../../_data/products/product-details";
import { products } from "../../_data/products/products";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductDetailBySlug(slug);

  if (!product) {
    return { title: "প্রোডাক্ট পাওয়া যায়নি" };
  }

  const url = `/products/${product.slug}`;
  const keywords = [product.title, product.subtitle, product.tagline].filter(
    (v): v is string => Boolean(v),
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
      images: [{ url: product.imageSrc, alt: product.imageAlt, width: 900, height: 900 }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description,
      images: [product.imageSrc],
    },
  };
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductDetailBySlug(slug);
  if (!product) return notFound();

  const badgeLabel: Record<NonNullable<typeof product.badge>, string> = {
    New: "নতুন প্রোডাক্ট",
    "Best Seller": "বেস্ট সেলার",
    Limited: "লিমিটেড স্টক",
  };

  const productUrl = absoluteUrl(`/products/${product.slug}`);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: [absoluteUrl(product.imageSrc)],
    sku: product.id,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price: product.price,
      availability:
        product.status === "coming-soon"
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.reviews
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.reviews.average,
            reviewCount: product.reviews.total,
          },
        }
      : {}),
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
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 pt-20 pb-28 sm:px-6 sm:pt-24 sm:pb-32 lg:px-8 lg:pt-28 lg:pb-16 xl:px-10">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <ProductBreadcrumbs items={product.breadcrumbs} />

      <div className="grid grid-cols-1 items-start gap-5 sm:gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14">
        {/* Mobile: gallery first. Desktop: left column */}
        <div className="min-w-0 lg:col-span-7">
          <ProductGallery
            badge={
              product.status === "coming-soon"
                ? "কামিং সুন"
                : product.badge
                  ? badgeLabel[product.badge]
                  : undefined
            }
            images={product.gallery}
          />
          <ProductSupportPanel product={product} className="mt-6 hidden lg:mt-8 lg:block" />
        </div>

        <div className="min-w-0 lg:col-span-5">
          <ProductInfo product={product} />
        </div>
      </div>

      <ProductDetailsTabs product={product} />
      <RelatedProducts items={product.related} />

      <ProductMobileBuyBar product={product} />
    </main>
  );
}
