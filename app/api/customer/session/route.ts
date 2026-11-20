import { NextResponse } from "next/server";

import {
  applyCustomerPair,
  clearCustomerCookies,
  getValidCustomerToken,
  readCustomerProfile,
} from "@/lib/auth/customer-bff";

export async function GET() {
  const { access, rotated } = await getValidCustomerToken();

  if (!access) {
    const res = NextResponse.json(
      { authenticated: false, customer: null },
      { headers: { "Cache-Control": "no-store" } },
    );
    clearCustomerCookies(res);
    return res;
  }

  const profile = await readCustomerProfile(access);
  if (!profile) {
    const res = NextResponse.json(
      { authenticated: false, customer: null },
      { headers: { "Cache-Control": "no-store" } },
    );
    clearCustomerCookies(res);
    return res;
  }

  const res = NextResponse.json(
    { authenticated: true, customer: profile },
    { headers: { "Cache-Control": "no-store" } },
  );

  if (rotated) {
    applyCustomerPair(res, rotated);
  }

  return res;
}
