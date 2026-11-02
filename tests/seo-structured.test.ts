/* eslint-disable @typescript-eslint/no-explicit-any -- JSON-LD is untyped JSON read by key. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { HSTS_VALUE, wantsHsts } from "@/lib/hsts";
import { outOfRangeTarget } from "@/lib/mart-api/catalog-page-guard";
import {
  productJsonLd,
  type ShippingRates,
  type StructuredProduct,
} from "@/lib/product-structured-data";
import { absoluteUrl, pageMetadata, SITE_URL, siteVerification } from "@/lib/seo";
import { lastModified, latest, sitemapCategories } from "@/lib/sitemap-entries";

const RATES: ShippingRates = {
  insideDhaka: 70,
  dhakaSuburban: 100,
  outsideDhaka: 130,
  insideEnabled: true,
  suburbanEnabled: true,
  outsideEnabled: false,
};
const NOW = new Date("2026-11-02T00:00:00Z");
const URL_ = "https://mart.example/products/p1";

function ld(product: StructuredProduct, rates: ShippingRates | null = RATES) {
  return productJsonLd({
    product,
    name: "Desk Lamp",
    description: "A warm lamp.",
    url: URL_,
    brand: "Implesia Mart",
    rates,
    now: NOW,
    toAbsolute: (src) => new URL(src, "https://mart.example").toString(),
  }) as Record<string, any>;
}

const PLAIN: StructuredProduct = {
  id: "p1",
  price: 1500,
  status: "in-stock",
  imageSrc: "/img/a.jpg",
  gallery: [{ src: "/img/a.jpg" }, { src: "/img/b.jpg", type: "image" }, { src: "/v.mp4", type: "video" }],
  categoryName: "Lighting",
};

// Google merchant listing requirements (developers.google.com/search/docs/appearance/
// structured-data/merchant-listing): Product needs name, image and offers; an Offer needs
// price (or a priceSpecification) and priceCurrency; recommended fields are checked too.
function assertOffer(offer: Record<string, any>) {
  assert.equal(offer.priceCurrency, "BDT");
  assert.match(offer.priceValidUntil, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(offer.availability, /^https:\/\/schema\.org\/(InStock|OutOfStock|PreOrder)$/);
  assert.equal(offer.itemCondition, "https://schema.org/NewCondition");
  assert.deepEqual(offer.shippingDetails, {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: 100, currency: "BDT" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "BD" },
  });
  const policy = offer.hasMerchantReturnPolicy;
  assert.equal(policy["@type"], "MerchantReturnPolicy");
  assert.equal(policy.applicableCountry, "BD");
  assert.equal(policy.returnPolicyCategory, "https://schema.org/MerchantReturnFiniteReturnWindow");
  assert.ok(Number.isInteger(policy.merchantReturnDays) && policy.merchantReturnDays > 0);
  assert.match(policy.returnMethod, /^https:\/\/schema\.org\/Return(ByMail|InStore|AtKiosk)$/);
  assert.match(policy.returnFees, /^https:\/\/schema\.org\/(FreeReturn|ReturnFeesCustomerResponsibility|ReturnShippingFees)$/);
}

test("product JSON-LD has the required Product and Offer fields and no ratings", () => {
  const data = ld(PLAIN);
  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], "Product");
  assert.equal(data["@id"], `${URL_}#product`);
  assert.equal(data.name, "Desk Lamp");
  assert.deepEqual(data.image, ["https://mart.example/img/a.jpg", "https://mart.example/img/b.jpg"]);
  assert.deepEqual(data.brand, { "@type": "Brand", name: "Implesia Mart" });
  assert.equal(data.offers["@type"], "Offer");
  assert.equal(data.offers.price, 1500);
  assert.equal(data.offers.priceValidUntil, "2027-11-02");
  assert.equal(data.offers.availability, "https://schema.org/InStock");
  assertOffer(data.offers);
  for (const key of ["aggregateRating", "review"]) assert.equal(key in data, false);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(data)));
});

test("variants become an AggregateOffer with one Offer per variant", () => {
  const data = ld({
    ...PLAIN,
    variants: [
      { id: "v1", label: "Red", price: 1200, available: true },
      { id: "v2", label: "Blue", price: 1800, available: false },
    ],
  });
  const offers = data.offers;
  assert.equal(offers["@type"], "AggregateOffer");
  assert.equal(offers.lowPrice, 1200);
  assert.equal(offers.highPrice, 1800);
  assert.equal(offers.offerCount, 2);
  assert.equal(offers.availability, "https://schema.org/InStock");
  assertOffer(offers);
  assert.deepEqual(
    offers.offers.map((offer: Record<string, any>) => [offer["@type"], offer.sku, offer.price, offer.availability]),
    [
      ["Offer", "v1", 1200, "https://schema.org/InStock"],
      ["Offer", "v2", 1800, "https://schema.org/OutOfStock"],
    ],
  );
  offers.offers.forEach(assertOffer);
});

test("sold-out, coming-soon and unknown rates are handled", () => {
  assert.equal(ld({ ...PLAIN, status: "sold-out" }).offers.availability, "https://schema.org/OutOfStock");
  assert.equal(ld({ ...PLAIN, status: "coming-soon" }).offers.availability, "https://schema.org/PreOrder");
  const noRates = ld(PLAIN, null).offers;
  assert.equal("shippingDetails" in noRates, false);
  assert.equal(noRates.hasMerchantReturnPolicy["@type"], "MerchantReturnPolicy");
});

test("pageMetadata marks product pages with og:type product and the price", () => {
  const meta = pageMetadata({
    title: "Lamp",
    description: "d",
    path: "/products/p1",
    product: { price: 1500, currency: "BDT" },
  });
  assert.equal("type" in (meta.openGraph as object), false);
  assert.deepEqual(meta.other, {
    "og:type": "product",
    "product:price:amount": "1500",
    "product:price:currency": "BDT",
  });
  const plain = pageMetadata({ title: "FAQ", description: "d", path: "/faqs" });
  assert.equal((plain.openGraph as Record<string, unknown>).type, "website");
});

test("the home URL has no trailing slash, like its canonical", () => {
  assert.equal(absoluteUrl("/"), SITE_URL);
  assert.equal(absoluteUrl(""), SITE_URL);
  assert.equal(absoluteUrl("/faqs"), `${SITE_URL}/faqs`);
});

test("siteVerification reads optional Google and Bing tokens", () => {
  assert.equal(siteVerification({}), undefined);
  assert.deepEqual(siteVerification({ google: "g-token" }), { google: "g-token" });
  assert.deepEqual(siteVerification({ google: " ", bing: "b-token" }), {
    other: { "msvalidate.01": "b-token" },
  });
});

test("sitemap categories keep only those with products, with real dates", () => {
  const items = sitemapCategories([
    {
      slug: "fashion",
      product_count: 3,
      updated_at: "2026-10-01T10:00:00Z",
      children: [
        { slug: "sarees", product_count: 1, updated_at: "bad" },
        { slug: "empty", product_count: 0 },
      ],
    },
    { slug: "fashion", product_count: 3 },
    null,
  ]);
  assert.deepEqual(
    items.map((item) => [item.path, item.lastModified?.toISOString()]),
    [
      ["/products?category=fashion", "2026-10-01T10:00:00.000Z"],
      ["/products?category=sarees", undefined],
    ],
  );
  assert.equal(lastModified(undefined), undefined);
  assert.equal(latest([undefined, new Date(1), new Date(5)])?.getTime(), 5);
});

test("an out-of-range catalog page redirects to the last page with its filters", () => {
  const params = new URLSearchParams("category=fashion&page=50&sort=price-asc");
  const target = outOfRangeTarget(params, 3);
  assert.ok(target?.startsWith("/products?"));
  const query = new URLSearchParams(target!.split("?")[1]);
  assert.equal(query.get("category"), "fashion");
  assert.equal(query.get("page"), "3");
  assert.equal(query.get("sort"), "price-asc");
  assert.equal(outOfRangeTarget(new URLSearchParams("page=2"), 3), null);
  assert.equal(outOfRangeTarget(new URLSearchParams("page=9"), 0), null);
});

test("HSTS is sent only for HTTPS on a public host", () => {
  assert.equal(HSTS_VALUE, "max-age=31536000");
  assert.equal(wantsHsts(new URL("https://mart.implesia.com/"), null), true);
  assert.equal(wantsHsts(new URL("http://mart.implesia.com/"), "https"), true);
  assert.equal(wantsHsts(new URL("https://mart.implesia.com/"), "http"), false);
  assert.equal(wantsHsts(new URL("http://mart.implesia.com/"), null), false);
  assert.equal(wantsHsts(new URL("https://localhost:3001/"), null), false);
});
