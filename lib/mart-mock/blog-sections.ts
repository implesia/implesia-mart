import { WHATSAPP_HREF } from "@/app/(client)/_data/contact/contact";
import {
  blogPosts,
  type BlogContentBlock,
} from "@/app/(client)/_data/blogs/blogs";

import { MOCK_EVENT } from "./store";

const KEY = "implesia.admin.blog-sections.v1";

const CATEGORY_SEED: { id: string; label: string }[] = [
  { id: "buying", label: "বায়িং গাইড" },
  { id: "review", label: "রিভিউ" },
  { id: "lifestyle", label: "লাইফস্টাইল" },
  { id: "compare", label: "কম্প্যারিজন" },
  { id: "fashion", label: "ফ্যাশন" },
  { id: "tips", label: "টিপস" },
];

export type BlogBlock =
  | { id: string; type: "paragraph"; text: string; isActive?: boolean }
  | { id: string; type: "heading"; text: string; isActive?: boolean }
  | { id: string; type: "list"; items: string[]; isActive?: boolean }
  | {
      id: string;
      type: "callout";
      title: string;
      text: string;
      variant: "tip" | "note";
      isActive?: boolean;
    };

export type BlogCategoryItem = {
  id: string;
  label: string;
  isActive?: boolean;
};

export type BlogPostRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categoryId: string;
  coverImage: string;
  coverAlt: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
  relatedProductSlugs: string[];
  content: BlogBlock[];
  isActive?: boolean;
};

export type BlogHeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  countLabel: string;
  isActive?: boolean;
};

export type BlogListingContent = {
  heading: string;
  allLabel: string;
  countSuffix: string;
  emptyMessage: string;
  featuredLabel: string;
  readLabel: string;
  readSuffix: string;
  tabsLabel: string;
  isActive?: boolean;
};

export type BlogCategoriesContent = {
  items: BlogCategoryItem[];
  isActive?: boolean;
};

export type BlogRelatedContent = {
  tocTitle: string;
  productsTitle: string;
  productsSubtitle: string;
  postsTitle: string;
  postsSubtitle: string;
  postsLinkLabel: string;
  comingSoonLabel: string;
  viewLabel: string;
  detailsLabel: string;
  isActive?: boolean;
};

export type BlogCtaContent = {
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  isActive?: boolean;
};

export type BlogSections = {
  hero: BlogHeroContent;
  listing: BlogListingContent;
  categories: BlogCategoriesContent;
  posts: BlogPostRecord[];
  related: BlogRelatedContent;
  cta: BlogCtaContent;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isBlogSlug(value: string) {
  return SLUG_PATTERN.test(value);
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(MOCK_EVENT));
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function categoryIdFor(label: string) {
  return CATEGORY_SEED.find((item) => item.label === label)?.id ?? "buying";
}

function toBlock(postId: string, block: BlogContentBlock, index: number): BlogBlock {
  const id = `${postId}-b${index + 1}`;
  if (block.type === "heading") return { id, type: "heading", text: block.text };
  if (block.type === "list") return { id, type: "list", items: [...block.items] };
  if (block.type === "callout") {
    return {
      id,
      type: "callout",
      title: block.title,
      text: block.text,
      variant: block.variant === "note" ? "note" : "tip",
    };
  }
  return { id, type: "paragraph", text: block.text };
}

export function seedBlogSections(): BlogSections {
  return {
    hero: {
      eyebrow: "গাইড ও ব্লগ",
      title: "গ্যাজেট ও গর্জিয়াস ড্রেস — স্পষ্ট গাইড",
      subtitle: "বায়িং গাইড থেকে কাস্টম ড্রেস টিপস — সিদ্ধান্ত সহজ করতে বাংলায়।",
      countLabel: "আর্টিকেল",
    },
    listing: {
      heading: "সর্বশেষ আর্টিকেল",
      allLabel: "সব",
      countSuffix: "টি আর্টিকেল",
      emptyMessage: "এই ক্যাটাগরিতে এখনো কোনো আর্টিকেল নেই।",
      featuredLabel: "ফিচার্ড",
      readLabel: "পড়ুন",
      readSuffix: "পড়া",
      tabsLabel: "ব্লগ ক্যাটাগরি",
    },
    categories: {
      items: CATEGORY_SEED.map((item) => ({ ...item })),
    },
    posts: blogPosts.map((post, index) => {
      const id = `post-${index + 1}`;
      return {
        id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        categoryId: categoryIdFor(post.category),
        coverImage: post.coverImage,
        coverAlt: post.coverAlt,
        author: post.author,
        authorRole: post.authorRole,
        publishedAt: post.publishedAt,
        readTime: post.readTime,
        tags: [...post.tags],
        relatedProductSlugs: [...post.relatedProductSlugs],
        content: post.content.map((block, blockIndex) => toBlock(id, block, blockIndex)),
      };
    }),
    related: {
      tocTitle: "এই আর্টিকেলে",
      productsTitle: "এই আর্টিকেলে উল্লেখিত প্রোডাক্ট",
      productsSubtitle: "স্টকে থাকলে অর্ডার করুন; শীঘ্রই আসছে আইটেম এখনো কেনা যাবে না।",
      postsTitle: "আরও পড়ুন",
      postsSubtitle: "সম্পর্কিত গাইড",
      postsLinkLabel: "সব ব্লগ",
      comingSoonLabel: "শীঘ্রই আসছে",
      viewLabel: "দেখুন",
      detailsLabel: "বিস্তারিত",
    },
    cta: {
      title: "প্রোডাক্ট নিয়ে জানতে চান?",
      subtitle: "অর্ডার, মাপ বা স্টক — কল বা হোয়াটসঅ্যাপে জিজ্ঞাসা করুন।",
      primaryLabel: "সব প্রোডাক্ট",
      primaryHref: "/products",
      secondaryLabel: "হোয়াটসঅ্যাপ",
      secondaryHref: WHATSAPP_HREF,
    },
  };
}

export function readBlogSections(): BlogSections {
  const seed = seedBlogSections();
  const stored = readJson<Partial<BlogSections>>(KEY);
  if (!stored) return seed;
  return {
    hero: { ...seed.hero, ...stored.hero },
    listing: { ...seed.listing, ...stored.listing },
    categories: {
      isActive: stored.categories?.isActive,
      items: stored.categories?.items ?? seed.categories.items,
    },
    posts: stored.posts ?? seed.posts,
    related: { ...seed.related, ...stored.related },
    cta: { ...seed.cta, ...stored.cta },
  };
}

export function saveBlogSections(sections: BlogSections) {
  writeJson(KEY, sections);
}

export function blankBlogCategory(): BlogCategoryItem {
  return { id: newId("cat"), label: "", isActive: true };
}

export function blankBlogBlock(type: BlogBlock["type"] = "paragraph"): BlogBlock {
  const id = newId("block");
  if (type === "list") return { id, type: "list", items: [""], isActive: true };
  if (type === "callout") {
    return { id, type: "callout", title: "", text: "", variant: "tip", isActive: true };
  }
  if (type === "heading") return { id, type: "heading", text: "", isActive: true };
  return { id, type: "paragraph", text: "", isActive: true };
}

export function blankBlogPost(categoryId: string): BlogPostRecord {
  return {
    id: newId("post"),
    slug: "",
    title: "",
    excerpt: "",
    categoryId,
    coverImage: "",
    coverAlt: "",
    author: "ইমপ্লেসিয়া মার্ট টিম",
    authorRole: "",
    publishedAt: "",
    readTime: "",
    tags: [],
    relatedProductSlugs: [],
    content: [blankBlogBlock("paragraph")],
    isActive: true,
  };
}

export function categoryLabel(sections: BlogSections, categoryId: string) {
  return sections.categories.items.find((item) => item.id === categoryId)?.label ?? "";
}

export function moveList<T>(items: T[], index: number, direction: -1 | 1) {
  const next = index + direction;
  if (next < 0 || next >= items.length) return items;
  const copy = items.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}
