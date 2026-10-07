export type ContentsNavLink = {
  id: string;
  icon: string;
  label: string;
};

type HeadingSection = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  heading: string;
} | null;

type TitleSection = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  title: string;
} | null;

function headingLink(
  id: string,
  section: HeadingSection,
  fallbackIcon: string,
): ContentsNavLink | null {
  if (!section?.isActive || !section.heading.trim()) return null;
  return {
    id,
    icon: section.icon || fallbackIcon,
    label: section.navLabel.trim() || section.heading.trim(),
  };
}

function titleLink(
  id: string,
  section: TitleSection,
  fallbackIcon: string,
): ContentsNavLink | null {
  if (!section?.isActive || !section.title.trim()) return null;
  return {
    id,
    icon: section.icon || fallbackIcon,
    label: section.navLabel.trim() || section.title.trim(),
  };
}

export function shippingContentsNav(sections: {
  shipping: HeadingSection;
  payment: HeadingSection;
  returns: HeadingSection;
  refund: HeadingSection;
  support: TitleSection;
}): ContentsNavLink[] {
  return [
    headingLink("shipping", sections.shipping, "local_shipping"),
    headingLink("payment", sections.payment, "payments"),
    headingLink("returns", sections.returns, "assignment_return"),
    headingLink("refund", sections.refund, "receipt_long"),
    titleLink("support", sections.support, "support_agent"),
  ].filter((item): item is ContentsNavLink => item !== null);
}

export function privacyContentsNav(sections: {
  introduction: HeadingSection;
  collection: HeadingSection;
  usage: HeadingSection;
  sharing: HeadingSection;
  rights: HeadingSection;
  support: TitleSection;
}): ContentsNavLink[] {
  return [
    headingLink("introduction", sections.introduction, "info"),
    headingLink("collection", sections.collection, "database"),
    headingLink("usage", sections.usage, "query_stats"),
    headingLink("sharing", sections.sharing, "share"),
    headingLink("rights", sections.rights, "gavel"),
    titleLink("support", sections.support, "support_agent"),
  ].filter((item): item is ContentsNavLink => item !== null);
}
