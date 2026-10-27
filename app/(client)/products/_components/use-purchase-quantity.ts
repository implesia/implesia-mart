"use client";

import { useSyncExternalStore } from "react";

import { clampQuantity, lineKey } from "@/lib/mart-api/variants";

import { useCart } from "../../_providers/cart-provider";
import {
  getBuyQuantity,
  setBuyQuantity,
  subscribeBuyQuantity,
} from "./buy-quantity-store";

type Limits = { min?: number; max?: number | null };

/**
 * Product-page quantity. Once this product and variant is in the cart, this is that cart line.
 * `limits` are the product's order limits; the API enforces them again at cart and order time.
 */
export function usePurchaseQuantity(
  slug: string,
  variantId: string | null = null,
  limits: Limits = {},
) {
  const { items, adjustQuantity, addItem, openCart, readQuantity } = useCart();
  const localQuantity = useSyncExternalStore(
    subscribeBuyQuantity,
    getBuyQuantity,
    () => 1,
  );
  const key = lineKey(slug, variantId);
  const line = items.find((item) => item.key === key);
  const quantity = line?.quantity ?? clampQuantity(localQuantity, limits);
  const min = clampQuantity(1, limits);
  const max = clampQuantity(5, limits);

  return {
    quantity,
    inCart: Boolean(line),
    lineTotal: line?.lineTotal,
    atMin: quantity <= min,
    atMax: quantity >= max,
    decrease() {
      if (line) adjustQuantity(key, -1);
      else setBuyQuantity(clampQuantity(getBuyQuantity() - 1, limits));
    },
    increase() {
      if (line) adjustQuantity(key, 1);
      else setBuyQuantity(clampQuantity(getBuyQuantity() + 1, limits));
    },
    addItem,
    openCart,
    /** Latest selected quantity, including clicks that have not re-rendered yet. */
    selected() {
      return line ? readQuantity(key) : clampQuantity(getBuyQuantity(), limits);
    },
  };
}
