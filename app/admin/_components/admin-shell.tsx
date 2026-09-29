"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  clearSession,
  readSession,
  type AdminSession,
} from "@/lib/mart-mock/store";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";

const SIDEBAR_KEY = "implesia.admin.sidebar.collapsed";
const SIDEBAR_EVENT = "implesia-admin-sidebar";
const SESSION_EVENT = "implesia-admin-session";

function emptySubscribe() {
  return () => {};
}

function subscribeSession(onStoreChange: () => void) {
  window.addEventListener(SESSION_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function subscribeSidebar(onStoreChange: () => void) {
  window.addEventListener(SIDEBAR_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(SIDEBAR_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

let sessionCache: AdminSession | null | undefined;

function getSessionSnapshot() {
  const next = readSession();
  if (sessionCache && next && sessionCache.email === next.email)
    return sessionCache;
  if (!sessionCache && !next) return sessionCache ?? null;
  sessionCache = next;
  return next;
}

let collapsedCache: { raw: string | null; value: boolean } | null = null;

function getCollapsedSnapshot() {
  const raw = window.localStorage.getItem(SIDEBAR_KEY);
  if (collapsedCache?.raw === raw) return collapsedCache.value;
  const value = raw === "1";
  collapsedCache = { raw, value };
  return value;
}

function writeCollapsed(collapsed: boolean) {
  window.localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  collapsedCache = null;
  window.dispatchEvent(new Event(SIDEBAR_EVENT));
}

const NAV = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: "dashboard", exact: true },
  {
    href: "/admin/orders",
    label: "অর্ডার",
    icon: "receipt_long",
    exact: false,
  },
  {
    href: "/admin/products",
    label: "প্রোডাক্ট",
    icon: "inventory_2",
    exact: false,
  },
  {
    href: "/admin/banners",
    label: "হোম ব্যানার",
    icon: "view_carousel",
    exact: false,
  },
  {
    href: "/admin/delivery",
    label: "ডেলিভারি চার্জ",
    icon: "local_shipping",
    exact: false,
  },
] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageLabel(pathname: string) {
  if (pathname === "/admin") return "ড্যাশবোর্ড";
  if (pathname.startsWith("/admin/orders/")) return "অর্ডার বিস্তারিত";
  if (pathname.startsWith("/admin/orders")) return "অর্ডার";
  if (pathname === "/admin/products/new") return "নতুন প্রোডাক্ট";
  if (pathname.startsWith("/admin/products/")) return "প্রোডাক্ট এডিট";
  if (pathname.startsWith("/admin/products")) return "প্রোডাক্ট";
  if (pathname.startsWith("/admin/banners/")) return "ব্যানার এডিট";
  if (pathname.startsWith("/admin/banners")) return "হোম ব্যানার";
  if (pathname.startsWith("/admin/delivery")) return "ডেলিভারি চার্জ";
  return "অ্যাডমিন";
}

function SidebarNav({
  pathname,
  onNavigate,
  collapsed = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "flex h-16 items-center border-b border-neutral-200",
          collapsed ? "justify-center px-2" : "gap-2 px-4",
        )}
      >
        <Link
          href="/admin"
          aria-label="Implesia Mart"
          title="Implesia Mart"
          className={cn(
            "block shrink-0 overflow-hidden",
            collapsed ? "size-9" : "h-9",
          )}
        >
          <Image
            src="/images/common/logo.png"
            alt=""
            width={991}
            height={252}
            priority
            className="h-9 w-auto max-w-none"
          />
        </Link>
        {collapsed ? null : (
          <span className="text-xs text-neutral-500">অ্যাডমিন</span>
        )}
      </div>
      <nav
        className={cn(
          "flex flex-1 flex-col gap-1 overflow-y-auto",
          collapsed ? "p-2" : "p-3",
        )}
      >
        {NAV.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={onNavigate}
              className={cn(
                "flex items-center rounded-xl text-sm font-medium transition-colors",
                collapsed
                  ? "justify-center px-0 py-2.5"
                  : "gap-2.5 px-3 py-2.5",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
              )}
            >
              <MaterialIcon name={item.icon} className="text-[22px]" />
              <span className={cn(collapsed && "sr-only")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function AdminHeader({
  pathname,
  session,
  collapsed,
  onToggleSidebar,
  onOpenMenu,
  onLogout,
}: {
  pathname: string;
  session: AdminSession;
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMenu: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-neutral-200 bg-white px-3 sm:px-4">
      <button
        type="button"
        onClick={onOpenMenu}
        className="inline-flex size-10 items-center justify-center rounded-xl text-neutral-700 hover:bg-neutral-100 lg:hidden"
        aria-label="মেনু খুলুন"
      >
        <MaterialIcon name="menu" className="text-[22px]" />
      </button>
      <button
        type="button"
        onClick={onToggleSidebar}
        className="hidden size-10 items-center justify-center rounded-xl text-neutral-700 hover:bg-neutral-100 lg:inline-flex"
        aria-label={collapsed ? "সাইডবার খুলুন" : "সাইডবার ভাঁজ করুন"}
        aria-pressed={collapsed}
      >
        <MaterialIcon
          name={
            collapsed
              ? "keyboard_double_arrow_right"
              : "keyboard_double_arrow_left"
          }
          className="text-[22px]"
        />
      </button>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-neutral-950">
          {pageLabel(pathname)}
        </p>
        <p className="hidden truncate text-xs text-neutral-500 sm:block">
          Implesia Mart
        </p>
      </div>
      <div className="ml-auto flex min-w-0 items-center gap-2">
        <p className="hidden max-w-48 truncate text-sm text-neutral-600 md:block">
          {session.email}
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          <MaterialIcon name="logout" className="text-[20px]" />
          <span className="hidden sm:inline">লগআউট</span>
        </button>
      </div>
    </header>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => null,
  );
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    getCollapsedSnapshot,
    () => false,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const isLogin = pathname === "/admin/login";
  const wide =
    pathname === "/admin" ||
    pathname === "/admin/orders" ||
    pathname === "/admin/products" ||
    pathname === "/admin/banners" ||
    pathname === "/admin/delivery";

  useEffect(() => {
    if (!hydrated) return;
    if (pathname === "/admin/login") {
      if (session) router.replace("/admin");
      return;
    }
    if (!session) router.replace("/admin/login");
  }, [hydrated, pathname, router, session]);

  function toggleSidebar() {
    writeCollapsed(!collapsed);
  }

  function logout() {
    clearSession();
    sessionCache = null;
    window.dispatchEvent(new Event(SESSION_EVENT));
    setMenuOpen(false);
    router.replace("/admin/login");
  }

  if (!hydrated) {
    return <div className="force-light min-h-dvh bg-[#f5f6f8]" />;
  }

  if (isLogin) {
    if (session) {
      return <div className="force-light min-h-dvh bg-[#f5f6f8]" />;
    }
    return (
      <div className="force-light min-h-dvh bg-[#f5f6f8] text-neutral-950">
        {children}
      </div>
    );
  }

  if (!session) {
    return <div className="force-light min-h-dvh bg-[#f5f6f8]" />;
  }

  return (
    <div className="force-light min-h-dvh bg-[#f5f6f8] text-neutral-950">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-neutral-200 bg-white transition-[width] duration-200 lg:block",
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <SidebarNav pathname={pathname} collapsed={collapsed} />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          showCloseButton
          className="force-light w-72 max-w-[85vw] border-neutral-200 bg-white p-0 text-neutral-950"
        >
          <SidebarNav
            pathname={pathname}
            onNavigate={() => setMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "min-w-0 transition-[padding] duration-200",
          collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64",
        )}
      >
        <AdminHeader
          pathname={pathname}
          session={session}
          collapsed={collapsed}
          onToggleSidebar={toggleSidebar}
          onOpenMenu={() => setMenuOpen(true)}
          onLogout={logout}
        />
        <div
          className={cn(
            "w-full",
            wide
              ? "px-4 py-3 sm:px-5 lg:px-5"
              : "mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
