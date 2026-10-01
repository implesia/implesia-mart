import { findCmsPage, findCmsSection } from "../../../_config/cms";
import { ContactDetailsEditor } from "./details-editor";
import { ContactFaqEditor } from "./faq-editor";
import { ContactFormEditor } from "./form-editor";
import { ContactHeroEditor } from "./hero-editor";
import { ContactSupportEditor } from "./support-editor";

export function ContactSectionManager({ sectionId }: { sectionId: string }) {
  const page = findCmsPage("contact");
  const section = page ? findCmsSection(page, sectionId) : undefined;
  if (!section) return null;

  if (sectionId === "hero") return <ContactHeroEditor />;
  if (sectionId === "form") return <ContactFormEditor />;
  if (sectionId === "details") return <ContactDetailsEditor />;
  if (sectionId === "support") return <ContactSupportEditor />;
  if (sectionId === "faq") return <ContactFaqEditor />;

  return null;
}

export function ContactSectionFallback() {
  return (
    <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
  );
}
