import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  clearedCookieOptions,
  isSameOrigin,
  refreshCookieOptions,
} from "@/lib/auth/cookies";

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

type TokenPair = { access: string; refresh: string };

const refreshJobs = new Map<string, Promise<TokenPair | null>>();

function secureCookie() {
  return process.env.NODE_ENV === "production";
}

function applyPair(response: NextResponse, pair: TokenPair) {
  const secure = secureCookie();
  response.cookies.set(ACCESS_COOKIE, pair.access, accessCookieOptions(secure));
  response.cookies.set(REFRESH_COOKIE, pair.refresh, refreshCookieOptions(secure));
}

export function clearSessionCookies(response: NextResponse) {
  const options = clearedCookieOptions(secureCookie());
  response.cookies.set(ACCESS_COOKIE, "", options);
  response.cookies.set(REFRESH_COOKIE, "", options);
}

async function rotate(refreshToken: string): Promise<TokenPair | null> {
  let response: Response;
  try {
    response = await fetch(`${API}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const body = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
  };
  if (!body.access_token || !body.refresh_token) return null;
  return { access: body.access_token, refresh: body.refresh_token };
}

/** One refresh per presented token, so parallel 401s cannot rotate twice and revoke the family. */
function rotateOnce(refreshToken: string) {
  let job = refreshJobs.get(refreshToken);
  if (!job) {
    job = rotate(refreshToken).finally(() => {
      refreshJobs.delete(refreshToken);
    });
    refreshJobs.set(refreshToken, job);
  }
  return job;
}

async function readEmail(access: string) {
  try {
    const response = await fetch(`${API}/api/v1/auth/me`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${access}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { email?: string };
    return body.email?.trim() || null;
  } catch {
    return null;
  }
}

export async function loginWithPassword(email: string, password: string) {
  let response: Response;
  try {
    response = await fetch(`${API}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: { message: "Could not reach the API." } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!response.ok) {
    const text = await response.text();
    return new NextResponse(text || "{}", {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
  const body = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
  };
  if (!body.access_token || !body.refresh_token) {
    return NextResponse.json(
      { error: { message: "Sign in failed." } },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
  const pair = { access: body.access_token, refresh: body.refresh_token };
  const account = (await readEmail(pair.access)) ?? email;
  const result = NextResponse.json(
    { email: account },
    { headers: { "Cache-Control": "no-store" } },
  );
  applyPair(result, pair);
  return result;
}

async function revokeRefreshToken(refresh: string) {
  try {
    const response = await fetch(`${API}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
    });
    return response.ok || response.status === 401;
  } catch {
    return false;
  }
}

export async function logoutSession(request: Request) {
  const jar = await cookies();
  const tokens = new Set<string>();
  const cookieRefresh = jar.get(REFRESH_COOKIE)?.value;
  if (cookieRefresh) tokens.add(cookieRefresh);
  try {
    const body = (await request.json()) as { refresh_token?: unknown };
    if (typeof body.refresh_token === "string" && body.refresh_token.trim()) {
      tokens.add(body.refresh_token.trim());
    }
  } catch {
    /* A normal logout posts no body. The refresh cookie is enough. */
  }

  for (const token of tokens) {
    const revoked = await revokeRefreshToken(token);
    if (!revoked) {
      return NextResponse.json(
        {
          error: {
            message: "Sign out did not finish. You are still signed in.",
          },
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const result = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  clearSessionCookies(result);
  return result;
}

export async function sessionResponse() {
  const jar = await cookies();
  let access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  let rotated: TokenPair | null = null;
  if (!access && refresh) {
    rotated = await rotateOnce(refresh);
    access = rotated?.access;
  }
  let email = access ? await readEmail(access) : null;
  if (!email && refresh && !rotated) {
    rotated = await rotateOnce(refresh);
    email = rotated ? await readEmail(rotated.access) : null;
  }
  if (!email) {
    const missing = NextResponse.json(
      { error: { message: "Sign in again." } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
    clearSessionCookies(missing);
    return missing;
  }
  const result = NextResponse.json(
    { email },
    { headers: { "Cache-Control": "no-store" } },
  );
  if (rotated) applyPair(result, rotated);
  return result;
}

const HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-length",
  "host",
  "cookie",
  "authorization",
]);

function allowedAdminPath(path: string) {
  return (
    path.startsWith("api/v1/admin/") ||
    path === "api/v1/auth/me" ||
    path === "api/v1/auth/change-password"
  );
}

function errorMessage(bytes: ArrayBuffer) {
  try {
    const body = JSON.parse(new TextDecoder().decode(bytes)) as {
      error?: { message?: string };
    };
    return body.error?.message ?? "";
  } catch {
    return "";
  }
}

export async function proxyAdmin(request: Request, path: string) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { message: "Forbidden" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!allowedAdminPath(path)) {
    return NextResponse.json(
      { error: { message: "Not found" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  const method = request.method;
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
  const search = new URL(request.url).search;

  async function send(token: string | undefined) {
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!HOP_HEADERS.has(key.toLowerCase())) headers.set(key, value);
    });
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${API}/${path}${search}`, {
      method,
      headers,
      body,
      cache: "no-store",
    });
  }

  let rotated: TokenPair | null = null;
  let upstream = await send(access);
  const passwordChange = path === "api/v1/auth/change-password";
  if (upstream.status === 401 && refresh && !passwordChange) {
    rotated = await rotateOnce(refresh);
    if (rotated) upstream = await send(rotated.access);
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("cache-control", "no-store");
  const payload = await upstream.arrayBuffer();

  // A wrong current password is also 401. Refreshing it would sign the user out.
  if (passwordChange && upstream.status === 401) {
    const invalidToken = errorMessage(payload) === "Could not validate credentials";
    if (invalidToken && refresh && !rotated) {
      rotated = await rotateOnce(refresh);
      if (rotated) {
        upstream = await send(rotated.access);
        const retried = await upstream.arrayBuffer();
        const retryType = upstream.headers.get("content-type");
        const retryHeaders = new Headers();
        if (retryType) retryHeaders.set("content-type", retryType);
        retryHeaders.set("cache-control", "no-store");
        const retriedResult = new NextResponse(retried, {
          status: upstream.status,
          headers: retryHeaders,
        });
        if (upstream.status === 401 && errorMessage(retried) === "Could not validate credentials") {
          clearSessionCookies(retriedResult);
        } else {
          applyPair(retriedResult, rotated);
        }
        return retriedResult;
      }
    }
    const rejected = new NextResponse(payload, { status: 401, headers });
    if (invalidToken) clearSessionCookies(rejected);
    return rejected;
  }

  const result = new NextResponse(payload, {
    status: upstream.status,
    headers,
  });
  if (rotated) applyPair(result, rotated);
  else if (upstream.status === 401) clearSessionCookies(result);
  return result;
}
