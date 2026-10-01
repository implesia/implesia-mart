"use client";

import { ShippingContentsEditor } from "./contents-editor";
import { ShippingFaqEditor } from "./faq-editor";
import { ShippingHeroEditor } from "./hero-editor";
import { ShippingPaymentEditor } from "./payment-editor";
import { ShippingRefundEditor } from "./refund-editor";
import { ShippingReturnsEditor } from "./returns-editor";
import { ShippingBlockEditor } from "./shipping-block-editor";
import { ShippingSupportEditor } from "./support-editor";

export function ShippingSectionFallback() {
  return <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />;
}

export function ShippingSectionManager({ sectionId }: { sectionId: string }) {
  if (sectionId === "hero") return <ShippingHeroEditor />;
  if (sectionId === "contents") return <ShippingContentsEditor />;
  if (sectionId === "shipping") return <ShippingBlockEditor />;
  if (sectionId === "payment") return <ShippingPaymentEditor />;
  if (sectionId === "returns") return <ShippingReturnsEditor />;
  if (sectionId === "refund") return <ShippingRefundEditor />;
  if (sectionId === "support") return <ShippingSupportEditor />;
  if (sectionId === "faq") return <ShippingFaqEditor />;
  return null;
}
