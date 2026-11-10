"use client";

import { useEffect, useRef, useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

function subscribeToClient() {
  return () => {};
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function InventoryDialog({
  title,
  titleId,
  description,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  titleId: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Server and the hydration render stay closed. The portal appears on the next client render.
  const mounted = useSyncExternalStore(subscribeToClient, () => true, () => false);

  useEffect(() => {
    if (!mounted) return;
    const previous =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = dialogRef.current;
    const preferred =
      root?.querySelector<HTMLElement>("[autofocus]") ??
      root?.querySelector<HTMLElement>("input, textarea, select, button");
    preferred?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [mounted]);

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
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

  const dialog = (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-neutral-950/40 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? `${titleId}-description` : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          "force-light flex max-h-[min(92dvh,52rem)] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl outline-none ring-1 ring-neutral-200/80 sm:rounded-2xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-[36rem]",
        )}
      >
        <div className="border-b border-neutral-100 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-neutral-950">
            {title}
          </h2>
          {description ? (
            <p id={`${titleId}-description`} className="mt-1 text-sm text-neutral-600">
              {description}
            </p>
          ) : null}
        </div>
        <div className="min-h-0 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );

  // Portaled so a dialog opened from inside the product form is not a nested form.
  if (!mounted) return null;
  return createPortal(dialog, document.body);
}
