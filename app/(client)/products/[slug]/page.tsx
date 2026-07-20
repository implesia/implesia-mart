import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductBreadcrumbs } from "../_components/product-breadcrumbs";
import { ProductDetailsTabs } from "../_components/product-details-tabs";
import { ProductGallery } from "../_components/product-gallery";
import { ProductInfo } from "../_components/product-info";
import { ProductMobileBuyBar } from "../_components/product-mobile-buy-bar";
import { ProductSupportPanel } from "../_components/product-support-panel";
import { RelatedProducts } from "../_components/related-products";
import { getProductDetailBySlug } from "../../_data/products/product-details";
import { products } from "../../_data/products/products";

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

  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: [{ url: product.imageSrc, alt: product.imageAlt }],
    },
  };
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next.js 16: dynamic route params are async.
  const { slug } = await params;
  const product = getProductDetailBySlug(slug);
  if (!product) return notFound();

  const badgeLabel: Record<NonNullable<typeof product.badge>, string> = {
    New: "নতুন প্রোডাক্ট",
    "Best Seller": "বেস্ট সেলার",
    Limited: "লিমিটেড স্টক",
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pt-24 pb-28 sm:px-6 sm:pt-28 lg:px-10 lg:pt-32 lg:pb-16">
      <ProductBreadcrumbs items={product.breadcrumbs} />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14">
        <div className="space-y-6 lg:col-span-7 lg:space-y-8">
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
          <ProductSupportPanel product={product} className="hidden lg:block" />
        </div>
        <div className="lg:col-span-5">
          <ProductInfo product={product} />
        </div>
      </div>

      <ProductDetailsTabs product={product} />
      <RelatedProducts items={product.related} />

      <ProductMobileBuyBar product={product} />
    </main>
  );
}
