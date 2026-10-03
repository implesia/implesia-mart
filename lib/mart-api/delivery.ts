import { MART_API_URL, MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type DeliveryZone = "inside" | "suburban" | "outside";

export type DeliveryRates = {
  insideDhaka: number;
  dhakaSuburban: number;
  outsideDhaka: number;
  insideEnabled: boolean;
  suburbanEnabled: boolean;
  outsideEnabled: boolean;
};

type ApiRates = {
  inside_dhaka: number;
  dhaka_suburban: number;
  outside_dhaka: number;
  inside_enabled?: boolean;
  suburban_enabled?: boolean;
  outside_enabled?: boolean;
};

export function zoneEnabled(rates: DeliveryRates, zone: DeliveryZone) {
  if (zone === "inside") return rates.insideEnabled;
  if (zone === "suburban") return rates.suburbanEnabled;
  return rates.outsideEnabled;
}

function mapRates(body: ApiRates): DeliveryRates {
  return {
    insideDhaka: body.inside_dhaka,
    dhakaSuburban: body.dhaka_suburban,
    outsideDhaka: body.outside_dhaka,
    insideEnabled: body.inside_enabled ?? true,
    suburbanEnabled: body.suburban_enabled ?? true,
    outsideEnabled: body.outside_enabled ?? true,
  };
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to change delivery rates.";
  if (response.status === 403) return "You do not have permission to change delivery rates.";
  return fallback;
}

export async function getPublicDeliveryRates() {
  const response = await fetch(`${MART_API_URL}/api/v1/delivery`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new MartApiError("Delivery rates could not be loaded.");
  }
  return mapRates((await response.json()) as ApiRates);
}

export async function getAdminDeliveryRates() {
  const response = await authorizedFetch("/api/v1/admin/delivery");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Delivery rates could not be loaded."));
  }
  return mapRates((await response.json()) as ApiRates);
}

export async function saveAdminDeliveryRates(rates: DeliveryRates) {
  const response = await authorizedFetch("/api/v1/admin/delivery", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inside_dhaka: rates.insideDhaka,
      dhaka_suburban: rates.dhakaSuburban,
      outside_dhaka: rates.outsideDhaka,
      inside_enabled: rates.insideEnabled,
      suburban_enabled: rates.suburbanEnabled,
      outside_enabled: rates.outsideEnabled,
    }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Delivery rates could not be saved."));
  }
  return mapRates((await response.json()) as ApiRates);
}
