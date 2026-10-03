import { categoryLabels, products } from "../products/products";

export const SITE_NAME = "Implesia Mart";

export const navLinks = [
  { href: "/products", label: "Trending Gadgets", active: true },
] as const;

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  priceLabel: string;
  compareAtLabel?: string;
  discountLabel?: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  imageSrc: string;
  imageAlt: string;
  accent: "gold" | "teal" | "rose" | "ink";
};

function money(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

function discountLabel(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return undefined;
  const pct = Math.round(((compareAt - price) / compareAt) * 100);
  return `${pct}% ছাড়`;
}

const sunsetLamp = products.find((p) => p.slug === "sunset-rainbow-projection-lamp")!;
const selfieStand = products.find((p) => p.slug === "ai-face-tracking-phone-holder")!;
const womensGown = products.find((p) => p.slug === "custom-gorgeous-womens-gown")!;
const babyFrock = products.find((p) => p.slug === "custom-baby-party-frock")!;

export const heroSlides: HeroSlide[] = [
  {
    id: sunsetLamp.slug,
    eyebrow: "বেস্ট সেলার গ্যাজেট",
    title: "সানসেট ল্যাম্পে বদলে যাক রুমের মুড",
    description:
      "ওয়ার্ম প্রজেকশন লাইটে ঘর, ডেস্ক বা কনটেন্ট শট — এক ল্যাম্পেই প্রিমিয়াম অ্যামবিয়েন্স।",
    priceLabel: money(sunsetLamp.price),
    compareAtLabel: sunsetLamp.compareAtPrice
      ? money(sunsetLamp.compareAtPrice)
      : undefined,
    discountLabel: discountLabel(sunsetLamp.price, sunsetLamp.compareAtPrice),
    primaryCta: { label: "এখনই অর্ডার", href: "/products" },
    secondaryCta: { label: "সব গ্যাজেট", href: "/products" },
    imageSrc: "/images/products/lamp/lamp-5.jpg",
    imageAlt: sunsetLamp.imageAlt,
    accent: "gold",
  },
  {
    id: selfieStand.slug,
    eyebrow: "নতুন অ্যাডিশন",
    title: "AI ট্র্যাকিংয়ে একাই প্রো শুট",
    description:
      "ফেস ট্র্যাকিং হোল্ডার আপনাকে ফ্রেমে রাখে — রিলস, ভ্লগ ও লাইভ এখন হাতমুক্ত।",
    priceLabel: money(selfieStand.price),
    compareAtLabel: selfieStand.compareAtPrice
      ? money(selfieStand.compareAtPrice)
      : undefined,
    discountLabel: discountLabel(selfieStand.price, selfieStand.compareAtPrice),
    primaryCta: { label: "অর্ডার করুন", href: "/products" },
    secondaryCta: { label: "বিস্তারিত", href: "/products" },
    imageSrc: "/images/products/selfie-stand/stand-1.jpg",
    imageAlt: selfieStand.imageAlt,
    accent: "teal",
  },
  {
    id: womensGown.slug,
    eyebrow: "হাতে তৈরি ফ্যাশন",
    title: "অনুষ্ঠানের জন্য কাস্টম গাউন",
    description:
      "মাপ ও ডিজাইন অনুযায়ী এমব্রয়ডারি গাউন — স্পেশাল ডে-তে নিজের লুক নিজেই নির্ধারণ করুন।",
    priceLabel: `শুরু ${money(womensGown.price)}`,
    primaryCta: { label: "কাস্টম অর্ডার", href: "/products" },
    secondaryCta: { label: "সব ড্রেস", href: "/products" },
    imageSrc: womensGown.imageSrc,
    imageAlt: womensGown.imageAlt,
    accent: "rose",
  },
  {
    id: babyFrock.slug,
    eyebrow: "কাস্টম বেবি ওয়্যার",
    title: "পার্টির জন্য বেবি ফ্রক",
    description:
      "কালার, ডিটেইল ও মাপ কাস্টমাইজ করে হাতে তৈরি — ছোট্ট তারকার পার্টি লুক সম্পূর্ণ।",
    priceLabel: `শুরু ${money(babyFrock.price)}`,
    primaryCta: { label: "অর্ডার করুন", href: "/products" },
    secondaryCta: { label: "যোগাযোগ", href: "/contact-us" },
    imageSrc: babyFrock.imageSrc,
    imageAlt: babyFrock.imageAlt,
    accent: "rose",
  },
];

export type BestSellingProduct = {
  id: string;
  slug: string;
  category: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  unitLabel?: string;
  imageSrc: string;
  imageAlt: string;
  badge?: "New" | "Best Seller" | "Limited";
  status: "available" | "sold-out" | "coming-soon";
};

/** Curated home carousel — available picks first, then upcoming gadgets. */
const BEST_SELLING_SLUGS = [
  "sunset-rainbow-projection-lamp",
  "ai-face-tracking-phone-holder",
  "custom-gorgeous-womens-gown",
  "custom-baby-party-frock",
  "baby-comfort-top-shorts-set",
  "womens-daily-wear-dress",
  "slim-power-bank-10000mah",
  "tws-wireless-earbuds",
  "mini-thermal-printer",
  "smart-fitness-ring",
  "magnetic-car-phone-holder",
  "bluetooth-neckband-earphone",
] as const;

export const bestSellingProducts: BestSellingProduct[] = BEST_SELLING_SLUGS.map(
  (slug) => {
    const p = products.find((item) => item.slug === slug);
    if (!p) throw new Error(`Missing product for home carousel: ${slug}`);
    return {
      id: p.id,
      slug: p.slug,
      category: categoryLabels[p.categoryId],
      name: p.title,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      unitLabel: p.unitLabel,
      imageSrc: p.imageSrc,
      imageAlt: p.imageAlt,
      badge: p.badge,
      status: p.status,
    };
  },
);

export const flashSale = {
  eyebrow: "লিমিটেড অফার",
  title: "সানসেট ল্যাম্পে এখনই ছাড়",
  highlight: "৩৩% পর্যন্ত সেভ",
  description:
    "সীমিত সময়ের অফার — ক্যাশ অন ডেলিভারিতে অর্ডার করুন, সারাদেশে ঘরে বসেই পৌঁছে যাবে।",
  badge: "আজকের ডিল",
  cta: "এখনই অর্ডার",
  ctaHref: "/products",
  secondaryCta: { label: "বিস্তারিত দেখুন", href: "/products" },
  priceLabel: money(sunsetLamp.price),
  compareAtLabel: sunsetLamp.compareAtPrice
    ? money(sunsetLamp.compareAtPrice)
    : undefined,
  imageSrc: "/images/products/lamp/lamp-5.jpg",
  imageAlt: sunsetLamp.imageAlt,
  trustNote: "ক্যাশ অন ডেলিভারি · সারাদেশে",
};

export const organicHighlight = {
  kicker: "আমাদের প্রতিশ্রুতি",
  title: "কেন ইমপ্লেসিয়া মার্ট থেকে কিনবেন?",
  description:
    "কোয়ালিটি চেকড প্রোডাক্ট, সারাদেশে ক্যাশ অন ডেলিভারি আর সহজ রিটার্ন — নিশ্চিন্তে অর্ডার করুন।",
  cta: "সব প্রোডাক্ট দেখুন",
  ctaHref: "/products",
  storeBadge: "কোয়ালিটি ভেরিফাইড স্টোর",
  stats: [
    { value: "৬৪", label: "জেলায় ডেলিভারি" },
    { value: "ক্যাশ", label: "ক্যাশ অন ডেলিভারি" },
    { value: "৩ দিন", label: "ইজি রিটার্ন" },
  ],
  bullets: [
    {
      icon: "payments" as const,
      title: "ক্যাশ অন ডেলিভারি",
      detail: "হাতে পেয়ে যাচাই করে তারপর পেমেন্ট",
    },
    {
      icon: "local_shipping" as const,
      title: "সারাদেশে ডেলিভারি",
      detail: "ঢাকাসহ ৬৪ জেলায় নির্ভরযোগ্য শিপিং",
    },
    {
      icon: "verified" as const,
      title: "কোয়ালিটি চেকড",
      detail: "প্রতিটি প্রোডাক্ট যাচাই করে পাঠানো হয়",
    },
    {
      icon: "assignment_return" as const,
      title: "৩ দিনের ইজি রিটার্ন",
      detail: "সমস্যা হলে সহজেই রিটার্ন বা এক্সচেঞ্জ",
    },
  ],
  images: [
    {
      src: "/images/products/lamp/lamp-5.jpg",
      alt: "সানসেট প্রজেকশন ল্যাম্প",
      label: "বেস্ট সেলার",
    },
    {
      src: "/images/products/selfie-stand/stand-5.jpg",
      alt: "AI ফেস ট্র্যাকিং ফোন হোল্ডার",
      label: "নতুন",
    },
    {
      src: "/images/products/baby-products/wedding-dress.jpeg",
      alt: "কাস্টম উইমেন্স গাউন",
      label: "কাস্টম",
    },
    {
      src: "/images/products/earbuts/earbuts.jpg",
      alt: "TWS ওয়্যারলেস ইয়ারবাডস",
      label: "গ্যাজেট",
    },
  ],
};

/**
 * Customer review screenshots. Drop the image at `imageSrc`
 * (under `public/`) and it shows in the home review wall.
 * Suggested crop: a phone chat or comment screenshot, portrait.
 */
export const testimonials = [
  {
    id: "sunset-lamp-1",
    imageSrc: "/images/reviews/sunset-lamp-1.jpg",
    imageAlt: "সানসেট ল্যাম্পের কাস্টমার রিভিউ স্ক্রিনশট",
    product: "সানসেট ল্যাম্প",
    channel: "WhatsApp",
  },
  {
    id: "phone-holder-1",
    imageSrc: "/images/reviews/phone-holder-1.jpg",
    imageAlt: "এআই ফোন হোল্ডারের কাস্টমার রিভিউ স্ক্রিনশট",
    product: "AI ফোন হোল্ডার",
    channel: "Messenger",
  },
  {
    id: "gown-1",
    imageSrc: "/images/reviews/gown-1.jpg",
    imageAlt: "কাস্টম গাউনের কাস্টমার রিভিউ স্ক্রিনশট",
    product: "কাস্টম গাউন",
    channel: "WhatsApp",
  },
  {
    id: "phone-holder-2",
    imageSrc: "/images/reviews/phone-holder-2.jpg",
    imageAlt: "এআই ফোন হোল্ডারের আরেকটি কাস্টমার রিভিউ স্ক্রিনশট",
    product: "AI ফোন হোল্ডার",
    channel: "WhatsApp",
  },
  {
    id: "sunset-lamp-2",
    imageSrc: "/images/reviews/sunset-lamp-2.jpg",
    imageAlt: "সানসেট ল্যাম্পের আরেকটি কাস্টমার রিভিউ স্ক্রিনশট",
    product: "সানসেট ল্যাম্প",
    channel: "Messenger",
  },
  {
    id: "baby-frock-1",
    imageSrc: "/images/reviews/baby-frock-1.jpg",
    imageAlt: "বেবি পার্টি ফ্রকের কাস্টমার রিভিউ স্ক্রিনশট",
    product: "বেবি পার্টি ফ্রক",
    channel: "WhatsApp",
  },
] as const;

export const faqSections = [
  {
    category: "অর্ডার ট্র্যাকিং",
    question: "আমার অর্ডার কীভাবে ট্র্যাক করব?",
    answer:
      "আমার অর্ডার পেজে অর্ডার নম্বর আর চেকআউটের মোবাইল দিলে স্ট্যাটাস দেখা যায়। একই ব্রাউজারে করলে নম্বর সেভ থাকে। দরকার হলে কল বা হোয়াটসঅ্যাপেও জানানো হয়।",
  },
  {
    category: "পেমেন্ট ও ক্যাশ অন ডেলিভারি",
    question: "অর্ডারের জন্য কি আগে টাকা পরিশোধ করতে হবে?",
    answer:
      "না। আমরা পুরো বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা দিচ্ছি — প্রোডাক্ট হাতে পেয়ে, ভালোভাবে দেখে তারপর টাকা পরিশোধ করতে পারবেন।",
  },
  {
    category: "রিটার্ন ও রিপ্লেসমেন্ট",
    question: "প্রোডাক্ট পছন্দ না হলে রিটার্ন করা যাবে?",
    answer:
      "হ্যাঁ। প্রোডাক্ট ড্যামেজ বা ভুল হলে ডেলিভারির ৩ দিনের মধ্যে জানালে আমরা রিটার্ন বা রিপ্লেসমেন্ট প্রক্রিয়া সম্পন্ন করে দিই।",
  },
  {
    category: "কাস্টমার সাপোর্ট",
    question: "কোনো সমস্যা হলে কীভাবে যোগাযোগ করব?",
    answer:
      "আমাদের কাস্টমার সাপোর্ট টিম ফোন, ফেসবুক পেজ ও ওয়েবসাইটের যোগাযোগ ফর্মের মাধ্যমে সবসময় সাহায্যের জন্য প্রস্তুত। আমরা দ্রুততম সময়ে উত্তর দেওয়ার চেষ্টা করি।",
  },
  {
    category: "প্রোডাক্ট কোয়ালিটি",
    question: "প্রোডাক্টগুলো কি কোয়ালিটি চেক করা হয়?",
    answer:
      "হ্যাঁ। ডেলিভারির আগে প্রতিটি প্রোডাক্ট চালু করে পরীক্ষা করা হয়, যাতে আপনার হাতে পৌঁছায় সম্পূর্ণ কার্যকর একটি প্রোডাক্ট।",
  },
  {
    category: "ডেলিভারি সময়",
    question: "ডেলিভারি পেতে কত সময় লাগে?",
    answer:
      "ঢাকার ভেতরে সাধারণত ২৪-৪৮ ঘণ্টা এবং ঢাকার বাইরে ২৪-৭২ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়।",
  },
] as const;
