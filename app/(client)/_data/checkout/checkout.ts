export type CheckoutCartItem = {
  id: string;
  title: string;
  meta: string;
  price: number;
  imageSrc: string;
  imageAlt: string;
};

export type CheckoutCart = {
  items: CheckoutCartItem[];
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
};

import { products } from "../products/products";

const DEFAULT_ITEMS: CheckoutCartItem[] = products
  .filter((p) => p.status === "available")
  .map((p) => ({
    id: p.id,
    title: p.title,
    meta: p.subtitle,
    price: p.price,
    imageSrc: p.imageSrc,
    imageAlt: p.imageAlt,
  }));

const SHIPPING_FLAT = 70;

function roundMoney(value: number) {
  return Math.round(value);
}

export function buildCheckoutCart(opts?: { productSlug?: string; quantity?: number }): CheckoutCart {
  let items = DEFAULT_ITEMS;

  if (opts?.productSlug) {
    const found = products.find((p) => p.slug === opts.productSlug);

    if (found) {
      const quantity = Math.max(1, Math.min(5, opts.quantity ?? 1));
      items = [
        {
          id: found.id,
          title: found.title,
          meta: quantity > 1 ? `${found.subtitle} | পরিমাণ: ${quantity}` : found.subtitle,
          price: found.price * quantity,
          imageSrc: found.imageSrc,
          imageAlt: found.imageAlt,
        },
      ];
    }
  }

  const subtotal = roundMoney(items.reduce((sum, it) => sum + it.price, 0));
  const shipping = items.length ? SHIPPING_FLAT : 0;
  const total = roundMoney(subtotal + shipping);

  return {
    items,
    pricing: { subtotal, shipping, tax: 0, total },
  };
}

export const checkoutCopy = {
  shippingTitle: "ডেলিভারি ঠিকানা",
  paymentTitle: "পেমেন্ট পদ্ধতি",
  summaryTitle: "অর্ডার সামারি",
  placeOrder: "অর্ডার কনফার্ম করুন",
  sslNote: "১০০% সুরক্ষিত ও নিরাপদ চেকআউট",
} as const;

