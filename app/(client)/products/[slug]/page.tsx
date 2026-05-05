import { notFound } from "next/navigation";

import { ProductBreadcrumbs } from "../_components/product-breadcrumbs";
import { ProductDetailsTabs } from "../_components/product-details-tabs";
import { ProductGallery } from "../_components/product-gallery";
import { ProductInfo } from "../_components/product-info";
import { RelatedProducts } from "../_components/related-products";
import { getProductDetailBySlug } from "../../_data/products/product-details";
import { products } from "../../_data/products/products";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
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

  return (
    <main className="mx-auto max-w-[1440px] px-10 pt-32">
      <ProductBreadcrumbs items={product.breadcrumbs} />

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProductGallery
            badge={
              product.badge
                ? `${product.badge.toUpperCase()} ARRIVAL`
                : undefined
            }
            images={product.gallery}
          />
        </div>
        <div className="lg:col-span-5">
          <ProductInfo product={product} />
        </div>
      </div>

      <ProductDetailsTabs product={product} />
      <RelatedProducts items={product.related} />
    </main>
  );
}
