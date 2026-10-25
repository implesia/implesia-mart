"use client";

import { useMemo, useSyncExternalStore } from "react";

import { buttonVariants } from "@/components/ui/button";
import { absoluteUrl } from "@/lib/seo";
import { priceView } from "@/lib/mart-api/variants";
import { productPath } from "@/lib/mart-api/product-url";
import {
  configuredProductWhatsappNumber,
  productWhatsappMessage,
  selectionLabels,
  whatsappHref,
} from "@/lib/mart-api/whatsapp";
import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "../../_components/common/brand-icons";
import type { ProductDetail } from "../../_data/products/product-details";
import {
  activePicks,
  choicesOf,
  subscribeActivePicks,
} from "./purchase-selection";
import { usePurchaseQuantity } from "./use-purchase-quantity";
import { useSelectedVariant } from "./use-selected-variant";

const LABEL = "WhatsApp-এ অর্ডার/জিজ্ঞাসা করুন";
const INQUIRY_LABEL = "WhatsApp-এ জিজ্ঞাসা করুন";
export const WHATSAPP_HINT = "WhatsApp খুলবে। মেসেজটি দেখে আপনি নিজে পাঠান।";

/**
 * Third purchase action. The link is rebuilt from the same selection store and
 * quantity the Add to Cart and Order buttons use, so it always matches what the
 * shopper sees. Prices are the displayed (API-priced) values; nothing is sent
 * until the shopper presses send in WhatsApp.
 */
export function ProductWhatsAppButton({
  product,
  layout,
  className,
}: {
  product: ProductDetail;
  layout: "full" | "icon";
  className?: string;
}) {
  const picks = useSyncExternalStore(subscribeActivePicks, activePicks, () => []);
  const { variant, check } = useSelectedVariant(product);
  const { quantity } = usePurchaseQuantity(product.slug, variant?.id ?? null, {
    min: product.minPerOrder,
    max: product.maxPerOrder,
  });
  const number = configuredProductWhatsappNumber();
  const view = priceView(product, variant, quantity);
  const status = product.status ?? "available";
  const orderable = status === "available" && check.ok;
  const selection = useMemo(
    () => selectionLabels(product.purchaseOptions ?? [], choicesOf(picks)),
    [product.purchaseOptions, picks],
  );

  if (!number) return null;

  const href = whatsappHref(
    number,
    productWhatsappMessage({
      title: product.title,
      id: product.id,
      url: absoluteUrl(productPath(product)),
      selection,
      quantity,
      unitPrice: view.unitPrice,
      lineTotal: view.lineTotal,
      orderable,
      status,
    }),
  );
  const label = orderable ? LABEL : INQUIRY_LABEL;

  if (layout === "icon") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="product-whatsapp"
        aria-label={`${label} (${WHATSAPP_HINT})`}
        title={label}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "size-11 shrink-0 rounded-full text-[#128c4a] sm:size-12",
          className,
        )}
      >
        <WhatsAppIcon className="size-5" />
      </a>
    );
  }

  return (
    <div className={className}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="product-whatsapp"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-12 w-full gap-2 rounded-full border-[#128c4a]/50 text-sm font-semibold text-[#0d6b39]",
        )}
      >
        <WhatsAppIcon className="size-5" />
        {label}
      </a>
      <p className="mt-1.5 text-center text-xs text-muted-foreground">
        {WHATSAPP_HINT}
      </p>
    </div>
  );
}
