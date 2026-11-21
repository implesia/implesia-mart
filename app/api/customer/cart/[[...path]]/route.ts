import { NextResponse } from "next/server";

import {
  clearCustomerCookies,
  forbiddenCustomerResponse,
  forwardCustomerResponse,
  proxyCustomerRequest,
  proxyGuestFallbackRequest,
} from "@/lib/auth/customer-bff";
import { isSameOrigin } from "@/lib/auth/cookies";

type RouteContext = { params: Promise<{ path?: string[] }> };

function resolveCartPath(segments: string[]): string | null {
  if (segments.length === 0) return "/api/v1/cart";
  if (segments.length === 1 && segments[0] === "items") {
    return "/api/v1/cart/items";
  }
  if (segments.length === 2 && segments[0] === "items" && segments[1]) {
    return `/api/v1/cart/items/${encodeURIComponent(segments[1])}`;
  }
  return null;
}

async function handle(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return forbiddenCustomerResponse();
  }

  const { path = [] } = await context.params;
  const targetPath = resolveCartPath(path);
  if (!targetPath) {
    return NextResponse.json(
      { error: { message: "Not found" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const method = request.method;
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.text();

  const headers: Record<string, string> = {};
  const cartToken = request.headers.get("x-cart-token");
  if (cartToken) {
    headers["X-Cart-Token"] = cartToken;
  }

  const { response, rotated } = await proxyCustomerRequest(targetPath, {
    method,
    body: body || undefined,
    headers,
  });

  // If the customer's access/refresh cookies were expired or revoked, fall back
  // cleanly to the guest cart while clearing the stale cookies.
  if (response.status === 401) {
    const guestResponse = await proxyGuestFallbackRequest(targetPath, {
      method,
      body: body || undefined,
      headers,
    });
    const fallback = await forwardCustomerResponse(guestResponse, null, {
      clearOn401: false,
    });
    clearCustomerCookies(fallback);
    return fallback;
  }

  return forwardCustomerResponse(response, rotated);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
