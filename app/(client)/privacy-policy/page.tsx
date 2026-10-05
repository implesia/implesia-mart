import type { Metadata } from "next";

import { listPublicPrivacyCollection } from "@/lib/mart-api/privacy-collection";
import { listPublicPrivacyContents } from "@/lib/mart-api/privacy-contents";
import { listPublicPrivacyHero } from "@/lib/mart-api/privacy-hero";
import { listPublicPrivacyIntroduction } from "@/lib/mart-api/privacy-introduction";
import { listPublicPrivacyRights } from "@/lib/mart-api/privacy-rights";
import { listPublicPrivacySharing } from "@/lib/mart-api/privacy-sharing";
import { listPublicPrivacySupport } from "@/lib/mart-api/privacy-support";
import { listPublicPrivacyUsage } from "@/lib/mart-api/privacy-usage";

import { Container } from "../_components/common/container";
import { ProductBreadcrumbs } from "../products/_components/product-breadcrumbs";
import { PrivacyPolicyView } from "./_components/privacy-policy-view";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "গোপনীয়তা নীতি",
  description:
    "ইমপ্লেসিয়া মার্ট — অর্ডারের নাম, ফোন ও ঠিকানা কীভাবে সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখা হয়।",
  alternates: { canonical: "/privacy-policy" },
};

export default async function PrivacyPolicyPage() {
  const [hero, contents, introduction, collection, usage, sharing, rights, support] =
    await Promise.all([
      listPublicPrivacyHero(),
      listPublicPrivacyContents(),
      listPublicPrivacyIntroduction(),
      listPublicPrivacyCollection(),
      listPublicPrivacyUsage(),
      listPublicPrivacySharing(),
      listPublicPrivacyRights(),
      listPublicPrivacySupport(),
    ]);
  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 sm:pt-4 lg:pt-5">
          <ProductBreadcrumbs
            items={[
              { label: "হোম", href: "/" },
              { label: "গোপনীয়তা নীতি" },
            ]}
          />
        </div>
      </Container>
      <PrivacyPolicyView
        hero={hero}
        contents={contents}
        introduction={introduction}
        collection={collection}
        usage={usage}
        sharing={sharing}
        rights={rights}
        support={support}
      />
    </main>
  );
}
