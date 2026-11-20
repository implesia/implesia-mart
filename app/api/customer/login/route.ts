import { NextResponse } from "next/server";

import {
  applyCustomerPair,
  formatCustomerProfile,
  type RawCustomerProfile,
} from "@/lib/auth/customer-bff";
import { isSameOrigin } from "@/lib/auth/cookies";

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { message: "Forbidden" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: { identifier?: string; password?: string };
  try {
    body = (await request.json()) as { identifier?: string; password?: string };
  } catch {
    return NextResponse.json(
      { error: { message: "Sign in failed." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const identifier = body.identifier?.trim() ?? "";
  const password = body.password ?? "";
  if (!identifier || !password) {
    return NextResponse.json(
      { error: { message: "Enter your phone number or email, and password." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let response: Response;
  try {
    response = await fetch(`${API}/api/v1/customer/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ identifier, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: { message: "Could not reach authentication server." } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    return new NextResponse(errorText || "{}", {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  const tokenData = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!tokenData.access_token || !tokenData.refresh_token) {
    return NextResponse.json(
      { error: { message: "Authentication response missing tokens." } },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Fetch customer profile
  const profileRes = await fetch(`${API}/api/v1/customer/profile`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${tokenData.access_token}`,
    },
    cache: "no-store",
  });

  const rawProfile = profileRes.ok
    ? ((await profileRes.json()) as RawCustomerProfile)
    : null;

  const result = NextResponse.json(
    {
      ok: true,
      customer: rawProfile ? formatCustomerProfile(rawProfile) : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );

  applyCustomerPair(result, {
    access: tokenData.access_token,
    refresh: tokenData.refresh_token,
  });

  return result;
}
