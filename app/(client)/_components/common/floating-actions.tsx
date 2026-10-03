"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "./brand-icons";
import { MaterialIcon } from "./material-icon";

const SCROLL_SHOW_AFTER = 360;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

/**
 * Global bottom-right floating actions:
 * - WhatsApp chat (always)
 * - Scroll to top (after scrolling)
 *
 * Lifts above sticky mobile bars on product & checkout pages.
 */
export function FloatingActions({ whatsappHref }: { whatsappHref: string }) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isCheckout = pathname === "/checkout";
  const isProductDetail = /^\/products\/[^/]+$/.test(pathname);
  const hasMobileBottomBar = isCheckout || isProductDetail;

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setShowScrollTop(window.scrollY > SCROLL_SHOW_AFTER);
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-3 z-[45] flex flex-col-reverse items-end gap-2.5 sm:right-5 sm:gap-3",
        isCheckout
          ? "bottom-[5.75rem] lg:bottom-6"
          : isProductDetail
            ? "bottom-[5.75rem] lg:bottom-6"
            : "bottom-5 sm:bottom-6",
      )}
      style={{
        paddingBottom: hasMobileBottomBar
          ? undefined
          : "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {whatsappHref ? (
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "pointer-events-auto group relative flex size-12 items-center justify-center rounded-full sm:size-14",
          "bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.35)]",
          "ring-1 ring-black/5 transition-[transform,box-shadow] duration-300 ease-out",
          "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,211,102,0.45)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2",
          "active:scale-95",
          "dark:ring-white/10 dark:focus-visible:ring-offset-background",
        )}
        aria-label="হোয়াটসঅ্যাপে চ্যাট করুন"
      >
        <span
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full bg-[#25D366]/40",
            !reducedMotion && "animate-ping opacity-20",
          )}
          aria-hidden
          style={{ animationDuration: "2.8s" }}
        />
        <WhatsAppIcon className="relative z-10 size-6 sm:size-7" />

        <span
          className={cn(
            "pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full",
            "bg-on-surface px-3 py-1.5 text-xs font-medium text-surface-container-lowest shadow-md",
            "opacity-0 translate-x-1 transition-all duration-200",
            "group-hover:opacity-100 group-hover:translate-x-0",
            "md:inline-block",
            "dark:bg-surface-container-highest dark:text-on-surface",
          )}
        >
          হোয়াটসঅ্যাপে চ্যাট
        </span>
      </a>
      ) : null}

      {/* Scroll to top — appears after user scrolls */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="উপরে স্ক্রল করুন"
        aria-hidden={!showScrollTop}
        tabIndex={showScrollTop ? 0 : -1}
        className={cn(
          "pointer-events-auto flex size-11 items-center justify-center rounded-full sm:size-12",
          "border border-outline-variant/40 bg-surface-container-lowest/95 text-on-surface shadow-md backdrop-blur-md",
          "ring-1 ring-black/5 transition-all duration-300 ease-out",
          "hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-lg",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "active:scale-95",
          "dark:border-white/15 dark:bg-surface-container/95 dark:ring-white/10",
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <MaterialIcon name="keyboard_arrow_up" className="text-[26px] sm:text-[28px]" />
      </button>
    </div>
  );
}
