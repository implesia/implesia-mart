"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";

const INVENTORY_TABS = [
  { href: "/admin/inventory/suppliers", label: "Suppliers", icon: "handshake" },
  { href: "/admin/inventory/purchases", label: "Purchases", icon: "receipt_long" },
  { href: "/admin/inventory/purchases/new", label: "New Purchase", icon: "add_shopping_cart" },
  { href: "/admin/inventory/stock", label: "Stock History", icon: "history" },
] as const;

export function InventorySubNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Inventory sections"
      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xs"
    >
      <div className="flex flex-wrap items-center gap-1">
        {INVENTORY_TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
                active
                  ? "bg-[#0b3d39] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              <MaterialIcon name={tab.icon} className="text-[16px]" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <Link
        href="/admin/reports/inventory"
        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-[#0b3d39] transition hover:bg-teal-50"
      >
        <MaterialIcon name="analytics" className="text-[16px]" />
        Inventory Valuation Report
      </Link>
    </nav>
  );
}
