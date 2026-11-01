import { visibleBadges } from "@/lib/mart-api/badge-rules";

import type { ProductDetail } from "../../_data/products/product-details";
import { ProductBreadcrumbs } from "./product-breadcrumbs";
import { ProductDetailsTabs } from "./product-details-tabs";
import { ProductGallery } from "./product-gallery";
import { ProductInfo } from "./product-info";
import { ProductMobileBuyBar } from "./product-mobile-buy-bar";
import { ProductSupportPanel } from "./product-support-panel";
import { RelatedProducts } from "./related-products";

/** Built-in badges keep their Bengali storefront wording unless an admin renamed them. */
const builtInLabel: Record<string, { name: string; label: string }> = {
  new: { name: "New", label: "নতুন প্রোডাক্ট" },
  "best-seller": { name: "Best Seller", label: "বেস্ট সেলার" },
  limited: { name: "Limited", label: "লিমিটেড স্টক" },
};

function detailBadges(product: ProductDetail) {
  return visibleBadges(product.badges, product.badge).map((badge) => {
    const builtIn = builtInLabel[badge.slug];
    return builtIn && builtIn.name === badge.name ? { ...badge, name: builtIn.label } : badge;
  });
}

export function ProductDetailLayout({ product }: { product: ProductDetail }) {
  return (
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 pt-4 pb-28 sm:px-6 sm:pb-32 lg:px-8 lg:pt-8 lg:pb-16 xl:px-10">
      <ProductBreadcrumbs items={product.breadcrumbs} />

      {/* DOM order is gallery, info (h1), then the desktop support panel (h2s) so headings stay in order;
          on lg the panel sits in row 2 under the gallery and the info column spans both rows. */}
      <div className="grid grid-cols-1 items-start gap-5 sm:gap-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-0 xl:gap-x-14">
        <div className="min-w-0 lg:col-span-7">
          <ProductGallery
            title={product.title}
            badge={
              product.status === "coming-soon"
                ? "কামিং সুন"
                : product.status === "sold-out"
                  ? "শেষ"
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
          className="hidden min-w-0 lg:col-span-7 lg:mt-8 lg:block"
        />
      </div>

      <ProductDetailsTabs product={product} />
      <RelatedProducts items={product.related} />
      <ProductMobileBuyBar key={product.slug} product={product} />
    </main>
  );
}
