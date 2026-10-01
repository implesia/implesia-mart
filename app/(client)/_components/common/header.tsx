"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useContactSections } from "@/lib/mart-mock/hooks";
import { isContentActive } from "@/lib/mart-mock/visibility";

import { headerNav } from "../../_data/common/site-nav";
import { productFilters } from "../../_data/products/products";
import { CartTrigger } from "../cart/cart-trigger";
import { Container } from "./container";
import { MaterialIcon } from "./material-icon";
import { SiteLogo } from "./site-logo";
import { ThemeToggle } from "./theme-toggle";

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

export default function Header() {
  const pathname = usePathname();
  const direct = useContactSections().direct;
  const phoneChannel = isContentActive(direct)
    ? direct.channels.find(
        (channel) => channel.icon === "call" && isContentActive(channel),
      )
    : undefined;
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [categoriesPath, setCategoriesPath] = useState<string | null>(null);
  const menuId = useId();
  const categoriesRef = useRef<HTMLDivElement>(null);
  const mobileOpen = menuPath === pathname;
  const categoriesOpen = categoriesPath === pathname;

  useScrollLock(mobileOpen);

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
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="border-b border-neutral-200 bg-white text-neutral-800">
          <Container className="flex items-end gap-3 px-4 py-2 sm:gap-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-end lg:gap-6 lg:px-8 lg:py-3">
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
                className="h-9 w-[7.5rem] sm:h-10 sm:w-36 lg:h-10 lg:w-40"
                onClick={() => setMenuPath(null)}
              />
            </div>

            <form
              className="hidden w-[clamp(18rem,34vw,32rem)] lg:block"
              role="search"
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="flex w-full">
                <input
                  type="search"
                  name="q"
                  placeholder="প্রোডাক্ট খুঁজুন..."
                  aria-label="প্রোডাক্ট খুঁজুন"
                  className="h-11 min-w-0 flex-1 rounded-l-md border border-r-0 border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
                />
                <button
                  type="submit"
                  className="grid size-11 shrink-0 place-items-center rounded-r-md bg-neutral-950 text-white transition-colors hover:bg-black"
                  aria-label="খুঁজুন"
                >
                  <MaterialIcon name="search" className="text-[20px]" />
                </button>
              </div>
            </form>

            <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5">
              <span className="hidden items-center gap-1.5 pb-0.5 text-[13px] font-medium text-neutral-700 lg:inline-flex">
                <span aria-hidden>🇧🇩</span>
                বাংলা
              </span>
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-2.5">
                <ThemeToggle className="hidden size-9 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 lg:inline-flex [&_.material-symbols-outlined]:text-[22px]" />

                <button
                  type="button"
                  className="hidden size-9 items-center justify-center rounded-md text-neutral-800 transition-colors hover:bg-neutral-100 lg:inline-flex"
                  aria-label="অ্যাকাউন্ট"
                >
                  <MaterialIcon name="person" className="text-[22px]" />
                </button>

                <CartTrigger variant="summary" />

                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-md text-neutral-800 hover:bg-neutral-100 lg:hidden"
                  aria-label={mobileOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
                  aria-expanded={mobileOpen}
                  aria-controls={menuId}
                  onClick={() =>
                    setMenuPath((current) =>
                      current === pathname ? null : pathname,
                    )
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

        <div className="bg-neutral-950 text-white">
          <Container className="flex h-12 items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:h-[3.25rem] lg:px-8">
            <div className="relative shrink-0" ref={categoriesRef}>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-neutral-950 shadow-sm transition-colors hover:bg-neutral-100"
                aria-expanded={categoriesOpen}
                aria-haspopup="true"
                onClick={() => {
                  setCategoriesPath((current) =>
                    current === pathname ? null : pathname,
                  );
                }}
              >
                <MaterialIcon name="apps" className="text-[18px]" />
                <span className="hidden min-[360px]:inline">ক্যাটাগরি</span>
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
                {productFilters.categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.id}`}
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
                  সব দেখুন
                </Link>
              </div>
            </div>

            <nav
              className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto sm:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="প্রধান নেভিগেশন"
            >
              {headerNav.map((item) => {
                const active = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "shrink-0 text-sm font-medium whitespace-nowrap transition-colors",
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

      <div aria-hidden className="h-[6.75rem] sm:h-[8.5rem] lg:h-[9.25rem]" />

      <div
        id={menuId}
        className={cn(
          "fixed inset-0 z-60 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          aria-label="মেনু বন্ধ করুন"
          onClick={() => setMenuPath(null)}
        />

        <aside
          className={cn(
            "absolute top-0 right-0 flex h-full w-[min(100vw-2.5rem,22rem)] max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-[#0e1514]",
            "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
            mobileOpen ? "translate-x-0" : "translate-x-full",
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
              aria-label="মেনু বন্ধ করুন"
              onClick={() => setMenuPath(null)}
            >
              <MaterialIcon name="close" className="text-[24px]" />
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-5">
            <form
              className="relative mb-4"
              role="search"
              onSubmit={(event) => event.preventDefault()}
            >
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-[20px] text-neutral-400"
              />
              <Input
                placeholder="প্রোডাক্ট খুঁজুন..."
                className="h-11 w-full rounded-md border border-neutral-200 bg-white py-2 pr-4 pl-10 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-neutral-950/15 dark:border-white/15"
                aria-label="প্রোডাক্ট খুঁজুন"
              />
            </form>

            {phoneChannel ? (
              <a
                href={phoneChannel.href}
                className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-700 sm:hidden dark:text-neutral-200"
              >
                <MaterialIcon name="call" className="text-[18px]" />
                {phoneChannel.value}
              </a>
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
                    onClick={() => setMenuPath(null)}
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

            <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
              <CartTrigger
                variant="button"
                onNavigate={() => setMenuPath(null)}
              />
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 text-sm font-medium dark:border-white/15"
              >
                <MaterialIcon name="person" className="mr-1.5 text-[18px]" />
                অ্যাকাউন্ট
              </button>
            </div>

            <div className="mt-2 pb-2">
              <ThemeToggle className="h-11 w-full justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-100 dark:border-white/15 dark:bg-transparent dark:text-white [&_.material-symbols-outlined]:text-[20px]" />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
