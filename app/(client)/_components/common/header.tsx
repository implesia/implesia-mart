"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_HEADER_ITEMS, type HeaderItem } from "@/lib/header-view";
import { cn } from "@/lib/utils";

import {
  contactChannel,
  type ContactDetails,
} from "@/lib/mart-api/contact-details";

import { CartTrigger } from "../cart/cart-trigger";
import { Container } from "./container";
import { CustomerAvatar } from "./customer-avatar";
import {
  CustomerNotificationBell,
  useCustomerUnreadCount,
} from "./customer-notification-bell";
import { MaterialIcon } from "./material-icon";
import { SearchBox } from "./search-box";
import { SiteLogo } from "./site-logo";
import { useCustomerAuth } from "../../_providers/customer-auth-provider";

const SITE_NAME = "Implesia Mart";

function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [locked]);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Same breakpoint as Tailwind `lg`, where the desktop navigation takes over. */
const DESKTOP_QUERY = "(min-width: 1024px)";

export type HeaderCategory = { slug: string; label: string };

export default function Header({
  details,
  categories = [],
  navItems = DEFAULT_HEADER_ITEMS,
  logo,
}: {
  details: ContactDetails | null;
  /** Top-level categories from the API (never a hardcoded list). */
  categories?: HeaderCategory[];
  /** Top menu from the API (Admin → Site → Header); the built-in menu when omitted. */
  navItems?: readonly HeaderItem[];
  /** Uploaded navbar logo from the API; the built-in logo when omitted. */
  logo?: { src: string; alt: string };
}) {
  const pathname = usePathname();
  const phoneChannel = contactChannel(details, "call");
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const unreadNotifications = useCustomerUnreadCount(isAuthenticated);
  const [userMenuPath, setUserMenuPath] = useState<string | null>(null);
  const userMenuOpen = userMenuPath === pathname;
  const closeUserMenu = useCallback(() => setUserMenuPath(null), []);
  const toggleUserMenu = useCallback(
    () => setUserMenuPath((curr) => (curr === pathname ? null : pathname)),
    [pathname],
  );
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [categoriesPath, setCategoriesPath] = useState<string | null>(null);
  const menuId = useId();
  const categoriesRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  // What opened the menu, so focus goes back there when it closes.
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const focusTargetRef = useRef<"close" | "search">("close");
  const wasOpenRef = useRef(false);
  const mobileOpen = menuPath === pathname;
  const categoriesOpen = categoriesPath === pathname;
  const [menuEntered, setMenuEntered] = useState(false);

  useScrollLock(mobileOpen);

  const closeMenu = useCallback(() => setMenuPath(null), []);
  const openMenu = useCallback(
    (opener: HTMLButtonElement | null, focus: "close" | "search") => {
      openerRef.current = opener;
      focusTargetRef.current = focus;
      setMenuPath(pathname);
    },
    [pathname],
  );

  // Move focus into the menu when it opens, and back to the button that opened it when it
  // closes (also after a link was followed), so keyboard and screen reader users keep their place.
  useEffect(() => {
    if (mobileOpen) {
      wasOpenRef.current = true;
      const frame = requestAnimationFrame(() => {
        const aside = asideRef.current;
        if (!aside) return;
        const target =
          focusTargetRef.current === "search"
            ? aside.querySelector<HTMLElement>('input[role="combobox"]')
            : aside.querySelector<HTMLElement>("[data-menu-close]");
        target?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      (openerRef.current ?? menuButtonRef.current)?.focus();
    }
  }, [mobileOpen]);

  // The drawer is mobile only: if the window grows to desktop while it is open, close it
  // so the scroll lock and the inert header do not stay behind.
  useEffect(() => {
    if (!mobileOpen) return;
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeMenu();
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [mobileOpen, closeMenu]);

  // Keep Tab inside the open dialog (the header behind it is inert).
  const trapTab = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") return;
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !event.currentTarget.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    // Enter on the next frame so the slide-in transition runs; reset when the menu closes.
    const frame = requestAnimationFrame(() => setMenuEntered(true));
    return () => {
      cancelAnimationFrame(frame);
      setMenuEntered(false);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuPath(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (!categoriesOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!categoriesRef.current?.contains(event.target as Node)) {
        setCategoriesPath(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCategoriesPath(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [categoriesOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!userDropdownRef.current?.contains(event.target as Node)) {
        closeUserMenu();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeUserMenu();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen, closeUserMenu]);

  const activeHref = useMemo(() => {
    if (!pathname) return "/";
    if (pathname.startsWith("/products")) return "/products";
    return pathname;
  }, [pathname]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]"
        inert={mobileOpen}
      >
        {/* Main header bar */}
        <div className="border-b border-neutral-200/80 bg-white text-neutral-800 dark:border-white/10 dark:bg-[#121a19] dark:text-neutral-100">
          <Container className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-8 lg:px-8">
            <div className="flex min-w-0 shrink-0 items-center">
              <SiteLogo
                priority
                tone="light"
                custom={logo}
                className="h-8.5 w-[7.5rem] min-[360px]:w-[8.875rem] sm:h-9.5 sm:w-[9.875rem]"
                onClick={closeMenu}
              />
            </div>

            <div className="hidden justify-center px-4 lg:flex">
              <SearchBox variant="desktop" />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4 lg:gap-5">
              {phoneChannel ? (
                <a
                  href={phoneChannel.href}
                  className="hidden items-center gap-1.5 text-[13px] font-medium text-neutral-800 transition-colors hover:text-neutral-950 lg:inline-flex dark:text-neutral-200 dark:hover:text-white"
                >
                  <MaterialIcon name="call" className="text-[18px] text-neutral-700 dark:text-neutral-300" />
                  <span>{phoneChannel.value}</span>
                </a>
              ) : null}
              <Link
                href="/order-status"
                className="hidden size-9 items-center justify-center rounded-lg text-neutral-800 transition-colors hover:bg-neutral-100 hover:text-neutral-950 lg:inline-flex dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Track Order"
                title="Track Order"
              >
                <MaterialIcon name="receipt_long" className="text-[22px]" />
              </Link>

              {/* Customer Notification Bell (when signed in) */}
              <CustomerNotificationBell enabled={isAuthenticated} />

              {/* Customer Account Pill / Dropdown on Desktop */}
              {!isAuthenticated ? (
                <Link
                  href="/login"
                  className="hidden items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-2xs transition-colors hover:bg-neutral-50 hover:text-neutral-950 lg:inline-flex dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
                  title="Login / Register"
                >
                  <MaterialIcon name="person" className="text-[18px] text-neutral-600 dark:text-neutral-300" />
                  <span>Login</span>
                </Link>
              ) : customer ? (
                <div className="relative hidden lg:block" ref={userDropdownRef}>
                  <button
                    type="button"
                    onClick={toggleUserMenu}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border border-neutral-200/90 bg-neutral-50/90 py-1 pr-2.5 pl-1 text-xs font-medium text-neutral-900 transition-colors hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
                      userMenuOpen && "border-emerald-300 bg-white ring-2 ring-emerald-500/20 dark:border-emerald-700/60 dark:bg-white/10",
                    )}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                  >
                    <CustomerAvatar
                      name={customer.fullName}
                      avatarUrl={customer.avatarUrl}
                      size="xs"
                    />
                    <span className="max-w-[100px] truncate text-left font-semibold">
                      {customer.fullName.split(" ")[0]}
                    </span>
                    <MaterialIcon
                      name="expand_more"
                      className={cn("text-[16px] text-neutral-500 transition-transform duration-200", userMenuOpen && "rotate-180")}
                    />
                  </button>

                  {userMenuOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 origin-top-right overflow-hidden rounded-2xl border border-neutral-200/90 bg-white text-neutral-900 shadow-2xl shadow-black/10 ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 dark:border-white/10 dark:bg-[#131c1b] dark:text-white"
                    >
                      {/* Rich Header Card */}
                      <div className="border-b border-neutral-100 bg-gradient-to-br from-emerald-50/60 via-white to-white px-4 py-3.5 dark:border-white/10 dark:from-emerald-950/30 dark:via-[#131c1b] dark:to-[#131c1b]">
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
                        <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-500/30">
                          <MaterialIcon name="verified" className="text-[13px]" />
                          <span>ভেরিফাইড কাস্টমার</span>
                        </span>
                      </div>

                      {/* Group 1: Orders & Activity */}
                      <div className="p-1.5">
                        <p className="px-2.5 pt-1 pb-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                          অর্ডার ও কার্যক্রম
                        </p>
                        <Link
                          href="/dashboard"
                          role="menuitem"
                          onClick={closeUserMenu}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100/80 hover:text-neutral-950 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <MaterialIcon name="dashboard" className="text-[17px] text-neutral-400" />
                          <span>ড্যাশবোর্ড</span>
                        </Link>
                        <Link
                          href="/dashboard/orders"
                          role="menuitem"
                          onClick={closeUserMenu}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100/80 hover:text-neutral-950 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <MaterialIcon name="receipt_long" className="text-[17px] text-neutral-400" />
                          <span>আমার অর্ডার</span>
                        </Link>
                        <Link
                          href="/dashboard/tracking"
                          role="menuitem"
                          onClick={closeUserMenu}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100/80 hover:text-neutral-950 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <MaterialIcon name="local_shipping" className="text-[17px] text-neutral-400" />
                          <span>অর্ডার ট্র্যাকিং</span>
                        </Link>
                        <Link
                          href="/dashboard/purchases"
                          role="menuitem"
                          onClick={closeUserMenu}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100/80 hover:text-neutral-950 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <MaterialIcon name="shopping_bag" className="text-[17px] text-neutral-400" />
                          <span>কেনা পণ্যের হিস্ট্রি</span>
                        </Link>
                        <Link
                          href="/dashboard/notifications"
                          role="menuitem"
                          onClick={closeUserMenu}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100/80 hover:text-neutral-950 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <MaterialIcon name="notifications" className="text-[17px] text-neutral-400" />
                          <span>নোটিফিকেশন</span>
                          {unreadNotifications > 0 ? (
                            <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white tabular-nums">
                              {unreadNotifications > 99 ? "99+" : unreadNotifications}
                            </span>
                          ) : null}
                        </Link>
                      </div>

                      {/* Group 2: Account */}
                      <div className="border-t border-neutral-100 p-1.5 dark:border-white/10">
                        <p className="px-2.5 pt-1 pb-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                          অ্যাকাউন্ট
                        </p>
                        <Link
                          href="/dashboard/profile"
                          role="menuitem"
                          onClick={closeUserMenu}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100/80 hover:text-neutral-950 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <MaterialIcon name="person" className="text-[17px] text-neutral-400" />
                          <span>আমার প্রোফাইল</span>
                        </Link>
                        <Link
                          href="/dashboard/settings"
                          role="menuitem"
                          onClick={closeUserMenu}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100/80 hover:text-neutral-950 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <MaterialIcon name="settings" className="text-[17px] text-neutral-400" />
                          <span>সেটিংস</span>
                        </Link>
                      </div>

                      {/* Styled Logout */}
                      <div className="border-t border-neutral-100 bg-neutral-50/60 p-1.5 dark:border-white/10 dark:bg-white/[0.02]">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={async () => {
                            closeUserMenu();
                            await logout();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                          <MaterialIcon name="logout" className="text-[17px]" />
                          <span>লগআউট</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <CartTrigger variant="summary" />

              <button
                ref={searchButtonRef}
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 lg:hidden dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Search products"
                aria-haspopup="dialog"
                onClick={() => openMenu(searchButtonRef.current, "search")}
              >
                <MaterialIcon name="search" className="text-[22px]" />
              </button>

              <button
                ref={menuButtonRef}
                type="button"
                className="-mr-1 inline-flex size-9 items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 lg:hidden dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls={mobileOpen ? menuId : undefined}
                onClick={() =>
                  mobileOpen
                    ? closeMenu()
                    : openMenu(menuButtonRef.current, "close")
                }
              >
                <MaterialIcon
                  name={mobileOpen ? "close" : "menu"}
                  className="text-[22px]"
                />
              </button>
            </div>
          </Container>
        </div>

        {/* Categories & Navigation Bar */}
        <div className="hidden bg-neutral-950 text-white lg:block">
          <Container className="flex h-10 items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
            <div className="relative shrink-0" ref={categoriesRef}>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-white px-2.5 text-xs font-semibold text-neutral-950 shadow-xs transition-colors hover:bg-neutral-100"
                aria-label="Categories"
                aria-expanded={categoriesOpen}
                aria-haspopup="true"
                onClick={() => {
                  setCategoriesPath((current) =>
                    current === pathname ? null : pathname,
                  );
                }}
              >
                <MaterialIcon name="apps" className="text-[17px]" />
                <span className="hidden min-[360px]:inline">Categories</span>
                <MaterialIcon
                  name="expand_more"
                  className={cn(
                    "text-[17px] transition-transform duration-200",
                    categoriesOpen && "rotate-180",
                  )}
                />
              </button>

              <div
                className={cn(
                  "absolute top-[calc(100%+0.375rem)] left-0 z-50 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 text-neutral-900 shadow-xl dark:border-white/10 dark:bg-[#141c1b] dark:text-white",
                  categoriesOpen ? "block" : "hidden",
                )}
                role="menu"
              >
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/products?category=${category.slug}`}
                    role="menuitem"
                    className="block px-3.5 py-2 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-white/10"
                    onClick={() => setCategoriesPath(null)}
                  >
                    {category.label}
                  </Link>
                ))}
                <Link
                  href="/products"
                  role="menuitem"
                  className="block border-t border-neutral-100 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-neutral-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                  onClick={() => setCategoriesPath(null)}
                >
                  View All
                </Link>
              </div>
            </div>

            <nav
              className="flex min-w-0 flex-1 snap-x snap-mandatory scroll-px-1 items-center gap-1 overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] sm:gap-2 lg:[mask-image:none] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Main navigation"
            >
              {navItems.map((item, index) => {
                const active = item.href === activeHref;
                return (
                  <Link
                    key={`${index}-${item.href}`}
                    href={item.href}
                    className={cn(
                      "inline-flex h-7.5 shrink-0 snap-start items-center rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white last:mr-6 lg:last:mr-0",
                      active ? "bg-white/15 font-semibold text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </Container>
        </div>
      </header>

      {/* Matches the fixed header height per breakpoint so nothing jumps or overlaps content */}
      <div aria-hidden className="h-14 sm:h-16 lg:h-[104px]" />

      {mobileOpen ? (
      <div
        id={menuId}
        className="fixed inset-0 z-60 lg:hidden"
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300",
            menuEntered ? "opacity-100" : "opacity-0",
          )}
          onClick={closeMenu}
        />

        <aside
          ref={asideRef}
          onKeyDown={trapTab}
          className={cn(
            "absolute top-0 right-0 flex h-full w-[min(100vw-2.5rem,22rem)] max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-[#0e1514]",
            "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
            menuEntered ? "translate-x-0" : "translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:px-5 dark:border-white/10">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
                Menu
              </p>
              <p className="truncate text-sm font-semibold text-neutral-950 dark:text-white">
                {SITE_NAME}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
              data-menu-close
              aria-label="Close menu"
              onClick={closeMenu}
            >
              <MaterialIcon name="close" className="text-[20px]" />
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3.5 sm:px-5">
            <SearchBox variant="mobile" onNavigate={closeMenu} />

            {/* Mobile Drawer Customer Auth Card */}
            {!isAuthenticated ? (
              <div className="my-3 rounded-xl border border-neutral-200/90 bg-neutral-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-neutral-200/80 text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
                      <MaterialIcon name="person" className="text-[18px]" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                        লগইন করা নেই
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        অর্ডার ও প্রোফাইল দেখতে
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="inline-flex items-center justify-center rounded-lg bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
                  >
                    লগইন / সাইন আপ
                  </Link>
                </div>
              </div>
            ) : customer ? (
              <div className="my-3 rounded-2xl border border-neutral-200/90 bg-neutral-50/80 p-3.5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <CustomerAvatar
                    name={customer.fullName}
                    avatarUrl={customer.avatarUrl}
                    size="md"
                    shape="rounded"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-neutral-900 dark:text-white">
                      {customer.fullName}
                    </p>
                    <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                      {customer.phone || customer.email}
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <MaterialIcon name="verified" className="text-[12px]" />
                      <span>ভেরিফাইড কাস্টমার</span>
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-neutral-200/60 pt-2.5 dark:border-white/10">
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200/60 dark:text-neutral-200 dark:hover:bg-white/10"
                  >
                    <MaterialIcon name="dashboard" className="text-[16px] text-neutral-500" />
                    <span>ড্যাশবোর্ড</span>
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    onClick={closeMenu}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200/60 dark:text-neutral-200 dark:hover:bg-white/10"
                  >
                    <MaterialIcon name="receipt_long" className="text-[16px] text-neutral-500" />
                    <span>আমার অর্ডার</span>
                  </Link>
                  <Link
                    href="/dashboard/tracking"
                    onClick={closeMenu}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200/60 dark:text-neutral-200 dark:hover:bg-white/10"
                  >
                    <MaterialIcon name="local_shipping" className="text-[16px] text-neutral-500" />
                    <span>অর্ডার ট্র্যাকিং</span>
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    onClick={closeMenu}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200/60 dark:text-neutral-200 dark:hover:bg-white/10"
                  >
                    <MaterialIcon name="notifications" className="text-[16px] text-neutral-500" />
                    <span>নোটিফিকেশন</span>
                    {unreadNotifications > 0 ? (
                      <span className="ml-auto rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white tabular-nums">
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </span>
                    ) : null}
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    onClick={closeMenu}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200/60 dark:text-neutral-200 dark:hover:bg-white/10"
                  >
                    <MaterialIcon name="person" className="text-[16px] text-neutral-500" />
                    <span>আমার প্রোফাইল</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={closeMenu}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200/60 dark:text-neutral-200 dark:hover:bg-white/10"
                  >
                    <MaterialIcon name="settings" className="text-[16px] text-neutral-500" />
                    <span>সেটিংস</span>
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    closeMenu();
                    await logout();
                  }}
                  className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200/70 bg-rose-50/70 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
                >
                  <MaterialIcon name="logout" className="text-[16px]" />
                  <span>লগআউট</span>
                </button>
              </div>
            ) : null}

            {phoneChannel ? (
              <a
                href={phoneChannel.href}
                className="mb-3 inline-flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 sm:hidden dark:bg-white/5 dark:text-neutral-200"
              >
                <MaterialIcon name="call" className="text-[16px] text-neutral-500" />
                <span>Hotline: {phoneChannel.value}</span>
              </a>
            ) : null}

            {categories.length > 0 ? (
              <nav className="mb-4" aria-label="Categories">
                <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
                  Categories
                </p>
                <ul className="space-y-0.5">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/products?category=${category.slug}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-white/10"
                        onClick={closeMenu}
                      >
                        <span>{category.label}</span>
                        <MaterialIcon name="chevron_right" className="text-[18px] text-neutral-400" />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/products"
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-100 dark:text-white dark:hover:bg-white/10"
                      onClick={closeMenu}
                    >
                      <span>View All</span>
                      <MaterialIcon name="arrow_forward" className="text-[18px]" />
                    </Link>
                  </li>
                </ul>
              </nav>
            ) : null}

            <nav className="space-y-0.5" aria-label="Navigation links">
              {navItems.map((item, index) => {
                const active = item.href === activeHref;
                return (
                  <Link
                    key={`${index}-${item.href}`}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                        : "text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-white/10",
                    )}
                    onClick={closeMenu}
                  >
                    <span>{item.label}</span>
                    <MaterialIcon
                      name={active ? "check" : "chevron_right"}
                      className="text-[18px] text-neutral-400"
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto grid grid-cols-2 gap-2 pt-4 pb-2">
              <CartTrigger
                variant="button"
                onNavigate={closeMenu}
              />
              <Link
                href="/order-status"
                onClick={closeMenu}
                className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 text-sm font-medium dark:border-white/15"
              >
                <MaterialIcon
                  name="receipt_long"
                  className="mr-1.5 text-[18px]"
                />
                My Orders
              </Link>
            </div>
          </div>
        </aside>
      </div>
      ) : null}
    </>
  );
}
