import { SustainabilityCommitment } from "./_components/sustainability-commitment";
import { SustainabilityCta } from "./_components/sustainability-cta";
import { SustainabilityDurability } from "./_components/sustainability-durability";
import { SustainabilityHero } from "./_components/sustainability-hero";
import { SustainabilityImpact } from "./_components/sustainability-impact";
import { SustainabilityOrigin } from "./_components/sustainability-origin";
import { SustainabilityQuality } from "./_components/sustainability-quality";
import { SustainabilityTrust } from "./_components/sustainability-trust";

export default function SustainabilityPage() {
  return (
    <main className="pt-16 sm:pt-20">
      <SustainabilityHero />
      <SustainabilityOrigin />
      <SustainabilityCommitment />
      <SustainabilityQuality />
      <SustainabilityDurability />
      <SustainabilityImpact />
      <SustainabilityTrust />
      <SustainabilityCta />
    </main>
  );
}
