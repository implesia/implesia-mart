"use client";

import { useEffect, useEffectEvent, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { Input } from "@/components/ui/input";
import { MartApiError, changeMartPassword } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import {
  adminButtonClass,
  adminFieldClass,
  FieldError,
  FieldLabel,
} from "./admin-ui";

type FieldErrors = {
  current?: string;
  next?: string;
  confirm?: string;
  form?: string;
};

function passwordProblems(
  current: string,
  next: string,
  confirm: string,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!current) errors.current = "Enter your current password.";
  else if (new TextEncoder().encode(current).length > 72) {
    errors.current = "Current password is too long.";
  }

  const nextBytes = new TextEncoder().encode(next).length;
  if (next.trim().length < 12) errors.next = "Use at least 12 characters.";
  else if (next.length > 72 || nextBytes > 72)
    errors.next = "Use at most 72 characters.";
  else if (next === current)
    errors.next = "Choose a different password than the current one.";

  if (!confirm) errors.confirm = "Repeat the new password.";
  else if (confirm !== next) errors.confirm = "Those passwords do not match.";
  return errors;
}

function PasswordField({
  id,
  label,
  placeholder,
  autoComplete,
  value,
  error,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={cn(adminFieldClass, "pr-12", error && "border-red-400")}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="button"
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          aria-pressed={visible}
          aria-controls={id}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-500 hover:bg-white hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
        >
          <MaterialIcon
            name={visible ? "visibility_off" : "visibility"}
            className="text-[20px]"
          />
        </button>
      </div>
      <div id={errorId}>
        <FieldError message={error} />
      </div>
    </div>
  );
}

export function ChangePasswordDialog({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const closeOnEscape = useEffectEvent((event: KeyboardEvent) => {
    if (pending) return;
    event.preventDefault();
    onClose();
  });

  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    panelRef.current?.querySelector<HTMLElement>("input")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      closeOnEscape(event);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = passwordProblems(current, next, confirm);
    setErrors(nextErrors);
    if (nextErrors.current || nextErrors.next || nextErrors.confirm || pending)
      return;
    setPending(true);
    try {
      await changeMartPassword(current, next);
      onChanged();
    } catch (error) {
      setPending(false);
      setErrors({
        form:
          error instanceof MartApiError
            ? error.message
            : "The password could not be changed.",
      });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="force-light w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl ring-1 ring-neutral-200/80 sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-neutral-950">
              Change password
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              After it saves, sign in again with the new password. Other devices
              are signed out.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
          >
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>

        {errors.form ? (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-2xl bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700 ring-1 ring-red-100"
          >
            <MaterialIcon name="error" className="mt-0.5 text-[18px]" />
            <span>{errors.form}</span>
          </p>
        ) : null}

        <form onSubmit={submit} className="mt-5 flex flex-col gap-4" noValidate>
          <PasswordField
            id="admin-current-password"
            label="Current password"
            placeholder="Enter your current password"
            autoComplete="current-password"
            value={current}
            error={errors.current}
            disabled={pending}
            onChange={(value) => {
              setCurrent(value);
              setErrors((existing) => ({
                ...existing,
                current: undefined,
                form: undefined,
              }));
            }}
          />
          <PasswordField
            id="admin-new-password"
            label="New password"
            placeholder="At least 12 characters"
            autoComplete="new-password"
            value={next}
            error={errors.next}
            disabled={pending}
            onChange={(value) => {
              setNext(value);
              setErrors((existing) => ({
                ...existing,
                next: undefined,
                form: undefined,
              }));
            }}
          />
          <PasswordField
            id="admin-confirm-password"
            label="Confirm new password"
            placeholder="Repeat the new password"
            autoComplete="new-password"
            value={confirm}
            error={errors.confirm}
            disabled={pending}
            onChange={(value) => {
              setConfirm(value);
              setErrors((existing) => ({
                ...existing,
                confirm: undefined,
                form: undefined,
              }));
            }}
          />
          <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className={adminButtonClass.secondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className={adminButtonClass.primary}
            >
              {pending ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
