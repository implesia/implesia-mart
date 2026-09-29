"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getAdminProduct, MOCK_EVENT, type AdminProduct } from "@/lib/mart-mock/store";

import { AdminLoading, AdminPageHeader } from "../../_components/admin-ui";
import { ProductForm } from "../_components/product-form";

export default function EditProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug ?? "");
  const [product, setProduct] = useState<AdminProduct | null | undefined>(undefined);

  useEffect(() => {
    const sync = () => setProduct(getAdminProduct(slug));
    sync();
    window.addEventListener(MOCK_EVENT, sync);
    return () => window.removeEventListener(MOCK_EVENT, sync);
  }, [slug]);

  if (product === undefined) return <AdminLoading />;

  if (!product) {
    return (
      <>
        <AdminPageHeader title="Product not found" />
        <Link href="/admin/products" className="text-sm font-medium text-primary">
          Back to products
        </Link>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader title="Edit product" description={product.title} />
      <ProductForm key={product.slug} product={product} />
    </>
  );
}
