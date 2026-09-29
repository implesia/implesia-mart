"use client";

import { AdminPageHeader } from "../../_components/admin-ui";
import { ProductForm } from "../_components/product-form";

export default function NewProductPage() {
  return (
    <>
      <AdminPageHeader title="New product" description="Saving adds it to the product list as mock data." />
      <ProductForm />
    </>
  );
}
