"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { headerNav, productCategories } from "../../_data/common/site-nav";
import { Container } from "./container";
import { MaterialIcon } from "./material-icon";

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
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const productsCloseTimerRef = useRef<number | null>(null);

  useScrollLock(mobileOpen);

  const scheduleCloseProducts = () => {
    if (productsCloseTimerRef.current) {
      window.clearTimeout(productsCloseTimerRef.current);
    }
    productsCloseTimerRef.current = window.setTimeout(() => {
      setProductsOpen(false);
    }, 160);
  };

  const cancelCloseProducts = () => {
    if (productsCloseTimerRef.current) {
      window.clearTimeout(productsCloseTimerRef.current);
      productsCloseTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (productsCloseTimerRef.current) {
        window.clearTimeout(productsCloseTimerRef.current);
      }
    };
  }, []);

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
              {headerNav.map((item) => {
                if (item.type === "products") {
                  return (
                    <div
                      key={item.href}
                      className="relative"
                      onMouseEnter={() => {
                        cancelCloseProducts();
                        setProductsOpen(true);
                      }}
                      onMouseLeave={() => {
                        scheduleCloseProducts();
                      }}
                    >
                      <Link
                        href={item.href}
                        className={cn(linkClass(item.href), "gap-0.5")}
                        aria-haspopup="menu"
                        aria-expanded={productsOpen}
                        onFocus={() => {
                          cancelCloseProducts();
                          setProductsOpen(true);
                        }}
                        onBlur={() => {
                          scheduleCloseProducts();
                        }}
                        onClick={() => {
                          cancelCloseProducts();
                          setProductsOpen(false);
                        }}
                      >
                        {item.label}
                        <MaterialIcon
                          name="expand_more"
                          className={cn(
                            "shrink-0 text-[18px] transition-transform",
                            productsOpen && "rotate-180",
                          )}
                        />
                      </Link>

                      <div
                        className={cn(
                          "absolute left-1/2 top-full z-50 mt-3 w-[min(920px,calc(100vw-2rem))] max-w-[920px] -translate-x-1/2 rounded-2xl border border-neutral-200/60 bg-white/95 p-3 shadow-xl backdrop-blur-xl transition sm:p-4",
                          "dark:border-neutral-800/60 dark:bg-slate-950/90",
                          productsOpen
                            ? "pointer-events-auto translate-y-0 opacity-100"
                            : "pointer-events-none -translate-y-1 opacity-0",
                        )}
                        role="menu"
                        onMouseEnter={() => {
                          cancelCloseProducts();
                          setProductsOpen(true);
                        }}
                        onMouseLeave={() => {
                          scheduleCloseProducts();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setProductsOpen(false);
                        }}
                      >
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          <Link
                            href="/products"
                            className="rounded-xl p-3 transition-colors hover:bg-surface-container-low dark:hover:bg-white/5"
                            role="menuitem"
                            onClick={() => setProductsOpen(false)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-label-md text-on-surface dark:text-white">
                                All Products
                              </span>
                              <MaterialIcon
                                name="arrow_forward"
                                className="text-[18px] text-outline"
                              />
                            </div>
                            <p className="mt-1 text-sm text-on-surface-variant dark:text-neutral-400">
                              Explore everything in the catalogue.
                            </p>
                          </Link>

                          {productCategories.map((cat) => (
                            <Link
                              key={cat.href}
                              href={cat.href}
                              className="rounded-xl p-3 transition-colors hover:bg-surface-container-low dark:hover:bg-white/5"
                              role="menuitem"
                              onClick={() => setProductsOpen(false)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-label-md text-on-surface dark:text-white">
                                  {cat.title}
                                </span>
                                <MaterialIcon
                                  name="arrow_forward"
                                  className="text-[18px] text-outline"
                                />
                              </div>
                              <p className="mt-1 text-sm text-on-surface-variant dark:text-neutral-400">
                                {cat.description}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={linkClass(item.href)}
                  >
                    {item.label}
                  </Link>
                );
              })}
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
              {headerNav
                .filter((x) => x.type !== "products")
                .map((item) => (
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

              <Accordion defaultValue={[]} className="w-full">
                <AccordionItem value="products" className="border-0">
                  <AccordionTrigger className="rounded-xl px-3 py-2 font-medium tracking-tight text-on-surface hover:no-underline [&_svg]:text-primary">
                    Products
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="mt-1 space-y-1">
                      <Link
                        href="/products"
                        className="block rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low"
                        onClick={() => setMobileOpen(false)}
                      >
                        All Products
                      </Link>
                      {productCategories.map((cat) => (
                        <Link
                          key={cat.href}
                          href={cat.href}
                          className="block rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low"
                          onClick={() => setMobileOpen(false)}
                        >
                          {cat.title}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
          </div>
        </aside>
      </div>
    </header>
  );
}
