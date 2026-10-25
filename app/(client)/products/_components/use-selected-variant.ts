"use client";

import { useSyncExternalStore } from "react";

import {
  findVariant,
  purchaseCheck,
  type ProductVariant,
} from "@/lib/mart-api/variants";

import type { ProductDetail } from "../../_data/products/product-details";
import {
  activePicks,
  choicesOf,
  subscribeActivePicks,
} from "./purchase-selection";

/** The variant matching the picks in the buy box, and whether it can be bought. */
export function useSelectedVariant(product: ProductDetail) {
  const picks = useSyncExternalStore(
    subscribeActivePicks,
    activePicks,
    () => [],
  );
  const variants: ProductVariant[] = product.variants ?? [];
  const hasVariants = product.hasVariants === true;
  const variant = hasVariants ? findVariant(variants, choicesOf(picks)) : null;
  return { hasVariants, variant, check: purchaseCheck(hasVariants, variant) };
}
