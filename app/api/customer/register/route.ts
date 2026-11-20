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

  let body: {
    full_name?: string;
    phone?: string;
    email?: string;
    password?: string;
  };

  try {
    body = (await request.json()) as {
      full_name?: string;
      phone?: string;
      email?: string;
      password?: string;
    };
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid registration payload." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const fullName = body.full_name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const password = body.password ?? "";
  const email = body.email?.trim() || undefined;

  if (!fullName || !phone || !password) {
    return NextResponse.json(
      { error: { message: "Name, phone number, and password are required." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let response: Response;
  try {
    response = await fetch(`${API}/api/v1/customer/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        phone,
        email,
        password,
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: { message: "Could not reach registration server." } },
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
      { error: { message: "Registration response missing tokens." } },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Fetch created profile
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
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );

  applyCustomerPair(result, {
    access: tokenData.access_token,
    refresh: tokenData.refresh_token,
  });

  return result;
}
