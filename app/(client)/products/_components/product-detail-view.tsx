import { visibleBadges } from "@/lib/mart-api/badge-rules";

import type { ProductDetail } from "../../_data/products/product-details";
import { ProductBreadcrumbs } from "./product-breadcrumbs";
import { ProductDetailsTabs } from "./product-details-tabs";
import { ProductGallery } from "./product-gallery";
import { ProductInfo } from "./product-info";
import { ProductMobileBuyBar } from "./product-mobile-buy-bar";
import { ProductSupportPanel } from "./product-support-panel";
import { RelatedProducts } from "./related-products";

const builtInLabel: Record<string, { name: string; label: string }> = {
  new: { name: "New", label: "New" },
  "best-seller": { name: "Best Seller", label: "Best Seller" },
  limited: { name: "Limited", label: "Limited Stock" },
};

function detailBadges(product: ProductDetail) {
  return visibleBadges(product.badges, product.badge).map((badge) => {
    const builtIn = builtInLabel[badge.slug];
    return builtIn && builtIn.name === badge.name ? { ...badge, name: builtIn.label } : badge;
  });
}

export function ProductDetailLayout({ product }: { product: ProductDetail }) {
  return (
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-3.5 pt-3 pb-24 sm:px-6 sm:pb-28 lg:px-8 lg:pt-5 lg:pb-16 xl:px-10">
      <div className="mb-3 sm:mb-4">
        <ProductBreadcrumbs items={product.breadcrumbs} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-0 xl:gap-x-12">
        <div className="min-w-0 lg:col-span-7">
          <ProductGallery
            title={product.title}
            badge={
              product.status === "coming-soon"
                ? "Coming Soon"
                : product.status === "sold-out"
                  ? "Sold Out"
                  : undefined
            }
            badges={detailBadges(product)}
            images={product.gallery}
          />
        </div>

        <div className="min-w-0 lg:col-span-5 lg:row-span-2">
          <ProductInfo key={product.slug} product={product} />
        </div>

        <ProductSupportPanel
          product={product}
          className="hidden min-w-0 lg:col-span-7 lg:mt-6 lg:block"
        />
      </div>

      <ProductDetailsTabs product={product} />
      <RelatedProducts items={product.related} />
      <ProductMobileBuyBar key={product.slug} product={product} />
    </main>
  );
}
