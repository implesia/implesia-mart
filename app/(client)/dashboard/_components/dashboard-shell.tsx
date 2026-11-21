"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { CustomerProfile } from "@/lib/mart-api/customer";

import { Container } from "../../_components/common/container";
import { CustomerAvatar } from "../../_components/common/customer-avatar";
import { useCustomerUnreadCount } from "../../_components/common/customer-notification-bell";
import { MaterialIcon } from "../../_components/common/material-icon";
import { useCart } from "../../_providers/cart-provider";
import { useCustomerAuth } from "../../_providers/customer-auth-provider";
import {
  DASHBOARD_NAV_GROUPS,
  currentDashboardPage,
  isDashboardNavActive,
  type DashboardNavItem,
} from "./dashboard-nav";

function NavBadge({
  kind,
  unreadCount,
  cartCount,
  active,
}: {
  kind: DashboardNavItem["badge"];
  unreadCount: number;
  cartCount: number;
  active: boolean;
}) {
  if (!kind) return null;
  const value = kind === "notifications" ? unreadCount : cartCount;
  if (value <= 0) return null;
  const label = value > 99 ? "99+" : String(value);

  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums",
        kind === "notifications"
          ? active
            ? "bg-rose-600 text-white"
            : "bg-rose-500 text-white"
          : active
            ? "bg-emerald-700 text-white dark:bg-emerald-500 dark:text-neutral-950"
            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
      )}
    >
      {label}
    </span>
  );
}

function DashboardSidebarContent({
  customer,
  pathname,
  unreadCount,
  cartCount,
  onNavigate,
  onLogout,
}: {
  customer: CustomerProfile;
  pathname: string;
  unreadCount: number;
  cartCount: number;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Customer Identity Card */}
      <div className="border-b border-neutral-100 p-4 dark:border-white/10">
        <div className="flex items-center gap-3">
          <CustomerAvatar
            name={customer.fullName}
            avatarUrl={customer.avatarUrl}
            size="md"
            shape="rounded"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-neutral-950 dark:text-white">
              {customer.fullName}
            </p>
            <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
              {customer.phone || customer.email || "ইমপ্লেসিয়া গ্রাহক"}
            </p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-500/30">
            <MaterialIcon name="verified" className="text-[13px]" />
            <span>ভেরিফাইড কাস্টমার</span>
          </span>
        </div>
      </div>

      {/* Grouped Navigation */}
      <nav
        aria-label="ড্যাশবোর্ড নেভিগেশন"
        className="flex-1 space-y-5 overflow-y-auto p-3"
      >
        {DASHBOARD_NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-1.5 text-[10px] font-bold tracking-[0.14em] text-neutral-400 uppercase dark:text-neutral-500">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isDashboardNavActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-150",
                      active
                        ? "bg-emerald-50 text-emerald-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-inset ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/50"
                        : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:hover:text-white",
                    )}
                  >
                    {active ? (
                      <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-emerald-600 dark:bg-emerald-400" />
                    ) : null}
                    <MaterialIcon
                      name={item.icon}
                      className={cn(
                        "shrink-0 text-[19px] transition-colors",
                        active
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-200",
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    <NavBadge
                      kind={item.badge}
                      unreadCount={unreadCount}
                      cartCount={cartCount}
                      active={active}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Support & Logout Footer */}
      <div className="space-y-2.5 border-t border-neutral-100 p-3 dark:border-white/10">
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-3 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/25">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
            <MaterialIcon name="support_agent" className="text-[17px]" />
            <span>সহায়তা প্রয়োজন?</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            অর্ডার বা ডেলিভারি সংক্রান্ত যেকোনো প্রশ্নে আমাদের সাথে যোগাযোগ করুন।
          </p>
          <Link
            href="/contact-us"
            onClick={onNavigate}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            <span>যোগাযোগ করুন</span>
            <MaterialIcon name="arrow_forward" className="text-[13px]" />
          </Link>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/60 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
        >
          <MaterialIcon name="logout" className="text-[17px]" />
          <span>লগআউট করুন</span>
        </button>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { customer, isAuthenticated, isLoading, logout } = useCustomerAuth();
  const { itemCount: cartCount } = useCart();
  const router = useRouter();
  const pathname = usePathname() || "/dashboard";
  const unreadCount = useCustomerUnreadCount(isAuthenticated);
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <main className="min-h-[70vh] w-full bg-[#f5f6f8] py-20 dark:bg-[#0b1312]">
        <Container className="flex flex-col items-center justify-center text-center">
          <div className="size-9 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
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

  const page = currentDashboardPage(pathname);

  async function handleLogout() {
    setDrawerPath(null);
    await logout();
    router.push("/login");
  }

  return (
    <main className="min-h-[82vh] w-full bg-[#f5f6f8] pb-14 pt-4 text-neutral-900 sm:pt-6 dark:bg-[#0b1312] dark:text-neutral-100">
      <Container className="space-y-5">
        {/* Compact Mobile Top Dashboard Bar + Slide-out Sheet Trigger */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/90 bg-white px-3.5 py-2.5 shadow-2xs lg:hidden dark:border-white/10 dark:bg-[#131c1b]">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setDrawerPath(pathname)}
              aria-label="ড্যাশবোর্ড মেনু খুলুন"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200"
            >
              <MaterialIcon name="menu" className="text-[20px]" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {page.group}
              </p>
              <p className="truncate text-sm font-bold text-neutral-950 dark:text-white">
                {page.label}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/dashboard/notifications"
              className="relative inline-flex size-9 items-center justify-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
              aria-label="নোটিফিকেশন"
            >
              <MaterialIcon name="notifications" className="text-[20px]" />
              {unreadCount > 0 ? (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white tabular-nums">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
            <Link
              href="/dashboard/profile"
              aria-label="আমার প্রোফাইল"
              className="rounded-full"
            >
              <CustomerAvatar
                name={customer.fullName}
                avatarUrl={customer.avatarUrl}
                size="sm"
              />
            </Link>
          </div>
        </div>

        {/* Mobile Slide-out Navigation Drawer */}
        <Sheet
          open={drawerOpen}
          onOpenChange={(next) => setDrawerPath(next ? pathname : null)}
        >
          <SheetContent
            side="left"
            showCloseButton
            className="w-72 max-w-[85vw] border-neutral-200 bg-white p-0 text-neutral-900 dark:border-white/10 dark:bg-[#131c1b] dark:text-neutral-100"
          >
            <SheetTitle className="sr-only">ড্যাশবোর্ড মেনু</SheetTitle>
            <DashboardSidebarContent
              customer={customer}
              pathname={pathname}
              unreadCount={unreadCount}
              cartCount={cartCount}
              onNavigate={() => setDrawerPath(null)}
              onLogout={() => void handleLogout()}
            />
          </SheetContent>
        </Sheet>

        {/* Desktop 2-Column Shell */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[272px_minmax(0,1fr)]">
          {/* Desktop Sidebar */}
          <aside className="sticky top-[7.5rem] hidden overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] lg:block dark:border-white/10 dark:bg-[#131c1b]">
            <DashboardSidebarContent
              customer={customer}
              pathname={pathname}
              unreadCount={unreadCount}
              cartCount={cartCount}
              onLogout={() => void handleLogout()}
            />
          </aside>

          {/* Right Content Column */}
          <div className="min-w-0 space-y-5">
            {/* Desktop Compact Section Header Bar */}
            <div className="hidden items-center justify-between gap-4 rounded-2xl border border-neutral-200/90 bg-white px-5 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] lg:flex dark:border-white/10 dark:bg-[#131c1b]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <MaterialIcon name={page.icon} className="text-[20px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {page.group}
                  </p>
                  <h1 className="truncate text-base font-bold tracking-tight text-neutral-950 dark:text-white">
                    {page.label}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/products"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10"
                >
                  <MaterialIcon
                    name="storefront"
                    className="text-[17px] text-neutral-500 dark:text-neutral-400"
                  />
                  <span>শপিং করুন</span>
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-neutral-950 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  <MaterialIcon name="local_shipping" className="text-[17px]" />
                  <span>অর্ডার দেখুন</span>
                </Link>
              </div>
            </div>

            {/* Active Dashboard Sub-page */}
            <section className="min-w-0">{children}</section>
          </div>
        </div>
      </Container>
    </main>
  );
}
