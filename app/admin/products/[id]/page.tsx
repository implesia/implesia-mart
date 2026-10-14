"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getMartProduct, MartApiError } from "@/lib/mart-api/products";
import type { AdminProduct } from "@/lib/mart-mock/store";

import { AdminLoading, AdminPageHeader } from "../../_components/admin-ui";
import { ProductForm } from "../_components/product-form";

const PRODUCT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const validId = PRODUCT_ID.test(id);
  // The loaded result is keyed by id, so a stale product never shows for a new id.
  const [loaded, setLoaded] = useState<{
    id: string;
    product: AdminProduct | null;
    error: string;
  } | null>(null);
  const product: AdminProduct | null | undefined = !validId
    ? null
    : loaded?.id === id
      ? loaded.product
      : undefined;
  const error = validId && loaded?.id === id ? loaded.error : "";

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    getMartProduct(id)
      .then((next) => {
        if (!cancelled) setLoaded({ id, product: next, error: "" });
      })
      .catch((loadError) => {
        if (cancelled) return;
        setLoaded({
          id,
          product: null,
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

  if (product === undefined) return <AdminLoading />;

  if (!product) {
    return (
      <>
        <AdminPageHeader title="Product not found" description={error || undefined} />
        <Link href="/admin/products" className="text-sm font-medium text-primary">
          Back to products
        </Link>
      </>
    );
  }

  return <ProductForm key={product.id} product={product} />;
}
