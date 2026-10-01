"use client";

import { PrivacyCollectionEditor } from "./collection-editor";
import { PrivacyContentsEditor } from "./contents-editor";
import { PrivacyHeroEditor } from "./hero-editor";
import { PrivacyIntroductionEditor } from "./introduction-editor";
import { PrivacyRightsEditor } from "./rights-editor";
import { PrivacySharingEditor } from "./sharing-editor";
import { PrivacySupportEditor } from "./support-editor";
import { PrivacyUsageEditor } from "./usage-editor";

export function PrivacySectionFallback() {
  return (
    <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
  );
}

export function PrivacySectionManager({ sectionId }: { sectionId: string }) {
  if (sectionId === "hero") return <PrivacyHeroEditor />;
  if (sectionId === "contents") return <PrivacyContentsEditor />;
  if (sectionId === "introduction") return <PrivacyIntroductionEditor />;
  if (sectionId === "collection") return <PrivacyCollectionEditor />;
  if (sectionId === "usage") return <PrivacyUsageEditor />;
  if (sectionId === "sharing") return <PrivacySharingEditor />;
  if (sectionId === "rights") return <PrivacyRightsEditor />;
  if (sectionId === "support") return <PrivacySupportEditor />;
  return null;
}
