import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* Staff screens, the cart, checkout, and a shopper's order lookup are not public pages.
         /admin also covers /admin/cart. There is no storefront /cart route (the cart is a drawer);
         /cart is disallowed so a cart URL cannot be indexed. Order success is the checkout page. */
      disallow: ["/admin", "/cart", "/checkout", "/order-status", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
