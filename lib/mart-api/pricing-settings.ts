import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";
import { readTiers, type QuantityTier } from "@/lib/mart-api/pricing";
import { DEFAULT_MAX_QUANTITY, QUANTITY_CEILING } from "@/lib/mart-api/variants";

/** A typed order limit: a whole number from 1 to 1000, else null. */
export function parseQuantityLimit(value: string): number | null {
  const text = value.trim();
  if (!/^\d{1,4}$/.test(text)) return null;
  const amount = Number(text);
  return amount >= 1 && amount <= QUANTITY_CEILING ? amount : null;
}

/** Store-wide discount rules (Admin › Pricing). */
export type PricingSettings = {
  tiersEnabled: boolean;
  maxDiscountPercent: number;
  /** Most of one product per cart/order line, unless the product sets its own. */
  maxQuantityPerOrder: number;
  tiers: QuantityTier[];
};

type ApiSettings = {
  tiers_enabled?: unknown;
  max_discount_percent?: unknown;
  max_quantity_per_order?: unknown;
  tiers?: unknown;
};

function mapSettings(body: ApiSettings): PricingSettings {
  return {
    tiersEnabled: body.tiers_enabled !== false,
    maxDiscountPercent:
      typeof body.max_discount_percent === "number" ? body.max_discount_percent : 90,
    maxQuantityPerOrder:
      typeof body.max_quantity_per_order === "number"
        ? body.max_quantity_per_order
        : DEFAULT_MAX_QUANTITY,
    tiers: readTiers(body.tiers),
  };
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to change discounts.";
  if (response.status === 403) return "You do not have permission to change discounts.";
  return fallback;
}

export async function getAdminPricingSettings() {
  const response = await authorizedFetch("/api/v1/admin/pricing", { cache: "no-store" });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Discount settings could not be loaded."));
  }
  return mapSettings((await response.json()) as ApiSettings);
}

export async function saveAdminPricingSettings(settings: PricingSettings) {
  const response = await authorizedFetch("/api/v1/admin/pricing", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tiers_enabled: settings.tiersEnabled,
      max_discount_percent: settings.maxDiscountPercent,
      max_quantity_per_order: settings.maxQuantityPerOrder,
      tiers: settings.tiers.map((tier) => ({
        min_quantity: tier.minQuantity,
        extra_percent: tier.extraPercent,
      })),
    }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Discount settings could not be saved."));
  }
  return mapSettings((await response.json()) as ApiSettings);
}
