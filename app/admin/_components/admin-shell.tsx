"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logoutMart } from "@/lib/mart-api/products";
import {
  clearSession,
  markPasswordChanged,
  readSession,
  writeSession,
  type AdminSession,
} from "@/lib/mart-mock/store";

import { ChangePasswordDialog } from "./change-password-dialog";

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
  if (sessionCache && next && sessionCache.email === next.email) {
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
        "flex items-center rounded-xl text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2",
        nested && !collapsed && "py-1.5 text-[13px]",
        active
          ? "bg-primary/10 text-primary"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
      )}
    >
      <MaterialIcon
        name={item.icon}
        className={nested ? "text-[18px]" : "text-[20px]"}
      />
      <span className={cn("truncate", collapsed && "sr-only")}>
        {item.label}
      </span>
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
              <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
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
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-neutral-200 bg-white px-3 sm:px-4">
      <button
        type="button"
        onClick={onOpenMenu}
        className="inline-flex size-10 items-center justify-center rounded-xl text-neutral-700 hover:bg-neutral-100 lg:hidden"
        aria-label="Open menu"
      >
        <MaterialIcon name="menu" className="text-[22px]" />
      </button>
      <button
        type="button"
        onClick={onToggleSidebar}
        className="hidden size-10 items-center justify-center rounded-xl text-neutral-700 hover:bg-neutral-100 lg:inline-flex"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
        <p className="text-[11px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
          {page.group}
        </p>
        <p className="truncate text-sm font-semibold text-neutral-950">
          {page.label}
        </p>
      </div>
      <div className="ml-auto flex min-w-0 items-center gap-2">
        <p className="hidden max-w-48 truncate text-sm text-neutral-600 md:block">
          {session.email}
        </p>
        <button
          type="button"
          onClick={onChangePassword}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          <MaterialIcon name="key" className="text-[20px]" />
          <span className="hidden sm:inline">Password</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          <MaterialIcon name="logout" className="text-[20px]" />
          <span className="hidden sm:inline">Log out</span>
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
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const isLogin = pathname === "/admin/login";
  const wide = isWideAdminPath(pathname);
  const backHref = adminBackHref(pathname);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/session", { credentials: "same-origin" })
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          const body = (await response.json()) as { email?: string };
          if (body.email) writeSession(body.email);
          return;
        }
        clearSession();
        sessionCache = null;
        window.dispatchEvent(new Event(SESSION_EVENT));
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
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
    await logoutMart();
    sessionCache = null;
    window.dispatchEvent(new Event(SESSION_EVENT));
    setMenuOpen(false);
    setPasswordOpen(false);
    router.replace("/admin/login");
  }

  function finishPasswordChange() {
    markPasswordChanged();
    clearSession();
    sessionCache = null;
    window.dispatchEvent(new Event(SESSION_EVENT));
    setMenuOpen(false);
    setPasswordOpen(false);
    router.replace("/admin/login");
  }

  if (!hydrated || !checked) {
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
          onChangePassword={() => setPasswordOpen(true)}
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
          {backHref ? (
            <div className="mb-4">
              <Link
                href={backHref}
                className="inline-flex h-9 items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-950"
              >
                <MaterialIcon name="arrow_back" className="text-[18px]" />
                Back
              </Link>
            </div>
          ) : null}
          {children}
        </div>
      </div>
      {passwordOpen ? (
        <ChangePasswordDialog onClose={() => setPasswordOpen(false)} onChanged={finishPasswordChange} />
      ) : null}
    </div>
  );
}
