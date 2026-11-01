"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import { adminButtonClass } from "./admin-ui";

/**
 * One confirm modal for every delete in the admin.
 *
 *   const confirmDelete = useConfirmDelete();
 *   confirmDelete({
 *     title: "Delete this product?",
 *     description: "This cannot be undone.",
 *     onConfirm: () => deleteMartProduct(id),
 *     successMessage: "Product deleted",
 *     errorMessage: "The product could not be deleted.",
 *   });
 *
 * Nothing is deleted until the modal's Delete button is pressed. Cancel,
 * Escape, and a click on the backdrop close it without calling onConfirm.
 * The provider shows a success or failure toast once the delete settles.
 * The returned promise resolves true only when the delete succeeded.
 */
export type ConfirmDeleteOptions = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<unknown> | unknown;
  /** Checked when Delete is pressed. Return a message to keep the modal open and show it. */
  validate?: () => string | null;
  successMessage?: string;
  errorMessage?: string;
};

type ConfirmDelete = (options: ConfirmDeleteOptions) => Promise<boolean>;

type Pending = ConfirmDeleteOptions & { resolve: (deleted: boolean) => void };
type Toast = { message: string; tone: "ok" | "error"; key: number };

const ConfirmDeleteContext = createContext<ConfirmDelete | null>(null);
const ConfirmDeleteOpenContext = createContext(false);

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useConfirmDelete(): ConfirmDelete {
  const confirm = useContext(ConfirmDeleteContext);
  if (!confirm) {
    throw new Error("useConfirmDelete must be used inside <ConfirmDeleteProvider>.");
  }
  return confirm;
}

/**
 * True while the confirm modal is open. A modal Base UI sheet that opens the
 * confirm (the inquiry drawer) uses it to stop trapping focus and to ignore
 * outside clicks, so the confirm on top of it stays usable.
 */
export function useConfirmDeleteOpen(): boolean {
  return useContext(ConfirmDeleteOpenContext);
}

export function ConfirmDeleteProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingRef = useRef<Pending | null>(null);

  const notify = useCallback((message: string, tone: Toast["tone"]) => {
    setToast({ message, tone, key: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), tone === "ok" ? 3000 : 5000);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const confirmDelete = useCallback<ConfirmDelete>(
    (options) =>
      new Promise<boolean>((resolve) => {
        // A second request while one is open cancels the first.
        pendingRef.current?.resolve(false);
        const next = { ...options, resolve };
        pendingRef.current = next;
        setBusy(false);
        setInvalid(null);
        setPending(next);
      }),
    [],
  );

  const close = useCallback((deleted: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    setBusy(false);
    setInvalid(null);
    current?.resolve(deleted);
  }, []);

  const cancel = useCallback(() => {
    if (busy) return;
    close(false);
  }, [busy, close]);

  async function run() {
    const current = pendingRef.current;
    if (!current || busy) return;
    const problem = current.validate?.() ?? null;
    setInvalid(problem);
    if (problem) return;
    setBusy(true);
    try {
      await current.onConfirm();
      close(true);
      notify(current.successMessage ?? "Deleted", "ok");
    } catch (error) {
      close(false);
      notify(
        error instanceof MartApiError && error.message
          ? error.message
          : (current.errorMessage ?? "Could not delete. Please try again."),
        "error",
      );
    }
  }

  return (
    <ConfirmDeleteContext.Provider value={confirmDelete}>
      <ConfirmDeleteOpenContext.Provider value={pending !== null}>
      {children}
      {pending ? (
        <ConfirmDeleteDialog
          title={pending.title}
          description={pending.description}
          confirmLabel={pending.confirmLabel ?? "Delete"}
          busy={busy}
          error={invalid}
          onCancel={cancel}
          onConfirm={() => void run()}
        />
      ) : null}
      {typeof document !== "undefined"
        ? createPortal(
            <div
              role="status"
              aria-live="polite"
              className="force-light pointer-events-none fixed inset-x-0 bottom-5 z-[80] flex justify-center px-4"
            >
              {toast ? (
                <p
                  key={toast.key}
                  className={cn(
                    "flex max-w-xl items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-xl",
                    toast.tone === "ok" ? "bg-neutral-900" : "bg-red-700",
                  )}
                >
                  <MaterialIcon
                    name={toast.tone === "ok" ? "check_circle" : "error"}
                    className="shrink-0 text-[18px]"
                  />
                  {toast.message}
                </p>
              ) : null}
            </div>,
            document.body,
          )
        : null}
      </ConfirmDeleteOpenContext.Provider>
    </ConfirmDeleteContext.Provider>
  );
}

function ConfirmDeleteDialog({
  title,
  description,
  confirmLabel,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Start on Cancel so a stray Enter never deletes anything.
    cancelRef.current?.focus();
    return () => previousFocus?.focus();
  }, []);

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
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
      className="fixed inset-0 z-[70] flex items-end justify-center bg-neutral-950/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby={description ? "confirm-delete-description" : undefined}
        aria-busy={busy}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="force-light w-full max-w-md rounded-2xl bg-white p-5 shadow-xl outline-none ring-1 ring-neutral-200/80 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-100">
            <MaterialIcon name="delete" className="text-[20px]" />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-delete-title" className="text-base font-semibold text-neutral-950">
              {title}
            </h2>
            {description ? (
              <div
                id="confirm-delete-description"
                className="mt-1 text-sm leading-relaxed text-neutral-600"
              >
                {description}
              </div>
            ) : null}
          </div>
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            className={adminButtonClass.secondary}
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:bg-red-300"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <span
                aria-hidden="true"
                className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            ) : null}
            {busy ? `${confirmLabel === "Delete" ? "Deleting" : confirmLabel}…` : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
