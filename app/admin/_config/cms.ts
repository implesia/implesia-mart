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
      id: "promo",
      label: "Promo banner",
      icon: "campaign",
      description: "Slim banner under Featured Products. Hidden until you publish it.",
      fields: ["image", "heading", "cta"],
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
      {
        id: "hero",
        label: "Hero",
        icon: "imagesmode",
        description:
          "The banner at the top of the about page. Words on the left, one photo beside them.",
        fields: ["eyebrow", "title", "subtitle", "cta", "image"],
      },
      {
        id: "stats",
        label: "Stats",
        icon: "bar_chart",
        description: "Categories, districts, COD, and returns.",
        fields: ["items", "value", "label", "icon"],
      },
      {
        id: "story",
        label: "Story",
        icon: "menu_book",
        description: "Why Implesia Mart started.",
        fields: ["kicker", "title", "paragraphs", "cta", "image"],
      },
      {
        id: "custom-dresses",
        label: "Custom dresses",
        icon: "checkroom",
        description: "Dress block with one photo.",
        fields: ["title", "subtitle", "features", "image", "cta"],
      },
      {
        id: "mission",
        label: "Mission & vision",
        icon: "rocket_launch",
        description: "Two cards — vision and mission.",
        fields: ["vision", "mission"],
      },
      {
        id: "values",
        label: "Values",
        icon: "verified",
        description: "Quality, COD, delivery, and returns.",
        fields: ["kicker", "title", "items"],
      },
      {
        id: "how-it-works",
        label: "How to order",
        icon: "list_alt",
        description: "Four-step order process.",
        fields: ["kicker", "title", "steps"],
      },
      {
        id: "cta",
        label: "CTA",
        icon: "campaign",
        description: "Closing call to action.",
        fields: ["title", "subtitle", "cta"],
      },
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
      {
        id: "hero",
        label: "Hero",
        icon: "imagesmode",
        description: "Opening copy and an optional photo.",
        fields: ["eyebrow", "title", "subtitle", "cta", "image"],
      },
      {
        id: "impact",
        label: "Habits",
        icon: "bar_chart",
        description: "COD, returns, checks, and packing stats.",
        fields: ["kicker", "title", "stats"],
      },
      {
        id: "origin",
        label: "Point of view",
        icon: "menu_book",
        description: "Why quality is a responsibility.",
        fields: ["eyebrow", "title", "body", "quote", "image"],
      },
      {
        id: "commitment",
        label: "Commitment",
        icon: "volunteer_activism",
        description: "Four responsibility cards.",
        fields: ["kicker", "title", "items"],
      },
      {
        id: "quality",
        label: "Quality",
        icon: "fact_check",
        description: "Check process and badges.",
        fields: ["title", "body", "steps", "badges", "image"],
      },
      {
        id: "durability",
        label: "Built to last",
        icon: "all_inclusive",
        description: "Less waste, products that last.",
        fields: ["title", "body", "bullets", "image"],
      },
      {
        id: "cta",
        label: "CTA",
        icon: "campaign",
        description: "Closing call to action.",
        fields: ["title", "subtitle", "cta"],
      },
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
      {
        id: "hero",
        label: "Hero",
        icon: "imagesmode",
        description: "Opening copy and buttons.",
        fields: ["eyebrow", "title", "subtitle", "cta"],
      },
      {
        id: "form",
        label: "Form",
        icon: "edit_note",
        description: "The message form beside the contact channels.",
        fields: ["title", "fields", "cta", "hint"],
      },
      {
        id: "details",
        label: "Contacts",
        icon: "call",
        description: "Call, WhatsApp, email, and service area.",
        fields: ["title", "channels", "social", "badge"],
      },
      {
        id: "support",
        label: "Support",
        icon: "schedule",
        description: "Support hours and quick links.",
        fields: ["title", "hours", "quickLinks"],
      },
      {
        id: "faq",
        label: "FAQ",
        icon: "help",
        description: "Short questions on the contact page.",
        fields: ["title", "subtitle", "items"],
      },
    ],
  },
  {
    id: "blogs",
    label: "Blog",
    icon: "article",
    href: "/admin/pages/blogs",
    publicPath: "/blogs",
    api: "cms/pages/blogs",
    description: "List hero, categories, articles, and the article page.",
    sections: [
      {
        id: "hero",
        label: "Hero",
        icon: "imagesmode",
        description: "Opening copy and article count.",
        fields: ["eyebrow", "title", "subtitle"],
      },
      {
        id: "categories",
        label: "Categories",
        icon: "label",
        description: "Filter tags on the blog list.",
        fields: ["items"],
      },
      {
        id: "listing",
        label: "Listing",
        icon: "view_list",
        description: "Headings, empty state, and card labels.",
        fields: ["heading", "labels"],
      },
      {
        id: "posts",
        label: "Posts",
        icon: "newspaper",
        description: "Articles, covers, and body.",
        fields: ["title", "slug", "excerpt", "body", "related"],
      },
      {
        id: "related",
        label: "Related",
        icon: "link",
        description: "Contents, mentioned products, and more to read.",
        fields: ["title", "subtitle"],
      },
      {
        id: "cta",
        label: "CTA",
        icon: "campaign",
        description: "Closing banner on each article.",
        fields: ["title", "subtitle", "cta"],
      },
    ],
  },
  {
    id: "faqs",
    label: "FAQs",
    icon: "quiz",
    href: "/admin/pages/faqs",
    publicPath: "/faqs",
    api: "cms/pages/faqs",
    description: "Search banner, categories, questions, and the help banner.",
    sections: [
      {
        id: "hero",
        label: "Hero",
        icon: "imagesmode",
        description: "Opening copy, search, and quick searches.",
        fields: ["eyebrow", "title", "subtitle", "placeholder", "trending"],
      },
      {
        id: "categories",
        label: "Categories",
        icon: "label",
        description: "Sidebar topic groups.",
        fields: ["title", "items"],
      },
      {
        id: "listing",
        label: "Results",
        icon: "manage_search",
        description: "Question count and the empty search message.",
        fields: ["count", "empty"],
      },
      {
        id: "callout",
        label: "Callout",
        icon: "info",
        description: "Important note above the questions.",
        fields: ["eyebrow", "body"],
      },
      {
        id: "items",
        label: "Questions",
        icon: "format_list_bulleted",
        description: "Each question and answer.",
        fields: ["question", "answer", "categoryId"],
      },
      {
        id: "help",
        label: "Help",
        icon: "support_agent",
        description: "Closing contact banner.",
        fields: ["title", "subtitle", "cta", "phone"],
      },
    ],
  },
  {
    id: "shipping",
    label: "Shipping & returns",
    icon: "local_shipping",
    href: "/admin/pages/shipping",
    publicPath: "/shipping-returns",
    api: "cms/pages/shipping",
    description: "Delivery, payment, returns, refunds, and support.",
    sections: [
      {
        id: "hero",
        label: "Hero",
        icon: "imagesmode",
        description: "Opening copy.",
        fields: ["eyebrow", "title", "subtitle"],
      },
      {
        id: "contents",
        label: "Contents",
        icon: "toc",
        description: "Sidebar heading and section links.",
        fields: ["title", "subtitle"],
      },
      {
        id: "shipping",
        label: "Shipping",
        icon: "local_shipping",
        description: "Coverage, timelines, and notes.",
        fields: ["heading", "cards", "timelines", "notes"],
      },
      {
        id: "payment",
        label: "Payment",
        icon: "payments",
        description: "Cash on delivery and mobile banking.",
        fields: ["heading", "cards"],
      },
      {
        id: "returns",
        label: "Returns",
        icon: "assignment_return",
        description: "3-day return rules and exceptions.",
        fields: ["heading", "rules", "special"],
      },
      {
        id: "refund",
        label: "Refund",
        icon: "receipt_long",
        description: "Refund steps and the note.",
        fields: ["heading", "steps", "note"],
      },
      {
        id: "support",
        label: "Support",
        icon: "support_agent",
        description: "Closing contact banner.",
        fields: ["title", "subtitle", "cta", "phone"],
      },
      {
        id: "faq",
        label: "FAQ",
        icon: "help",
        description: "Short questions on this page.",
        fields: ["title", "items"],
      },
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
      {
        id: "hero",
        label: "Hero",
        icon: "imagesmode",
        description: "Opening copy and last-updated date.",
        fields: ["eyebrow", "title", "subtitle", "lastUpdated"],
      },
      {
        id: "contents",
        label: "Contents",
        icon: "toc",
        description: "Sidebar heading and section links.",
        fields: ["title", "subtitle"],
      },
      {
        id: "introduction",
        label: "Introduction",
        icon: "info",
        description: "What the policy covers.",
        fields: ["heading", "paragraphs"],
      },
      {
        id: "collection",
        label: "Collection",
        icon: "database",
        description: "What information is stored.",
        fields: ["heading", "cards"],
      },
      {
        id: "usage",
        label: "Use",
        icon: "query_stats",
        description: "How data is used and protected.",
        fields: ["heading", "items", "protection"],
      },
      {
        id: "sharing",
        label: "Sharing",
        icon: "share",
        description: "Limited sharing with courier and payment.",
        fields: ["heading", "body", "chips"],
      },
      {
        id: "rights",
        label: "Rights",
        icon: "gavel",
        description: "View, correct, delete, and how long data is kept.",
        fields: ["heading", "items", "retention"],
      },
      {
        id: "support",
        label: "Contact",
        icon: "support_agent",
        description: "Closing contact banner.",
        fields: ["title", "subtitle", "cta", "phone"],
      },
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
    api: "site/header",
    description: "Top navigation links shown on every page.",
    sections: [],
  },
  {
    id: "footer",
    label: "Footer",
    icon: "bottom_navigation",
    href: "/admin/site/footer",
    publicPath: "/",
    api: "site/footer",
    description: "Brand text, link columns, trust points, and legal links.",
    sections: [],
  },
  {
    id: "contact",
    label: "Contact settings",
    icon: "call",
    href: "/admin/site/contact",
    publicPath: "/contact-us",
    api: "site/contact",
    description: "Phone, WhatsApp and email used across the whole storefront.",
    sections: [],
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
