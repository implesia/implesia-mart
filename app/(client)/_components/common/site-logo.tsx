import Image from "next/image";
import Link from "next/link";

import { canOptimize } from "@/lib/blog-view";
import { cn } from "@/lib/utils";

const SITE_NAME = "Implesia Mart";
const LOGO_LIGHT = "/images/common/logo.png";
const LOGO_DARK = "/images/common/implesia-mart-white-logo.png";

type SiteLogoProps = {
  className?: string;
  priority?: boolean;
  onClick?: () => void;
  /** auto = theme-aware; onDark = always white mark; light = always navy mark */
  tone?: "auto" | "onDark" | "light";
  /** An admin-uploaded logo that replaces the built-in marks (footer). */
  custom?: { src: string; alt: string };
  /** Accessible name for the link; defaults to the site name. A custom logo is named by its alt text instead. */
  label?: string;
};

/**
 * Brand logo that swaps to the white mark in dark mode by default.
 * Uses CSS `dark:` (not JS theme state) so it matches the
 * pre-hydration theme script and avoids a flash of the wrong asset.
 */
export function SiteLogo({
  className,
  priority = false,
  onClick,
  tone = "auto",
  custom,
  label = SITE_NAME,
}: SiteLogoProps) {
  const lightClass =
    tone === "onDark"
      ? "hidden"
      : tone === "light"
        ? "object-contain object-left"
        : "object-contain object-left dark:hidden";

  const darkClass =
    tone === "light"
      ? "hidden"
      : tone === "onDark"
        ? "object-contain object-left"
        : "hidden object-contain object-left dark:block";

  return (
    <Link
      href="/"
      className={cn(
        "relative block h-10 w-[9.75rem] shrink-0 transition-opacity hover:opacity-90 sm:h-12 sm:w-[12rem] lg:h-[3.25rem] lg:w-[13.25rem]",
        className,
      )}
      aria-label={custom ? undefined : label}
      onClick={onClick}
    >
      {custom ? (
        <Image
          src={custom.src}
          alt={custom.alt}
          fill
          priority={priority}
          unoptimized={!canOptimize(custom.src)}
          className="object-contain object-left"
          sizes="(max-width: 640px) 156px, (max-width: 1024px) 192px, 212px"
        />
      ) : (
        <>
      <Image
        src={LOGO_LIGHT}
        alt=""
        fill
        priority={priority}
        className={lightClass}
        sizes="(max-width: 640px) 156px, (max-width: 1024px) 192px, 212px"
      />
      <Image
        src={LOGO_DARK}
        alt=""
        fill
        priority={priority}
        className={darkClass}
        sizes="(max-width: 640px) 156px, (max-width: 1024px) 192px, 212px"
      />
        </>
      )}
    </Link>
  );
}
