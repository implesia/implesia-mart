import { placeholderImage, products, type Product } from "./products";

export type ProductDetail = Product & {
  slug: string;
  breadcrumbs: { label: string; href?: string }[];
  gallery: { src: string; alt: string }[];
  tagline: string;
  rating?: { value: number; count: number };
  stockLabel: string;
  description: string;
  keyFeatures?: string[];
  colorOptions?: { id: string; name: string; swatch: string }[];
  materialDetails?: { label: string; value: string }[];
  delivery: { icon: string; title: string; description: string }[];
  details: {
    heading: string;
    body: string;
    bullets: string[];
    authenticity: {
      title: string;
      body: string;
      imageSrc: string;
      imageAlt: string;
    };
  };
  reviews?: {
    average: number;
    total: number;
    breakdown: { stars: 5 | 4 | 3 | 2 | 1; percent: number }[];
    items: {
      id: string;
      initials: string;
      name: string;
      meta: string;
      rating: number;
      quote: string;
    }[];
  };
  related: {
    id: string;
    slug: string;
    title: string;
    priceLabel: string;
    imageSrc: string;
    imageAlt: string;
    status?: Product["status"];
  }[];
};

const STANDARD_DELIVERY = [
  {
    icon: "payments",
    title: "ক্যাশ অন ডেলিভারি",
    description: "প্রোডাক্ট হাতে পাওয়ার পর টাকা পরিশোধ করুন। আগে থেকে পেমেন্টের প্রয়োজন নেই।",
  },
  {
    icon: "local_shipping",
    title: "সারাদেশে ডেলিভারি",
    description: "ঢাকার ভেতরে ২৪-৪৮ ঘণ্টা, ঢাকার বাইরে ২৪-৭২ ঘণ্টার মধ্যে ডেলিভারি পাবেন।",
  },
  {
    icon: "assignment_return",
    title: "৩ দিনের ইজি রিটার্ন",
    description: "প্রোডাক্ট ড্যামেজ বা ভিন্ন হলে সহজে রিটার্ন বা রিপ্লেসমেন্ট করা যাবে।",
  },
];

function buildRelatedFromProducts(excludeSlug: string) {
  return products
    .filter((p) => p.slug !== excludeSlug)
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      priceLabel:
        p.status === "coming-soon" ? "কামিং সুন" : `৳${p.price.toLocaleString("en-US")}`,
      imageSrc: p.imageSrc,
      imageAlt: p.imageAlt,
      status: p.status,
    }));
}

const sunsetLampDetail: ProductDetail = {
  ...products.find((p) => p.slug === "sunset-rainbow-projection-lamp")!,
  tagline: "রুম ডেকোর গ্যাজেট",
  rating: { value: 4.8, count: 96 },
  stockLabel: "স্টকে আছে",
  breadcrumbs: [
    { label: "হোম", href: "/" },
    { label: "ট্রেন্ডিং গ্যাজেট", href: "/products" },
    { label: "সানসেট প্রজেকশন ল্যাম্প" },
  ],
  gallery: [
    { src: placeholderImage("Sunset Lamp"), alt: "সানসেট প্রজেকশন ল্যাম্প - মেইন ভিউ" },
    { src: placeholderImage("Sunset Lamp - Room"), alt: "রুমে জ্বালানো অবস্থায় সানসেট ল্যাম্প" },
    { src: placeholderImage("Sunset Lamp - Remote"), alt: "রিমোট কন্ট্রোল সহ সানসেট ল্যাম্প" },
    { src: placeholderImage("Sunset Lamp - Colors"), alt: "সানসেট ল্যাম্পের বিভিন্ন কালার মোড" },
  ],
  description:
    "রুমের পরিবেশকে সেকেন্ডেই বদলে দিতে পারে এই সানসেট প্রজেকশন ল্যাম্প। সূর্যাস্তের মতো উষ্ণ কমলা আলো থেকে শুরু করে রেইনবো কালার মোড — যেকোনো দেয়ালে প্রজেক্ট করে তৈরি করে ইনস্টাগ্রাম-পারফেক্ট অ্যাম্বিয়েন্স। রুম ডেকোরের জন্য, রিলস/টিকটক ভিডিওর ব্যাকগ্রাউন্ডের জন্য অথবা প্রিয়জনকে গিফট করার জন্য — সবদিক থেকেই এটি একটি পারফেক্ট চয়েস।",
  keyFeatures: [
    "১৬ কালার সানসেট ও রেইনবো লাইট মোড",
    "রিমোট কন্ট্রোল দিয়ে সহজে কালার ও অ্যাঙ্গেল পরিবর্তন",
    "USB পাওয়ার্ড — ফোন চার্জার বা পাওয়ার ব্যাংক দিয়েই চলে",
    "৩৬০° রোটেটেবল হেড, ঘরের যেকোনো দেয়াল বা সিলিংয়ে আলো ফেলা যায়",
  ],
  materialDetails: [
    { label: "বিদ্যুৎ উৎস", value: "USB (5V, Type-A)" },
    { label: "ওজন", value: "প্রায় ২৫০ গ্রাম" },
    { label: "উপকরণ", value: "ABS প্লাস্টিক + অ্যালুমিনিয়াম বেস" },
    { label: "বক্সে যা থাকছে", value: "ল্যাম্প, রিমোট কন্ট্রোল, USB ক্যাবল, ইউজার গাইড" },
  ],
  delivery: STANDARD_DELIVERY,
  details: {
    heading: "কেন এই সানসেট ল্যাম্প নেবেন?",
    body: "এই ল্যাম্পটি ডিজাইন করা হয়েছে আপনার রুমকে মুহূর্তের মধ্যে একটি রিলাক্সিং ও এস্থেটিক জায়গায় পরিণত করার জন্য। সহজ সেটআপ, হালকা ওজন এবং যেকোনো ইউএসবি পোর্টে চলার সুবিধার কারণে বেডরুম, স্টাডি টেবিল, কফি শপ কর্নার বা গিফটের জন্য এটি সমান কার্যকর।",
    bullets: [
      "১ মিনিটের মধ্যে সেটআপ, কোনো টুলস দরকার নেই",
      "ফটোগ্রাফি ও ভিডিও কনটেন্টের জন্য পারফেক্ট ব্যাকগ্রাউন্ড লাইট",
      "জন্মদিন, অ্যানিভার্সারি বা যেকোনো গিফটের জন্য উপযুক্ত",
      "লো পাওয়ার কনজাম্পশন, দীর্ঘ সময় চালানো যায় নিশ্চিন্তে",
    ],
    authenticity: {
      title: "কোয়ালিটি চেকড প্রোডাক্ট",
      body: "প্রতিটি ল্যাম্প ডেলিভারির আগে চালু করে পরীক্ষা করা হয়, যাতে আপনার হাতে পৌঁছায় সম্পূর্ণ কার্যকর একটি প্রোডাক্ট।",
      imageSrc: placeholderImage("Quality Checked"),
      imageAlt: "কোয়ালিটি চেক করা প্রোডাক্ট",
    },
  },
  reviews: {
    average: 4.8,
    total: 96,
    breakdown: [
      { stars: 5, percent: 84 },
      { stars: 4, percent: 12 },
      { stars: 3, percent: 3 },
      { stars: 2, percent: 1 },
      { stars: 1, percent: 0 },
    ],
    items: [
      {
        id: "r1",
        initials: "রি",
        name: "রিফাত হাসান",
        meta: "ভেরিফাইড কাস্টমার • ২ সপ্তাহ আগে",
        rating: 5,
        quote:
          "রুমের লাইটিং পুরোপুরি বদলে গেছে। কালার মোডগুলো খুব সুন্দর, আর দাম হিসেবে কোয়ালিটি অনেক ভালো। ডেলিভারিও দ্রুত পেয়েছি।",
      },
      {
        id: "r2",
        initials: "নি",
        name: "নুসরাত জাহান",
        meta: "ভেরিফাইড কাস্টমার • ১ মাস আগে",
        rating: 5,
        quote:
          "বান্ধবীকে বার্থডে গিফট দিয়েছিলাম, খুব পছন্দ হয়েছে ওর। প্যাকেজিং প্রিমিয়াম ছিল এবং রিমোট দিয়ে ইউজ করাও সহজ।",
      },
      {
        id: "r3",
        initials: "তা",
        name: "তানভীর আহমেদ",
        meta: "ভেরিফাইড কাস্টমার • ৩ সপ্তাহ আগে",
        rating: 4,
        quote:
          "প্রোডাক্ট ভালো, কালার কোয়ালিটি চমৎকার। শুধু ইউএসবি ক্যাবলটা আরেকটু লম্বা হলে ভালো হতো।",
      },
    ],
  },
  related: buildRelatedFromProducts("sunset-rainbow-projection-lamp"),
};

const aiTrackingHolderDetail: ProductDetail = {
  ...products.find((p) => p.slug === "ai-face-tracking-phone-holder")!,
  tagline: "কনটেন্ট ক্রিয়েটর এসেনশিয়াল",
  rating: { value: 4.7, count: 58 },
  stockLabel: "স্টকে আছে",
  breadcrumbs: [
    { label: "হোম", href: "/" },
    { label: "ট্রেন্ডিং গ্যাজেট", href: "/products" },
    { label: "এআই ফেস ট্র্যাকিং ফোন হোল্ডার" },
  ],
  gallery: [
    { src: placeholderImage("AI Tracking Holder"), alt: "এআই ফেস ট্র্যাকিং ফোন হোল্ডার - মেইন ভিউ" },
    { src: placeholderImage("AI Holder - Tripod Mode"), alt: "ট্রাইপড মোডে এআই ফোন হোল্ডার" },
    { src: placeholderImage("AI Holder - Remote"), alt: "ব্লুটুথ রিমোট সহ এআই ফোন হোল্ডার" },
    { src: placeholderImage("AI Holder - Folded"), alt: "ফোল্ডেবল অবস্থায় এআই ফোন হোল্ডার" },
  ],
  description:
    "লাইভ, রিলস, ভ্লগ বা অনলাইন ক্লাস — যেকোনো কনটেন্টই এখন রেকর্ড করুন হাত ছাড়াই। এই এআই ফেস ট্র্যাকিং ফোন হোল্ডার কোনো অ্যাপ ছাড়াই আপনার মুখ ও শরীরের মুভমেন্ট ফলো করে ফ্রেমে রাখে, যাতে প্রতিটি শট থাকে পারফেক্টলি সেন্টারড। জেসচার কন্ট্রোল, ৩৬০° রোটেশন আর ব্লুটুথ রিমোট থাকায় সেটআপ করা এবং ব্যবহার করা দুটোই খুব সহজ।",
  keyFeatures: [
    "এআই ফেস ও বডি ট্র্যাকিং — কোনো অ্যাপ ছাড়াই কাজ করে",
    "৩৬০° রোটেশন, হাত ছাড়াই পারফেক্ট ফ্রেমিং নিশ্চিত করে",
    "জেসচার কন্ট্রোল — হাতের ইশারায় ট্র্যাকিং স্টার্ট/স্টপ করা যায়",
    "ব্লুটুথ রিমোটসহ, ফোল্ডেবল ও পোর্টেবল ডিজাইন",
  ],
  materialDetails: [
    { label: "সর্বোচ্চ উচ্চতা", value: "প্রায় ১৬৩ সেমি" },
    { label: "রোটেশন", value: "৩৬০° হরাইজন্টাল" },
    { label: "ব্যাটারি লাইফ", value: "প্রায় ৬ ঘণ্টা" },
    { label: "চার্জিং পোর্ট", value: "USB-C" },
    { label: "উপযোগী ডিভাইস", value: "সব স্মার্টফোন (Android/iOS), অ্যাকশন ক্যামেরা" },
  ],
  delivery: STANDARD_DELIVERY,
  details: {
    heading: "লাইভ, রিলস আর ভ্লগিং হবে আরও সহজ",
    body: "নিজে নিজে ভিডিও করার সময় বারবার ফ্রেম ঠিক করার ঝামেলা শেষ। এই স্মার্ট ট্রাইপড আপনাকে অনুসরণ করে চলাফেরার সময়ও, যাতে আপনি ফোকাস করতে পারেন কনটেন্টে — ফ্রেমিংয়ে নয়। কন্টেন্ট ক্রিয়েটর, ভ্লগার, অনলাইন শিক্ষক এবং ছোট ব্যবসায়ীদের জন্য এটি একটি প্রয়োজনীয় গ্যাজেট।",
    bullets: [
      "লাইভ স্ট্রিমিং, রিলস, টিকটক ও ইউটিউব ভ্লগের জন্য উপযুক্ত",
      "অনলাইন ক্লাস বা প্রেজেন্টেশনের জন্য হ্যান্ডস-ফ্রি রেকর্ডিং",
      "ফোল্ডেবল ডিজাইন, ব্যাগে সহজে বহনযোগ্য",
      "সেটআপ করতে কোনো অ্যাপ ইনস্টল বা অ্যাকাউন্ট লাগে না",
    ],
    authenticity: {
      title: "কোয়ালিটি চেকড প্রোডাক্ট",
      body: "ডেলিভারির আগে প্রতিটি ইউনিটের ট্র্যাকিং ও ব্যাটারি পরীক্ষা করা হয়, যাতে আপনি নিশ্চিন্তে অর্ডার করতে পারেন।",
      imageSrc: placeholderImage("Quality Checked"),
      imageAlt: "কোয়ালিটি চেক করা প্রোডাক্ট",
    },
  },
  reviews: {
    average: 4.7,
    total: 58,
    breakdown: [
      { stars: 5, percent: 78 },
      { stars: 4, percent: 16 },
      { stars: 3, percent: 4 },
      { stars: 2, percent: 2 },
      { stars: 1, percent: 0 },
    ],
    items: [
      {
        id: "r1",
        initials: "সা",
        name: "সাদিয়া ইসলাম",
        meta: "ভেরিফাইড কাস্টমার • ১০ দিন আগে",
        rating: 5,
        quote:
          "রিলস বানানো এখন অনেক সহজ হয়ে গেছে। হাঁটাহাঁটি করলেও ট্র্যাকিং একদম পারফেক্ট থাকে। দামের তুলনায় খুবই ভালো প্রোডাক্ট।",
      },
      {
        id: "r2",
        initials: "ইম",
        name: "ইমরান খান",
        meta: "ভেরিফাইড কাস্টমার • ৩ সপ্তাহ আগে",
        rating: 5,
        quote:
          "অনলাইন ক্লাস নেওয়ার জন্য কিনেছিলাম, এখন প্রতিদিনই ব্যবহার করি। ব্লুটুথ রিমোটটা খুবই কাজের একটা ফিচার।",
      },
      {
        id: "r3",
        initials: "মা",
        name: "মাহি চৌধুরী",
        meta: "ভেরিফাইড কাস্টমার • ১ মাস আগে",
        rating: 4,
        quote:
          "ট্র্যাকিং স্পিড ভালো, বিল্ড কোয়ালিটিও মজবুত। ব্যাটারি লাইফ আর একটু বেশি হলে ফাইভ স্টার দিতাম।",
      },
    ],
  },
  related: buildRelatedFromProducts("ai-face-tracking-phone-holder"),
};

export const productDetails: ProductDetail[] = [sunsetLampDetail, aiTrackingHolderDetail];

/**
 * Lightweight Bangla teaser page for the 8 "Coming Soon" products — no
 * pricing, specs, or reviews yet since the item isn't sellable.
 */
function buildComingSoonDetail(p: Product): ProductDetail {
  return {
    ...p,
    slug: p.slug,
    tagline: "কামিং সুন",
    stockLabel: "কামিং সুন",
    breadcrumbs: [
      { label: "হোম", href: "/" },
      { label: "ট্রেন্ডিং গ্যাজেট", href: "/products" },
      { label: p.title },
    ],
    gallery: [
      { src: p.imageSrc, alt: p.imageAlt },
      { src: p.imageSrc, alt: `${p.imageAlt} - প্রিভিউ` },
    ],
    description: `${p.title} শীঘ্রই আমাদের স্টকে যুক্ত হচ্ছে। ${p.subtitle} — লঞ্চ হওয়ার সাথে সাথে এই পেজেই বিস্তারিত তথ্য, দাম ও অর্ডার অপশন যুক্ত করা হবে।`,
    delivery: [
      {
        icon: "notifications",
        title: "শীঘ্রই আসছে",
        description: "নতুন প্রোডাক্ট লঞ্চ হওয়ার সাথে সাথে আমরা আপনাকে জানিয়ে দেব।",
      },
    ],
    details: {
      heading: "শীঘ্রই আসছে",
      body: `${p.title} নিয়ে আমরা কাজ করছি, যাতে সঠিক কোয়ালিটি ও দামে আপনার কাছে পৌঁছাতে পারি। আগ্রহী থাকলে আমাদের সাথে যোগাযোগ করে রাখতে পারেন, লঞ্চ হলে প্রথমেই জানানো হবে।`,
      bullets: [p.subtitle, "বিস্তারিত স্পেসিফিকেশন শীঘ্রই যুক্ত হবে", "লঞ্চ অফার সবার আগে পেতে যোগাযোগ রাখুন"],
      authenticity: {
        title: "কোয়ালিটি চেকড প্রোডাক্টের প্রতিশ্রুতি",
        body: "আমাদের প্রতিটি প্রোডাক্ট মান যাচাই করার পরই বাজারে আনা হয়।",
        imageSrc: p.imageSrc,
        imageAlt: p.imageAlt,
      },
    },
    related: buildRelatedFromProducts(p.slug),
  };
}

export function getProductDetailBySlug(slug: string) {
  const explicit = productDetails.find((p) => p.slug === slug);
  if (explicit) return explicit;
  const fromList = products.find((p) => p.slug === slug);
  return fromList ? buildComingSoonDetail(fromList) : null;
}
