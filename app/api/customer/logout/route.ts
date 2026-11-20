import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { clearCustomerCookies } from "@/lib/auth/customer-bff";
import { CUSTOMER_REFRESH_COOKIE } from "@/lib/auth/customer-cookies";
import { isSameOrigin } from "@/lib/auth/cookies";

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { message: "Forbidden" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const jar = await cookies();
  const refreshToken = jar.get(CUSTOMER_REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      await fetch(`${API}/api/v1/customer/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });
    } catch {
      // Even if network fails, we proceed to clear client cookies
    }
  }

  const response = NextResponse.json(
    { ok: true, message: "Logged out" },
    { headers: { "Cache-Control": "no-store" } },
  );

  clearCustomerCookies(response);
  return response;
}
