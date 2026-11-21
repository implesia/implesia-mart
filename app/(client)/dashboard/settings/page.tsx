"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { MaterialIcon } from "../../_components/common/material-icon";
import { useCustomerAuth } from "../../_providers/customer-auth-provider";
import { DashboardCard } from "../_components/dashboard-ui";

const fieldClass =
  "h-11 rounded-xl border-neutral-200 bg-[#f8f9fa] px-3.5 text-sm shadow-none focus-visible:border-emerald-600 focus-visible:ring-emerald-600/30 dark:border-white/10 dark:bg-white/5 dark:text-white";

export default function DashboardSettingsPage() {
  const { changePassword } = useCustomerAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardCard>
        <h2 className="text-lg font-bold tracking-tight text-neutral-950 sm:text-xl dark:text-white">
          অ্যাকাউন্ট সেটিংস ও পাসওয়ার্ড নিরাপত্তা
        </h2>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে নিয়মিত শক্তিশালী পাসওয়ার্ড ব্যবহার করুন
        </p>
      </DashboardCard>

      <DashboardCard>
        <form onSubmit={handleSubmit}>
          {successMessage ? (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-semibold text-emerald-900 animate-in fade-in dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
              <MaterialIcon
                name="check_circle"
                className="text-[20px] text-emerald-600"
              />
              <span>{successMessage}</span>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-900 animate-in fade-in dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
              <MaterialIcon name="error" className="text-[20px] text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <div className="max-w-md space-y-4">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <MaterialIcon
                    name={showCurrent ? "visibility_off" : "visibility"}
                    className="text-[18px]"
                  />
                </button>
              </div>
            </div>

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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <MaterialIcon
                    name={showNew ? "visibility_off" : "visibility"}
                    className="text-[18px]"
                  />
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                নতুন পাসওয়ার্ড নিশ্চিত করুন{" "}
                <span className="text-red-500">*</span>
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={fieldClass}
              />
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
