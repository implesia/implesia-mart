import { LegalDirectory } from "./_components/legal-directory";
import { PolicyContent } from "./_components/policy-content";
import { PrivacyHero } from "./_components/privacy-hero";

export default function PrivacyPolicyPage() {
  return (
    <main>
      <PrivacyHero />

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-lg px-6 pb-xl md:grid-cols-12 md:px-8">
        <LegalDirectory />
        <PolicyContent />
      </section>
    </main>
  );
}
