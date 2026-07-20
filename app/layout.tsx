/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata, Viewport } from "next";
import "./globals.css";
/* Load Swiper CSS with the root layout so carousels don’t FOUC before client chunks */
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import { CartDrawer } from "./(client)/_components/cart/cart-drawer";
import { JsonLd } from "./(client)/_components/common/json-ld";
import Header from "./(client)/_components/common/header";
import Footer from "./(client)/_components/common/footer";
import { FloatingActions } from "./(client)/_components/common/floating-actions";
import { CartProvider } from "./(client)/_providers/cart-provider";
import { ThemeProvider } from "./(client)/_providers/theme-provider";
import { WHATSAPP_HREF } from "./(client)/_data/contact/contact";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  applicationName: SITE_NAME,
  category: "e-commerce",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    locale: "bn_BD",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7faf7" },
    { media: "(prefers-color-scheme: dark)", color: "#061110" },
  ],
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/images/common/logo.png`,
  sameAs: [
    "https://www.facebook.com/implesiamart",
    "https://www.linkedin.com/company/implesia-mart",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: "+880-1516-527932",
      url: WHATSAPP_HREF,
      areaServed: "BD",
      availableLanguage: ["bn", "en"],
    },
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "bn-BD",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className="h-full antialiased" suppressHydrationWarning>
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
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
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
