"use client";

import { useSyncExternalStore } from "react";

import { MAX_CART_QTY } from "../../_lib/cart-shared";
import { useCart } from "../../_providers/cart-provider";
import {
  adjustBuyQuantity,
  getBuyQuantity,
  subscribeBuyQuantity,
} from "./buy-quantity-store";

/** Product-page quantity. Once the product is in the cart, this is that cart line. */
export function usePurchaseQuantity(slug: string) {
  const { items, adjustQuantity, addItem, openCart, readQuantity } = useCart();
  const localQuantity = useSyncExternalStore(
    subscribeBuyQuantity,
    getBuyQuantity,
    () => 1,
  );
  const line = items.find((item) => item.slug === slug);
  const quantity = line?.quantity ?? localQuantity;

  return {
    quantity,
    inCart: Boolean(line),
    lineTotal: line?.lineTotal,
    atMin: quantity <= 1,
    atMax: quantity >= MAX_CART_QTY,
    decrease() {
      if (line) adjustQuantity(slug, -1);
      else adjustBuyQuantity(-1);
    },
    increase() {
      if (line) adjustQuantity(slug, 1);
      else adjustBuyQuantity(1);
    },
    addItem,
    openCart,
    /** Latest selected quantity, including clicks that have not re-rendered yet. */
    selected() {
      return line ? readQuantity(slug) : getBuyQuantity();
    },
  };
}
