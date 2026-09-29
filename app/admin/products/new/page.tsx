"use client";

import { AdminPageHeader } from "../../_components/admin-ui";
import { ProductForm } from "../_components/product-form";

export default function NewProductPage() {
  return (
    <>
      <AdminPageHeader title="নতুন প্রোডাক্ট" description="সেভ করলে প্রোডাক্ট লিস্টে মক আপডেট দেখাবে।" />
      <ProductForm />
    </>
  );
}
