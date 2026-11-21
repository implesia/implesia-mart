export type DashboardNavBadge = "notifications" | "cart";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  badge?: DashboardNavBadge;
};

export type DashboardNavGroup = {
  title: string;
  items: readonly DashboardNavItem[];
};

export const DASHBOARD_NAV_GROUPS: readonly DashboardNavGroup[] = [
  {
    title: "প্রধান",
    items: [
      { href: "/dashboard", label: "ওভারভিউ", icon: "dashboard", exact: true },
      { href: "/dashboard/orders", label: "আমার অর্ডার", icon: "receipt_long" },
      {
        href: "/dashboard/tracking",
        label: "অর্ডার ট্র্যাকিং",
        icon: "local_shipping",
      },
      {
        href: "/dashboard/purchases",
        label: "কেনা পণ্যের হিস্ট্রি",
        icon: "shopping_bag",
      },
    ],
  },
  {
    title: "কার্ট ও অ্যালার্ট",
    items: [
      {
        href: "/dashboard/cart",
        label: "আমার কার্ট",
        icon: "shopping_cart",
        badge: "cart",
      },
      {
        href: "/dashboard/notifications",
        label: "নোটিফিকেশন",
        icon: "notifications",
        badge: "notifications",
      },
    ],
  },
  {
    title: "অ্যাকাউন্ট",
    items: [
      {
        href: "/dashboard/address",
        label: "ডেলিভারি ঠিকানা",
        icon: "location_on",
      },
      {
        href: "/dashboard/profile",
        label: "আমার প্রোফাইল",
        icon: "person",
      },
      {
        href: "/dashboard/settings",
        label: "সেটিংস",
        icon: "settings",
      },
    ],
  },
];

export function isDashboardNavActive(
  pathname: string,
  item: DashboardNavItem,
): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function currentDashboardPage(pathname: string): {
  group: string;
  label: string;
  icon: string;
} {
  for (const group of DASHBOARD_NAV_GROUPS) {
    for (const item of group.items) {
      if (isDashboardNavActive(pathname, item)) {
        return { group: group.title, label: item.label, icon: item.icon };
      }
    }
  }
  return { group: "প্রধান", label: "ওভারভিউ", icon: "dashboard" };
}
