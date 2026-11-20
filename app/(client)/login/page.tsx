"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

import { Container } from "../_components/common/container";
import { MaterialIcon } from "../_components/common/material-icon";
import { useCustomerAuth } from "../_providers/customer-auth-provider";
import { MartApiError } from "@/lib/mart-api/products";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";

  const { login, isAuthenticated, isLoading } = useCustomerAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextUrl);
    }
  }, [isLoading, isAuthenticated, router, nextUrl]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!identifier.trim()) {
      setError("মোবাইল নম্বর অথবা ইমেইল লিখুন (Enter phone or email)");
      return;
    }
    if (!password) {
      setError("পাসওয়ার্ড প্রদান করুন (Enter your password)");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await login(identifier.trim(), password);
      router.push(nextUrl);
      router.refresh();
    } catch (err) {
      setBusy(false);
      if (err instanceof MartApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।");
      }
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-[#141c1b]">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800/60">
          <MaterialIcon name="lock" className="text-[26px]" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl dark:text-white">
          অ্যাকাউন্টে লগইন করুন
        </h1>
        <p className="mt-1 text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
          Sign in with your mobile number or email
        </p>
      </div>

      {/* Error Alert */}
      {error ? (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 ring-1 ring-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60"
        >
          <MaterialIcon name="error" className="mt-0.5 text-[18px] shrink-0" />
          <span className="leading-relaxed">{error}</span>
        </div>
      ) : null}

      {/* Login Form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="login-identifier"
            className="mb-1.5 block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
          >
            মোবাইল নম্বর অথবা ইমেইল (Phone or Email)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400">
              <MaterialIcon name="person" className="text-[18px]" />
            </span>
            <input
              id="login-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="01712345678 or name@example.com"
              required
              autoFocus
              autoComplete="username"
              className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pr-3.5 pl-9 text-sm text-neutral-900 shadow-2xs outline-none transition placeholder:text-neutral-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-950/50"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1.5 block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
          >
            পাসওয়ার্ড (Password)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400">
              <MaterialIcon name="lock" className="text-[18px]" />
            </span>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pr-10 pl-9 text-sm text-neutral-900 shadow-2xs outline-none transition placeholder:text-neutral-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-950/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              title={showPassword ? "Hide password" : "Show password"}
            >
              <MaterialIcon
                name={showPassword ? "visibility_off" : "visibility"}
                className="text-[18px]"
              />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 font-semibold text-sm text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:bg-neutral-300 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 dark:disabled:bg-neutral-700"
        >
          {busy ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-neutral-900/30 dark:border-t-neutral-900" />
              <span>লগইন হচ্ছে…</span>
            </>
          ) : (
            <span>লগইন করুন</span>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 border-t border-neutral-100 pt-5 text-center text-xs text-neutral-600 dark:border-white/10 dark:text-neutral-400">
        <span>নতুন অ্যাকাউন্ট তৈরি করতে চান? </span>
        <Link
          href={`/register${nextUrl !== "/dashboard" ? `?next=${encodeURIComponent(nextUrl)}` : ""}`}
          className="font-bold text-emerald-700 hover:underline dark:text-emerald-400"
        >
          এখানে রেজিস্ট্রেশন করুন
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-[75vh] w-full items-center justify-center bg-[#f8f9fa] px-4 py-12 dark:bg-[#0e1514]">
      <Container className="flex justify-center">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-2xl border border-neutral-200/90 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-[#141c1b]">
              Loading...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </Container>
    </main>
  );
}
