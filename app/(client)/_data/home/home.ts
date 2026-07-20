import { products } from "../products/products";

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
  price: string;
  imageSrc: string;
  imageAlt: string;
  favorite?: boolean;
  status: "available" | "coming-soon";
};

export const bestSellingProducts: BestSellingProduct[] = products.map((p) => ({
  id: p.id,
  slug: p.slug,
  category: "ট্রেন্ডিং গ্যাজেট",
  name: p.title,
  price: p.status === "coming-soon" ? "Out of Stock" : `৳${p.price.toLocaleString("en-US")}`,
  imageSrc: p.imageSrc,
  imageAlt: p.imageAlt,
  favorite: p.badge === "Best Seller",
  status: p.status,
}));

export const flashSale = {
  titleLines: ["৩৩% পর্যন্ত ছাড়ে", "সানসেট প্রজেকশন ল্যাম্প"],
  description:
    "সীমিত সময়ের অফার — ক্যাশ অন ডেলিভারিতে অর্ডার করুন, ঘরে বসেই পৌঁছে যাবে।",
  badge: "লিমিটেড টাইম অফার",
  cta: "এখনই কিনুন",
  ctaHref: `/products/${sunsetLamp.slug}`,
  imageSrc: "/images/products/lamp/lamp-1.jpg",
  imageAlt: "সানসেট প্রজেকশন ল্যাম্পের অ্যাম্বিয়েন্ট লাইট ইফেক্ট",
};

export const organicHighlight = {
  kicker: "আমাদের প্রতিশ্রুতি",
  title: "কেন ইমপ্লেসিয়া মার্ট থেকে কিনবেন?",
  description:
    "আমরা বিশ্বাস করি, সেরা শপিং এক্সপেরিয়েন্স মানে নিশ্চিন্তে অর্ডার করা। প্রতিটি প্রোডাক্ট মান যাচাই করে বাছাই করা হয়, ক্যাশ অন ডেলিভারিতে ঘরে বসেই পাবেন সারাদেশে, আর কোনো সমস্যা হলে সহজ রিটার্নের সুবিধাও থাকছে।",
  cta: "সব প্রোডাক্ট দেখুন",
  ctaHref: "/products",
  bullets: [
    {
      icon: "payments" as const,
      label: "ক্যাশ অন ডেলিভারি — আগে টাকা লাগবে না",
      title: "ক্যাশ অন ডেলিভারি",
      detail: "আগে টাকা লাগবে না — পণ্য হাতে পেয়ে পেমেন্ট",
    },
    {
      icon: "local_shipping" as const,
      label: "সারাদেশে দ্রুত ডেলিভারি",
      title: "সারাদেশে ডেলিভারি",
      detail: "ঢাকা ও জেলায় দ্রুত, নির্ভরযোগ্য শিপিং",
    },
    {
      icon: "verified" as const,
      label: "প্রতিটি প্রোডাক্ট কোয়ালিটি চেকড",
      title: "কোয়ালিটি চেকড",
      detail: "প্রতিটি প্রোডাক্ট যাচাই করে পাঠানো হয়",
    },
    {
      icon: "assignment_return" as const,
      label: "৩ দিনের ইজি রিটার্ন",
      title: "৩ দিনের ইজি রিটার্ন",
      detail: "সমস্যা হলে সহজেই রিটার্ন করতে পারবেন",
    },
  ],
  images: [
    {
      src: "/images/products/lamp/lamp-1.jpg",
      alt: "সানসেট ল্যাম্প — মুড লাইটিং",
    },
    {
      src: "/images/products/selfie-stand/stand-3.jpg",
      alt: "AI সেলফি স্ট্যান্ড",
    },
    {
      src: "/images/products/lamp/lamp-2.jpg",
      alt: "সানসেট ল্যাম্প ডিটেইল",
    },
    {
      src: "/images/products/selfie-stand/stand-2.jpg",
      alt: "সেলফি স্ট্যান্ড সেটআপ",
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
    timeAgo: "২ সপ্তাহ আগে",
    initials: "রা",
    accent: "#2bc0b5",
  },
  {
    id: "2",
    rating: 5,
    product: "AI সেলফি স্ট্যান্ড",
    quote:
      "রিলস বানানোর জন্য নিয়েছিলাম। মুখ ঘোরালেও ক্যামেরা ফলো করে, হাত ছাড়াই রেকর্ড করা যায়। ডেলিভারিও দ্রুত পেয়েছি।",
    name: "তৌফিক হোসেন",
    location: "মিরপুর, ঢাকা",
    timeAgo: "১০ দিন আগে",
    initials: "তৌ",
    accent: "#0d5c56",
  },
  {
    id: "3",
    rating: 4,
    product: "সানসেট ল্যাম্প",
    quote:
      "ফেসবুক অ্যাড দেখে অর্ডার করেছিলাম, প্রথমে একটু ভয় ছিল। প্রোডাক্ট ভালোই — শুধু ক্যাবলটা একটু ছোট মনে হয়েছে। মোটের ওপর সন্তুষ্ট।",
    name: "সাদিয়া ইসলাম",
    location: "চট্টগ্রাম",
    timeAgo: "৩ সপ্তাহ আগে",
    initials: "সা",
    accent: "#4c5e7d",
  },
  {
    id: "4",
    rating: 5,
    product: "AI সেলফি স্ট্যান্ড",
    quote:
      "অনলাইন ক্লাস নেই, তাই হোল্ডারটা কিনেছি। ব্লুটুথ রিমোট দিয়ে ছবি তোলাও সহজ। কোয়ালিটি দামের চেয়ে ভালো লেগেছে।",
    name: "ইমরান খান",
    location: "সিলেট",
    timeAgo: "১ মাস আগে",
    initials: "ইম",
    accent: "#1a6b64",
  },
  {
    id: "5",
    rating: 5,
    product: "সানসেট ল্যাম্প",
    quote:
      "বান্ধবীকে বার্থডে গিফট দিয়েছি। প্যাকেজিং সুন্দর ছিল, রিমোট দিয়ে কালার চেঞ্জ করতেও পছন্দ হয়েছে তার। আবার অর্ডার করব।",
    name: "নুসরাত জাহান",
    location: "উত্তরা, ঢাকা",
    timeAgo: "৫ দিন আগে",
    initials: "নু",
    accent: "#c4870a",
  },
  {
    id: "6",
    rating: 4,
    product: "AI সেলফি স্ট্যান্ড",
    quote:
      "ট্র্যাকিং স্পিড ভালো, স্ট্যান্ডও মজবুত। ব্যাটারি আর একটু বেশি চললে পারফেক্ট হতো। তবু রোজ ব্যবহার করি।",
    name: "মাহি চৌধুরী",
    location: "রাজশাহী",
    timeAgo: "২ মাস আগে",
    initials: "মা",
    accent: "#3d6b8a",
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
