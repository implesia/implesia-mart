"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useRef } from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logoutMart } from "@/lib/mart-api/products";
import { INQUIRIES_CHANGED, getInquiryCounts } from "@/lib/mart-api/inquiries";
import {
  clearSession,
  dropStoredTokens,
  markPasswordChanged,
  readSession,
  readStoredRefreshToken,
  writeSession,
  type AdminSession,
} from "@/lib/mart-mock/store";

import { ChangePasswordDialog } from "./change-password-dialog";
import { ConfirmDeleteProvider } from "./confirm-delete";
import { OrderAlertBadge, OrderAlertBell } from "./order-alerts/order-alert-bell";
import { OrderAlertHint, OrderAlertsProvider } from "./order-alerts/order-alerts-provider";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  ADMIN_NAV,
  adminBackHref,
  currentAdminPage,
  isAdminBranchActive,
  isAdminNavActive,
  isWideAdminPath,
  type AdminNavItem,
} from "../_config/nav";

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
  if (sessionCache && next && sessionCache.email === next.email && sessionCache.role === next.role) {
    return sessionCache;
  }
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

/** Count of new inquiries; refreshed on focus, every minute and after an admin change. */
function InquiryBadge({ collapsed }: { collapsed: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () =>
      void getInquiryCounts().then((counts) => {
        if (alive && counts) setCount(counts.new);
      });
    load();
    const id = window.setInterval(load, 60_000);
    window.addEventListener(INQUIRIES_CHANGED, load);
    window.addEventListener("focus", load);
    return () => {
      alive = false;
      window.clearInterval(id);
      window.removeEventListener(INQUIRIES_CHANGED, load);
      window.removeEventListener("focus", load);
    };
  }, []);
  if (!count) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      aria-label={`${count} new`}
      className={cn(
        "rounded-full bg-amber-500 text-[11px] font-bold text-white tabular-nums",
        collapsed ? "absolute top-1 right-1 min-w-4 px-1 leading-4" : "ml-auto min-w-5 px-1.5 text-center leading-5",
      )}
    >
      {label}
    </span>
  );
}

// dashbaord sidebar link
function NavLink({
  item,
  pathname,
  collapsed,
  onNavigate,
  nested = false,
  forceActive,
}: {
  item: AdminNavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  nested?: boolean;
  forceActive?: boolean;
}) {
  const active = forceActive ?? isAdminNavActive(pathname, item);
  
  return (
    <Link
      href={item.href}
      title={item.label}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center rounded-lg text-sm font-medium transition-all duration-200",
        collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2",
        nested && !collapsed && "py-1.5 text-[13px]",
        active
          ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-100"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {/* Active Left Accent Bar */}
      {active && !collapsed && (
        <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600" />
      )}

      {/* Icon */}
      <MaterialIcon
        name={item.icon}
        className={cn(
          "shrink-0 transition-colors",
          nested ? "text-[18px]" : "text-[20px]",
          active 
            ? "text-indigo-600" 
            : "text-slate-400 group-hover:text-slate-600"
        )}
      />

      {/* Label */}
      <span className={cn("truncate", collapsed && "sr-only")}>
        {item.label}
      </span>

      {/* Badges */}
      {item.badge === "inquiries" ? <InquiryBadge collapsed={collapsed} /> : null}
      {item.badge === "orders" ? <OrderAlertBadge collapsed={collapsed} /> : null}
    </Link>
  );
}

function NavBranch({
  item,
  pathname,
  collapsed,
  onNavigate,
  open,
  onToggle,
}: {
  item: AdminNavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  open: boolean;
  onToggle: () => void;
}) {
  const children = item.children ?? [];
  const branchActive = isAdminBranchActive(pathname, item);

  if (children.length === 0 || collapsed) {
    return (
      <NavLink
        item={item}
        pathname={pathname}
        collapsed={collapsed}
        onNavigate={onNavigate}
        forceActive={branchActive}
      />
    );
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center rounded-xl",
          branchActive && "bg-neutral-50",
        )}
      >
        <Link
          href={item.href}
          title={item.label}
          onClick={onNavigate}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            isAdminNavActive(pathname, item)
              ? "text-primary"
              : branchActive
                ? "text-neutral-950"
                : "text-neutral-600 hover:text-neutral-950",
          )}
        >
          <MaterialIcon name={item.icon} className="text-[20px]" />
          <span className="truncate">{item.label}</span>
          {item.badge === "inquiries" ? <InquiryBadge collapsed={false} /> : null}
          {item.badge === "orders" ? <OrderAlertBadge collapsed={false} /> : null}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={
            open ? `Hide ${item.label} sections` : `Show ${item.label} sections`
          }
          className="mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
        >
          <MaterialIcon
            name={open ? "expand_less" : "expand_more"}
            className="text-[20px]"
          />
        </button>
      </div>
      {open ? (
        <div className="mt-0.5 ml-4 flex flex-col gap-0.5 border-l border-neutral-200 pl-2">
          {children.map((child) => (
            <NavLink
              key={child.href}
              item={child}
              pathname={pathname}
              collapsed={false}
              onNavigate={onNavigate}
              nested
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function openMapForPath(pathname: string) {
  const next: Record<string, boolean> = {};
  for (const group of ADMIN_NAV) {
    for (const item of group.items) {
      if (item.children?.length && isAdminBranchActive(pathname, item)) {
        next[item.href] = true;
      }
    }
  }
  return next;
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
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    openMapForPath(pathname),
  );
  const [openForPath, setOpenForPath] = useState(pathname);
  if (pathname !== openForPath) {
    setOpenForPath(pathname);
    setOpenMap((prev) => ({ ...prev, ...openMapForPath(pathname) }));
  }

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
          <span className="text-xs text-neutral-500">Admin</span>
        )}
      </div>
      <nav
        className={cn(
          "flex flex-1 flex-col overflow-y-auto",
          collapsed ? "gap-2 p-2" : "gap-3 p-3",
        )}
      >
        {ADMIN_NAV.map((group) => (
          <div key={group.title}>
            {collapsed ? (
              <div className="mx-1 mb-1 h-px bg-neutral-200" />
            ) : (
              <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
                {group.title}
              </p>
            )}
            <div
              className={cn("flex flex-col", collapsed ? "gap-1" : "gap-0.5")}
            >
              {group.items.map((item) => (
                <NavBranch
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                  open={Boolean(openMap[item.href])}
                  onToggle={() =>
                    setOpenMap((prev) => ({
                      ...prev,
                      [item.href]: !prev[item.href],
                    }))
                  }
                />
              ))}
            </div>
          </div>
        ))}
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
  onChangePassword,
  onLogout,
}: {
  pathname: string;
  session: AdminSession;
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMenu: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
}) {
  const page = currentAdminPage(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    if (profileOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [profileOpen]);

  // Get user initial for avatar
  const initial = session.email?.charAt(0).toUpperCase() || "A";
  const displayName = session.email?.split("@")[0] || "Admin";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-3 backdrop-blur-md print:hidden sm:px-4">
      
      {/* Mobile Menu Toggle (Drawer Icon) */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 lg:hidden"
        aria-label="Open drawer"
      >
        <MaterialIcon name="menu" className="text-[22px]" />
      </button>

      {/* Desktop Sidebar Toggle (Drawer Icon) */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 lg:inline-flex"
        aria-label={collapsed ? "Open drawer" : "Close drawer"}
        aria-pressed={collapsed}
      >
        <MaterialIcon
          name={collapsed ? "menu" : "menu_open"}
          className="text-[22px]"
        />
      </button>

      {/* Page Breadcrumb */}
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {page.group}
        </p>
        <p className="truncate text-sm font-semibold text-slate-900">
          {page.label}
        </p>
      </div>

      {/* Right Side Actions */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        
        {/* Notification Bell */}
        <OrderAlertBell />

        {/* Profile Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="group flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 sm:pr-2.5"
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label="Open profile menu"
          >
            {/* Avatar Circle */}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2bc0b5] text-xs font-bold text-white shadow-sm ring-2 ring-white">
              {initial}
            </span>
            
            {/* Name (Desktop Only) */}
            <span className="hidden text-left sm:block">
              <span className="block max-w-[100px] truncate text-xs font-semibold leading-tight text-slate-900">
                {displayName}
              </span>
              <span className="block max-w-[100px] truncate text-[10px] font-medium leading-tight text-slate-500">
                Administrator
              </span>
            </span>
            
            {/* Chevron */}
            <MaterialIcon
              name="expand_more"
              className={`hidden text-[18px] text-slate-400 transition-transform duration-200 sm:block ${profileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                
                {/* User Info Header */}
                <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Signed in as
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                    {session.email}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="p-1.5">
                  {/* My Profile (placeholder) */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      // Route to profile if available
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <MaterialIcon name="person" className="text-[18px] text-slate-400" />
                    My Profile
                  </button>

                  {/* Settings (placeholder) */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      // Route to settings if available
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <MaterialIcon name="settings" className="text-[18px] text-slate-400" />
                    Settings
                  </button>

                  {/* Change Password */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onChangePassword();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <MaterialIcon name="key" className="text-[18px] text-slate-400" />
                    Change Password
                  </button>
                </div>

                {/* Logout (Separated) */}
                <div className="border-t border-slate-100 p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                  >
                    <MaterialIcon name="logout" className="text-[18px]" />
                    Log out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const isLogin = pathname === "/admin/login";
  const wide = isWideAdminPath(pathname);
  const backHref = adminBackHref(pathname);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const leftover = readStoredRefreshToken();
      if (leftover) {
        try {
          const revoked = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: leftover }),
          });
          if (revoked.ok) dropStoredTokens();
        } catch {
          /* Keep the stored token so the next visit can revoke it. */
        }
      }
      if (cancelled) return;
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "same-origin",
        });
        if (cancelled) return;
        if (response.ok) {
          const body = (await response.json()) as { email?: string; role?: string };
          if (body.email) writeSession(body.email, body.role);
          return;
        }
        clearSession();
        sessionCache = null;
        window.dispatchEvent(new Event(SESSION_EVENT));
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!hydrated || !checked) return;
    if (pathname === "/admin/login") {
      if (session) router.replace("/admin");
      return;
    }
    if (!session) router.replace("/admin/login");
  }, [checked, hydrated, pathname, router, session]);

  function toggleSidebar() {
    writeCollapsed(!collapsed);
  }

  async function logout() {
    setLogoutError("");
    try {
      await logoutMart();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Sign out did not finish. You are still signed in.",
      );
      return;
    }
    sessionCache = null;
    window.dispatchEvent(new Event(SESSION_EVENT));
    setMenuOpen(false);
    setPasswordOpen(false);
    router.replace("/admin/login");
  }

  async function finishPasswordChange() {
    markPasswordChanged();
    try {
      await logoutMart();
    } catch {
      clearSession();
    }
    sessionCache = null;
    window.dispatchEvent(new Event(SESSION_EVENT));
    setMenuOpen(false);
    setPasswordOpen(false);
    router.replace("/admin/login");
  }

  if (!hydrated || !checked) {
    return (
      <div className="force-light flex min-h-dvh items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      </div>
    );
  }

  if (isLogin) {
    if (session) {
      return <div className="force-light min-h-dvh bg-slate-50" />;
    }
    return (
      <div className="force-light min-h-dvh bg-slate-50 text-slate-900">
        {children}
      </div>
    );
  }

  if (!session) {
    return <div className="force-light min-h-dvh bg-slate-50" />;
  }

  return (
    <ConfirmDeleteProvider>
      <OrderAlertsProvider>
        <div className="force-light min-h-dvh bg-slate-50/80 text-slate-900">
          
          {/* Desktop Sidebar */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white shadow-sm transition-[width] duration-200 ease-in-out print:hidden lg:block",
              collapsed ? "w-[4.5rem]" : "w-64",
            )}
          >
            <SidebarNav pathname={pathname} collapsed={collapsed} />
          </aside>

          {/* Mobile Sidebar (Sheet) */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetContent
              side="left"
              showCloseButton
              className="force-light w-72 max-w-[85vw] border-slate-200 bg-white p-0 text-slate-900"
            >
              <SidebarNav
                pathname={pathname}
                onNavigate={() => setMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>

          {/* Main Content Area */}
          <div
            className={cn(
              "flex min-h-dvh min-w-0 flex-col transition-[padding] duration-200 ease-in-out print:pl-0",
              collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64",
            )}
          >
            <AdminHeader
              pathname={pathname}
              session={session}
              collapsed={collapsed}
              onToggleSidebar={toggleSidebar}
              onOpenMenu={() => setMenuOpen(true)}
              onChangePassword={() => setPasswordOpen(true)}
              onLogout={() => void logout()}
            />
            
            <OrderAlertHint />
            
            {logoutError ? (
              <div className="border-b border-rose-200 bg-rose-50 px-4 py-2.5">
                <p role="alert" className="text-sm font-medium text-rose-700">
                  {logoutError}
                </p>
              </div>
            ) : null}

            <main
              className={cn(
                "w-full flex-1 print:p-0",
                wide
                  ? "px-4 py-4 sm:px-5 lg:px-6"
                  : "mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 print:max-w-none",
              )}
            >
              {backHref ? (
                <div className="mb-5 print:hidden">
                  <Link
                    href={backHref}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 -ml-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <MaterialIcon name="arrow_back" className="text-[18px]" />
                    Back
                  </Link>
                </div>
              ) : null}
              
              {children}
            </main>
          </div>

          {/* Change Password Dialog */}
          {passwordOpen ? (
            <ChangePasswordDialog
              onClose={() => setPasswordOpen(false)}
              onChanged={finishPasswordChange}
            />
          ) : null}
        </div>
      </OrderAlertsProvider>
    </ConfirmDeleteProvider>
  );
}