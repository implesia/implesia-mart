"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import type { CustomerProfile } from "@/lib/mart-api/customer";

import { CustomerAvatar } from "../../_components/common/customer-avatar";
import { MaterialIcon } from "../../_components/common/material-icon";
import { useCustomerAuth } from "../../_providers/customer-auth-provider";
import { DashboardCard } from "../_components/dashboard-ui";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

const fieldClass =
  "h-11 rounded-xl border-neutral-200 bg-[#f8f9fa] px-3.5 text-sm shadow-none focus-visible:border-emerald-600 focus-visible:ring-emerald-600/30 dark:border-white/10 dark:bg-white/5 dark:text-white";

function ProfileDetailsForm({
  customer,
  onSave,
}: {
  customer: CustomerProfile;
  onSave: (data: {
    fullName: string;
    phone?: string;
    email: string | null;
  }) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(customer.fullName || "");
  const [phone, setPhone] = useState(customer.phone || "");
  const [email, setEmail] = useState(customer.email || "");

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanedName = fullName.trim();
    if (cleanedName.length < 2) {
      setErrorMessage("দয়া করে কমপক্ষে ২ অক্ষরের পুরো নাম লিখুন।");
      return;
    }

    const cleanedPhone = phone.trim();
    const cleanedEmail = email.trim();

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onSave({
        fullName: cleanedName,
        ...(cleanedPhone ? { phone: cleanedPhone } : {}),
        email: cleanedEmail ? cleanedEmail : null,
      });
      setSuccessMessage("আপনার প্রোফাইলের তথ্য সফলভাবে আপডেট করা হয়েছে!");
      window.setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "প্রোফাইল আপডেট করা যায়নি।",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardCard>
      <div className="border-b border-neutral-100 pb-3.5 dark:border-white/10">
        <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
          ব্যক্তিগত তথ্য
        </h3>
        <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
          আপনার নাম, মোবাইল নম্বর এবং ইমেইল ঠিকানা পরিচালনা করুন
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {successMessage ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-semibold text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            <MaterialIcon
              name="check_circle"
              className="text-[19px] text-emerald-600"
            />
            <span>{successMessage}</span>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
            <MaterialIcon name="error" className="text-[19px] text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            >
              পুরো নাম <span className="text-red-500">*</span>
            </label>
            <Input
              id="fullName"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="যেমন: রাকিব হাসান"
              required
              minLength={2}
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            >
              মোবাইল নম্বর{" "}
              <span className="text-[10px] text-neutral-400">(১১ ডিজিট)</span>
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="যেমন: 017XXXXXXXX"
              className={fieldClass}
            />
          </div>

          <div className="sm:col-span-2">
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                ইমেইল ঠিকানা{" "}
                <span className="text-[10px] text-neutral-400">
                  (ঐচ্ছিক — খালি রেখে সেভ করলে মুছে যাবে)
                </span>
              </label>
              {email ? (
                <button
                  type="button"
                  onClick={() => setEmail("")}
                  className="text-[11px] font-semibold text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  খালি করুন
                </button>
              ) : null}
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="যেমন: name@example.com"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            href="/dashboard/address"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            <MaterialIcon name="location_on" className="text-[16px]" />
            <span>ডেলিভারি ঠিকানা পরিচালনা করুন</span>
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-800 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <MaterialIcon name="save" className="text-[17px]" />
                <span>পরিবর্তন সংরক্ষণ করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </DashboardCard>
  );
}

export default function DashboardProfilePage() {
  const { customer, updateProfile, uploadAvatar, deleteAvatar } =
    useCustomerAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  if (!customer) return null;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setAvatarError(null);
    setAvatarSuccess(null);

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setAvatarError("শুধুমাত্র JPG, PNG, WEBP বা GIF ছবি আপলোড করা যাবে।");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।");
      return;
    }

    setAvatarBusy(true);
    try {
      await uploadAvatar(file);
      setAvatarSuccess("প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে!");
      window.setTimeout(() => setAvatarSuccess(null), 5000);
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "ছবি আপলোড করা যায়নি।",
      );
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarBusy(true);
    setAvatarError(null);
    setAvatarSuccess(null);
    try {
      await deleteAvatar();
      setAvatarSuccess("প্রোফাইল ছবি মুছে ফেলা হয়েছে।");
      window.setTimeout(() => setAvatarSuccess(null), 5000);
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "প্রোফাইল ছবি মুছা যায়নি।",
      );
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Interactive Profile Photo Card */}
      <DashboardCard>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <CustomerAvatar
                name={customer.fullName}
                avatarUrl={customer.avatarUrl}
                size="lg"
                className="size-20 text-xl ring-4 ring-emerald-50 dark:ring-emerald-950/60"
              />
              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => fileInputRef.current?.click()}
                aria-label="প্রোফাইল ছবি পরিবর্তন করুন"
                className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full border-2 border-white bg-emerald-700 text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:opacity-50 dark:border-[#131c1b]"
              >
                <MaterialIcon name="photo_camera" className="text-[14px]" />
              </button>
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-bold text-neutral-950 sm:text-lg dark:text-white">
                প্রোফাইল ছবি
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                JPG, PNG, WEBP বা GIF ফরম্যাট (সর্বোচ্চ ৫ মেগাবাইট)
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => void handleFileChange(e)}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-800 disabled:opacity-50"
                >
                  <MaterialIcon name="upload" className="text-[16px]" />
                  <span>
                    {avatarBusy
                      ? "আপডেট হচ্ছে..."
                      : "ছবি আপলোড / পরিবর্তন করুন"}
                  </span>
                </button>

                {customer.avatarUrl ? (
                  <button
                    type="button"
                    disabled={avatarBusy}
                    onClick={() => void handleRemoveAvatar()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
                  >
                    <MaterialIcon
                      name="delete_outline"
                      className="text-[16px]"
                    />
                    <span>ছবি মুছুন</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {avatarSuccess ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            <MaterialIcon name="check_circle" className="text-[18px]" />
            <span>{avatarSuccess}</span>
          </div>
        ) : null}

        {avatarError ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
            <MaterialIcon name="error" className="text-[18px]" />
            <span>{avatarError}</span>
          </div>
        ) : null}
      </DashboardCard>

      {/* Personal Details Form */}
      <ProfileDetailsForm
        key={`${customer.id}|${customer.fullName}|${customer.phone ?? ""}|${customer.email ?? ""}`}
        customer={customer}
        onSave={async (data) => {
          await updateProfile(data);
        }}
      />
    </div>
  );
}
