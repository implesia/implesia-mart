"use client";

import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "sm:max-w-md",
  // Do not use max-w-xl. This project’s spacing token makes that utility 80px wide.
  md: "sm:max-w-[36rem]",
  lg: "sm:max-w-3xl",
} as const;

export type AdminFormModalSize = keyof typeof SIZE_CLASS;

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

let scrollLocks = 0;
let previousBodyOverflow = "";

function lockPageScroll() {
  if (scrollLocks === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLocks += 1;
  return () => {
    scrollLocks = Math.max(0, scrollLocks - 1);
    if (scrollLocks === 0) document.body.style.overflow = previousBodyOverflow;
  };
}

export function AdminFormModal({
  titleId,
  size = "md",
  children,
}: {
  titleId: string;
  size?: AdminFormModalSize;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unlockScroll = lockPageScroll();
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const root = dialogRef.current;
    const preferred =
      root?.querySelector<HTMLElement>("[autofocus]") ??
      root?.querySelector<HTMLElement>("input, textarea, select");
    preferred?.focus();

    function blockEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
    }

    window.addEventListener("keydown", blockEscape, true);
    return () => {
      unlockScroll();
      window.removeEventListener("keydown", blockEscape, true);
      previousFocus?.focus();
    };
  }, []);

  function trapTab(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.key !== "Tab") return;
    const root = dialogRef.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-center bg-neutral-950/40 sm:items-center sm:p-4"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trapTab}
        className={cn(
          "force-light flex h-dvh w-full min-h-0 flex-col overflow-hidden bg-white shadow-xl outline-none sm:h-auto sm:max-h-[min(92dvh,52rem)] sm:rounded-2xl sm:ring-1 sm:ring-neutral-200/80",
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150",
          SIZE_CLASS[size],
        )}
      >
        {children}
      </div>
    </div>
  );
}
