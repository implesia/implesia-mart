import { JsonLd } from "./_components/common/json-ld";
import { StorefrontFrame } from "./_components/common/storefront-frame";
import { CartProvider } from "./_providers/cart-provider";
import {
  contactChannel,
  listPublicContactDetails,
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

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const details = await listPublicContactDetails();
  const phone = contactChannel(details, "call");
  const chat = contactChannel(details, "chat");
  const sameAs = details?.isActive
    ? details.social.map((item) => item.href).filter((href) => href.startsWith("http"))
    : [];
  const organizationJsonLd = {
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

  return (
    <CartProvider>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <StorefrontFrame details={details}>{children}</StorefrontFrame>
    </CartProvider>
  );
}
