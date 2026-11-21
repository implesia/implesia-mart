"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export function getCustomerInitials(name?: string | null): string {
  if (!name?.trim()) return "গ্রা";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "গ্রা";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZE_CLASSES = {
  xs: "size-7 text-[11px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
} as const;

export function CustomerAvatar({
  name,
  avatarUrl,
  size = "sm",
  shape = "circle",
  className,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  shape?: "circle" | "rounded";
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = avatarUrl?.trim() || null;
  const showImage = Boolean(src) && failedSrc !== src;
  const radius = shape === "rounded" ? "rounded-xl" : "rounded-full";

  if (showImage && src) {
    return (
      <span
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden bg-neutral-100 ring-1 ring-black/10 dark:bg-white/10 dark:ring-white/15",
          SIZE_CLASSES[size],
          radius,
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name || "Customer avatar"}
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center bg-gradient-to-br from-[#0b5e56] to-[#2bc0b5] font-bold text-white shadow-xs",
        SIZE_CLASSES[size],
        radius,
        className,
      )}
    >
      {getCustomerInitials(name)}
    </span>
  );
}
