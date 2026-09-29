"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { writeSession } from "@/lib/mart-mock/store";

import { adminFieldClass, FieldError, FieldLabel } from "../_components/admin-ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Enter an email.";
    if (!password.trim()) next.password = "Enter a password.";
    setErrors(next);
    if (next.email || next.password) return;
    writeSession(email);
    router.replace("/admin");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200/90 sm:p-6">
        <p className="text-xs font-medium tracking-wide text-primary">Implesia Mart</p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-950">Admin login</h1>
        <p className="mt-3 rounded-xl bg-primary/10 px-3 py-2 text-xs leading-relaxed text-[#0b3d39]">
          Login is a design placeholder. Real authentication comes later.
        </p>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-4" noValidate>
          <div>
            <FieldLabel htmlFor="admin-email">Email</FieldLabel>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={cn(adminFieldClass, errors.email && "border-red-400")}
              aria-invalid={Boolean(errors.email)}
            />
            <FieldError message={errors.email} />
          </div>
          <div>
            <FieldLabel htmlFor="admin-password">Password</FieldLabel>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={cn(adminFieldClass, errors.password && "border-red-400")}
              aria-invalid={Boolean(errors.password)}
            />
            <FieldError message={errors.password} />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary/80"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
