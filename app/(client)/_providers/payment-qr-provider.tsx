"use client";

import { createContext, useContext } from "react";

const PaymentQrContext = createContext<string | null>(null);

/** Hands the live Bangla QR image (fetched on the server, or null) to client components. */
export function PaymentQrProvider({
  qrSrc,
  children,
}: {
  qrSrc: string | null;
  children: React.ReactNode;
}) {
  return <PaymentQrContext.Provider value={qrSrc}>{children}</PaymentQrContext.Provider>;
}

export function usePaymentQr() {
  return useContext(PaymentQrContext);
}
