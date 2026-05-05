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

const DEFAULT_ITEMS: CheckoutCartItem[] = [
  {
    id: "sneakers-urban-monarch",
    title: "Urban Monarch Sneakers",
    meta: "Size: 42 | Color: Bone",
    price: 240,
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCqzLzO2Kv2z3MUnazmfKfsTqiBYxVN4zEXpKWoy13qJ1GLU65XhLVaiaYIdZS1TlaX3QGHmfuDVjdLdNlcDwdgKe-l6Dzz8tpDZmg6lduFie5nlVsKk4gE5yLjt4TNbY6BHe0xC32T6uo7KWeLXQkNZpo_zrW02YdMWNVyCoQXd1gSwpDdHBXhRW4s0a83d1Z3IpGIyEk40W2k32vnSbxIdj5Q6Qu5UdRfjVZyxgQkcwBXwjwC0NMkHnlk7i-MTQhhsfGOq_nUPg",
    imageAlt: "Luxe Sneakers",
  },
  {
    id: "watch-verdant-chrono",
    title: "Verdant Chronograph",
    meta: "Size: OS | Color: Emerald",
    price: 890,
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtAsQANKZ2m4LsI0wehhO4Be1fvm1a7gURynPi5wT3ZWyWgy4XBafykfX5KWSfl2ro2euoLpDE30R_8zrDKKiMcZ3SFQsbK-YMOCAg8lClIOpXwHvCq1f0Y4fXJeazxpvVhQpogu7pkPDOy4-uyObVPTqLgKqKuXD30NBoa57xmbgQlDAXM9Kqge8_5F4sXCItSpoku3l6sxuP8jTciIhBv4kRYu8OGlinH_Z_PfFz3rAWzLnDVu_Rl9UdSDFAxzVZB1C1wyH86w",
    imageAlt: "Luxury Watch",
  },
];

const SHIPPING_FLAT = 25;
const TAX_RATE = 0.0818;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function buildCheckoutCart(opts?: { productSlug?: string }): CheckoutCart {
  let items = DEFAULT_ITEMS;

  if (opts?.productSlug) {
    // Lazy import (keeps this file focused on checkout data)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { products } = require("../products/products") as typeof import("../products/products");
    const found = products.find((p) => p.slug === opts.productSlug);

    if (found) {
      items = [
        {
          id: found.id,
          title: found.title,
          meta: found.subtitle,
          price: found.price,
          imageSrc: found.imageSrc,
          imageAlt: found.imageAlt,
        },
      ];
    }
  }

  const subtotal = roundMoney(items.reduce((sum, it) => sum + it.price, 0));
  const shipping = items.length ? SHIPPING_FLAT : 0;
  const tax = roundMoney(subtotal * TAX_RATE);
  const total = roundMoney(subtotal + shipping + tax);

  return {
    items,
    pricing: { subtotal, shipping, tax, total },
  };
}

export const checkoutCopy = {
  shippingTitle: "Shipping Details",
  paymentTitle: "Payment Method",
  summaryTitle: "Order Summary",
  placeOrder: "Place Order",
  sslNote: "Secure 256-bit SSL encrypted payment",
} as const;

