import { NextResponse } from "next/server";

import {
  applyCustomerPair,
  clearCustomerCookies,
  forbiddenCustomerResponse,
  formatCustomerProfile,
  proxyCustomerRequest,
  type RawCustomerProfile,
} from "@/lib/auth/customer-bff";
import { isSameOrigin } from "@/lib/auth/cookies";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return forbiddenCustomerResponse();
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid multipart upload payload." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { response, rotated } = await proxyCustomerRequest(
    "/api/v1/customer/profile/avatar",
    {
      method: "POST",
      body: formData,
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

  const raw = (await response.json()) as RawCustomerProfile;
  const result = NextResponse.json(formatCustomerProfile(raw), {
    headers: { "Cache-Control": "no-store" },
  });

  if (rotated) {
    applyCustomerPair(result, rotated);
  }

  return result;
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return forbiddenCustomerResponse();
  }

  const { response, rotated } = await proxyCustomerRequest(
    "/api/v1/customer/profile/avatar",
    { method: "DELETE" },
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

  const raw = (await response.json()) as RawCustomerProfile;
  const result = NextResponse.json(formatCustomerProfile(raw), {
    headers: { "Cache-Control": "no-store" },
  });

  if (rotated) {
    applyCustomerPair(result, rotated);
  }

  return result;
}
