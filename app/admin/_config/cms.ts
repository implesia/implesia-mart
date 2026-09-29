export type CmsSection = {
  id: string;
  label: string;
  icon: string;
  description: string;
  fields: string[];
};

export type CmsPage = {
  id: string;
  label: string;
  icon: string;
  href: string;
  publicPath: string;
  api: string;
  description: string;
  sections: CmsSection[];
};

export const HOME_CMS: CmsPage = {
  id: "home",
  label: "Home",
  icon: "home",
  href: "/admin/home",
  publicPath: "/",
  api: "cms/home",
  description: "Live landing-page sections. Each block has its own API.",
  sections: [
    {
      id: "hero",
      label: "Hero",
      icon: "view_carousel",
      description: "Top slider — image, title, price, and CTA.",
      fields: ["slides", "title", "price", "image", "cta", "published"],
    },
    {
      id: "trust",
      label: "Trust",
      icon: "verified",
      description: "Cash on delivery, nationwide delivery, 3-day returns.",
      fields: ["items", "label", "icon", "href"],
    },
    {
      id: "categories",
      label: "Categories",
      icon: "category",
      description: "Gadget and dress tiles.",
      fields: ["heading", "tiles", "image", "href"],
    },
    {
      id: "featured",
      label: "Featured",
      icon: "star",
      description: "Selected products shown on the home page.",
      fields: ["heading", "slugs", "limit"],
    },
    {
      id: "showcase",
      label: "Showcase",
      icon: "view_quilt",
      description: "Product rows grouped by category.",
      fields: ["heading", "gadgetRow", "fashionRow"],
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: "reviews",
      description: "Customer testimonials.",
      fields: ["heading", "quotes", "author", "rating"],
    },
    {
      id: "faq",
      label: "FAQ",
      icon: "help",
      description: "Short questions on the home page.",
      fields: ["heading", "items"],
    },
    {
      id: "newsletter",
      label: "Newsletter",
      icon: "mail",
      description: "Subscribe block copy and CTA.",
      fields: ["title", "subtitle", "placeholder", "cta"],
    },
  ],
};

export const PAGE_CMS: CmsPage[] = [
  {
    id: "about",
    label: "About",
    icon: "domain",
    href: "/admin/pages/about",
    publicPath: "/about-us",
    api: "cms/pages/about",
    description: "Brand story, stats, mission, and order steps.",
    sections: [
      { id: "hero", label: "Hero", icon: "imagesmode", description: "Opening title, subtitle, and images.", fields: ["eyebrow", "title", "subtitle", "cta", "images"] },
      { id: "stats", label: "Stats", icon: "bar_chart", description: "Categories, districts, COD, and returns.", fields: ["items", "value", "label", "icon"] },
      { id: "story", label: "Story", icon: "menu_book", description: "Why Implesia Mart started.", fields: ["kicker", "title", "paragraphs", "cta", "images"] },
      { id: "custom-dresses", label: "Custom dresses", icon: "checkroom", description: "Dress block and gallery.", fields: ["title", "subtitle", "features", "gallery", "cta"] },
      { id: "mission", label: "Mission & vision", icon: "rocket_launch", description: "Two cards — vision and mission.", fields: ["vision", "mission"] },
      { id: "values", label: "Values", icon: "verified", description: "Quality, COD, delivery, and returns.", fields: ["kicker", "title", "items"] },
      { id: "how-it-works", label: "How to order", icon: "list_alt", description: "Four-step order process.", fields: ["kicker", "title", "steps"] },
      { id: "cta", label: "CTA", icon: "campaign", description: "Closing call to action.", fields: ["title", "subtitle", "cta"] },
    ],
  },
  {
    id: "sustainability",
    label: "Sustainability",
    icon: "eco",
    href: "/admin/pages/sustainability",
    publicPath: "/sustainability",
    api: "cms/pages/sustainability",
    description: "Responsible shopping, from the hero through the CTA.",
    sections: [
      { id: "hero", label: "Hero", icon: "imagesmode", description: "Opening copy and images.", fields: ["eyebrow", "title", "subtitle", "cta", "images"] },
      { id: "impact", label: "Habits", icon: "bar_chart", description: "COD, returns, checks, and packing stats.", fields: ["kicker", "title", "stats"] },
      { id: "origin", label: "Point of view", icon: "menu_book", description: "Why quality is a responsibility.", fields: ["eyebrow", "title", "body", "quote", "images"] },
      { id: "commitment", label: "Commitment", icon: "volunteer_activism", description: "Four responsibility cards.", fields: ["kicker", "title", "items"] },
      { id: "quality", label: "Quality", icon: "fact_check", description: "Check process and badges.", fields: ["title", "body", "steps", "badges", "image"] },
      { id: "durability", label: "Built to last", icon: "all_inclusive", description: "Less waste, products that last.", fields: ["title", "body", "bullets", "image"] },
      { id: "cta", label: "CTA", icon: "campaign", description: "Closing call to action.", fields: ["title", "subtitle", "cta"] },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    icon: "alternate_email",
    href: "/admin/pages/contact",
    publicPath: "/contact-us",
    api: "cms/pages/contact",
    description: "Hero, form, channels, support hours, and FAQ.",
    sections: [
      { id: "hero", label: "Hero", icon: "imagesmode", description: "Opening copy and CTA.", fields: ["eyebrow", "title", "subtitle", "cta"] },
      { id: "form", label: "Form", icon: "edit_note", description: "WhatsApp form labels and fields.", fields: ["title", "fields", "cta", "hint"] },
      { id: "details", label: "Channels", icon: "call", description: "Call, WhatsApp, email, and area.", fields: ["title", "channels", "social", "badge"] },
      { id: "support", label: "Hours", icon: "schedule", description: "Support hours and quick links.", fields: ["title", "hours", "quickLinks"] },
      { id: "faq", label: "FAQ", icon: "help", description: "Short questions on the contact page.", fields: ["title", "subtitle", "items"] },
    ],
  },
  {
    id: "blogs",
    label: "Blog",
    icon: "article",
    href: "/admin/pages/blogs",
    publicPath: "/blogs",
    api: "cms/pages/blogs",
    description: "List hero, categories, and posts.",
    sections: [
      { id: "hero", label: "Hero", icon: "imagesmode", description: "Opening copy for the blog list.", fields: ["title", "subtitle"] },
      { id: "categories", label: "Categories", icon: "label", description: "Blog filter tags.", fields: ["items"] },
      { id: "posts", label: "Posts", icon: "newspaper", description: "Articles, slugs, body, and related SKUs.", fields: ["title", "slug", "excerpt", "body", "related"] },
    ],
  },
  {
    id: "faqs",
    label: "FAQs",
    icon: "quiz",
    href: "/admin/pages/faqs",
    publicPath: "/faqs",
    api: "cms/pages/faqs",
    description: "Hero, categories, question list, and help CTA.",
    sections: [
      { id: "hero", label: "Hero", icon: "imagesmode", description: "Title, search placeholder, and trending chips.", fields: ["eyebrow", "title", "subtitle", "placeholder", "trending"] },
      { id: "categories", label: "Categories", icon: "label", description: "Sidebar topic groups.", fields: ["title", "items"] },
      { id: "items", label: "Questions", icon: "format_list_bulleted", description: "Each question and answer is its own record.", fields: ["question", "answer", "categoryId"] },
      { id: "callout", label: "Callout", icon: "info", description: "Important note about delivery time.", fields: ["eyebrow", "body"] },
      { id: "help", label: "Help CTA", icon: "support_agent", description: "Closing contact block.", fields: ["title", "subtitle", "cta", "phone"] },
    ],
  },
  {
    id: "shipping",
    label: "Shipping & returns",
    icon: "local_shipping",
    href: "/admin/pages/shipping",
    publicPath: "/shipping-returns",
    api: "cms/pages/shipping",
    description: "Delivery, COD, returns, refunds, and support.",
    sections: [
      { id: "hero", label: "Hero", icon: "imagesmode", description: "Opening copy.", fields: ["eyebrow", "title", "subtitle"] },
      { id: "shipping", label: "Shipping", icon: "package_2", description: "Coverage, timelines, and notes.", fields: ["heading", "cards", "timelines", "notes"] },
      { id: "payment", label: "Payment", icon: "payments", description: "COD and mobile banking cards.", fields: ["heading", "cards"] },
      { id: "returns", label: "Returns", icon: "assignment_return", description: "3-day easy return rules.", fields: ["heading", "rules", "special"] },
      { id: "refund", label: "Refund", icon: "receipt_long", description: "Refund steps and note.", fields: ["heading", "steps", "note"] },
      { id: "support", label: "Support", icon: "support_agent", description: "Help CTA.", fields: ["title", "subtitle", "cta", "phone"] },
      { id: "faq", label: "Mini FAQ", icon: "help", description: "Short questions on this page.", fields: ["title", "items"] },
    ],
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: "policy",
    href: "/admin/pages/privacy",
    publicPath: "/privacy-policy",
    api: "cms/pages/privacy",
    description: "What we collect, how we use it, sharing, and rights.",
    sections: [
      { id: "hero", label: "Hero", icon: "imagesmode", description: "Opening copy and last-updated date.", fields: ["eyebrow", "title", "subtitle", "lastUpdated"] },
      { id: "introduction", label: "Introduction", icon: "info", description: "What the policy covers.", fields: ["heading", "paragraphs"] },
      { id: "collection", label: "Collection", icon: "database", description: "What information is stored.", fields: ["heading", "cards"] },
      { id: "usage", label: "Use", icon: "query_stats", description: "How data is used and protected.", fields: ["heading", "items", "protection"] },
      { id: "sharing", label: "Sharing", icon: "share", description: "Limited sharing with courier and payment.", fields: ["heading", "body", "chips"] },
      { id: "rights", label: "Rights", icon: "gavel", description: "View, correct, and delete.", fields: ["heading", "items", "retention"] },
      { id: "support", label: "Contact", icon: "support_agent", description: "Help CTA for policy questions.", fields: ["title", "subtitle", "cta", "phone"] },
    ],
  },
];

export const SITE_CMS: CmsPage[] = [
  {
    id: "header",
    label: "Header",
    icon: "web",
    href: "/admin/site/header",
    publicPath: "/",
    api: "cms/site/header",
    description: "Top navigation on every page — links and labels.",
    sections: [
      { id: "nav", label: "Menu", icon: "menu", description: "Page links in the header.", fields: ["items", "label", "href"] },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    icon: "bottom_navigation",
    href: "/admin/site/footer",
    publicPath: "/",
    api: "cms/site/footer",
    description: "Columns, trust points, and contact.",
    sections: [
      { id: "shop", label: "Shop column", icon: "storefront", description: "Product and blog links.", fields: ["title", "links"] },
      { id: "company", label: "Company", icon: "domain", description: "About, sustainability, and contact.", fields: ["title", "links"] },
      { id: "support", label: "Support", icon: "support", description: "FAQ, shipping, privacy, and checkout.", fields: ["title", "links"] },
      { id: "trust", label: "Trust", icon: "verified", description: "Three promises in the footer.", fields: ["items"] },
      { id: "contact", label: "Contact", icon: "call", description: "Phone, email, and social.", fields: ["phone", "email", "social"] },
    ],
  },
];

export const ALL_CMS_PAGES: CmsPage[] = [HOME_CMS, ...PAGE_CMS, ...SITE_CMS];

export function findCmsPage(id: string) {
  return ALL_CMS_PAGES.find((page) => page.id === id);
}

export function findCmsSection(page: CmsPage, sectionId: string) {
  return page.sections.find((section) => section.id === sectionId);
}

export function cmsApiPath(page: CmsPage, section?: CmsSection) {
  return section ? `${page.api}/${section.id}` : page.api;
}
