"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

import { Container } from "../_components/common/container";
import { MaterialIcon } from "../_components/common/material-icon";
import { useCustomerAuth } from "../_providers/customer-auth-provider";
import { MartApiError } from "@/lib/mart-api/products";

const BD_PHONE_REGEX = /^(?:\+?880|880)?01[3-9]\d{8}$/;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";

  const { register, isAuthenticated, isLoading } = useCustomerAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextUrl);
    }
  }, [isLoading, isAuthenticated, router, nextUrl]);

  function validatePhone(val: string): boolean {
    const cleaned = val.replace(/[\s\-\(\)\.]/g, "");
    if (!cleaned) {
      setPhoneError("মোবাইল নম্বর আবশ্যক (Phone number is required)");
      return false;
    }
    if (!BD_PHONE_REGEX.test(cleaned)) {
      setPhoneError("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)");
      return false;
    }
    setPhoneError("");
    return true;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!fullName.trim()) {
      setError("আপনার পুরো নাম লিখুন (Enter your full name)");
      return;
    }

    if (!validatePhone(phone)) {
      return;
    }

    if (password.length < 6) {
      setPasswordError("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে (At least 6 characters)");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("পাসওয়ার্ড দুটি মিলছে না (Passwords do not match)");
      return;
    }

    setPasswordError("");
    setBusy(true);
    setError("");

    try {
      await register({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
      });
      router.push(nextUrl);
      router.refresh();
    } catch (err) {
      setBusy(false);
      if (err instanceof MartApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("রেজিস্ট্রেশন সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
      }
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-[#141c1b]">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800/60">
          <MaterialIcon name="person_add" className="text-[26px]" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl dark:text-white">
          নতুন অ্যাকাউন্ট তৈরি করুন
        </h1>
        <p className="mt-1 text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
          Create an account to track orders & manage details
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

      {/* Form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="reg-name"
            className="mb-1.5 block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
          >
            পুরো নাম (Full Name) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400">
              <MaterialIcon name="badge" className="text-[18px]" />
            </span>
            <input
              id="reg-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. মোঃ সাকিব হাসান"
              required
              autoFocus
              className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pr-3.5 pl-9 text-sm text-neutral-900 shadow-2xs outline-none transition placeholder:text-neutral-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-950/50"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor="reg-phone"
            className="mb-1.5 block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
          >
            মোবাইল নম্বর (11-digit Mobile Number) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400">
              <MaterialIcon name="call" className="text-[18px]" />
            </span>
            <input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) setPhoneError("");
              }}
              onBlur={(e) => validatePhone(e.target.value)}
              placeholder="01712345678"
              required
              autoComplete="tel"
              className={`h-11 w-full rounded-xl border bg-neutral-50/50 pr-3.5 pl-9 text-sm text-neutral-900 shadow-2xs outline-none transition placeholder:text-neutral-400 focus:bg-white focus:ring-2 ${
                phoneError
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100 dark:border-rose-500"
                  : "border-neutral-200 focus:border-emerald-600 focus:ring-emerald-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-emerald-400"
              }`}
            />
          </div>
          {phoneError ? (
            <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
              {phoneError}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-neutral-400">
              সরাসরি ১১ ডিজিটের ফোন নম্বর (013, 014, 017, 018, 019 ইত্যাদি)
            </p>
          )}
        </div>

        {/* Email (Optional) */}
        <div>
          <label
            htmlFor="reg-email"
            className="mb-1.5 flex items-center justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200"
          >
            <span>ইমেইল ঠিকানা (Email)</span>
            <span className="font-normal text-neutral-400 text-[11px]">ঐচ্ছিক (Optional)</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400">
              <MaterialIcon name="mail" className="text-[18px]" />
            </span>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pr-3.5 pl-9 text-sm text-neutral-900 shadow-2xs outline-none transition placeholder:text-neutral-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-950/50"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="reg-password"
            className="mb-1.5 block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
          >
            পাসওয়ার্ড (Password) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400">
              <MaterialIcon name="lock" className="text-[18px]" />
            </span>
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              placeholder="কমপক্ষে ৬ অক্ষর (Min 6 characters)"
              required
              autoComplete="new-password"
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

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="reg-confirm-password"
            className="mb-1.5 block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
          >
            পাসওয়ার্ড নিশ্চিত করুন (Confirm Password) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400">
              <MaterialIcon name="lock_reset" className="text-[18px]" />
            </span>
            <input
              id="reg-confirm-password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              placeholder="পুনরায় পাসওয়ার্ডটি লিখুন"
              required
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pr-10 pl-9 text-sm text-neutral-900 shadow-2xs outline-none transition placeholder:text-neutral-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-950/50"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              title={showConfirm ? "Hide password" : "Show password"}
            >
              <MaterialIcon
                name={showConfirm ? "visibility_off" : "visibility"}
                className="text-[18px]"
              />
            </button>
          </div>
          {passwordError ? (
            <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
              {passwordError}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 font-semibold text-sm text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:bg-neutral-300 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 dark:disabled:bg-neutral-700"
        >
          {busy ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-neutral-900/30 dark:border-t-neutral-900" />
              <span>রেজিস্ট্রেশন হচ্ছে…</span>
            </>
          ) : (
            <span>অ্যাকাউন্ট তৈরি করুন</span>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 border-t border-neutral-100 pt-5 text-center text-xs text-neutral-600 dark:border-white/10 dark:text-neutral-400">
        <span>ইতিমধ্যে অ্যাকাউন্ট আছে? </span>
        <Link
          href={`/login${nextUrl !== "/dashboard" ? `?next=${encodeURIComponent(nextUrl)}` : ""}`}
          className="font-bold text-emerald-700 hover:underline dark:text-emerald-400"
        >
          লগইন করুন
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="flex min-h-[80vh] w-full items-center justify-center bg-[#f8f9fa] px-4 py-12 dark:bg-[#0e1514]">
      <Container className="flex justify-center">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-2xl border border-neutral-200/90 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-[#141c1b]">
              Loading...
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </Container>
    </main>
  );
}
