import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";
import { readTiers, type QuantityTier } from "@/lib/mart-api/pricing";

/** Store-wide discount rules (Admin › Pricing). */
export type PricingSettings = {
  tiersEnabled: boolean;
  maxDiscountPercent: number;
  tiers: QuantityTier[];
};

type ApiSettings = {
  tiers_enabled?: unknown;
  max_discount_percent?: unknown;
  tiers?: unknown;
};

function mapSettings(body: ApiSettings): PricingSettings {
  return {
    tiersEnabled: body.tiers_enabled !== false,
    maxDiscountPercent:
      typeof body.max_discount_percent === "number" ? body.max_discount_percent : 90,
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
