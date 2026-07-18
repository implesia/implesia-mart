import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

const SITE_NAME = "Implesia Mart";
const LOGO_LIGHT = "/images/common/logo.png";
const LOGO_DARK = "/images/common/implesia-mart-white-logo.png";

type SiteLogoProps = {
  className?: string;
  priority?: boolean;
  onClick?: () => void;
};

/**
 * Brand logo that swaps to the white mark in dark mode.
 * Uses CSS `dark:` (not JS theme state) so it matches the
 * pre-hydration theme script and avoids a flash of the wrong asset.
 */
export function SiteLogo({ className, priority = false, onClick }: SiteLogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "relative block h-8 w-[7.5rem] shrink-0 transition-opacity hover:opacity-90 sm:h-9 sm:w-[9rem] lg:h-10 lg:w-[10rem]",
        className,
      )}
      aria-label={SITE_NAME}
      onClick={onClick}
    >
      <Image
        src={LOGO_LIGHT}
        alt=""
        fill
        priority={priority}
        className="object-contain object-left dark:hidden"
        sizes="(max-width: 640px) 120px, (max-width: 1024px) 140px, 160px"
      />
      <Image
        src={LOGO_DARK}
        alt=""
        fill
        priority={priority}
        className="hidden object-contain object-left dark:block"
        sizes="(max-width: 640px) 120px, (max-width: 1024px) 140px, 160px"
      />
    </Link>
  );
}
