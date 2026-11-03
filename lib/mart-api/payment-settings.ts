import { unstable_rethrow } from "next/navigation";

import { API_BASE_URL } from "@/lib/mart-api/media-url";
import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";
import { NO_PAYMENT_SETTINGS, paymentSettingsFrom, type PaymentSettings } from "@/lib/payment";

const ADMIN_URL = "/api/v1/admin/site/payment";

/**
 * The live Bangla QR (`no-store`, so an admin change shows on the next request). On any
 * failure the QR is treated as not set: the card and the checkout method stay hidden.
 */
export async function getPublicPaymentSettings(): Promise<PaymentSettings> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/site/payment`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return NO_PAYMENT_SETTINGS;
    return paymentSettingsFrom(await response.json());
  } catch (error) {
    unstable_rethrow(error);
    return NO_PAYMENT_SETTINGS;
  }
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit the payment QR.";
  if (response.status === 403) return "Your account cannot edit the payment QR.";
  if (response.status === 413) return "The image is too large (5 MB max).";
  return fallback;
}

async function settingsOrThrow(response: Response, fallback: string) {
  if (!response.ok) throw new MartApiError(await readError(response, fallback));
  return paymentSettingsFrom(await response.json());
}

export async function getAdminPaymentSettings(): Promise<PaymentSettings> {
  return settingsOrThrow(await authorizedFetch(ADMIN_URL), "Could not load the payment QR.");
}

/** Upload or replace the QR image. The API deletes the old file. */
export async function uploadPaymentQr(file: File): Promise<PaymentSettings> {
  const body = new FormData();
  body.append("image", file);
  return settingsOrThrow(
    await authorizedFetch(`${ADMIN_URL}/qr`, { method: "POST", body }),
    "Could not upload the payment QR.",
  );
}

export async function deletePaymentQr(): Promise<PaymentSettings> {
  return settingsOrThrow(
    await authorizedFetch(`${ADMIN_URL}/qr`, { method: "DELETE" }),
    "Could not remove the payment QR.",
  );
}
