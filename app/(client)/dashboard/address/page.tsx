"use client";

import Link from "next/link";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CustomerProfile } from "@/lib/mart-api/customer";

import { MaterialIcon } from "../../_components/common/material-icon";
import { useCustomerAuth } from "../../_providers/customer-auth-provider";
import { DashboardCard } from "../_components/dashboard-ui";

const fieldClass =
  "h-11 rounded-xl border-neutral-200 bg-[#f8f9fa] px-3.5 text-sm shadow-none focus-visible:border-emerald-600 focus-visible:ring-emerald-600/30 dark:border-white/10 dark:bg-white/5 dark:text-white";

function AddressForm({
  customer,
  onSave,
}: {
  customer: CustomerProfile;
  onSave: (payload: {
    district: string | null;
    area: string | null;
    address: string | null;
  }) => Promise<void>;
}) {
  const [district, setDistrict] = useState(customer.district || "");
  const [area, setArea] = useState(customer.area || "");
  const [address, setAddress] = useState(customer.address || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!district.trim() || !area.trim() || !address.trim()) {
      setError("দয়া করে জেলা, থানা/এলাকা এবং বিস্তারিত ঠিকানা পূরণ করুন।");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await onSave({
        district: district.trim(),
        area: area.trim(),
        address: address.trim(),
      });
      setSuccess(
        "আপনার ডেলিভারি ঠিকানা সফলভাবে সংরক্ষিত হয়েছে! চেকআউটে এটি স্বয়ংক্রিয়ভাবে যুক্ত হবে।",
      );
      window.setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ঠিকানা সংরক্ষণ করা যায়নি।",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardCard>
      <div className="border-b border-neutral-100 pb-3.5 dark:border-white/10">
        <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
          ডেলিভারি ঠিকানা আপডেট করুন
        </h3>
        <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
          সঠিক জেলা, থানা ও বাসার ঠিকানা দিলে দ্রুত ডেলিভারি নিশ্চিত করা সহজ হয়
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {success ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-semibold text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            <MaterialIcon
              name="check_circle"
              className="text-[19px] text-emerald-600"
            />
            <span>{success}</span>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
            <MaterialIcon name="error" className="text-[19px] text-rose-600" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="district"
              className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            >
              জেলা (District) <span className="text-red-500">*</span>
            </label>
            <Input
              id="district"
              name="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="যেমন: ঢাকা, চট্টগ্রাম, সিলেট"
              required
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="area"
              className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            >
              থানা / এলাকা (Area / Thana){" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              id="area"
              name="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="যেমন: মিরপুর-১০, ধানমন্ডি, উত্তরা"
              required
              className={fieldClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="address"
              className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            >
              বিস্তারিত ঠিকানা (বাসা নং, রোড, ব্লক, ল্যান্ডমার্ক){" "}
              <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="address"
              name="address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="যেমন: বাসা ১২, রোড ৪, ব্লক সি, মিরপুর-১০"
              required
              className="rounded-xl border-neutral-200 bg-[#f8f9fa] p-3 text-sm focus-visible:border-emerald-600 focus-visible:ring-emerald-600/30 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            href="/checkout"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            <MaterialIcon name="shopping_cart_checkout" className="text-[16px]" />
            <span>চেকআউট পাতায় যান</span>
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
                <span>ঠিকানা সংরক্ষণ করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </DashboardCard>
  );
}

export default function DashboardAddressPage() {
  const { customer, updateProfile } = useCustomerAuth();
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearNotice, setClearNotice] = useState<string | null>(null);

  if (!customer) return null;

  const hasSavedAddress = Boolean(
    customer.district || customer.area || customer.address,
  );

  async function handleClearAddress() {
    setClearing(true);
    setClearNotice(null);
    try {
      await updateProfile({
        district: null,
        area: null,
        address: null,
      });
      setConfirmClear(false);
      setClearNotice("সংরক্ষিত ডেলিভারি ঠিকানা সফলভাবে মুছে ফেলা হয়েছে।");
      window.setTimeout(() => setClearNotice(null), 5000);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Current Saved Delivery Address Card */}
      <DashboardCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <MaterialIcon name="home_pin" className="text-[22px]" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-neutral-950 sm:text-lg dark:text-white">
                  সংরক্ষিত ডেলিভারি ঠিকানা
                </h2>
                {hasSavedAddress ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <MaterialIcon name="verified" className="text-[13px]" />
                    <span>চেকআউটে অটো-ফিল সক্রিয়</span>
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                চেকআউটের সময় আপনার ঠিকানা স্বয়ংক্রিয়ভাবে পূরণ হয়ে যাবে
              </p>
            </div>
          </div>

          {hasSavedAddress && !confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
            >
              <MaterialIcon name="delete_outline" className="text-[16px]" />
              <span>ঠিকানা মুছে ফেলুন</span>
            </button>
          ) : null}
        </div>

        {confirmClear ? (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-rose-900/50 dark:bg-rose-950/35">
            <div className="flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
              <MaterialIcon name="warning" className="mt-0.5 text-[18px] text-rose-600" />
              <p className="font-semibold">
                আপনি কি নিশ্চিতভাবে সংরক্ষিত ডেলিভারি ঠিকানাটি মুছে ফেলতে চান?
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={() => void handleClearAddress()}
                className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {clearing ? "মুছছে..." : "হ্যাঁ, মুছে ফেলুন"}
              </button>
            </div>
          </div>
        ) : null}

        {clearNotice ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            <MaterialIcon name="check_circle" className="text-[18px]" />
            <span>{clearNotice}</span>
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/70 p-4 text-xs dark:border-white/10 dark:bg-white/[0.03]">
          {hasSavedAddress ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] text-neutral-400">প্রাপকের নাম</p>
                <p className="mt-0.5 font-bold text-neutral-950 dark:text-white">
                  {customer.fullName}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-400">মোবাইল নম্বর</p>
                <p className="mt-0.5 font-bold text-neutral-950 dark:text-white">
                  {customer.phone || "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-400">জেলা ও এলাকা</p>
                <p className="mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
                  {[customer.area, customer.district]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-400">বিস্তারিত ঠিকানা</p>
                <p className="mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
                  {customer.address || "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <MaterialIcon
                name="add_location_alt"
                className="text-[28px] text-neutral-400"
              />
              <p className="mt-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
                কোনো ডেলিভারি ঠিকানা সংরক্ষিত নেই
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                নিচের ফর্ম থেকে আপনার ডিফল্ট ডেলিভারি ঠিকানা যোগ করুন।
              </p>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Edit Address Form */}
      <AddressForm
        key={`${customer.district ?? ""}|${customer.area ?? ""}|${customer.address ?? ""}`}
        customer={customer}
        onSave={async (payload) => {
          await updateProfile(payload);
        }}
      />
    </div>
  );
}
