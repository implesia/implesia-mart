"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Bell, Volume2, CheckCheck } from "lucide-react";

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
  if (permission === "denied") return "This browser is blocking notifications. Allow them in site settings.";
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
        "rounded-full bg-rose-500 text-[10px] font-bold text-white tabular-nums ring-2 ring-white",
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
      {/* Bell Trigger */}
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
      >
        <Bell className="h-5 w-5" />
        {countLabel ? (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white tabular-nums"
          >
            {countLabel}
          </span>
        ) : null}
      </button>

      {/* Dropdown Panel */}
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          onKeyDown={onPanelKeyDown}
          className={cn(
            "force-light z-50 flex max-h-[min(75dvh,34rem)] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-200/60 outline-none",
            "max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:w-auto",
            "sm:absolute sm:top-[calc(100%+8px)] sm:right-0",
            "animate-in fade-in zoom-in-95 duration-150",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-3">
            <h2 id={titleId} className="flex items-center gap-2 text-sm font-bold text-slate-900">
              New Orders
              {unread > 0 && (
                <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                  {unread} new
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unread === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          </div>

          {/* List */}
          <ul className="min-h-0 flex-1 overflow-y-auto p-1.5 scrollbar-thin">
            {recent.length === 0 ? (
              <li className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-100">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs font-medium text-slate-500">No new orders yet.</p>
              </li>
            ) : (
              recent.map((order) => {
                const unreadOrder = unreadIds.includes(order.id);
                return (
                  <li key={order.id}>
                    <Link
                      href={orderAlertHref(order.id)}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "group relative flex flex-col gap-1 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50",
                        unreadOrder && "bg-indigo-50/30",
                      )}
                    >
                      {/* Unread Dot */}
                      {unreadOrder && (
                        <span className="absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-indigo-500" />
                      )}
                      
                      <div className="flex items-baseline justify-between gap-3 pl-2">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                          #{order.number}
                        </span>
                        <span className="shrink-0 text-[10px] font-medium text-slate-400">
                          {relativeTimeDhaka(order.createdAt, now)}
                        </span>
                      </div>
                      <span className="mt-0.5 block truncate pl-2 text-xs font-medium text-slate-600">
                        {order.customerName}
                      </span>
                      <div className="mt-0.5 flex items-center justify-between gap-3 pl-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatAlertTaka(order.total)}
                        </span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          {paymentLabel(order.paymentMethod)}
                        </span>
                      </div>
                      {unreadOrder ? <span className="sr-only">Unread.</span> : null}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>

          {/* Settings Footer */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-3">
            <div className="space-y-3">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between gap-3">
                <span id={`${panelId}-sound`} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Volume2 className="h-3.5 w-3.5 text-slate-400" />
                  Sound
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.soundEnabled}
                  aria-labelledby={`${panelId}-sound`}
                  onClick={() => setSoundEnabled(!settings.soundEnabled)}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                    settings.soundEnabled ? "bg-indigo-600" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                      settings.soundEnabled ? "left-4.5" : "left-0.5",
                    )}
                  />
                </button>
              </div>

              {/* Volume */}
              <label className="block text-xs">
                <span className="mb-1.5 flex items-center justify-between text-slate-600">
                  <span className="font-medium">Volume</span>
                  <span className="tabular-nums font-semibold text-slate-900">{Math.round(settings.volume * 100)}%</span>
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
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600 disabled:opacity-40"
                />
              </label>

              {/* Browser Notifications */}
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <p className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                  <span>Browser Notifications</span>
                  <span className={cn(
                    "font-semibold",
                    permission === "granted" ? "text-emerald-600" : permission === "denied" ? "text-rose-600" : "text-slate-500",
                  )}>
                    {permissionLabel(permission)}
                  </span>
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                  {permissionHint(permission)}
                </p>
                {permission === "default" && (
                  <button
                    type="button"
                    onClick={requestPermission}
                    className="mt-2 inline-flex h-7 w-full items-center justify-center rounded-md bg-slate-900 px-2 text-[10px] font-semibold text-white transition hover:bg-slate-800"
                  >
                    Allow Notifications
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}