"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Container } from "../_components/common/container";
import { MaterialIcon } from "../_components/common/material-icon";
import { useCustomerAuth } from "../_providers/customer-auth-provider";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
};

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "ওভারভিউ", icon: "dashboard", exact: true },
  { href: "/dashboard/orders", label: "আমার অর্ডার", icon: "receipt_long" },
  { href: "/dashboard/profile", label: "ডেলিভারি ঠিকানা ও প্রোফাইল", icon: "location_on" },
  { href: "/dashboard/security", label: "সিকিউরিটি", icon: "lock" },
];

function getInitials(name?: string | null): string {
  if (!name) return "গ্রা";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "গ্রা";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { customer, isAuthenticated, isLoading, logout } = useCustomerAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <main className="min-h-[70vh] w-full bg-[#f8f9fa] py-16 dark:bg-[#0e1514]">
        <Container className="flex flex-col items-center justify-center text-center">
          <div className="size-10 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            ড্যাশবোর্ড লোড হচ্ছে...
          </p>
        </Container>
      </main>
    );
  }

  if (!isAuthenticated || !customer) {
    return null;
  }

  const isLinkActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <main className="min-h-[80vh] w-full bg-[#f8f9fa] text-neutral-900 pb-12 pt-4 sm:pt-6 dark:bg-[#0e1514] dark:text-neutral-100">
      <Container className="space-y-6">
        {/* Top Header & Greeting Bar */}
        <section className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#131c1b] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 font-bold text-lg text-white shadow-md shadow-emerald-700/20 sm:size-15 sm:text-xl">
                {getInitials(customer.fullName)}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-lg font-bold tracking-tight text-neutral-950 sm:text-2xl dark:text-white">
                    স্বাগতম, {customer.fullName}
                  </h1>
                  <span className="hidden rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20 sm:inline-block dark:bg-emerald-950/60 dark:text-emerald-300">
                    ভেরিফাইড কাস্টমার
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
                  {customer.phone || customer.email || "implesia mart customer"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 sm:border-0 sm:pt-0 dark:border-white/10">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10"
              >
                <MaterialIcon name="storefront" className="text-[17px] text-neutral-600 dark:text-neutral-400" />
                <span>শপিং করুন</span>
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <MaterialIcon name="logout" className="text-[17px]" />
                <span>লগআউট</span>
              </button>
            </div>
          </div>
        </section>

        {/* Mobile Nav Tabs */}
        <nav aria-label="Dashboard mobile navigation" className="block lg:hidden">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto rounded-xl border border-neutral-200/80 bg-white p-1.5 shadow-2xs dark:border-white/10 dark:bg-[#131c1b]">
            {NAV_ITEMS.map((item) => {
              const active = isLinkActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors",
                    active
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10",
                  )}
                >
                  <MaterialIcon name={item.icon} className="text-[17px]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Desktop 2-Column Grid */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_1fr]">
          {/* Desktop Sidebar Navigation */}
          <aside className="sticky top-20 hidden space-y-4 rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-xs lg:block dark:border-white/10 dark:bg-[#131c1b]">
            <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              মেনু
            </p>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = isLinkActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all",
                      active
                        ? "bg-emerald-600 text-white shadow-xs shadow-emerald-700/20"
                        : "text-neutral-700 hover:bg-neutral-100/80 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white",
                    )}
                  >
                    <MaterialIcon
                      name={item.icon}
                      className={cn("text-[19px]", active ? "text-white" : "text-neutral-500 dark:text-neutral-400")}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-neutral-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-neutral-300">
                <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                  <MaterialIcon name="support_agent" className="text-[18px]" />
                  <span>সহায়তা প্রয়োজন?</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                  অর্ডার সংক্রান্ত কোনো জিজ্ঞাসা থাকলে আমাদের কাস্টমার সাপোর্টে নির্দ্বিধায় মেসেজ করুন।
                </p>
                <Link
                  href="/contact"
                  className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  যোগাযোগ পাতা দেখুন →
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Dashboard Sub-page Content */}
          <section className="min-w-0">
            {children}
          </section>
        </div>
      </Container>
    </main>
  );
}
