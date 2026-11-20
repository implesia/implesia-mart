import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  CUSTOMER_ACCESS_COOKIE,
  CUSTOMER_REFRESH_COOKIE,
  customerAccessCookieOptions,
  customerClearedCookieOptions,
  customerRefreshCookieOptions,
} from "./customer-cookies";
import { shareRefresh, type TokenPair } from "./refresh";

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

const customerRefreshJobs = new Map<string, Promise<TokenPair | null>>();

function secureCookie(): boolean {
  return process.env.NODE_ENV === "production";
}

export function applyCustomerPair(response: NextResponse, pair: TokenPair): void {
  const secure = secureCookie();
  response.cookies.set(
    CUSTOMER_ACCESS_COOKIE,
    pair.access,
    customerAccessCookieOptions(secure),
  );
  response.cookies.set(
    CUSTOMER_REFRESH_COOKIE,
    pair.refresh,
    customerRefreshCookieOptions(secure),
  );
}

export function clearCustomerCookies(response: NextResponse): void {
  const options = customerClearedCookieOptions(secureCookie());
  response.cookies.set(CUSTOMER_ACCESS_COOKIE, "", options);
  response.cookies.set(CUSTOMER_REFRESH_COOKIE, "", options);
}

async function exchangeCustomerRefreshToken(
  refreshToken: string,
): Promise<TokenPair | null> {
  try {
    const res = await fetch(`${API}/api/v1/customer/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
    };
    if (!body.access_token || !body.refresh_token) return null;
    return { access: body.access_token, refresh: body.refresh_token };
  } catch {
    return null;
  }
}

function rotateCustomerOnce(refreshToken: string): Promise<TokenPair | null> {
  return shareRefresh(customerRefreshJobs, refreshToken, () =>
    exchangeCustomerRefreshToken(refreshToken),
  );
}

export type RawCustomerProfile = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  district: string | null;
  area: string | null;
  address: string | null;
  created_at: string;
};

export type FormattedCustomerProfile = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  district: string | null;
  area: string | null;
  address: string | null;
  createdAt: string;
};

export function formatCustomerProfile(
  raw: RawCustomerProfile,
): FormattedCustomerProfile {
  return {
    id: raw.id,
    fullName: raw.full_name,
    phone: raw.phone,
    email: raw.email,
    district: raw.district,
    area: raw.area,
    address: raw.address,
    createdAt: raw.created_at,
  };
}

export async function readCustomerProfile(
  access: string,
): Promise<FormattedCustomerProfile | null> {
  try {
    const response = await fetch(`${API}/api/v1/customer/profile`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access}`,
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as RawCustomerProfile;
    return formatCustomerProfile(body);
  } catch {
    return null;
  }
}

export async function getValidCustomerToken(): Promise<{
  access: string | null;
  rotated: TokenPair | null;
}> {
  const jar = await cookies();
  let access = jar.get(CUSTOMER_ACCESS_COOKIE)?.value ?? null;
  const refresh = jar.get(CUSTOMER_REFRESH_COOKIE)?.value ?? null;
  let rotated: TokenPair | null = null;

  if (!access && refresh) {
    rotated = await rotateCustomerOnce(refresh);
    access = rotated?.access ?? null;
  }

  return { access, rotated };
}

export async function proxyCustomerRequest(
  path: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<{ response: Response; rotated: TokenPair | null }> {
  let { access, rotated } = await getValidCustomerToken();
  const jar = await cookies();
  const refresh = jar.get(CUSTOMER_REFRESH_COOKIE)?.value ?? null;

  const makeRequest = (token: string | null) =>
    fetch(`${API}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: options.body,
      cache: "no-store",
    });

  let res = await makeRequest(access);

  if (res.status === 401 && refresh && !rotated) {
    rotated = await rotateCustomerOnce(refresh);
    if (rotated) {
      access = rotated.access;
      res = await makeRequest(access);
    }
  }

  return { response: res, rotated };
}
