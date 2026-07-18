"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { headerNav } from "../../_data/common/site-nav";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuId = useId();

  useScrollLock(mobileOpen);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const activeHref = useMemo(() => {
    if (!pathname) return "/";
    if (pathname.startsWith("/products")) return "/products";
    return pathname;
  }, [pathname]);

  const linkClass = (href: string) =>
    cn(
      "inline-flex items-center whitespace-nowrap text-[13px] font-medium tracking-tight transition-colors duration-200 xl:text-sm",
      href === activeHref
        ? "border-b-2 border-primary pb-0.5 text-primary"
        : "text-neutral-600 hover:text-primary dark:text-neutral-400 dark:hover:text-primary",
    );

  return (
    <header>
      <nav
        className="fixed top-0 z-50 w-full border-b border-neutral-200/60 bg-white/85 shadow-sm backdrop-blur-xl dark:border-neutral-800/60 dark:bg-slate-900/85"
        aria-label="প্রধান নেভিগেশন"
      >
        <Container className="flex h-16 w-full min-w-0 items-center justify-between gap-2 px-4 sm:h-20 sm:gap-3 sm:px-6 lg:gap-4 lg:px-8">
          {/* Logo — light navy mark / white mark in dark mode */}
          <div className="flex min-w-0 shrink-0 items-center">
            <SiteLogo priority onClick={() => setMobileOpen(false)} />
          </div>

          {/* Desktop nav — lg+ only (avoids crush on tablets) */}
          <div className="hidden min-w-0 flex-1 items-center justify-center px-2 lg:flex">
            <div className="flex max-w-full items-center justify-center gap-4 overflow-x-auto xl:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {headerNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClass(item.href)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5 lg:gap-2">
            <div className="relative hidden min-w-0 xl:block">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-[20px] text-outline"
              />
              <Input
                placeholder="সার্চ করুন..."
                className="h-10 w-44 rounded-full border-0 bg-surface-container-low py-2 pr-4 pl-10 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 2xl:w-56"
                aria-label="প্রোডাক্ট সার্চ"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="hidden size-10 text-primary hover:bg-primary/5 hover:text-primary lg:inline-flex xl:hidden"
              aria-label="সার্চ"
            >
              <MaterialIcon name="search" className="text-[22px]" />
            </Button>

            <CartTrigger />

            <Button
              variant="ghost"
              size="icon"
              className="hidden size-11 text-primary hover:bg-primary/5 hover:text-primary lg:inline-flex"
              aria-label="অ্যাকাউন্ট"
            >
              <MaterialIcon name="account_circle" className="text-[24px]" />
            </Button>

            <ThemeToggle className="hidden size-11 text-primary hover:bg-primary/5 hover:text-primary lg:inline-flex [&_.material-symbols-outlined]:text-[22px]" />

            <Button
              variant="ghost"
              size="icon"
              className="size-10 text-primary hover:bg-primary/5 hover:text-primary lg:hidden"
              aria-label={mobileOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
              aria-expanded={mobileOpen}
              aria-controls={menuId}
              onClick={() => setMobileOpen((open) => !open)}
            >
              <MaterialIcon
                name={mobileOpen ? "close" : "menu"}
                className="text-[24px]"
              />
            </Button>
          </div>
        </Container>
      </nav>

      {/* Mobile / tablet drawer */}
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
          onClick={() => setMobileOpen(false)}
        />

        <aside
          className={cn(
            "absolute top-0 right-0 flex h-full w-[min(100vw-2.5rem,22rem)] max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-950",
            "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
            mobileOpen ? "translate-x-0" : "translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="মোবাইল মেনু"
        >
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200/60 px-4 py-3.5 sm:px-5 dark:border-neutral-800/60">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-outline uppercase">
                মেনু
              </p>
              <p className="truncate text-sm font-semibold text-on-surface">
                {SITE_NAME}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 shrink-0"
              aria-label="মেনু বন্ধ করুন"
              onClick={() => setMobileOpen(false)}
            >
              <MaterialIcon name="close" className="text-[24px]" />
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-5">
            <div className="relative mb-4">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-[20px] text-outline"
              />
              <Input
                placeholder="প্রোডাক্ট সার্চ করুন..."
                className="h-11 w-full rounded-full border-0 bg-surface-container-low py-2 pr-4 pl-10 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-primary/20"
                aria-label="প্রোডাক্ট সার্চ"
              />
            </div>

            <nav className="space-y-1" aria-label="মোবাইল লিঙ্ক">
              {headerNav.map((item) => {
                const active = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-3 text-[0.95rem] font-medium tracking-tight transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-on-surface hover:bg-surface-container-low",
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span>{item.label}</span>
                    {active ? (
                      <MaterialIcon name="check" className="text-[18px]" />
                    ) : (
                      <MaterialIcon
                        name="chevron_right"
                        className="text-[20px] text-outline"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
              <CartTrigger
                variant="button"
                onNavigate={() => setMobileOpen(false)}
              />
              <Button variant="outline" className="h-11 rounded-full text-sm">
                <MaterialIcon name="account_circle" className="mr-1.5 text-[18px]" />
                অ্যাকাউন্ট
              </Button>
            </div>

            <div className="mt-2 pb-2">
              <ThemeToggle className="h-11 w-full justify-center rounded-full border border-input bg-background text-foreground hover:bg-muted [&_.material-symbols-outlined]:text-[20px]" />
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
}
