import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/cookies";
import { HSTS_VALUE, wantsHsts } from "@/lib/hsts";
import { catalogPageRedirect } from "@/lib/mart-api/catalog-page-guard";
import { hasMalformedPercentEncoding } from "@/lib/url-safety";

function nextWithPath(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-implesia-path", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function proxy(request: NextRequest) {
  const response = await route(request);
  if (wantsHsts(request.nextUrl, request.headers.get("x-forwarded-proto"))) {
    response.headers.set("Strict-Transport-Security", HSTS_VALUE);
  }
  return response;
}

async function route(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (hasMalformedPercentEncoding(pathname)) {
    return new NextResponse("Bad Request", {
      status: 400,
      headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (pathname === "/products" && request.nextUrl.searchParams.has("page")) {
    // A catalog page past the last one gets a real 307 (the page itself, once its
    // loading shell has streamed, could only send a meta refresh).
    const target = await catalogPageRedirect(request.nextUrl);
    if (target) return NextResponse.redirect(new URL(target, request.url), 307);
  }
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return nextWithPath(request);
  }
  const signedIn =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);
  if (signedIn) return nextWithPath(request);
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
