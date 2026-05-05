"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

function NavItem({
  label,
  icon,
  active,
  href = "#",
}: {
  label: string;
  icon: string;
  active?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl px-4 py-1 text-slate-400 transition-all duration-150 ease-in-out active:scale-90 dark:text-slate-500",
        "hover:bg-surface-container-low dark:hover:bg-white/5",
        active && "bg-surface-container-low text-primary dark:bg-white/10 dark:text-foreground"
      )}
    >
      <MaterialIcon name={icon} filled={active} />
      <span className="text-[10px] font-semibold tracking-tighter uppercase">{label}</span>
    </Link>
  );
}

export function CheckoutMobileNav() {
  return (
    <nav className="pb-safe fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-border bg-background/90 px-4 py-3 backdrop-blur-lg md:hidden">
      <NavItem label="Shop" icon="storefront" />
      <NavItem label="Search" icon="search" />
      <NavItem label="Bag" icon="shopping_bag" active />
      <NavItem label="Profile" icon="person" />
    </nav>
  );
}

