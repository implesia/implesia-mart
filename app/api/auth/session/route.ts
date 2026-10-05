import { sessionResponse } from "@/lib/auth/bff";
import { isSameOrigin } from "@/lib/auth/cookies";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { message: "Forbidden" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return sessionResponse();
}
