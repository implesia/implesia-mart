"use client";

import { useState } from "react";

import { MaterialIcon } from "../../_components/common/material-icon";
import { useCustomerAuth } from "../../_providers/customer-auth-provider";
import type { CustomerProfile } from "@/lib/mart-api/customer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 rounded-xl border-neutral-200 bg-[#f8f9fa] px-3.5 text-sm shadow-none focus-visible:border-emerald-600 focus-visible:ring-emerald-600/30 dark:border-white/10 dark:bg-white/5 dark:text-white";

function ProfileEditor({
  customer,
  onSave,
}: {
  customer: CustomerProfile;
  onSave: (data: {
    fullName: string;
    email?: string;
    district?: string;
    area?: string;
    address?: string;
  }) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(customer.fullName || "");
  const [email, setEmail] = useState(customer.email || "");
  const [district, setDistrict] = useState(customer.district || "");
  const [area, setArea] = useState(customer.area || "");
  const [address, setAddress] = useState(customer.address || "");

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage("দয়া করে আপনার নাম লিখুন।");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onSave({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        district: district.trim() || undefined,
        area: area.trim() || undefined,
        address: address.trim() || undefined,
      });
      setSuccessMessage("আপনার প্রোফাইল ও ডেলিভারি ঠিকানা সফলভাবে সংরক্ষণ করা হয়েছে!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "প্রোফাইল আপডেট করা যায়নি।");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#131c1b] sm:p-6"
    >
      {successMessage ? (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-semibold text-emerald-900 animate-in fade-in dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          <MaterialIcon name="check_circle" className="text-[20px] text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-900 animate-in fade-in dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          <MaterialIcon name="error" className="text-[20px] text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="space-y-5">
        <div className="border-b border-neutral-100 pb-3 dark:border-white/5">
          <h2 className="text-sm font-bold text-neutral-950 dark:text-white">
            ব্যক্তিগত তথ্য
          </h2>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            আপনার নাম ও যোগাযোগের তথ্য
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              পুরো নাম <span className="text-red-500">*</span>
            </label>
            <Input
              id="fullName"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="যেমন: রাকিব হাসান"
              required
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              মোবাইল নম্বর <span className="text-[10px] text-neutral-400">(অ্যাকাউন্ট আইডি)</span>
            </label>
            <Input
              id="phone"
              name="phone"
              value={customer.phone || ""}
              disabled
              className={cn(fieldClass, "bg-neutral-100 text-neutral-500 cursor-not-allowed dark:bg-white/5")}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              ইমেইল এড্রেস <span className="text-[10px] text-neutral-400">(ঐচ্ছিক)</span>
            </label>
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

        <div className="pt-4 border-b border-neutral-100 pb-3 dark:border-white/5">
          <h2 className="text-sm font-bold text-neutral-950 dark:text-white">
            ডিফল্ট ডেলিভারি ঠিকানা
          </h2>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            চেকআউটে দ্রুত অর্ডার কনফার্মের জন্য এই ঠিকানা স্বয়ংক্রিয়ভাবে বসবে
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="district" className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              জেলা (District)
            </label>
            <Input
              id="district"
              name="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="যেমন: ঢাকা বা চট্টগ্রাম"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="area" className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              থানা / এলাকা (Area / Thana)
            </label>
            <Input
              id="area"
              name="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="যেমন: মিরপুর, ধানমন্ডি বা সাভার"
              className={fieldClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              বিস্তারিত ঠিকানা (বাড়ি নং, রোড নং, ইত্যাদি)
            </label>
            <Textarea
              id="address"
              name="address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="যেমন: বাড়ি ১২, রোড ৩, ব্লক বি"
              className="rounded-xl border-neutral-200 bg-[#f8f9fa] p-3 text-sm focus-visible:border-emerald-600 focus-visible:ring-emerald-600/30 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-4">
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
      </div>
    </form>
  );
}

export default function DashboardProfilePage() {
  const { customer, updateProfile } = useCustomerAuth();

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#131c1b] sm:p-6">
        <h1 className="text-lg font-bold tracking-tight text-neutral-950 sm:text-xl dark:text-white">
          ডেলিভারি ঠিকানা ও প্রোফাইল সেটিংস
        </h1>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          আপনার ব্যক্তিগত তথ্য ও ডিফল্ট ডেলিভারি ঠিকানা হালনাগাদ রাখুন
        </p>
      </div>

      {customer ? (
        <ProfileEditor
          key={customer.id}
          customer={customer}
          onSave={async (data) => {
            await updateProfile(data);
          }}
        />
      ) : null}
    </div>
  );
}
