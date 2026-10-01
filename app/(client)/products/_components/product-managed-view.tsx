"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { applyAdminToDetail, detailFromAdmin } from "@/lib/mart-mock/product-content";
import { getAdminProduct, MOCK_EVENT } from "@/lib/mart-mock/store";

import type { ProductDetail } from "../../_data/products/product-details";
import { ProductDetailLayout } from "./product-detail-layout";

export function CatalogProductView({ product }: { product: ProductDetail }) {
  const [detail, setDetail] = useState(product);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const sync = () => {
      const admin = getAdminProduct(product.slug);
      if (!admin) {
        setHidden(false);
        setDetail(product);
        return;
      }
      if (!admin.published) {
        setHidden(true);
        return;
      }
      setHidden(false);
      setDetail(applyAdminToDetail(product, admin));
    };
    sync();
    window.addEventListener(MOCK_EVENT, sync);
    return () => window.removeEventListener(MOCK_EVENT, sync);
  }, [product]);

  if (hidden) return <Unavailable title="এই প্রোডাক্টটি এখন প্রকাশিত নয়।" />;
  return <ProductDetailLayout product={detail} />;
}

export function CustomProductView({ slug }: { slug: string }) {
  const [state, setState] = useState<"loading" | "missing" | "hidden" | "ready">("loading");
  const [product, setProduct] = useState<ProductDetail | null>(null);

  useEffect(() => {
    const sync = () => {
      const admin = getAdminProduct(slug);
      if (!admin) {
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
      <main className="mx-auto w-full max-w-7xl px-4 py-16" aria-busy="true" aria-label="Loading product">
        <div className="h-8 w-40 animate-pulse rounded-full bg-neutral-200" />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-neutral-200" />
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded-full bg-neutral-200" />
            <div className="h-10 w-3/4 animate-pulse rounded-full bg-neutral-200" />
            <div className="h-24 animate-pulse rounded-2xl bg-neutral-200" />
          </div>
        </div>
      </main>
    );
  }
  if (state === "hidden") return <Unavailable title="এই প্রোডাক্টটি এখন প্রকাশিত নয়।" />;
  if (state === "missing" || !product) return <Unavailable title="প্রোডাক্ট পাওয়া যায়নি।" />;
  return <ProductDetailLayout product={product} />;
}

function Unavailable({ title }: { title: string }) {
  return (
    <main className="mx-auto grid min-h-[50vh] w-full max-w-3xl place-items-center px-4 py-20 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-950">{title}</h1>
        <Link href="/products" className="mt-4 inline-flex text-sm font-semibold text-primary">
          সব প্রোডাক্ট দেখুন
        </Link>
      </div>
    </main>
  );
}
