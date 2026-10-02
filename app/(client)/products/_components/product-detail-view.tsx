"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  applyAdminToDetail,
  detailFromAdmin,
} from "@/lib/mart-mock/product-content";
import { getAdminProduct, MOCK_EVENT } from "@/lib/mart-mock/store";

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
          <ProductInfo product={product} />
        </div>
      </div>

      <ProductDetailsTabs product={product} />
      <RelatedProducts items={product.related} />
      <ProductMobileBuyBar product={product} />
    </main>
  );
}

export function CatalogProductView({ product }: { product: ProductDetail }) {
  const [live, setLive] = useState(product);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const sync = () => {
      const admin = getAdminProduct(product.slug);
      if (!admin) {
        setHidden(false);
        setLive(product);
        return;
      }
      if (!admin.published) {
        setHidden(true);
        return;
      }
      setHidden(false);
      setLive(applyAdminToDetail(product, admin));
    };
    sync();
    window.addEventListener(MOCK_EVENT, sync);
    return () => window.removeEventListener(MOCK_EVENT, sync);
  }, [product]);

  if (hidden) return <ProductUnavailable />;
  return <ProductDetailLayout product={live} />;
}

export function CustomProductView({ slug }: { slug: string }) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [state, setState] = useState<
    "loading" | "ready" | "missing" | "hidden"
  >("loading");

  useEffect(() => {
    const sync = () => {
      const admin = getAdminProduct(slug);
      if (!admin?.custom) {
        setProduct(null);
        setState("missing");
        return;
      }
      if (!admin.published) {
        setState("hidden");
        return;
      }
      setProduct(detailFromAdmin(admin));
      setState("ready");
    };
    sync();
    window.addEventListener(MOCK_EVENT, sync);
    return () => window.removeEventListener(MOCK_EVENT, sync);
  }, [slug]);

  if (state === "loading") {
    return (
      <main
        className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6"
        aria-busy="true"
      >
        <p className="text-sm text-neutral-500">Loading product…</p>
      </main>
    );
  }
  if (state !== "ready" || !product)
    return <ProductUnavailable missing={state === "missing"} />;
  return <ProductDetailLayout product={product} />;
}

function ProductUnavailable({ missing = false }: { missing?: boolean }) {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-start justify-center px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-950">
        {missing ? "Product not found" : "This product is not available"}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        {missing
          ? "This address does not match a product in the shop."
          : "This product is hidden from the shop right now."}
      </p>
      <Link
        href="/products"
        className="mt-6 text-sm font-semibold text-primary"
      >
        Back to products
      </Link>
    </main>
  );
}
