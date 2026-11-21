"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { categoryLabel } from "@/app/(client)/_data/products/catalog-meta";
import type { ProductAnalyticsReport } from "@/lib/admin/reports";
import {
  deleteMartProduct,
  getMartProduct,
  MartApiError,
} from "@/lib/mart-api/products";
import { productPath } from "@/lib/mart-api/product-url";
import { fetchProductAnalytics } from "@/lib/mart-api/reports";
import type { AdminProduct } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  adminButtonClass,
  AdminLoading,
  AdminPageHeader,
  StockStatusBadge,
} from "../../../_components/admin-ui";
import { useConfirmDelete } from "../../../_components/confirm-delete";
import { ProductMediaViewer } from "./_components/product-media-viewer";
import {
  ProductDetailsSummary,
  ProductKpiStrip,
  RecentMovementsCard,
  VariantsBreakdownTable,
} from "./_components/product-view-sections";

const PRODUCT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AdminProductViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const confirmDelete = useConfirmDelete();
  const id = decodeURIComponent(params.id ?? "");
  const validId = PRODUCT_ID.test(id);

  const [state, setState] = useState<{
    id: string;
    product: AdminProduct | null;
    analytics: ProductAnalyticsReport | null;
    error: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    Promise.all([getMartProduct(id), fetchProductAnalytics(id).catch(() => null)])
      .then(([product, analytics]) => {
        if (!cancelled) setState({ id, product, analytics, error: "" });
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setState({
          id,
          product: null,
          analytics: null,
          error:
            loadError instanceof MartApiError
              ? loadError.message
              : "Could not load this product.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id, validId]);

  if (validId && state?.id !== id) return <AdminLoading />;

  const product = validId && state?.id === id ? state.product : null;
  const analytics = validId && state?.id === id ? state.analytics : null;
  const error = validId && state?.id === id ? state.error : "";

  if (!product) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Product not found" description={error || undefined} />
        <Link href="/admin/products" className={adminButtonClass.secondary}>
          Back to products
        </Link>
      </div>
    );
  }

  const categoryTrailText =
    product.categoryPath?.map((node) => node.name).join(" › ") ||
    product.categoryName ||
    categoryLabel(product.categoryId);
  const supplierName = product.supplierName ?? analytics?.supplierName ?? null;
  const storefrontHref = productPath({ id: product.id, slug: product.slug });

  function handleDelete() {
    if (!product?.id || deleting) return;
    const targetId = product.id;
    const targetTitle = product.title;
    void confirmDelete({
      title: "Delete this product?",
      description: (
        <>
          <span className="font-semibold text-neutral-800">“{targetTitle}”</span> will be removed
          from the catalog and the storefront. This cannot be undone.
        </>
      ),
      successMessage: "Product deleted",
      errorMessage: "The product could not be deleted.",
      onConfirm: async () => {
        setDeleting(true);
        try {
          await deleteMartProduct(targetId);
          router.replace("/admin/products");
        } finally {
          setDeleting(false);
        }
      },
    });
  }

  return (
    <div className="min-w-0 space-y-5 pb-10">
      {/* Top Executive Header */}
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:size-20">
            {product.imageSrc ? (
              <Image
                src={product.imageSrc}
                alt={product.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-slate-400">
                <MaterialIcon name="image" className="text-[28px]" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold text-slate-950 sm:text-xl">
                {product.title}
              </h1>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  product.published
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70"
                    : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/70",
                )}
              >
                {product.published ? "Published" : "Draft"}
              </span>
              <StockStatusBadge status={product.status} />
            </div>

            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono">{product.slug}</span>
              <span className="text-slate-300">•</span>
              <span>{categoryTrailText}</span>
              {supplierName ? (
                <>
                  <span className="text-slate-300">•</span>
                  <Link
                    href={`/admin/inventory/suppliers?q=${encodeURIComponent(supplierName)}`}
                    className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 font-semibold text-teal-800 ring-1 ring-teal-200/70 transition hover:bg-teal-100"
                  >
                    <MaterialIcon name="handshake" className="text-[14px]" />
                    {supplierName}
                  </Link>
                </>
              ) : null}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/products/${product.id}`} className={adminButtonClass.primary}>
            <MaterialIcon name="edit" className="text-[18px]" />
            Edit Product
          </Link>
          <a
            href={storefrontHref}
            target="_blank"
            rel="noopener noreferrer"
            className={adminButtonClass.secondary}
          >
            <MaterialIcon name="open_in_new" className="text-[18px]" />
            View on Storefront
          </a>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className={cn(
              adminButtonClass.secondary,
              "text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50",
            )}
          >
            <MaterialIcon name="delete" className="text-[18px]" />
            Delete
          </button>
        </div>
      </header>

      {/* Financial & Inventory KPI Strip */}
      <ProductKpiStrip product={product} analytics={analytics} />

      {/* Main Content Grid */}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <ProductMediaViewer
          title={product.title}
          imageSrc={product.imageSrc}
          imageAlt={product.content.imageAlt}
          gallery={product.content.gallery}
        />
        <ProductDetailsSummary product={product} />
      </div>

      {/* Variants Table (if any) */}
      <VariantsBreakdownTable product={product} />

      {/* Recent Stock Movements Ledger Preview */}
      {product.id ? <RecentMovementsCard productId={product.id} analytics={analytics} /> : null}
    </div>
  );
}
