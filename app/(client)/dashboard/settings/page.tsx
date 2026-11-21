"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MaterialIcon } from "../../_components/common/material-icon";
import { useCustomerAuth } from "../../_providers/customer-auth-provider";
import { DashboardCard } from "../_components/dashboard-ui";

const fieldClass =
  "h-11 rounded-xl border-neutral-200 bg-[#f8f9fa] pr-10 pl-3.5 text-sm shadow-none focus-visible:border-emerald-600 focus-visible:ring-emerald-600/30 dark:border-white/10 dark:bg-white/5 dark:text-white";

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  barClass: string;
  textClass: string;
} {
  if (!password) {
    return {
      score: 0,
      label: "",
      barClass: "bg-neutral-200 dark:bg-white/10",
      textClass: "text-neutral-400",
    };
  }
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return {
      score: 1,
      label: "দুর্বল — অক্ষর ও সংখ্যা মিশিয়ে অন্তত ৮ অক্ষরের পাসওয়ার্ড দিন",
      barClass: "bg-rose-500",
      textClass: "text-rose-600 dark:text-rose-400",
    };
  }
  if (score === 2) {
    return {
      score: 2,
      label: "মাঝারি — বড় হাতের অক্ষর বা সংখ্যা যোগ করলে আরও নিরাপদ হবে",
      barClass: "bg-amber-500",
      textClass: "text-amber-700 dark:text-amber-400",
    };
  }
  if (score === 3) {
    return {
      score: 3,
      label: "ভালো — নিরাপদ পাসওয়ার্ড",
      barClass: "bg-sky-500",
      textClass: "text-sky-700 dark:text-sky-400",
    };
  }
  return {
    score: 4,
    label: "শক্তিশালী — চমৎকার নিরাপত্তা!",
    barClass: "bg-emerald-600",
    textClass: "text-emerald-700 dark:text-emerald-400",
  };
}

export default function DashboardSettingsPage() {
  const { changePassword } = useCustomerAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const strength = useMemo(
    () => getPasswordStrength(newPassword),
    [newPassword],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      setErrorMessage("বর্তমান পাসওয়ার্ডটি প্রদান করুন।");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage("নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ড থেকে ভিন্ন হতে হবে।");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMessage("পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <DashboardCard>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <MaterialIcon name="shield_lock" className="text-[22px]" />
          </span>
          <div>
            <h2 className="text-base font-bold tracking-tight text-neutral-950 sm:text-lg dark:text-white">
              অ্যাকাউন্ট সেটিংস ও পাসওয়ার্ড নিরাপত্তা
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              আপনার অ্যাকাউন্ট সুরক্ষিত রাখতে শক্তিশালী পাসওয়ার্ড ব্যবহার করুন। পাসওয়ার্ড বদলালে অন্যান্য ডিভাইস থেকে লগআউট হয়ে যাবে।
            </p>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard>
        <form onSubmit={handleSubmit}>
          {successMessage ? (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-semibold text-emerald-900 animate-in fade-in dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
              <MaterialIcon
                name="check_circle"
                className="text-[19px] text-emerald-600"
              />
              <span>{successMessage}</span>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-900 animate-in fade-in dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
              <MaterialIcon name="error" className="text-[19px] text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <div className="max-w-md space-y-4">
            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                বর্তমান পাসওয়ার্ড <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={
                    showCurrent
                      ? "বর্তমান পাসওয়ার্ড লুকান"
                      : "বর্তমান পাসওয়ার্ড দেখুন"
                  }
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <MaterialIcon
                    name={showCurrent ? "visibility_off" : "visibility"}
                    className="text-[18px]"
                  />
                </button>
              </div>
            </div>

            {/* New Password + Strength Indicator */}
            <div>
              <label
                htmlFor="newPassword"
                className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={
                    showNew ? "নতুন পাসওয়ার্ড লুকান" : "নতুন পাসওয়ার্ড দেখুন"
                  }
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <MaterialIcon
                    name={showNew ? "visibility_off" : "visibility"}
                    className="text-[18px]"
                  />
                </button>
              </div>

              {newPassword ? (
                <div className="mt-2 space-y-1.5">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <span
                        key={level}
                        className={cn(
                          "h-1.5 rounded-full transition-colors",
                          level <= strength.score
                            ? strength.barClass
                            : "bg-neutral-200 dark:bg-white/10",
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn("text-[11px] font-medium", strength.textClass)}>
                    {strength.label}
                  </p>
                </div>
              ) : (
                <p className="mt-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                  পরামর্শ: বড় ও ছোট হাতের অক্ষর এবং সংখ্যার সমন্বয়ে পাসওয়ার্ড তৈরি করুন।
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                নতুন পাসওয়ার্ড নিশ্চিত করুন{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={
                    showConfirm
                      ? "কনফার্ম পাসওয়ার্ড লুকান"
                      : "কনফার্ম পাসওয়ার্ড দেখুন"
                  }
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <MaterialIcon
                    name={showConfirm ? "visibility_off" : "visibility"}
                    className="text-[18px]"
                  />
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword ? (
                <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  পাসওয়ার্ড দুটি মিলছে না।
                </p>
              ) : null}
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-800 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>আপডেট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <MaterialIcon name="lock_reset" className="text-[18px]" />
                    <span>পাসওয়ার্ড আপডেট করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </DashboardCard>
    </div>
  );
}
