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
import { cn } from "@/lib/utils";

import {
  contactChannel,
  type ContactDetails,
} from "@/lib/mart-api/contact-details";

import { headerNav } from "../../_data/common/site-nav";
import { CartTrigger } from "../cart/cart-trigger";
import { Container } from "./container";
import { MaterialIcon } from "./material-icon";
import { SearchBox } from "./search-box";
import { SiteLogo } from "./site-logo";

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
}: {
  details: ContactDetails | null;
  /** Top-level categories from the API (never a hardcoded list). */
  categories?: HeaderCategory[];
}) {
  const pathname = usePathname();
  const phoneChannel = contactChannel(details, "call");
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
        <div className="border-b border-neutral-200 bg-white text-neutral-800">
          <Container className="flex items-center gap-3 px-4 py-1.5 sm:items-end sm:gap-4 sm:py-2 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-end lg:gap-6 lg:px-8 lg:py-3">
            <div className="flex min-w-0 shrink-0 flex-col gap-1">
              {phoneChannel ? (
                <a
                  href={phoneChannel.href}
                  className="hidden items-center gap-1.5 text-[13px] font-medium text-neutral-700 transition-colors hover:text-neutral-950 sm:inline-flex"
                >
                  <MaterialIcon name="call" className="text-[16px]" />
                  <span>{phoneChannel.value}</span>
                </a>
              ) : null}
              <SiteLogo
                priority
                tone="light"
                className="h-9 w-[7.5rem] min-[360px]:w-[8.875rem] sm:h-10 sm:w-[9.875rem] lg:h-10 lg:w-[9.875rem]"
                onClick={closeMenu}
              />
            </div>

            <SearchBox variant="desktop" />

            <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5">
              <span className="hidden items-center gap-1.5 pb-0.5 text-[13px] font-medium text-neutral-700 lg:inline-flex">
                <span aria-hidden>🇧🇩</span>
                বাংলা
              </span>
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-2.5">

                <Link
                  href="/order-status"
                  className="hidden size-9 items-center justify-center rounded-md text-neutral-800 transition-colors hover:bg-neutral-100 lg:inline-flex"
                  aria-label="আমার অর্ডার"
                >
                  <MaterialIcon name="receipt_long" className="text-[22px]" />
                </Link>

                <CartTrigger variant="summary" />

                <button
                  ref={searchButtonRef}
                  type="button"
                  className="inline-flex size-11 items-center justify-center rounded-md text-neutral-800 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 lg:hidden"
                  aria-label="প্রোডাক্ট খুঁজুন"
                  aria-haspopup="dialog"
                  onClick={() => openMenu(searchButtonRef.current, "search")}
                >
                  <MaterialIcon name="search" className="text-[24px]" />
                </button>

                <button
                  ref={menuButtonRef}
                  type="button"
                  className="-mr-1.5 inline-flex size-11 items-center justify-center rounded-md text-neutral-800 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 lg:hidden"
                  aria-label={mobileOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
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
                    className="text-[24px]"
                  />
                </button>
              </div>
            </div>
          </Container>
        </div>

        <div className="hidden bg-neutral-950 text-white lg:block">
          <Container className="flex h-12 items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:h-[3.25rem] lg:px-8">
            <div className="relative shrink-0" ref={categoriesRef}>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-white px-2.5 text-sm sm:gap-2 sm:px-3 font-semibold text-neutral-950 shadow-sm transition-colors hover:bg-neutral-100"
                aria-label="Categories"
                aria-expanded={categoriesOpen}
                aria-haspopup="true"
                onClick={() => {
                  setCategoriesPath((current) =>
                    current === pathname ? null : pathname,
                  );
                }}
              >
                <MaterialIcon name="apps" className="text-[18px]" />
                <span className="hidden min-[360px]:inline">Categories</span>
                <MaterialIcon
                  name="expand_more"
                  className={cn(
                    "text-[18px] transition-transform",
                    categoriesOpen && "rotate-180",
                  )}
                />
              </button>

              <div
                className={cn(
                  "absolute top-[calc(100%+0.5rem)] left-0 z-50 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 text-neutral-900 shadow-lg dark:border-white/10 dark:bg-[#141c1b] dark:text-white",
                  categoriesOpen ? "block" : "hidden",
                )}
                role="menu"
              >
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/products?category=${category.slug}`}
                    role="menuitem"
                    className="block px-3.5 py-2.5 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-white/10"
                    onClick={() => setCategoriesPath(null)}
                  >
                    {category.label}
                  </Link>
                ))}
                <Link
                  href="/products"
                  role="menuitem"
                  className="block border-t border-neutral-100 px-3.5 py-2.5 text-sm font-semibold hover:bg-neutral-100 dark:border-white/10 dark:hover:bg-white/10"
                  onClick={() => setCategoriesPath(null)}
                >
                  View All
                </Link>
              </div>
            </div>

            <nav
              className="flex min-w-0 flex-1 snap-x snap-mandatory scroll-px-1 items-center gap-1 overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] sm:gap-3 lg:[mask-image:none] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="প্রধান নেভিগেশন"
            >
              {headerNav.map((item) => {
                const active = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex h-11 shrink-0 snap-start items-center rounded-md px-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white last:mr-6 lg:last:mr-0",
                      active ? "text-white" : "text-white/75 hover:text-white",
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

      {/* Matches the fixed header height per breakpoint (measured) so nothing jumps or gaps. */}
      <div aria-hidden className="h-[105px] sm:h-[109px] lg:h-[145px]" />

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
          aria-label="মোবাইল মেনু"
        >
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3.5 sm:px-5 dark:border-white/10">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
                মেনু
              </p>
              <p className="truncate text-sm font-semibold text-neutral-950 dark:text-white">
                {SITE_NAME}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 shrink-0"
              data-menu-close
              aria-label="মেনু বন্ধ করুন"
              onClick={closeMenu}
            >
              <MaterialIcon name="close" className="text-[24px]" />
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-5">
            <SearchBox variant="mobile" onNavigate={closeMenu} />

            {phoneChannel ? (
              <a
                href={phoneChannel.href}
                className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-700 sm:hidden dark:text-neutral-200"
              >
                <MaterialIcon name="call" className="text-[18px]" />
                {phoneChannel.value}
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
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[0.95rem] font-medium text-neutral-800 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-white/10"
                        onClick={closeMenu}
                      >
                        <span>{category.label}</span>
                        <MaterialIcon name="chevron_right" className="text-[18px]" />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/products"
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[0.95rem] font-semibold text-neutral-950 transition-colors hover:bg-neutral-100 dark:text-white dark:hover:bg-white/10"
                      onClick={closeMenu}
                    >
                      <span>View All</span>
                      <MaterialIcon name="arrow_forward" className="text-[18px]" />
                    </Link>
                  </li>
                </ul>
              </nav>
            ) : null}

            <nav className="space-y-1" aria-label="মোবাইল লিংক">
              {headerNav.map((item) => {
                const active = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-3 text-[0.95rem] font-medium transition-colors",
                      active
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                        : "text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-white/10",
                    )}
                    onClick={closeMenu}
                  >
                    <span>{item.label}</span>
                    <MaterialIcon
                      name={active ? "check" : "chevron_right"}
                      className="text-[18px]"
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto grid grid-cols-2 gap-2 pt-6 pb-2">
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
                আমার অর্ডার
              </Link>
            </div>
          </div>
        </aside>
      </div>
      ) : null}
    </>
  );
}
