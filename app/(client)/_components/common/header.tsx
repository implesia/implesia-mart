"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { headerNav } from "../../_data/common/site-nav";
import { Container } from "./container";
import { MaterialIcon } from "./material-icon";
import { ThemeToggle } from "./theme-toggle";

const LOGO_SRC = "/images/common/logo.png";
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

  useScrollLock(mobileOpen);

  const activeHref = useMemo(() => {
    if (!pathname) return "/";
    if (pathname.startsWith("/products")) return "/products";
    return pathname;
  }, [pathname]);

  const linkClass = (href: string) =>
    cn(
      "inline-flex items-center whitespace-nowrap text-sm font-medium tracking-tight transition-all duration-300 xl:text-[0.9375rem]",
      href === activeHref
        ? "border-b-2 border-primary pb-1 text-primary"
        : "text-neutral-600 hover:text-primary dark:text-neutral-400 dark:hover:text-primary",
    );

  return (
    <header>
      <nav className="fixed top-0 z-50 w-full border-b border-neutral-200/50 bg-white/80 shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-neutral-800/50 dark:bg-slate-900/80">
        <Container className="grid h-20 w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-4">
          <div className="flex min-w-0 items-center justify-self-start">
            <Link
              href="/"
              className="relative block h-9 w-38 shrink-0 transition-opacity hover:opacity-90 sm:h-10 sm:w-42 lg:w-44"
              aria-label={SITE_NAME}
            >
              <Image
                src={LOGO_SRC}
                alt=""
                fill
                priority
                className="object-contain object-left"
                sizes="(max-width: 768px) 140px, 176px"
              />
            </Link>
          </div>

          <div className="hidden min-w-0 justify-self-center md:flex">
            <div className="flex shrink-0 items-center gap-3 lg:gap-5 xl:gap-7">
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

          <div className="flex shrink-0 items-center justify-self-end gap-2 sm:gap-3 lg:gap-5">
            <div className="relative hidden min-w-0 shrink lg:block">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-[20px] text-outline"
              />
              <Input
                placeholder="Search curated collections..."
                className="h-10 w-52 rounded-full border-0 bg-surface-container-low py-2 pr-4 pl-10 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 xl:w-64 xl:text-base"
              />
            </div>

            <Button
              variant="ghost"
              size="icon-lg"
              className="hidden shrink-0 scale-95 text-primary hover:opacity-80 active:scale-90 md:inline-flex [&_.material-symbols-outlined]:text-[28px]"
              aria-label="Shopping cart"
            >
              <MaterialIcon name="shopping_cart" />
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              className="hidden shrink-0 scale-95 text-primary hover:opacity-80 active:scale-90 md:inline-flex [&_.material-symbols-outlined]:text-[28px]"
              aria-label="Account"
            >
              <MaterialIcon name="account_circle" />
            </Button>
            <ThemeToggle className="hidden shrink-0 scale-95 text-primary hover:opacity-80 active:scale-90 md:inline-flex [&_.material-symbols-outlined]:text-[26px]" />

            <Button
              variant="ghost"
              size="icon-lg"
              className="shrink-0 scale-95 text-primary hover:opacity-80 active:scale-90 md:hidden [&_.material-symbols-outlined]:text-[28px]"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <MaterialIcon name="menu" />
            </Button>
          </div>
        </Container>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-60 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute right-0 top-0 h-full w-[min(92vw,420px)] bg-white shadow-2xl transition-transform dark:bg-slate-950",
            mobileOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-neutral-200/60 px-5 py-4 dark:border-neutral-800/60">
            <span className="font-label-md tracking-widest text-outline uppercase">
              Menu
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="[&_.material-symbols-outlined]:text-[26px]"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <MaterialIcon name="close" />
            </Button>
          </div>

          <div className="px-5 py-4">
            <div className="relative mb-4">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-[20px] text-outline"
              />
              <Input
                placeholder="Search curated collections..."
                className="h-11 rounded-full border-0 bg-surface-container-low py-2 pr-4 pl-10 font-label-md shadow-none focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-1">
              {headerNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-xl px-3 py-2 font-medium tracking-tight",
                    item.href === activeHref
                      ? "bg-surface-container-low text-primary"
                      : "text-on-surface",
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="w-full rounded-full">
                <MaterialIcon
                  name="shopping_cart"
                  className="mr-2 text-[20px]"
                />
                Cart
              </Button>
              <Button variant="outline" className="w-full rounded-full">
                <MaterialIcon
                  name="account_circle"
                  className="mr-2 text-[20px]"
                />
                Account
              </Button>
            </div>

            <div className="mt-3">
              <ThemeToggle className="w-full justify-center rounded-full border border-input bg-background text-foreground hover:bg-muted [&_.material-symbols-outlined]:text-[22px]" />
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
}
