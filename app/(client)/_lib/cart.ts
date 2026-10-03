import { effectiveStockStatus } from "@/lib/mart-mock/store";

import { products, type Product } from "../_data/products/products";

export const CART_STORAGE_KEY = "implesia.cart.v1";
export const MAX_CART_QTY = 5;
export const SHIPPING_FLAT = 70;

export type CartLineStored = {
  slug: string;
  quantity: number;
};

export type CartLineResolved = {
  id: string;
  slug: string;
  title: string;
  meta: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageSrc: string;
  imageAlt: string;
};

export type CartPricing = {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  insideDhaka: number;
  dhakaSuburban: number;
  outsideDhaka: number;
  insideEnabled: boolean;
  suburbanEnabled: boolean;
  outsideEnabled: boolean;
};

export function clampCartQty(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(MAX_CART_QTY, Math.floor(value)));
}

export function getAvailableProductBySlug(slug: string): Product | null {
  const product = products.find((p) => p.slug === slug);
  if (!product || effectiveStockStatus(slug, product.status) !== "available") return null;
  return product;
}

export function sanitizeCartLines(lines: CartLineStored[]): CartLineStored[] {
  const map = new Map<string, number>();

  for (const line of lines) {
    if (!line?.slug || typeof line.slug !== "string") continue;
    if (!getAvailableProductBySlug(line.slug)) continue;
    const nextQty = clampCartQty((map.get(line.slug) ?? 0) + Number(line.quantity || 0));
    map.set(line.slug, nextQty);
  }

  return Array.from(map.entries()).map(([slug, quantity]) => ({ slug, quantity }));
}

export function resolveCartLines(lines: CartLineStored[]): CartLineResolved[] {
  return sanitizeCartLines(lines).flatMap((line) => {
    const product = getAvailableProductBySlug(line.slug);
    if (!product) return [];

    return [
      {
        id: product.id,
        slug: product.slug,
        title: product.title,
        meta: product.subtitle,
        quantity: line.quantity,
        unitPrice: product.price,
        lineTotal: product.price * line.quantity,
        imageSrc: product.imageSrc,
        imageAlt: product.imageAlt,
      },
    ];
  });
}

export function computeCartPricing(lines: CartLineResolved[]): CartPricing {
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping = lines.length > 0 ? SHIPPING_FLAT : 0;
  return {
    subtotal,
    shipping,
    tax: 0,
    total: subtotal + shipping,
    insideDhaka: shipping,
    dhakaSuburban: shipping,
    outsideDhaka: shipping,
    insideEnabled: true,
    suburbanEnabled: true,
    outsideEnabled: true,
  };
}

export function formatCartMoney(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function offeredDeliveryLabel(pricing: CartPricing) {
  const offered = [
    pricing.insideEnabled ? pricing.insideDhaka : null,
    pricing.suburbanEnabled ? pricing.dhakaSuburban : null,
    pricing.outsideEnabled ? pricing.outsideDhaka : null,
  ].filter((fee): fee is number => fee != null);
  if (offered.length === 0) return "বন্ধ";
  if (offered.every((fee) => fee === offered[0])) return formatCartMoney(pricing.shipping);
  return "চেকআউটে";
}

export function readCartFromStorage(): CartLineStored[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return sanitizeCartLines(parsed as CartLineStored[]);
  } catch {
    return [];
  }
}

export function writeCartToStorage(lines: CartLineStored[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(sanitizeCartLines(lines)),
    );
  } catch {
    // ignore quota / private mode
  }
}
