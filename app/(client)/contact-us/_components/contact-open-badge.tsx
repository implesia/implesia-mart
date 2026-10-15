"use client";

import { useEffect, useMemo, useState } from "react";

import { openStatus, parseSchedule, type OpenStatus } from "@/lib/contact/contact-rules";
import { cn } from "@/lib/utils";

type Row = { label: string; value: string };

/** Re-evaluates every minute. Renders nothing until mounted (space reserved by the caller). */
export function useOpenStatus(rows: Row[]) {
  const key = JSON.stringify(rows);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rules = useMemo(() => parseSchedule(rows), [key]);
  const [status, setStatus] = useState<OpenStatus | null>(null);

  useEffect(() => {
    if (!rules) return;
    const tick = () => setStatus(openStatus(rules, new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [rules]);

  return { hasSchedule: rules !== null, status };
}

export function OpenBadge({ rows, onDark = false, className }: { rows: Row[]; onDark?: boolean; className?: string }) {
  const { hasSchedule, status } = useOpenStatus(rows);
  if (!hasSchedule) return null;
  const today = status?.todayIndex != null ? rows[status.todayIndex] : undefined;

  return (
    <p
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ring-1",
        onDark ? "bg-white/10 text-white ring-white/20" : "bg-white text-neutral-800 ring-neutral-200",
        !status && "invisible",
        className,
      )}
    >
      <span className="relative flex size-2.5" aria-hidden>
        {status?.open ? (
          <span className="absolute inline-flex size-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
        ) : null}
        <span className={cn("relative inline-flex size-2.5 rounded-full", status?.open ? "bg-emerald-500" : "bg-neutral-400")} />
      </span>
      <span>{status?.open ? "এখন খোলা" : "এখন বন্ধ"}</span>
      {today ? (
        <span className={cn("font-normal", onDark ? "text-white/75" : "text-neutral-600")}>
          · আজ {today.value}
        </span>
      ) : null}
      <span className="sr-only"> (বাংলাদেশ সময়)</span>
    </p>
  );
}
