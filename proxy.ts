import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/cookies";
import { hasMalformedPercentEncoding } from "@/lib/url-safety";

function nextWithPath(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-implesia-path", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (hasMalformedPercentEncoding(pathname)) {
    return new NextResponse("Bad Request", {
      status: 400,
      headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
    });
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
