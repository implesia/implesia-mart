"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { adminButtonClass } from "@/app/admin/_components/admin-ui";
import {
  badgeLabel,
  clampVolume,
  formatAlertTaka,
  orderAlertHref,
  paymentLabel,
  permissionLabel,
  relativeTimeDhaka,
  type NotificationPermissionState,
} from "@/lib/admin/order-alerts";
import { cn } from "@/lib/utils";

import { useOrderAlerts } from "./order-alerts-provider";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function permissionHint(permission: NotificationPermissionState) {
  if (permission === "granted") return "This browser will show a notification for each new order.";
  if (permission === "denied") return "This browser is blocking notifications. Allow them in the site settings.";
  if (permission === "unsupported") return "This browser does not support notifications.";
  return "Notifications stay off until you allow them.";
}

export function OrderAlertBadge({ collapsed }: { collapsed: boolean }) {
  const { unread } = useOrderAlerts();
  if (unread <= 0) return null;
  const label = badgeLabel(unread);
  return (
    <span
      aria-label={`${unread} unread orders`}
      className={cn(
        "rounded-full bg-warning text-[11px] font-bold text-white tabular-nums",
        collapsed ? "absolute top-1 right-1 min-w-4 px-1 leading-4" : "ml-auto min-w-5 px-1.5 text-center leading-5",
      )}
    >
      {label}
    </span>
  );
}

export function OrderAlertBell() {
  const {
    unread,
    unreadIds,
    recent,
    settings,
    permission,
    markAllRead,
    setSoundEnabled,
    setVolume,
    requestPermission,
  } = useOrderAlerts();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const titleId = useId();
  const label = unread > 0 ? `New orders, ${unread} unread` : "New orders";

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => previous?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function onPanelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (event.key !== "Tab") return;
    const root = panelRef.current;
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

  const countLabel = badgeLabel(unread);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex size-10 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <MaterialIcon name="notifications" className="text-[22px]" />
        {countLabel ? (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 min-w-4 rounded-full bg-warning px-1 text-[10px] leading-4 font-bold text-white tabular-nums"
          >
            {countLabel}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          onKeyDown={onPanelKeyDown}
          className={cn(
            "force-light z-40 flex max-h-[min(70dvh,32rem)] w-[min(22rem,calc(100vw-1.5rem))] flex-col rounded-2xl border border-neutral-200 bg-white text-neutral-950 shadow-xl outline-none",
            "max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:w-auto",
            "sm:absolute sm:top-full sm:right-0 sm:mt-2",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-150",
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2.5">
            <h2 id={titleId} className="text-sm font-semibold text-neutral-950">
              New orders
            </h2>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unread === 0}
              className="rounded-full px-2 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:text-neutral-500"
            >
              সব পড়া হয়েছে
            </button>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {recent.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-neutral-600">No new orders yet.</li>
            ) : (
              recent.map((order) => {
                const unreadOrder = unreadIds.includes(order.id);
                return (
                  <li key={order.id}>
                    <Link
                      href={orderAlertHref(order.id)}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-2.5 py-2 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-neutral-950">{order.number}</span>
                        <span className="shrink-0 text-xs text-neutral-600">
                          {relativeTimeDhaka(order.createdAt, now)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-neutral-700">
                        {order.customerName}
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-neutral-950">{formatAlertTaka(order.total)}</span>
                        <span className="text-neutral-600">{paymentLabel(order.paymentMethod)}</span>
                      </span>
                      {unreadOrder ? <span className="sr-only">Unread.</span> : null}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
          <div className="flex flex-col gap-3 border-t border-neutral-200 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <span id={`${panelId}-sound`} className="text-sm font-medium text-neutral-950">
                Sound
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundEnabled}
                aria-labelledby={`${panelId}-sound`}
                onClick={() => setSoundEnabled(!settings.soundEnabled)}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  settings.soundEnabled ? "bg-primary-ink" : "bg-neutral-500",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-5 rounded-full bg-white motion-reduce:transition-none",
                    settings.soundEnabled ? "left-5" : "left-0.5",
                  )}
                />
              </button>
            </div>
            <label className="flex flex-col gap-1.5 text-sm text-neutral-800">
              <span className="flex items-center justify-between gap-3">
                <span>Volume</span>
                <span className="tabular-nums text-neutral-600">{Math.round(settings.volume * 100)}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(settings.volume * 100)}
                disabled={!settings.soundEnabled}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(settings.volume * 100)}
                aria-label="Notification volume"
                onChange={(event) => setVolume(clampVolume(Number(event.target.value) / 100))}
                className="h-2 w-full accent-primary-ink disabled:opacity-50"
              />
            </label>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-neutral-800">
                Browser notifications: <span className="font-semibold">{permissionLabel(permission)}</span>
              </p>
              <p className="text-xs leading-relaxed text-neutral-600">{permissionHint(permission)}</p>
              <button
                type="button"
                onClick={requestPermission}
                disabled={permission !== "default"}
                className={cn(adminButtonClass.secondary, "h-9 disabled:text-neutral-500")}
              >
                {permission === "default" ? "Allow notifications" : "Notification permission"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
