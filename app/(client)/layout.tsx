import { Suspense } from "react";
import { connection } from "next/server";

import {
  ANALYTICS_CONFIG_ELEMENT_ID,
  analyticsConfig,
} from "@/lib/analytics/config";
import { StoreAnalytics } from "@/lib/analytics/store-analytics";
import { CouponCapture } from "./_components/common/coupon-capture";
import { JsonLd } from "./_components/common/json-ld";
import { StorefrontFrame } from "./_components/common/storefront-frame";
import Footer from "./_components/common/footer";
import { FloatingActions } from "./_components/common/floating-actions";
import Header from "./_components/common/header";
import { CartProvider } from "./_providers/cart-provider";
import {
  FALLBACK_CONTACT_DETAILS,
  contactChannel,
  listPublicContactDetails,
  type ContactDetails,
} from "@/lib/mart-api/contact-details";
import { listPublicCategoryTree } from "@/lib/mart-api/categories";
import { listPublicFooter } from "@/lib/mart-api/footer";
import { listPublicHeader } from "@/lib/mart-api/header";
import { DEFAULT_FOOTER } from "@/lib/footer-view";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "bn-BD",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const fallbackChat =
  contactChannel(FALLBACK_CONTACT_DETAILS, "chat")?.href ?? "";

function organizationJsonLd(details: ContactDetails) {
  const phone = contactChannel(details, "call");
  const chat = contactChannel(details, "chat");
  const sameAs = details.isActive
    ? details.social
        .map((item) => item.href)
        .filter((href) => href.startsWith("http"))
    : [];
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/common/logo.png`,
    ...(sameAs.length ? { sameAs } : {}),
    ...(phone || chat
      ? {
          contactPoint: [
            {
              "@type": "ContactPoint",
              contactType: "customer support",
              ...(phone ? { telephone: phone.value } : {}),
              ...(chat ? { url: chat.href } : {}),
              areaServed: "BD",
              availableLanguage: ["bn", "en"],
            },
          ],
        }
      : {}),
  };
}

async function ContactHeader() {
  const [details, tree, headerConfig] = await Promise.all([
    listPublicContactDetails(),
    listPublicCategoryTree(),
    listPublicHeader(),
  ]);
  const categories = (tree ?? [])
    .filter((item) => item.parentId === null)
    .map((item) => ({ slug: item.slug, label: item.label }));
  return (
    <>
      <JsonLd data={organizationJsonLd(details)} />
      <Header
        details={details}
        categories={categories}
        navItems={headerConfig.items}
        logo={headerConfig.logo}
      />
    </>
  );
}

async function ContactFooter() {
  const [details, config] = await Promise.all([
    listPublicContactDetails(),
    listPublicFooter(),
  ]);
  return <Footer details={details} config={config} />;
}

async function ContactFloating() {
  const details = await listPublicContactDetails();
  return (
    <FloatingActions
      whatsappHref={contactChannel(details, "chat")?.href ?? ""}
    />
  );
}

async function StoreAnalyticsSlot() {
  // Runtime read: ids set on the Worker show up without a rebuild, and an
  // empty id renders nothing. This slot is not mounted under /admin.
  await connection();
  const { ga4Id, metaPixelId } = analyticsConfig();
  return (
    <>
      {ga4Id || metaPixelId ? (
        <div
          id={ANALYTICS_CONFIG_ELEMENT_ID}
          hidden
          data-ga4={ga4Id}
          data-meta={metaPixelId}
        />
      ) : null}
      <Suspense fallback={null}>
        <StoreAnalytics ga4Id={ga4Id} metaPixelId={metaPixelId} />
      </Suspense>
    </>
  );
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      <Suspense fallback={null}>
        <StoreAnalyticsSlot />
      </Suspense>
      <Suspense fallback={null}>
        <CouponCapture />
      </Suspense>
      <JsonLd data={websiteJsonLd} />
      <StorefrontFrame
        header={
          <Suspense fallback={<Header details={FALLBACK_CONTACT_DETAILS} />}>
            <ContactHeader />
          </Suspense>
        }
        footer={
          <Suspense
            fallback={
              <Footer
                details={FALLBACK_CONTACT_DETAILS}
                config={DEFAULT_FOOTER}
              />
            }
          >
            <ContactFooter />
          </Suspense>
        }
        floating={
          <Suspense fallback={<FloatingActions whatsappHref={fallbackChat} />}>
            <ContactFloating />
          </Suspense>
        }
      >
        {children}
      </StorefrontFrame>
    </CartProvider>
  );
}
