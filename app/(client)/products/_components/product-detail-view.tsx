import type { ProductDetail } from "../../_data/products/product-details";
import { ProductBreadcrumbs } from "./product-breadcrumbs";
import { ProductDetailsTabs } from "./product-details-tabs";
import { ProductGallery } from "./product-gallery";
import { ProductInfo } from "./product-info";
import { ProductMobileBuyBar } from "./product-mobile-buy-bar";
import { ProductSupportPanel } from "./product-support-panel";
import { RelatedProducts } from "./related-products";

const badgeLabel: Record<NonNullable<ProductDetail["badge"]>, string> = {
  New: "নতুন প্রোডাক্ট",
  "Best Seller": "বেস্ট সেলার",
  Limited: "লিমিটেড স্টক",
};

export function ProductDetailLayout({ product }: { product: ProductDetail }) {
  return (
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 pt-4 pb-28 sm:px-6 sm:pb-32 lg:px-8 lg:pt-8 lg:pb-16 xl:px-10">
      <ProductBreadcrumbs items={product.breadcrumbs} />

      <div className="grid grid-cols-1 items-start gap-5 sm:gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14">
        <div className="min-w-0 lg:col-span-7">
          <ProductGallery
            title={product.title}
            badge={
              product.status === "coming-soon"
                ? "কামিং সুন"
                : product.status === "sold-out"
                  ? "শেষ"
                  : product.badge
                    ? badgeLabel[product.badge]
                    : undefined
            }
            images={product.gallery}
          />
          <ProductSupportPanel
            product={product}
            className="mt-6 hidden lg:mt-8 lg:block"
          />
        </div>

        <div className="min-w-0 lg:col-span-5">
          <ProductInfo key={product.slug} product={product} />
        </div>
      </div>

      <ProductDetailsTabs product={product} />
      <RelatedProducts items={product.related} />
      <ProductMobileBuyBar key={product.slug} product={product} />
    </main>
  );
}
