"use client";

import { usePathname } from "next/navigation";

import { contactChannel, type ContactDetails } from "@/lib/mart-api/contact-details";

import { CartDrawer } from "../cart/cart-drawer";
import { FloatingActions } from "./floating-actions";
import Footer from "./footer";
import Header from "./header";

export function StorefrontFrame({
  children,
  details,
}: {
  children: React.ReactNode;
  details: ContactDetails | null;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return children;
  }

  return (
    <>
      <Header details={details} />
      {children}
      <Footer details={details} />
      <CartDrawer />
      <FloatingActions whatsappHref={contactChannel(details, "chat")?.href ?? ""} />
    </>
  );
}
