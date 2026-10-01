"use client";

import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import { adminButtonClass } from "./admin-ui";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function UnsavedChangesDialog({
  onStay,
  onDiscard,
}: {
  onStay: () => void;
  onDiscard: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => previousFocus?.focus();
  }, []);

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onStay();
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/40 p-4 sm:items-center"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        aria-describedby="unsaved-changes-description"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="force-light w-full max-w-md rounded-2xl bg-white p-5 shadow-xl outline-none ring-1 ring-neutral-200/80"
      >
        <h2
          id="unsaved-changes-title"
          className="text-base font-semibold text-neutral-950"
        >
          Unsaved changes
        </h2>
        <p
          id="unsaved-changes-description"
          className="mt-1 text-sm leading-relaxed text-neutral-600"
        >
          You have unsaved changes. Are you sure you want to leave? Your changes
          will be lost if you leave this form.
        </p>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={adminButtonClass.secondary}
            onClick={onStay}
          >
            Stay & Continue Editing
          </button>
          <button
            type="button"
            className={adminButtonClass.primary}
            onClick={onDiscard}
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
