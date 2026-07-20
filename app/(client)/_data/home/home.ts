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
const powerBank = products.find((p) => p.slug === "slim-power-bank-10000mah")!;

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
    primaryCta: { label: "এখনই অর্ডার", href: `/products/${sunsetLamp.slug}` },
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
    primaryCta: { label: "অর্ডার করুন", href: `/products/${selfieStand.slug}` },
    secondaryCta: { label: "বিস্তারিত", href: `/products/${selfieStand.slug}` },
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
    primaryCta: { label: "কাস্টম অর্ডার", href: `/products/${womensGown.slug}` },
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
    primaryCta: { label: "অর্ডার করুন", href: `/products/${babyFrock.slug}` },
    secondaryCta: { label: "যোগাযোগ", href: "/contact-us" },
    imageSrc: babyFrock.imageSrc,
    imageAlt: babyFrock.imageAlt,
    accent: "rose",
  },
  {
    id: powerBank.slug,
    eyebrow: "শীঘ্রই আসছে",
    title: "স্লিম পাওয়ার ব্যাংক ১০,০০০mAh",
    description:
      "হালকা ডিজাইন, ফাস্ট চার্জিং সাপোর্ট — দৈনন্দিন ব্যাটারি ব্যাকআপের স্মার্ট সমাধান।",
    priceLabel: money(powerBank.price),
    compareAtLabel: powerBank.compareAtPrice
      ? money(powerBank.compareAtPrice)
      : undefined,
    discountLabel: discountLabel(powerBank.price, powerBank.compareAtPrice),
    primaryCta: { label: "প্রোডাক্ট দেখুন", href: `/products/${powerBank.slug}` },
    secondaryCta: { label: "সব প্রোডাক্ট", href: "/products" },
    imageSrc: powerBank.imageSrc,
    imageAlt: powerBank.imageAlt,
    accent: "ink",
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
  status: "available" | "coming-soon";
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
  ctaHref: `/products/${sunsetLamp.slug}`,
  secondaryCta: { label: "বিস্তারিত দেখুন", href: `/products/${sunsetLamp.slug}` },
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
    { value: "COD", label: "ক্যাশ অন ডেলিভারি" },
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

export const testimonials = [
  {
    id: "1",
    rating: 5,
    product: "সানসেট ল্যাম্প",
    quote:
      "রুমটা একদম অন্যরকম লাগে এখন। রাতে লাইট জ্বালালে কালারগুলো খুব সুন্দর। ক্যাশ অন ডেলিভারিতে নিয়ে দেখে টাকা দিয়েছি — কোনো ঝামেলা হয়নি।",
    name: "রাফিয়া আহমেদ",
    location: "ধানমন্ডি, ঢাকা",
    initials: "রা",
    accent: "#0d9488",
  },
  {
    id: "2",
    rating: 5,
    product: "AI ফোন হোল্ডার",
    quote:
      "রিলস বানানোর জন্য নিয়েছিলাম। মুখ ঘোরালেও ক্যামেরা ফলো করে, হাত ছাড়াই রেকর্ড করা যায়। ডেলিভারিও দ্রুত পেয়েছি।",
    name: "তৌফিক হোসেন",
    location: "মিরপুর, ঢাকা",
    initials: "তৌ",
    accent: "#0f766e",
  },
  {
    id: "3",
    rating: 5,
    product: "কাস্টম গাউন",
    quote:
      "বিয়ের অনুষ্ঠানের জন্য কাস্টম গাউন অর্ডার করেছিলাম। মাপ পারফেক্ট, এমব্রয়ডারিও সুন্দর। হোয়াটসঅ্যাপে ডিজাইন কনফার্ম করা সহজ ছিল।",
    name: "সাদিয়া ইসলাম",
    location: "চট্টগ্রাম",
    initials: "সা",
    accent: "#b45309",
  },
  {
    id: "4",
    rating: 5,
    product: "AI ফোন হোল্ডার",
    quote:
      "অনলাইন ক্লাস নেই, তাই হোল্ডারটা কিনেছি। ব্লুটুথ রিমোট দিয়ে ছবি তোলাও সহজ। কোয়ালিটি দামের চেয়ে ভালো লেগেছে।",
    name: "ইমরান খান",
    location: "সিলেট",
    initials: "ইম",
    accent: "#115e59",
  },
  {
    id: "5",
    rating: 5,
    product: "সানসেট ল্যাম্প",
    quote:
      "বান্ধবীকে বার্থডে গিফট দিয়েছি। প্যাকেজিং সুন্দর ছিল, রিমোট দিয়ে কালার চেঞ্জ করতেও পছন্দ হয়েছে তার। আবার অর্ডার করব।",
    name: "নুসরাত জাহান",
    location: "উত্তরা, ঢাকা",
    initials: "নু",
    accent: "#c4870a",
  },
  {
    id: "6",
    rating: 5,
    product: "বেবি পার্টি ফ্রক",
    quote:
      "মেয়ের জন্মদিনের জন্য কাস্টম ফ্রক করেছি। কালার ও ডিজাইন ঠিক যেমন চেয়েছিলাম। ডেলিভারি সময়মতো পেয়েছি।",
    name: "মাহি চৌধুরী",
    location: "রাজশাহী",
    initials: "মা",
    accent: "#be185d",
  },
] as const;

export const faqSections = [
  {
    category: "অর্ডার ট্র্যাকিং",
    question: "আমার অর্ডার কীভাবে ট্র্যাক করব?",
    answer:
      "অর্ডার কনফার্ম হওয়ার পর আমাদের কাস্টমার সাপোর্ট থেকে ফোন কলে অথবা SMS-এর মাধ্যমে ডেলিভারি স্ট্যাটাস জানিয়ে দেওয়া হয়। প্রয়োজনে আপনি নিজেও যোগাযোগ করে সর্বশেষ অবস্থা জানতে পারবেন।",
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
