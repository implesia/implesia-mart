"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

import { validGa4, validPixel } from "@/lib/analytics/config";
import { captureFbclidFromLocation } from "@/lib/analytics/order-tracking";
import { isAdminPath } from "@/lib/analytics/paths";
import { track } from "@/lib/analytics/track";

/**
 * Storefront-only loader. The client layout renders this; /admin does not.
 * Libraries load after hydration (`afterInteractive`) and at idle (`lazyOnload`).
 * Page views are sent from here, not by gtag's automatic page_view.
 */
export function StoreAnalytics({
  ga4Id,
  metaPixelId,
}: {
  ga4Id: string;
  metaPixelId: string;
}) {
  const ga4 = validGa4(ga4Id);
  const meta = validPixel(metaPixelId);
  const pathname = usePathname() || "/";
  const search = useSearchParams().toString();
  const seen = useRef("");

  useEffect(() => {
    if (isAdminPath(pathname)) return;
    captureFbclidFromLocation();
    if (!ga4 && !meta) return;
    const pagePath = search ? `${pathname}?${search}` : pathname;
    if (seen.current === pagePath) return;
    seen.current = pagePath;
    track(
      {
        name: "page_view",
        pagePath,
        pageLocation: window.location.href.split("#")[0] || window.location.href,
        pageTitle: document.title,
      },
      { pathname, config: { ga4Id: ga4, metaPixelId: meta } },
    );
  }, [ga4, meta, pathname, search]);

  if (isAdminPath(pathname) || (!ga4 && !meta)) return null;

  return (
    <>
      {ga4 ? (
        <Script
          id="implesia-ga4"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`}
          strategy="afterInteractive"
        />
      ) : null}
      {meta ? (
        <Script
          id="implesia-meta-pixel"
          src="https://connect.facebook.net/en_US/fbevents.js"
          strategy="lazyOnload"
        />
      ) : null}
    </>
  );
}
