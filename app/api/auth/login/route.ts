import { loginWithPassword } from "@/lib/auth/bff";
import { isSameOrigin } from "@/lib/auth/cookies";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { message: "Forbidden" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json(
      { error: { message: "Sign in failed." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json(
      { error: { message: "Enter an email and password." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  return loginWithPassword(email, password);
}
