import { NextResponse } from "next/server";

import {
  forbiddenCustomerResponse,
  forwardCustomerResponse,
  proxyCustomerRequest,
} from "@/lib/auth/customer-bff";
import { isSameOrigin } from "@/lib/auth/cookies";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return forbiddenCustomerResponse();
  }

  let bodyStr: string;
  try {
    bodyStr = await request.text();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid cart merge payload." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { response, rotated } = await proxyCustomerRequest(
    "/api/v1/customer/cart/merge",
    {
      method: "POST",
      body: bodyStr,
    },
  );
  return forwardCustomerResponse(response, rotated);
}
