import { Suspense } from "react";

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

const fallbackChat = contactChannel(FALLBACK_CONTACT_DETAILS, "chat")?.href ?? "";

function organizationJsonLd(details: ContactDetails) {
  const phone = contactChannel(details, "call");
  const chat = contactChannel(details, "chat");
  const sameAs = details.isActive
    ? details.social.map((item) => item.href).filter((href) => href.startsWith("http"))
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
  const details = await listPublicContactDetails();
  return (
    <>
      <JsonLd data={organizationJsonLd(details)} />
      <Header details={details} />
    </>
  );
}

async function ContactFooter() {
  const details = await listPublicContactDetails();
  return <Footer details={details} />;
}

async function ContactFloating() {
  const details = await listPublicContactDetails();
  return <FloatingActions whatsappHref={contactChannel(details, "chat")?.href ?? ""} />;
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      <JsonLd data={websiteJsonLd} />
      <StorefrontFrame
        header={
          <Suspense fallback={<Header details={FALLBACK_CONTACT_DETAILS} />}>
            <ContactHeader />
          </Suspense>
        }
        footer={
          <Suspense fallback={<Footer details={FALLBACK_CONTACT_DETAILS} />}>
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
