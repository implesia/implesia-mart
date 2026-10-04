"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { SiteLogo } from "@/app/(client)/_components/common/site-logo";
import { Input } from "@/components/ui/input";
import { MartApiError, loginMart } from "@/lib/mart-api/products";
import { writeSession } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  adminFieldClass,
  FieldError,
  FieldLabel,
} from "../_components/admin-ui";

const HIGHLIGHTS = [
  { icon: "inventory_2", label: "Products and stock" },
  { icon: "local_shipping", label: "Orders and delivery" },
  { icon: "edit_note", label: "Pages customers see" },
] as const;

function emailProblem(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Enter an email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return undefined;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const formErrorId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [pending, setPending] = useState(false);

  function noteCapsLock(event: React.KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState("CapsLock"));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next = {
      email: emailProblem(email),
      password: password.trim() ? undefined : "Enter a password.",
    };
    setErrors(next);
    if (next.email || next.password || pending) return;
    setPending(true);
    try {
      const tokens = await loginMart(email.trim(), password);
      writeSession(email.trim(), tokens.accessToken, tokens.refreshToken);
      router.replace("/admin");
    } catch (error) {
      setPending(false);
      setErrors({
        form:
          error instanceof MartApiError
            ? error.message
            : "Sign in failed. Try again.",
      });
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,32rem)]">
      <aside className="relative hidden overflow-hidden bg-[#042422] text-white lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-28 size-80 rounded-full bg-primary/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-36 -right-16 size-112 rounded-full bg-[#f0c14d]/20 blur-3xl"
        />
        <SiteLogo tone="onDark" priority className="relative h-11 w-44" />
        <div className="relative max-w-md">
          <p className="text-sm font-medium tracking-wide text-[#9fe8e2]">
            Store admin
          </p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
            Your shop, ready when you are.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/75">
            Sign in to update products, follow orders, and edit the pages
            customers see.
          </p>
        </div>
        <ul className="relative flex flex-col gap-3">
          {HIGHLIGHTS.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-3 text-sm text-white/85"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/10">
                <MaterialIcon
                  name={item.icon}
                  className="text-[20px] text-[#9fe8e2]"
                />
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-104">
          <SiteLogo
            tone="light"
            priority
            className="mb-8 h-10 w-40 lg:hidden"
          />
          <p className="text-sm font-medium tracking-wide text-primary lg:hidden">
            Store admin
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Sign in with your Implesia Mart admin account.
          </p>

          {errors.form ? (
            <p
              id={formErrorId}
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-2xl bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700 ring-1 ring-red-100"
            >
              <MaterialIcon name="error" className="mt-0.5 text-[18px]" />
              <span>{errors.form}</span>
            </p>
          ) : null}

          <form
            onSubmit={submit}
            className="mt-6 flex flex-col gap-4"
            noValidate
            aria-describedby={errors.form ? formErrorId : undefined}
          >
            <div>
              <FieldLabel htmlFor="admin-email">Email</FieldLabel>
              <div className="relative">
                <MaterialIcon
                  name="mail"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-neutral-400"
                />
                <Input
                  id="admin-email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="you@implesia.com"
                  value={email}
                  disabled={pending}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      email: undefined,
                      form: undefined,
                    }));
                  }}
                  className={cn(
                    adminFieldClass,
                    "pl-11",
                    errors.email && "border-red-400",
                  )}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "admin-email-error" : undefined
                  }
                />
              </div>
              <div id="admin-email-error">
                <FieldError message={errors.email} />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="admin-password">Password</FieldLabel>
              <div className="relative">
                <MaterialIcon
                  name="lock"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-neutral-400"
                />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  disabled={pending}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      password: undefined,
                      form: undefined,
                    }));
                  }}
                  onKeyDown={noteCapsLock}
                  onKeyUp={noteCapsLock}
                  onBlur={() => setCapsLock(false)}
                  className={cn(
                    adminFieldClass,
                    "pl-11 pr-12",
                    errors.password && "border-red-400",
                  )}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password
                      ? "admin-password-error"
                      : capsLock
                        ? "admin-password-caps"
                        : undefined
                  }
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  aria-controls="admin-password"
                  disabled={pending}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-500 hover:bg-white hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                >
                  <MaterialIcon
                    name={showPassword ? "visibility_off" : "visibility"}
                    className="text-[20px]"
                  />
                </button>
              </div>
              <div id="admin-password-error">
                <FieldError message={errors.password} />
              </div>
              {capsLock && !errors.password ? (
                <p
                  id="admin-password-caps"
                  className="mt-1.5 text-xs text-amber-700"
                >
                  Caps Lock is on.
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
            >
              {pending ? (
                "Signing in…"
              ) : (
                <>
                  Sign in
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            <Link
              href="/"
              className="font-medium text-neutral-700 underline-offset-4 hover:underline"
            >
              Back to the store
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
