"use client";

import Image from "next/image";
import { useState } from "react";

import { canOptimize, coverSrc } from "@/lib/blog-view";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

/**
 * A blog cover that never breaks the page: a missing, unusable (blob:, data:...) or
 * failed-to-load image shows a quiet placeholder instead of a broken icon or a render error.
 * The parent sets the size and aspect ratio (`relative` box).
 */
export function BlogImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const resolved = coverSrc(src);
  const [failedSrc, setFailedSrc] = useState("");

  if (!resolved || failedSrc === resolved) {
    return (
      <div
        data-testid="blog-image-placeholder"
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-[#eceef2] text-neutral-400"
      >
        <MaterialIcon name="image" className="text-[32px]" />
      </div>
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      unoptimized={!canOptimize(resolved)}
      onError={() => setFailedSrc(resolved)}
      className={cn("object-cover", className)}
    />
  );
}
