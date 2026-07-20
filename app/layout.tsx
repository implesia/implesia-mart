/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import "./globals.css";
/* Load Swiper CSS with the root layout so carousels don’t FOUC before client chunks */
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import { CartDrawer } from "./(client)/_components/cart/cart-drawer";
import Header from "./(client)/_components/common/header";
import Footer from "./(client)/_components/common/footer";
import { FloatingActions } from "./(client)/_components/common/floating-actions";
import { CartProvider } from "./(client)/_providers/cart-provider";
import { ThemeProvider } from "./(client)/_providers/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Implesia Mart | Premium Multi-Category Shopping",
    template: "%s | Implesia Mart",
  },
  description:
    "Premium multi-category shopping across fabrics, electronics, and organic lifestyle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          // Runs before React hydration to avoid theme flash
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='implesia.theme';var t=localStorage.getItem(k)||'system';var s=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var r=(t==='system'?s:t);document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(r);document.documentElement.style.colorScheme=r;}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <CartProvider>
            <Header />
            {children}
            <Footer />
            <CartDrawer />
            <FloatingActions />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
