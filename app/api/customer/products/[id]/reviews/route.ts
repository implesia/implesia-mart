import { NextResponse } from "next/server";

import {
  forbiddenCustomerResponse,
  forwardCustomerResponse,
  proxyCustomerRequest,
} from "@/lib/auth/customer-bff";
import { isSameOrigin } from "@/lib/auth/cookies";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return forbiddenCustomerResponse();
  }

  let bodyStr: string;
  try {
    bodyStr = await request.text();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid review payload." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await context.params;
  const { response, rotated } = await proxyCustomerRequest(
    `/api/v1/products/${encodeURIComponent(id)}/reviews`,
    {
      method: "POST",
      body: bodyStr,
    },
  );
  return forwardCustomerResponse(response, rotated);
}
