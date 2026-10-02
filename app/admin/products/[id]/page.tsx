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
  const [product, setProduct] = useState<AdminProduct | null | undefined>(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!PRODUCT_ID.test(id)) {
      setProduct(null);
      return;
    }
    let cancelled = false;
    setProduct(undefined);
    getMartProduct(id)
      .then((next) => {
        if (!cancelled) setProduct(next);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setProduct(null);
        setError(
          loadError instanceof MartApiError
            ? loadError.message
            : "Could not load this product.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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
