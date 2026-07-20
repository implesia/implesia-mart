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
  const { slug } = await params;
  const product = getProductDetailBySlug(slug);
  if (!product) return notFound();

  const badgeLabel: Record<NonNullable<typeof product.badge>, string> = {
    New: "নতুন প্রোডাক্ট",
    "Best Seller": "বেস্ট সেলার",
    Limited: "লিমিটেড স্টক",
  };

  return (
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 pt-20 pb-28 sm:px-6 sm:pt-24 sm:pb-32 lg:px-8 lg:pt-28 lg:pb-16 xl:px-10">
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
