import { SustainabilityCta } from "./_components/sustainability-cta";
import { SustainabilityCommitment } from "./_components/sustainability-commitment";
import { SustainabilityFashion } from "./_components/sustainability-fashion";
import { SustainabilityHero } from "./_components/sustainability-hero";
import { SustainabilityImpact } from "./_components/sustainability-impact";
import { SustainabilityOrganic } from "./_components/sustainability-organic";
import { SustainabilityOrigin } from "./_components/sustainability-origin";
import { SustainabilityTrust } from "./_components/sustainability-trust";

export default function SustainabilityPage() {
  return (
    <main className="pt-20">
      <SustainabilityHero />
      <SustainabilityOrigin />
      <SustainabilityCommitment />
      <SustainabilityOrganic />
      <SustainabilityFashion />
      <SustainabilityImpact />
      <SustainabilityTrust />
      <SustainabilityCta />
    </main>
  );
}

