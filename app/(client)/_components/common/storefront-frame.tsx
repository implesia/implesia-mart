"use client";

import { usePathname } from "next/navigation";

import { CartDrawer } from "../cart/cart-drawer";
import { FloatingActions } from "./floating-actions";
import Footer from "./footer";
import Header from "./header";

export function StorefrontFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return children;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
      <CartDrawer />
      <FloatingActions />
    </>
  );
}
