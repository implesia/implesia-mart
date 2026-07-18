import { placeholderImage, products } from "../products/products";

export const SITE_NAME = "Implesia Mart";

export const navLinks = [
  { href: "/products", label: "ট্রেন্ডিং গ্যাজেট", active: true },
] as const;

export type HeroSlide = {
  id: string;
  badge: string;
  titleLines: readonly [string, string];
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  imageSrc: string;
  imageAlt: string;
};

export const heroSlides: HeroSlide[] = [
  {
    id: "sunset-lamp",
    badge: "বেস্ট সেলার",
    titleLines: ["রুম আলোকিত করুন", "সানসেট ল্যাম্পে"],
    description:
      "রেইনবো ও সানসেট কালারে রুমের পরিবেশ বদলে দিন সেকেন্ডেই। রিলস, ফটোগ্রাফি বা রিলাক্সিং অ্যাম্বিয়েন্সের জন্য পারফেক্ট — এখন মাত্র ৳৯৯৯ টাকায়, ক্যাশ অন ডেলিভারিতে।",
    primaryCta: { label: "অর্ডার করুন", href: "/products/sunset-rainbow-projection-lamp" },
    secondaryCta: { label: "সব প্রোডাক্ট দেখুন", href: "/products" },
    imageSrc: placeholderImage("Sunset Lamp Hero", "0d5c56"),
    imageAlt: "সানসেট প্রজেকশন ল্যাম্প",
  },
  {
    id: "ai-tracking-holder",
    badge: "নতুন এসেছে",
    titleLines: ["হাত ছাড়াই রেকর্ড করুন", "এআই ট্র্যাকিং হোল্ডারে"],
    description:
      "কোনো অ্যাপ ছাড়াই AI ফেস ট্র্যাকিং, ৩৬০° রোটেশন আর ব্লুটুথ রিমোট — লাইভ, রিলস আর ভ্লগিং এখন আরও সহজ। মাত্র ৳১,৯৯৯ টাকায়।",
    primaryCta: { label: "অর্ডার করুন", href: "/products/ai-face-tracking-phone-holder" },
    secondaryCta: { label: "সব প্রোডাক্ট দেখুন", href: "/products" },
    imageSrc: placeholderImage("AI Tracking Holder Hero", "0d5c56"),
    imageAlt: "এআই ফেস ট্র্যাকিং ফোন হোল্ডার",
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
  price: p.status === "coming-soon" ? "কামিং সুন" : `৳${p.price.toLocaleString("en-US")}`,
  imageSrc: p.imageSrc,
  imageAlt: p.imageAlt,
  favorite: p.badge === "Best Seller",
  status: p.status,
}));

const sunsetLamp = products.find((p) => p.slug === "sunset-rainbow-projection-lamp")!;

export const flashSale = {
  titleLines: ["৩৩% পর্যন্ত ছাড়ে", "সানসেট প্রজেকশন ল্যাম্প"],
  badge: "লিমিটেড টাইম অফার",
  cta: "এখনই কিনুন",
  ctaHref: `/products/${sunsetLamp.slug}`,
  imageSrc: placeholderImage("Flash Sale - Sunset Lamp", "0d5c56"),
  imageAlt: "সানসেট প্রজেকশন ল্যাম্প ছাড়ে",
};

export const organicHighlight = {
  kicker: "আমাদের প্রতিশ্রুতি",
  title: "কেন ইমপ্লেসিয়া মার্ট থেকে কিনবেন?",
  description:
    "আমরা বিশ্বাস করি, সেরা শপিং এক্সপেরিয়েন্স মানে নিশ্চিন্তে অর্ডার করা। প্রতিটি প্রোডাক্ট মান যাচাই করে বাছাই করা হয়, ক্যাশ অন ডেলিভারিতে ঘরে বসেই পাবেন সারাদেশে, আর কোনো সমস্যা হলে সহজ রিটার্নের সুবিধাও থাকছে।",
  cta: "সব প্রোডাক্ট দেখুন",
  ctaHref: "/products",
  bullets: [
    { icon: "payments" as const, label: "ক্যাশ অন ডেলিভারি — আগে টাকা লাগবে না" },
    { icon: "local_shipping" as const, label: "সারাদেশে দ্রুত ডেলিভারি" },
    { icon: "verified" as const, label: "প্রতিটি প্রোডাক্ট কোয়ালিটি চেকড" },
    { icon: "assignment_return" as const, label: "৩ দিনের ইজি রিটার্ন" },
  ],
  images: [
    {
      src: placeholderImage("Quality Checked", "4c5e7d"),
      alt: "কোয়ালিটি চেক করা প্রোডাক্ট",
      className: "h-64",
    },
    {
      src: placeholderImage("Cash On Delivery", "0d5c56"),
      alt: "ক্যাশ অন ডেলিভারি",
      className: "h-80 -mt-14",
    },
    {
      src: placeholderImage("Fast Delivery", "2bc0b5"),
      alt: "সারাদেশে দ্রুত ডেলিভারি",
      className: "h-80",
    },
    {
      src: placeholderImage("Easy Return", "4c5e7d"),
      alt: "৩ দিনের ইজি রিটার্ন",
      className: "h-64",
    },
  ],
};

export const testimonials = [
  {
    id: "1",
    quote:
      "সানসেট ল্যাম্পটা অর্ডার করার পর থেকে রুমের পুরো লুকই বদলে গেছে। কালারগুলো এত সুন্দর, আর ক্যাশ অন ডেলিভারিতে পাওয়ায় নিশ্চিন্তে অর্ডার করেছিলাম।",
    name: "রাফিয়া আহমেদ",
    role: "ভেরিফাইড কাস্টমার",
    avatarSrc: placeholderImage("RA", "2bc0b5"),
  },
  {
    id: "2",
    quote:
      "এআই ট্র্যাকিং হোল্ডারটা কনটেন্ট বানানো অনেক সহজ করে দিয়েছে। ডেলিভারি দ্রুত পেয়েছি এবং প্রোডাক্টের কোয়ালিটি দামের তুলনায় অনেক ভালো।",
    name: "তানভীর হোসেন",
    role: "ভেরিফাইড কাস্টমার",
    avatarSrc: placeholderImage("TH", "0d5c56"),
  },
  {
    id: "3",
    quote:
      "ফেসবুকে অ্যাড দেখে অর্ডার করেছিলাম, প্রথমে একটু সন্দেহ ছিল। কিন্তু প্রোডাক্ট হাতে পাওয়ার পর পুরো সন্তুষ্ট, এখন নিয়মিত কাস্টমার হয়ে গেছি।",
    name: "সাদিয়া ইসলাম",
    role: "ভেরিফাইড কাস্টমার",
    avatarSrc: placeholderImage("SI", "4c5e7d"),
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
