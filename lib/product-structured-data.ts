/**
 * schema.org Product JSON-LD for the product page (Google merchant listing / product
 * snippet fields). Pure, so tests can check the structure. No ratings or reviews are
 * emitted: the store has none, and invented ones break Google's guidelines.
 */

export const STORE_COUNTRY = "BD";
export const STORE_CURRENCY = "BDT";

/**
 * Return policy. Assumption, from the storefront copy ("৩ দিনের ইজি রিটার্ন": damaged or
 * wrong items can be returned or replaced within 3 days, no stated return fee). Change
 * these values if the policy on /shipping-returns changes.
 */
export const RETURN_POLICY = {
  days: 3,
  method: "https://schema.org/ReturnByMail",
  fees: "https://schema.org/FreeReturn",
} as const;

/** How long the listed price is stated as valid (rolling; prices have no end date). */
export const PRICE_VALID_DAYS = 365;

export type ShippingRates = {
  insideDhaka: number;
  dhakaSuburban: number;
  outsideDhaka: number;
  insideEnabled: boolean;
  suburbanEnabled: boolean;
  outsideEnabled: boolean;
};

export type StructuredProduct = {
  id: string;
  price: number;
  status: string;
  imageSrc: string;
  gallery?: { src: string; type?: string }[];
  categoryName?: string;
  variants?: { id: string; label: string; price: number; available: boolean }[];
};

type Json = Record<string, unknown>;

export function availabilityUrl(status: string, available = true) {
  if (status === "coming-soon") return "https://schema.org/PreOrder";
  if (status === "sold-out" || !available) return "https://schema.org/OutOfStock";
  return "https://schema.org/InStock";
}

/** YYYY-MM-DD, `days` after `now`. */
export function priceValidUntil(now: Date, days = PRICE_VALID_DAYS) {
  return new Date(now.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Delivery charge inside Bangladesh. The zones (inside Dhaka / suburban / outside) do not
 * map to ISO region codes, so one country-wide rate is given: the highest enabled charge,
 * which never understates what a shopper pays. Null when rates are unknown.
 */
export function shippingDetails(rates: ShippingRates | null): Json | null {
  if (!rates) return null;
  const enabled = [
    rates.insideEnabled ? rates.insideDhaka : null,
    rates.suburbanEnabled ? rates.dhakaSuburban : null,
    rates.outsideEnabled ? rates.outsideDhaka : null,
  ].filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0);
  if (enabled.length === 0) return null;
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: Math.max(...enabled), currency: STORE_CURRENCY },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: STORE_COUNTRY },
  };
}

export function returnPolicy(): Json {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: STORE_COUNTRY,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: RETURN_POLICY.days,
    returnMethod: RETURN_POLICY.method,
    returnFees: RETURN_POLICY.fees,
  };
}

/** Product images for JSON-LD: main image first, then gallery photos, absolute, unique. */
export function productImages(product: StructuredProduct, toAbsolute: (src: string) => string) {
  const sources = [product.imageSrc, ...(product.gallery ?? []).filter((item) => !item.type || item.type === "image").map((item) => item.src)];
  return [...new Set(sources.filter(Boolean).map(toAbsolute))].slice(0, 6);
}

export function productJsonLd(input: {
  product: StructuredProduct;
  name: string;
  description: string;
  url: string;
  brand: string;
  rates: ShippingRates | null;
  now: Date;
  toAbsolute: (src: string) => string;
}): Json {
  const { product, name, description, url, brand, rates, now, toAbsolute } = input;
  const shipping = shippingDetails(rates);
  const common: Json = {
    priceCurrency: STORE_CURRENCY,
    priceValidUntil: priceValidUntil(now),
    itemCondition: "https://schema.org/NewCondition",
    url,
    seller: { "@type": "Organization", name: brand },
    ...(shipping ? { shippingDetails: shipping } : {}),
    hasMerchantReturnPolicy: returnPolicy(),
  };
  const variants = (product.variants ?? []).filter((variant) => Number.isFinite(variant.price));
  const offers: Json =
    variants.length > 0
      ? {
          "@type": "AggregateOffer",
          lowPrice: Math.min(...variants.map((variant) => variant.price)),
          highPrice: Math.max(...variants.map((variant) => variant.price)),
          offerCount: variants.length,
          availability: availabilityUrl(product.status, variants.some((variant) => variant.available)),
          ...common,
          offers: variants.map((variant) => ({
            "@type": "Offer",
            sku: variant.id,
            name: variant.label,
            price: variant.price,
            availability: availabilityUrl(product.status, variant.available),
            ...common,
          })),
        }
      : {
          "@type": "Offer",
          price: product.price,
          availability: availabilityUrl(product.status),
          ...common,
        };
  const images = productImages(product, toAbsolute);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name,
    description,
    ...(images.length ? { image: images } : {}),
    sku: product.id,
    url,
    ...(product.categoryName ? { category: product.categoryName } : {}),
    brand: { "@type": "Brand", name: brand },
    offers,
  };
}
