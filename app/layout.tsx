import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";

import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_SHARE_IMAGE,
  DEFAULT_TITLE,
  OPEN_GRAPH_DEFAULTS,
  SITE_NAME,
  SITE_URL,
  siteVerification,
} from "@/lib/seo";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
  adjustFontFallback: true,
  preload: true,
});

const materialSymbols = localFont({
  src: "./fonts/material-symbols-outlined.woff2",
  variable: "--font-material-symbols",
  display: "swap",
  weight: "400",
  adjustFontFallback: false,
  preload: false,
});

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
  // No root canonical / og:url: each indexable page sets its own (pageMetadata),
  // so pages without one (checkout, search, 404, admin) don't point at "/".
  openGraph: {
    ...OPEN_GRAPH_DEFAULTS,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_SHARE_IMAGE.url],
  },
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/png" }],
    shortcut: [{ url: "/favicon.ico", type: "image/png" }],
    apple: [{ url: "/favicon.ico", type: "image/png" }],
  },
  // Indexing is the default, so only the preview limits are set here. A page
  // that must not be indexed (404, checkout, admin) then has one robots tag.
  // Search Console / Bing verification meta, only when the env tokens are set.
  verification: siteVerification(),
  robots: {
    googleBot: {
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets env(safe-area-inset-*) resolve on notched phones; header/footer pad for it.
  viewportFit: "cover",
  // Light theme only: no dark mode, regardless of OS preference.
  themeColor: "#f7faf7",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`${inter.variable} ${materialSymbols.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="flex min-h-full flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
