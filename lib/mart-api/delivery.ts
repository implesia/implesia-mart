import { MART_API_URL, MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type DeliveryZone = "inside" | "suburban" | "outside";

export type DeliveryRates = {
  insideDhaka: number;
  dhakaSuburban: number;
  outsideDhaka: number;
};

type ApiRates = {
  inside_dhaka: number;
  dhaka_suburban: number;
  outside_dhaka: number;
};

function mapRates(body: ApiRates): DeliveryRates {
  return {
    insideDhaka: body.inside_dhaka,
    dhakaSuburban: body.dhaka_suburban,
    outsideDhaka: body.outside_dhaka,
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
    }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Delivery rates could not be saved."));
  }
  return mapRates((await response.json()) as ApiRates);
}
