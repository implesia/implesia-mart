"use client";

import { createContext, useContext } from "react";

import { DEFAULT_SITE_CONTACT, type SiteContact } from "@/lib/site-contact";

const SiteContactContext = createContext<SiteContact>(DEFAULT_SITE_CONTACT);

/** Hands the live central contact (fetched on the server) to client components. */
export function SiteContactProvider({
  contact,
  children,
}: {
  contact: SiteContact;
  children: React.ReactNode;
}) {
  return <SiteContactContext.Provider value={contact}>{children}</SiteContactContext.Provider>;
}

export function useSiteContact() {
  return useContext(SiteContactContext);
}
