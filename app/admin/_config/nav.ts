import { HOME_CMS, PAGE_CMS, SITE_CMS, findCmsPage, type CmsPage } from "./cms";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  aliases?: string[];
  children?: AdminNavItem[];
  /** Live count shown next to the label. */
  badge?: "inquiries" | "orders";
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

function cmsNavItem(page: CmsPage): AdminNavItem {
  return {
    href: page.href,
    label: page.label,
    icon: page.icon,
    exact: true,
    children: page.sections.map((section) => ({
      href: `${page.href}/${section.id}`,
      label: section.label,
      icon: section.icon,
      aliases: page.id === "home" && section.id === "hero" ? ["/admin/banners"] : undefined,
    })),
  };
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Store",
    items: [
      { href: "/admin", label: "Overview", icon: "dashboard", exact: true },
      { href: "/admin/reports", label: "Reports", icon: "analytics", exact: true },
      {
        href: "/admin/orders",
        label: "Orders Management",
        icon: "receipt_long",
        exact: true,
        badge: "orders",
        children: [
          { href: "/admin/orders", label: "Overview", icon: "dashboard", exact: true },
          { href: "/admin/orders/new", label: "Create Order", icon: "add_shopping_cart", exact: true },
          { href: "/admin/orders/list", label: "Order List", icon: "list_alt", exact: true },
          { href: "/admin/orders/ready-to-pack", label: "Ready to Pack", icon: "package_2", exact: true },
        ],
      },
      { href: "/admin/inquiries", label: "Inquiries", icon: "forum", badge: "inquiries" },
      { href: "/admin/products", label: "Products", icon: "inventory_2" },
      { href: "/admin/badges", label: "Badges", icon: "sell" },
      { href: "/admin/cart", label: "Cart", icon: "shopping_cart" },
      { href: "/admin/delivery", label: "Delivery charges", icon: "local_shipping" },
      { href: "/admin/pricing", label: "Discounts", icon: "percent" },
      { href: "/admin/coupons", label: "Coupons", icon: "confirmation_number" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { href: "/admin/inventory/suppliers", label: "Suppliers", icon: "handshake" },
      { href: "/admin/inventory/purchases", label: "Purchases", icon: "request_quote" },
      { href: "/admin/inventory/stock", label: "Stock history", icon: "history" },
    ],
  },
  {
    title: "Pages",
    items: [cmsNavItem(HOME_CMS), ...PAGE_CMS.map(cmsNavItem)],
  },
  {
    title: "Site",
    items: SITE_CMS.map(cmsNavItem),
  },
];

function pathMatches(pathname: string, href: string, exact?: boolean) {
  if (exact || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isAdminNavActive(pathname: string, item: AdminNavItem) {
  if (pathMatches(pathname, item.href, item.exact)) return true;
  return (item.aliases ?? []).some((alias) => pathMatches(pathname, alias));
}

export function isAdminBranchActive(pathname: string, item: AdminNavItem) {
  if (isAdminNavActive(pathname, item)) return true;
  if ((item.children ?? []).some((child) => isAdminNavActive(pathname, child))) return true;
  return Boolean(item.children?.length) && pathname.startsWith(`${item.href}/`);
}

export function currentAdminPage(pathname: string) {
  const cms = matchCmsLabel(pathname);
  if (cms) return cms;

  if (pathname.startsWith("/admin/orders/")) {
    const pages: Record<string, string> = {
      "/admin/orders/list": "Order List",
      "/admin/orders/new": "Create Order",
      "/admin/orders/ready-to-pack": "Ready to Pack",
      "/admin/orders/print": "Print",
    };
    return { group: "Orders Management", label: pages[pathname] ?? "Order details" };
  }
  if (pathname === "/admin/products/new") {
    return { group: "Store", label: "New product" };
  }
  if (pathname === "/admin/coupons/new") {
    return { group: "Store", label: "New coupon" };
  }
  if (pathname.startsWith("/admin/coupons/")) {
    return { group: "Store", label: "Edit coupon" };
  }
  if (pathname.startsWith("/admin/products/")) {
    return { group: "Store", label: "Edit product" };
  }
  if (pathname === "/admin/inventory/purchases/new") {
    return { group: "Inventory", label: "New purchase" };
  }
  if (pathname.startsWith("/admin/banners/")) {
    return { group: "Home", label: "Hero slide" };
  }

  const matches = ADMIN_NAV.flatMap((group) =>
    group.items.flatMap((item) => [
      { ...item, group: group.title },
      ...(item.children ?? []).map((child) => ({ ...child, group: item.label })),
    ]),
  )
    .filter((item) => isAdminNavActive(pathname, item))
    .sort((a, b) => b.href.length - a.href.length);

  const hit = matches[0];
  if (hit) return { group: hit.group, label: hit.label };

  return { group: "Store", label: "Admin" };
}

function matchCmsLabel(pathname: string) {
  const home = pathname.match(/^\/admin\/home\/([^/]+)(?:\/([^/]+))?$/);
  if (home) {
    const section = findCmsPage("home")?.sections.find((item) => item.id === home[1]);
    if (home[2] && home[1] === "hero") {
      return { group: "Home", label: "Hero slide" };
    }
    if (section) return { group: "Home", label: section.label };
    return { group: "Home", label: "Home" };
  }
  if (pathname === "/admin/home") {
    return { group: "Home", label: "Sections" };
  }

  const page = pathname.match(/^\/admin\/pages\/([^/]+)(?:\/([^/]+))?$/);
  if (page) {
    const record = findCmsPage(page[1]);
    if (!record) return { group: "Pages", label: "Page" };
    if (page[2]) {
      const section = record.sections.find((item) => item.id === page[2]);
      return { group: record.label, label: section?.label ?? record.label };
    }
    return { group: record.label, label: "Sections" };
  }

  const site = pathname.match(/^\/admin\/site\/([^/]+)(?:\/([^/]+))?$/);
  if (site) {
    const record = findCmsPage(site[1]);
    if (!record) return { group: "Site", label: "Site" };
    if (site[2]) {
      const section = record.sections.find((item) => item.id === site[2]);
      return { group: record.label, label: section?.label ?? record.label };
    }
    // A single-form page (Header, Footer) has no sections: show "Site › Header", not "Header › Sections".
    if (record.sections.length === 0) return { group: "Site", label: record.label };
    return { group: record.label, label: "Sections" };
  }

  return null;
}

function navHrefs() {
  return ADMIN_NAV.flatMap((group) =>
    group.items.flatMap((item) => [
      item.href,
      ...(item.aliases ?? []),
      ...(item.children ?? []).flatMap((child) => [child.href, ...(child.aliases ?? [])]),
    ]),
  );
}

export function adminBackHref(pathname: string) {
  const hrefs = navHrefs();
  if (hrefs.includes(pathname)) return null;
  const parent = hrefs
    .filter((href) => pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
  return parent ?? null;
}

export function isWideAdminPath(pathname: string) {
  if (pathname === "/admin") return true;
  if (
    pathname === "/admin/reports" ||
    pathname === "/admin/orders" ||
    pathname.startsWith("/admin/orders/") ||
    pathname === "/admin/products" ||
    pathname.startsWith("/admin/products/") ||
    pathname === "/admin/cart" ||
    pathname === "/admin/delivery" ||
    pathname === "/admin/pricing" ||
    pathname === "/admin/coupons" ||
    pathname.startsWith("/admin/coupons/") ||
    pathname === "/admin/badges" ||
    pathname.startsWith("/admin/inventory")
  ) {
    return true;
  }
  if (pathname === "/admin/home" || pathname.startsWith("/admin/home/")) return true;
  if (/^\/admin\/pages\/[^/]+$/.test(pathname)) return true;
  if (/^\/admin\/pages\/[^/]+\/[^/]+$/.test(pathname)) return true;
  if (/^\/admin\/site\/[^/]+$/.test(pathname)) return true;
  if (/^\/admin\/site\/[^/]+\/[^/]+$/.test(pathname)) return true;
  return false;
}
