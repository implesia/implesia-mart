"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

const EVENT = "contact-toast";

export function showContactToast(message: string, tone: "ok" | "error" = "ok") {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, tone } }));
}

/** One polite live region for the whole page; fixed position, so no layout shift. */
export function ContactToaster() {
  const [toast, setToast] = useState<{ message: string; tone: "ok" | "error"; key: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function onToast(e: Event) {
      const { message, tone } = (e as CustomEvent<{ message: string; tone: "ok" | "error" }>).detail;
      setToast({ message, tone, key: Date.now() });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), 2600);
    }
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
    >
      {toast ? (
        <p
          key={toast.key}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-xl",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2",
            toast.tone === "ok" ? "bg-neutral-900" : "bg-red-700",
          )}
        >
          <MaterialIcon name={toast.tone === "ok" ? "check_circle" : "error"} className="text-[18px]" />
          {toast.message}
        </p>
      ) : null}
    </div>
  );
}
