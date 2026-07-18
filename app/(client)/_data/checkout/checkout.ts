import { products } from "../products/products";

export type CheckoutCartItem = {
  id: string;
  slug: string;
  title: string;
  meta: string;
  quantity: number;
  unitPrice: number;
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

const DEFAULT_ITEMS: CheckoutCartItem[] = products
  .filter((p) => p.status === "available")
  .map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    meta: p.subtitle,
    quantity: 1,
    unitPrice: p.price,
    price: p.price,
    imageSrc: p.imageSrc,
    imageAlt: p.imageAlt,
  }));

const SHIPPING_FLAT = 70;

function roundMoney(value: number) {
  return Math.round(value);
}

export function buildCheckoutCart(opts?: {
  productSlug?: string;
  quantity?: number;
}): CheckoutCart {
  let items = DEFAULT_ITEMS;

  if (opts?.productSlug) {
    const found = products.find((p) => p.slug === opts.productSlug);

    if (found) {
      const quantity = Math.max(1, Math.min(5, opts.quantity ?? 1));
      items = [
        {
          id: found.id,
          slug: found.slug,
          title: found.title,
          meta: found.subtitle,
          quantity,
          unitPrice: found.price,
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
  pageEyebrow: "সুরক্ষিত চেকআউট",
  pageTitle: "অর্ডার সম্পন্ন করুন",
  pageSubtitle: "ডেলিভারি ঠিকানা পূরণ করে অর্ডার কনফার্ম করুন।",
  shippingTitle: "ডেলিভারি ঠিকানা",
  shippingHint: "সঠিক মোবাইল ও ঠিকানা দিলে ডেলিভারি দ্রুত হয়।",
  paymentTitle: "পেমেন্ট পদ্ধতি",
  paymentHint: "এখন শুধু ক্যাশ অন ডেলিভারি চালু আছে।",
  summaryTitle: "অর্ডার সামারি",
  placeOrder: "অর্ডার কনফার্ম করুন",
  sslNote: "১০০% সুরক্ষিত চেকআউট · ক্যাশ অন ডেলিভারি",
  deliveryEta: "ঢাকায় ২৪–৪৮ ঘণ্টা, বাইরে ২৪–৭২ ঘণ্টা",
  backToProduct: "প্রোডাক্টে ফিরে যান",
} as const;

export const checkoutSteps = [
  { id: 1, label: "ঠিকানা" },
  { id: 2, label: "পেমেন্ট" },
  { id: 3, label: "কনফার্ম" },
] as const;
