import { getProductMedia } from "./product-media";
import { products, type Product } from "./products";

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
    description:
      "প্রোডাক্ট হাতে পাওয়ার পর টাকা পরিশোধ করুন। আগে থেকে পেমেন্টের প্রয়োজন নেই।",
  },
  {
    icon: "local_shipping",
    title: "সারাদেশে ডেলিভারি",
    description:
      "ঢাকার ভেতরে ২৪-৪৮ ঘণ্টা, ঢাকার বাইরে ২৪-৭২ ঘণ্টার মধ্যে ডেলিভারি পাবেন।",
  },
  {
    icon: "assignment_return",
    title: "৩ দিনের ইজি রিটার্ন",
    description:
      "প্রোডাক্ট ড্যামেজ বা ভিন্ন হলে সহজে রিটার্ন বা রিপ্লেসমেন্ট করা যাবে।",
  },
];

const COMING_SOON_DELIVERY = [
  {
    icon: "notifications",
    title: "শীঘ্রই স্টকে আসছে",
    description:
      "লঞ্চ হওয়ার সাথে সাথে এই পেজে অর্ডার অপশন চালু হবে। আগে থেকে জানতে মেসেজ করে রাখুন।",
  },
  ...STANDARD_DELIVERY,
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
        p.status === "coming-soon"
          ? "কামিং সুন"
          : `৳${p.price.toLocaleString("en-US")}`,
      imageSrc: p.imageSrc,
      imageAlt: p.imageAlt,
      status: p.status,
    }));
}

type DetailContent = {
  tagline: string;
  stockLabel: string;
  description: string;
  keyFeatures: string[];
  materialDetails: { label: string; value: string }[];
  details: {
    heading: string;
    body: string;
    bullets: string[];
    authenticityTitle?: string;
    authenticityBody?: string;
  };
  rating?: { value: number; count: number };
  reviews?: ProductDetail["reviews"];
};

function assembleDetail(product: Product, content: DetailContent): ProductDetail {
  const media = getProductMedia(product.id);
  const isComingSoon = product.status === "coming-soon";

  return {
    ...product,
    tagline: content.tagline,
    rating: content.rating,
    stockLabel: content.stockLabel,
    breadcrumbs: [
      { label: "হোম", href: "/" },
      { label: "ট্রেন্ডিং গ্যাজেট", href: "/products" },
      { label: product.title },
    ],
    gallery: [...media.gallery],
    description: content.description,
    keyFeatures: content.keyFeatures,
    materialDetails: content.materialDetails,
    delivery: isComingSoon ? COMING_SOON_DELIVERY : STANDARD_DELIVERY,
    details: {
      heading: content.details.heading,
      body: content.details.body,
      bullets: content.details.bullets,
      authenticity: {
        title: content.details.authenticityTitle ?? "কোয়ালিটি চেকড প্রোডাক্ট",
        body:
          content.details.authenticityBody ??
          "প্রতিটি প্রোডাক্ট ডেলিভারির আগে পরীক্ষা করা হয়, যাতে আপনার হাতে পৌঁছায় সম্পূর্ণ কার্যকর একটি আইটেম।",
        imageSrc: media.authenticity.src,
        imageAlt: media.authenticity.alt,
      },
    },
    reviews: content.reviews,
    related: buildRelatedFromProducts(product.slug),
  };
}

function requireProduct(slug: string) {
  const product = products.find((p) => p.slug === slug);
  if (!product) throw new Error(`Missing product: ${slug}`);
  return product;
}

const sunsetLampDetail = assembleDetail(
  requireProduct("sunset-rainbow-projection-lamp"),
  {
    tagline: "রুম ডেকোর গ্যাজেট",
    stockLabel: "স্টকে আছে",
    rating: { value: 4.8, count: 96 },
    description:
      "রুমের পরিবেশকে সেকেন্ডেই বদলে দিতে পারে এই সানসেট প্রজেকশন ল্যাম্প। সূর্যাস্তের মতো উষ্ণ কমলা আলো থেকে শুরু করে রেইনবো কালার মোড — যেকোনো দেয়ালে প্রজেক্ট করে তৈরি করে ইনস্টাগ্রাম-পারফেক্ট অ্যাম্বিয়েন্স। রুম ডেকোর, রিলস/টিকটক ব্যাকগ্রাউন্ড অথবা গিফট — সবদিক থেকেই পারফেক্ট চয়েস।",
    keyFeatures: [
      "১৬ কালার সানসেট ও রেইনবো লাইট মোড",
      "রিমোট কন্ট্রোল দিয়ে সহজে কালার ও অ্যাঙ্গেল পরিবর্তন",
      "USB পাওয়ার্ড — ফোন চার্জার বা পাওয়ার ব্যাংক দিয়েই চলে",
      "৩৬০° রোটেটেবল হেড — দেয়াল বা সিলিংয়ে আলো ফেলা যায়",
    ],
    materialDetails: [
      { label: "বিদ্যুৎ উৎস", value: "USB (5V, Type-A)" },
      { label: "ওজন", value: "প্রায় ২৫০ গ্রাম" },
      { label: "উপকরণ", value: "ABS প্লাস্টিক + অ্যালুমিনিয়াম বেস" },
      { label: "বক্সে যা থাকছে", value: "ল্যাম্প, রিমোট, USB ক্যাবল, ইউজার গাইড" },
    ],
    details: {
      heading: "কেন এই সানসেট ল্যাম্প নেবেন?",
      body: "এই ল্যাম্পটি ডিজাইন করা হয়েছে আপনার রুমকে মুহূর্তের মধ্যে একটি রিলাক্সিং ও এস্থেটিক জায়গায় পরিণত করার জন্য। সহজ সেটআপ, হালকা ওজন এবং যেকোনো USB পোর্টে চলার সুবিধার কারণে বেডরুম, স্টাডি টেবিল বা গিফটের জন্য এটি সমান কার্যকর।",
      bullets: [
        "১ মিনিটের মধ্যে সেটআপ, কোনো টুলস দরকার নেই",
        "ফটোগ্রাফি ও ভিডিও কনটেন্টের জন্য পারফেক্ট ব্যাকগ্রাউন্ড লাইট",
        "জন্মদিন, অ্যানিভার্সারি বা যেকোনো গিফটের জন্য উপযুক্ত",
        "লো পাওয়ার কনজাম্পশন, দীর্ঘ সময় চালানো যায়",
      ],
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
            "রুমের লাইটিং পুরোপুরি বদলে গেছে। কালার মোডগুলো খুব সুন্দর, আর দাম হিসেবে কোয়ালিটি অনেক ভালো।",
        },
        {
          id: "r2",
          initials: "নি",
          name: "নুসরাত জাহান",
          meta: "ভেরিফাইড কাস্টমার • ১ মাস আগে",
          rating: 5,
          quote:
            "বান্ধবীকে বার্থডে গিফট দিয়েছিলাম, খুব পছন্দ হয়েছে। প্যাকেজিং প্রিমিয়াম ছিল এবং রিমোট দিয়ে ইউজ করাও সহজ।",
        },
        {
          id: "r3",
          initials: "তা",
          name: "তানভীর আহমেদ",
          meta: "ভেরিফাইড কাস্টমার • ৩ সপ্তাহ আগে",
          rating: 4,
          quote:
            "প্রোডাক্ট ভালো, কালার কোয়ালিটি চমৎকার। শুধু USB ক্যাবলটা আরেকটু লম্বা হলে ভালো হতো।",
        },
      ],
    },
  },
);

const aiTrackingHolderDetail = assembleDetail(
  requireProduct("ai-face-tracking-phone-holder"),
  {
    tagline: "কনটেন্ট ক্রিয়েটর এসেনশিয়াল",
    stockLabel: "স্টকে আছে",
    rating: { value: 4.7, count: 58 },
    description:
      "লাইভ, রিলস, ভ্লগ বা অনলাইন ক্লাস — যেকোনো কনটেন্টই এখন রেকর্ড করুন হাত ছাড়াই। এই এআই ফেস ট্র্যাকিং ফোন হোল্ডার কোনো অ্যাপ ছাড়াই আপনার মুখ ও শরীরের মুভমেন্ট ফলো করে ফ্রেমে রাখে। জেসচার কন্ট্রোল, ৩৬০° রোটেশন আর ব্লুটুথ রিমোট থাকায় সেটআপ ও ব্যবহার দুটোই সহজ।",
    keyFeatures: [
      "এআই ফেস ও বডি ট্র্যাকিং — কোনো অ্যাপ ছাড়াই কাজ করে",
      "৩৬০° রোটেশন, হাত ছাড়াই পারফেক্ট ফ্রেমিং",
      "জেসচার কন্ট্রোল — হাতের ইশারায় ট্র্যাকিং স্টার্ট/স্টপ",
      "ব্লুটুথ রিমোটসহ, ফোল্ডেবল ও পোর্টেবল ডিজাইন",
    ],
    materialDetails: [
      { label: "সর্বোচ্চ উচ্চতা", value: "প্রায় ১৬৩ সেমি" },
      { label: "রোটেশন", value: "৩৬০° হরাইজন্টাল" },
      { label: "ব্যাটারি লাইফ", value: "প্রায় ৬ ঘণ্টা" },
      { label: "চার্জিং পোর্ট", value: "USB-C" },
      { label: "উপযোগী ডিভাইস", value: "Android/iOS স্মার্টফোন, অ্যাকশন ক্যামেরা" },
    ],
    details: {
      heading: "লাইভ, রিলস আর ভ্লগিং হবে আরও সহজ",
      body: "নিজে নিজে ভিডিও করার সময় বারবার ফ্রেম ঠিক করার ঝামেলা শেষ। এই স্মার্ট ট্রাইপড আপনাকে অনুসরণ করে, যাতে আপনি ফোকাস করতে পারেন কনটেন্টে — ফ্রেমিংয়ে নয়।",
      bullets: [
        "লাইভ স্ট্রিমিং, রিলস, টিকটক ও ইউটিউব ভ্লগের জন্য উপযুক্ত",
        "অনলাইন ক্লাস বা প্রেজেন্টেশনের জন্য হ্যান্ডস-ফ্রি রেকর্ডিং",
        "ফোল্ডেবল ডিজাইন, ব্যাগে সহজে বহনযোগ্য",
        "সেটআপ করতে কোনো অ্যাপ ইনস্টল লাগে না",
      ],
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
            "রিলস বানানো এখন অনেক সহজ। হাঁটাহাঁটি করলেও ট্র্যাকিং একদম পারফেক্ট থাকে।",
        },
        {
          id: "r2",
          initials: "ইম",
          name: "ইমরান খান",
          meta: "ভেরিফাইড কাস্টমার • ৩ সপ্তাহ আগে",
          rating: 5,
          quote:
            "অনলাইন ক্লাস নেওয়ার জন্য কিনেছিলাম, এখন প্রতিদিনই ব্যবহার করি। ব্লুটুথ রিমোটটা খুবই কাজের।",
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
  },
);

const twsEarbudsDetail = assembleDetail(requireProduct("tws-wireless-earbuds"), {
  tagline: "ওয়্যারলেস অডিও",
  stockLabel: "কামিং সুন",
  description:
    "প্রতিদিনের কমিউট, ওয়ার্কআউট বা কলের জন্য প্রিমিয়াম সাউন্ডের TWS ওয়্যারলেস ইয়ারবাড। কমপ্যাক্ট চার্জিং কেস, স্ট্যাবল ব্লুটুথ কানেকশন এবং লং ব্যাটারি লাইফ — সবকিছু একসাথে। শীঘ্রই স্টকে আসছে।",
  keyFeatures: [
    "ট্রু ওয়্যারলেস স্টেরিও (TWS) ডিজাইন",
    "লং ব্যাটারি লাইফ + চার্জিং কেস",
    "ক্লিয়ার কল কোয়ালিটি ও টাচ কন্ট্রোল",
    "আরামদায়ক ফিট, হালকা ওজন",
  ],
  materialDetails: [
    { label: "কানেকশন", value: "ব্লুটুথ" },
    { label: "চার্জিং", value: "Type-C কেস" },
    { label: "ওয়াটার রেজিস্ট্যান্স", value: "স্প্ল্যাশ রেজিস্ট্যান্ট (দৈনন্দিন ব্যবহার)" },
    { label: "বক্সে যা থাকবে", value: "ইয়ারবাড, চার্জিং কেস, ক্যাবল, ইয়ারটিপস" },
  ],
  details: {
    heading: "প্রতিদিনের জন্য স্মার্ট অডিও কম্প্যানিয়ন",
    body: "মিউজিক, পডকাস্ট বা অফিস কল — সবকিছুতেই চাই পরিষ্কার সাউন্ড ও আরাম। এই TWS ইয়ারবাড সেটআপ করা সহজ এবং পকেটে বহনযোগ্য।",
    bullets: [
      "এক ট্যাপে পেয়ারিং",
      "দৈনন্দিন কমিউট ও জিমের জন্য উপযুক্ত",
      "কেসসহ পুরো দিনের ব্যাটারি ব্যাকআপ",
      "লঞ্চ অফার সবার আগে পেতে যোগাযোগ রাখুন",
    ],
  },
});

const neckbandDetail = assembleDetail(requireProduct("bluetooth-neckband-earphone"), {
  tagline: "স্পোর্টস অডিও",
  stockLabel: "কামিং সুন",
  description:
    "নেকব্যান্ড ডিজাইনের ব্লুটুথ ইয়ারফোন — দৌড়ানো, জিম বা লম্বা কলের সময়ও খুলে পড়ার ভয় নেই। মজবুত বিল্ড, ক্লিয়ার মাইক এবং অল-ডে কমফোর্ট একসাথে।",
  keyFeatures: [
    "সিকিউর নেকব্যান্ড ফিট — স্পোর্টস ফ্রেন্ডলি",
    "ক্লিয়ার কলিং মাইক",
    "লং প্লেটাইম ও ফাস্ট চার্জ",
    "ইনলাইন কন্ট্রোল বাটন",
  ],
  materialDetails: [
    { label: "ডিজাইন", value: "নেকব্যান্ড" },
    { label: "কানেকশন", value: "ব্লুটুথ" },
    { label: "ব্যাটারি", value: "লং প্লেটাইম" },
    { label: "নিয়ন্ত্রণ", value: "ইনলাইন বাটন" },
  ],
  details: {
    heading: "মুভমেন্টের সাথে তাল মিলিয়ে চলুক সাউন্ড",
    body: "ইয়ারবাড হারানোর ঝামেলা ছাড়াই স্পোর্টস ও দৈনন্দিন ব্যবহারের জন্য নেকব্যান্ড একটি নির্ভরযোগ্য অপশন।",
    bullets: [
      "জিম ও রানিংয়ের জন্য স্টেবল ফিট",
      "কলে কণ্ঠস্বর পরিষ্কার থাকে",
      "সহজে পকেট/ব্যাগে বহনযোগ্য",
      "বাজেট-ফ্রেন্ডলি প্রিমিয়াম লুক",
    ],
  },
});

const carHolderDetail = assembleDetail(requireProduct("magnetic-car-phone-holder"), {
  tagline: "কার অ্যাকসেসরিজ",
  stockLabel: "কামিং সুন",
  description:
    "গাড়িতে নেভিগেশন বা কল করার সময় ফোনকে নিরাপদ ও সহজলভ্য রাখুন। ম্যাগনেটিক গ্রিপ ও ৩৬০° রোটেশন দিয়ে যেকোনো অ্যাঙ্গেলে সেট করা যায়।",
  keyFeatures: [
    "শক্তিশালী ম্যাগনেটিক হোল্ড",
    "৩৬০° রোটেটেবল অ্যাঙ্গেল",
    "এয়ার ভেন্ট / ড্যাশ মাউন্ট ফ্রেন্ডলি ডিজাইন",
    "এক হাতে সহজে লাগানো-খোলা যায়",
  ],
  materialDetails: [
    { label: "হোল্ড টাইপ", value: "ম্যাগনেটিক" },
    { label: "রোটেশন", value: "৩৬০°" },
    { label: "কম্প্যাটিবিলিটি", value: "অধিকাংশ স্মার্টফোন" },
    { label: "উপকরণ", value: "অ্যালয় + সিলিকন প্যাড" },
  ],
  details: {
    heading: "সেফ ড্রাইভিং, ইজি নেভিগেশন",
    body: "রাস্তায় ফোন হাতে না নিয়েই ম্যাপ দেখা ও কল রিসিভ করা সহজ হয় — নিরাপত্তা ও সুবিধা দুটোই।",
    bullets: [
      "ড্রাইভিংয়ের সময় হ্যান্ডস-ফ্রি কনভেনিয়েন্স",
      "পোর্ট্রেট ও ল্যান্ডস্কেপ দুই মোড",
      "কম্প্যাক্ট, গাড়ির ইন্টেরিয়রের সাথে মানায়",
      "ইনস্টল করতে টুলসের দরকার নেই",
    ],
  },
});

const chargingCableDetail = assembleDetail(requireProduct("fast-charging-3in1-cable"), {
  tagline: "চার্জিং এসেনশিয়াল",
  stockLabel: "কামিং সুন",
  description:
    "একটি ক্যাবলেই একাধিক ডিভাইস চার্জ করুন। ৩-ইন-১ ফাস্ট চার্জিং ক্যাবল — ভ্রমণ, অফিস বা বাসায় সব জায়গায় কাজের।",
  keyFeatures: [
    "৩-ইন-১ মাল্টিপল কানেক্টর",
    "ফাস্ট চার্জিং সাপোর্ট",
    "ডাটা ট্রান্সফার সক্ষম",
    "টেনেবল ব্রেইডেড কেবল",
  ],
  materialDetails: [
    { label: "কানেক্টর", value: "৩-ইন-১ মাল্টি-হেড" },
    { label: "কেবল টাইপ", value: "ব্রেইডেড নাইলন" },
    { label: "ব্যবহার", value: "চার্জ + ডাটা" },
    { label: "উপযোগী", value: "মাল্টিপল স্মার্টফোন/ট্যাব" },
  ],
  details: {
    heading: "এক ক্যাবল, একাধিক ডিভাইস",
    body: "আলাদা আলাদা ক্যাবল বহন করার ঝামেলা কমাতে এই ৩-ইন-১ ক্যাবল দৈনন্দিন জীবনের সবচেয়ে প্র্যাকটিক্যাল গ্যাজেটগুলোর একটি।",
    bullets: [
      "ট্রাভেল ও অফিসের জন্য পারফেক্ট",
      "মজবুত কেবল, সহজে ছিঁড়ে না",
      "ফ্রেন্ড/ফ্যামিলির ডিভাইসেও কাজ করে",
      "কম দামে বেশি সুবিধা",
    ],
  },
});

const powerBankDetail = assembleDetail(requireProduct("slim-power-bank-10000mah"), {
  tagline: "পোর্টেবল পাওয়ার",
  stockLabel: "কামিং সুন",
  description:
    "স্লিম বডিতে ১০,০০০mAh ক্যাপাসিটি — পকেট বা ব্যাগে সহজে যায়, তবুও ফোনকে একাধিকবার চার্জ দেওয়ার ক্ষমতা রাখে।",
  keyFeatures: [
    "১০,০০০mAh হাই ক্যাপাসিটি",
    "স্লিম ও লাইটওয়েট ডিজাইন",
    "ফাস্ট চার্জিং সাপোর্ট",
    "মাল্টিপল আউটপুট পোর্ট",
  ],
  materialDetails: [
    { label: "ক্যাপাসিটি", value: "১০,০০০mAh" },
    { label: "ডিজাইন", value: "স্লিম পোর্টেবল" },
    { label: "ইনপুট/আউটপুট", value: "ফাস্ট চার্জ সাপোর্টেড" },
    { label: "সেফটি", value: "ওভারচার্জ প্রোটেকশন" },
  ],
  details: {
    heading: "পাওয়ার শেষ হওয়ার ভয় থাকবে না",
    body: "অফিস, ট্রাভেল বা লম্বা দিনের বাইরের কাজ — ব্যাটারি লো হলেই এই পাওয়ার ব্যাংক আপনার ব্যাকআপ।",
    bullets: [
      "পকেট-ফ্রেন্ডলি স্লিম শেপ",
      "এক চার্জে একাধিক টপ-আপ",
      "LED ইনডিকেটর দিয়ে ব্যাটারি স্ট্যাটাস বোঝা যায়",
      "দৈনন্দিন ব্যবহারের জন্য নিরাপদ সার্কিট",
    ],
  },
});

const miniPrinterDetail = assembleDetail(requireProduct("mini-thermal-printer"), {
  tagline: "স্মার্ট স্টাডি গ্যাজেট",
  stockLabel: "কামিং সুন",
  description:
    "ইঙ্ক ছাড়াই প্রিন্ট করুন নোট, স্টিকার বা ছোট ফটো। মিনি থার্মাল প্রিন্টার স্টুডেন্ট, জার্নাল লভার এবং ক্রিয়েটিভ কাজের জন্য পারফেক্ট।",
  keyFeatures: [
    "ইঙ্কলেস থার্মাল প্রিন্টিং",
    "ব্লুটুথ কানেকশন অ্যাপ সাপোর্ট",
    "পোর্টেবল কমপ্যাক্ট সাইজ",
    "নোট, লিস্ট ও স্টিকার প্রিন্টের জন্য উপযুক্ত",
  ],
  materialDetails: [
    { label: "প্রিন্ট টাইপ", value: "থার্মাল" },
    { label: "কানেকশন", value: "ব্লুটুথ" },
    { label: "পাওয়ার", value: "রিচার্জেবল ব্যাটারি" },
    { label: "পেপার", value: "থার্মাল রোল" },
  ],
  details: {
    heading: "পড়ালেখা ও ক্রিয়েটিভ কাজ হবে আরও মজার",
    body: "ক্লাসের নোট, টু-ডু লিস্ট বা কিউট স্টিকার — মিনি প্রিন্টার দৈনন্দিন অর্গানাইজেশনকে সহজ ও ভিজ্যুয়াল করে তোলে।",
    bullets: [
      "ইঙ্ক কেনার ঝামেলা নেই",
      "ফোন থেকে সরাসরি প্রিন্ট",
      "বাচ্চাদের স্টাডি ও ক্রাফটের জন্য দুর্দান্ত",
      "গিফট আইটেম হিসেবেও জনপ্রিয়",
    ],
  },
});

const smartRingDetail = assembleDetail(requireProduct("smart-fitness-ring"), {
  tagline: "ওয়্যারেবল ফিটনেস",
  stockLabel: "কামিং সুন",
  description:
    "মিনিমাল স্মার্ট রিং দিয়ে ট্র্যাক করুন হার্ট রেট, অ্যাক্টিভিটি ও স্লিপ — ঘড়ি পরার ঝামেলা ছাড়াই হেলথ ইনসাইট পান।",
  keyFeatures: [
    "হার্ট রেট ও অ্যাক্টিভিটি ট্র্যাকিং",
    "স্লিপ মনিটরিং",
    "আল্ট্রা-লাইট মিনিমাল ডিজাইন",
    "অ্যাপ সিঙ্ক ও দৈনিক রিপোর্ট",
  ],
  materialDetails: [
    { label: "টাইপ", value: "স্মার্ট ফিটনেস রিং" },
    { label: "সেন্সর", value: "হার্ট রেট / অ্যাক্টিভিটি" },
    { label: "ব্যাটারি", value: "মাল্টি-ডে ইউজেজ" },
    { label: "ওয়াটার রেজিস্ট", value: "দৈনন্দিন স্প্ল্যাশ রেজিস্ট্যান্ট" },
  ],
  details: {
    heading: "হেলথ ট্র্যাকিং, স্টাইলিশভাবে",
    body: "স্মার্টওয়াচের বড় ফর্ম ফ্যাক্টর ছাড়াই বেসিক হেলথ মেট্রিক্স জানতে চাইলে স্মার্ট রিং একটি স্মার্ট অল্টারনেটিভ।",
    bullets: [
      "হালকা, সারাদিন পরার মতো কমফোর্ট",
      "স্লিপ ও অ্যাক্টিভিটি ইনসাইট",
      "অফিস/ক্যাজুয়াল লুকের সাথে মানায়",
      "ফিটনেস জার্নি শুরু করার সহজ উপায়",
    ],
  },
});

const galaxyHumidifierDetail = assembleDetail(
  requireProduct("galaxy-projector-humidifier"),
  {
    tagline: "রুম অ্যাম্বিয়েন্স ২-ইন-১",
    stockLabel: "কামিং সুন",
    description:
      "গ্যালাক্সি প্রজেক্টর ও এয়ার হিউমিডিফায়ার একসাথে — বেডরুমে নরম আর্দ্রতা ও স্টাররি নাইট লাইটের ম্যাজিক এক ডিভাইসে।",
    keyFeatures: [
      "২-ইন-১: হিউমিডিফায়ার + গ্যালাক্সি প্রজেক্টর",
      "নরম নাইট লাইট / স্টার ইফেক্ট",
      "কোয়েট অপারেশন — ঘুমের জন্য উপযোগী",
      "কমপ্যাক্ট বেডসাইড ডিজাইন",
    ],
    materialDetails: [
      { label: "ফাংশন", value: "হিউমিডিফায়ার + প্রজেক্টর" },
      { label: "পাওয়ার", value: "USB / অ্যাডাপ্টার" },
      { label: "শব্দ", value: "লো-নয়েজ মোটর" },
      { label: "ব্যবহার", value: "বেডরুম / স্টাডি রুম" },
    ],
    details: {
      heading: "ঘুম ও মুড — দুটোই কেয়ার করে",
      body: "শুষ্ক বাতাস ও ফ্ল্যাট রুম লাইটিং বদলে দিতে এই ২-ইন-১ গ্যাজেট বেডসাইড টেবিলের পারফেক্ট কম্প্যানিয়ন।",
      bullets: [
        "নাইট রুটিনের জন্য সফট অ্যাম্বিয়েন্স",
        "ছোট রুমে সহজে জায়গা নেয়",
        "গিফট হিসেবে আকর্ষণীয়",
        "লঞ্চের আগে ইন্টারেস্ট লিস্টে নাম রাখুন",
      ],
    },
  },
);

export const productDetails: ProductDetail[] = [
  sunsetLampDetail,
  aiTrackingHolderDetail,
  twsEarbudsDetail,
  neckbandDetail,
  carHolderDetail,
  chargingCableDetail,
  powerBankDetail,
  miniPrinterDetail,
  smartRingDetail,
  galaxyHumidifierDetail,
];

export function getProductDetailBySlug(slug: string) {
  return productDetails.find((p) => p.slug === slug) ?? null;
}
