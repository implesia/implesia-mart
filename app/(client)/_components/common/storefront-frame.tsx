"use client";

import { usePathname } from "next/navigation";

import { CartDrawer } from "../cart/cart-drawer";

export function StorefrontFrame({
  children,
  header,
  footer,
  floating,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  floating: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return children;
  }

  return (
    <>
      {header}
      {children}
      {footer}
      <CartDrawer />
      {floating}
    </>
  );
}
