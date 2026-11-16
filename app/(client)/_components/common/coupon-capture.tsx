"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { captureCouponSearch } from "@/lib/coupons";

/** Remember `?coupon=` on any storefront page so checkout can fill it in. */
export function CouponCapture() {
  const params = useSearchParams();
  const code = params.get("coupon");

  useEffect(() => {
    if (!code) return;
    try {
      captureCouponSearch(`coupon=${encodeURIComponent(code)}`, window.sessionStorage);
    } catch {
      /* Private mode can refuse storage. Checkout still reads the URL. */
    }
  }, [code]);

  return null;
}
