import type { Metadata } from "next";

import { PrivacyPolicyView } from "./_components/privacy-policy-view";

export const metadata: Metadata = {
  title: "গোপনীয়তা নীতি",
  description:
    "ইমপ্লেসিয়া মার্ট — আপনার ব্যক্তিগত তথ্য কীভাবে সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখা হয় তা জানুন।",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="w-full overflow-x-hidden bg-background pt-16 text-on-surface sm:pt-20">
      <PrivacyPolicyView />
    </main>
  );
}
