import { NextResponse } from "next/server";

import {
  applyCustomerPair,
  clearCustomerCookies,
  proxyCustomerRequest,
} from "@/lib/auth/customer-bff";
import { isSameOrigin } from "@/lib/auth/cookies";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { message: "Forbidden" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let bodyStr: string;
  try {
    bodyStr = await request.text();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid payload." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { response, rotated } = await proxyCustomerRequest(
    "/api/v1/customer/change-password",
    {
      method: "POST",
      body: bodyStr,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    const res = new NextResponse(errorText || "{}", {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
    if (response.status === 401) {
      clearCustomerCookies(res);
    }
    return res;
  }

  const data = await response.json();
  const result = NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });

  if (rotated) {
    applyCustomerPair(result, rotated);
  }

  return result;
}
