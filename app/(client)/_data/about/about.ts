import { WHATSAPP_NUMBER } from "../contact/contact";

const CUSTOM_DRESS_MESSAGE =
  "হ্যালো, আমি একটি কাস্টম ডিজাইনের ড্রেস অর্ডার করতে চাই।";
const CUSTOM_DRESS_WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(CUSTOM_DRESS_MESSAGE)}`;

export type AboutValueCard = {
  icon: string;
  title: string;
  description: string;
};

export type AboutProcessStep = {
  step: string;
  icon: string;
  title: string;
  description: string;
};

export type AboutStat = {
  icon: string;
  value: string;
  label: string;
};

export type AboutFeature = {
  icon: string;
  title: string;
  description: string;
};

export type AboutGalleryImage = {
  src: string;
  alt: string;
};

export const aboutCopy = {
  hero: {
    eyebrow: "আমাদের সম্পর্কে",
    title: "আপনার নিশ্চিন্ত অনলাইন শপিং পার্টনার।",
    subtitle:
      "ঘরে বসে কোয়ালিটি চেক করা প্রোডাক্ট — ক্যাশ অন ডেলিভারিতে, কোনো আগাম ঝুঁকি ছাড়াই। ট্রেন্ডিং গ্যাজেট আর হাতে তৈরি গর্জিয়াস ড্রেস, একই বিশ্বাসে।",
    primaryCta: { label: "সব প্রোডাক্ট", href: "/products" },
    secondaryCta: { label: "যোগাযোগ", href: "/contact-us" },
    imageSrc: "/images/products/lamp/lamp-1.jpg",
    imageAlt: "সানসেট ল্যাম্প — ইমপ্লেসিয়া মার্টের ট্রেন্ডিং গ্যাজেট",
    secondaryImageSrc: "/images/products/baby-products/female-gorgious-ground-dress.jpeg",
    secondaryImageAlt: "হাতে তৈরি গর্জিয়াস উইমেন্স গাউন",
  },
  stats: [
    { icon: "category", value: "২", label: "ক্যাটাগরি" },
    { icon: "location_on", value: "৬৪", label: "জেলায় ডেলিভারি" },
    { icon: "payments", value: "COD", label: "ক্যাশ অন ডেলিভারি" },
    { icon: "assignment_return", value: "৩ দিন", label: "ইজি রিটার্ন" },
  ] satisfies AboutStat[],
  story: {
    kicker: "আমাদের যাত্রা",
    title: "কেন ইমপ্লেসিয়া মার্ট শুরু হলো",
    paragraphs: [
      "অনলাইনে অর্ডার করা মানেই ছিল একরাশ দুশ্চিন্তা — প্রোডাক্ট আসল কিনা, কোয়ালিটি ঠিক থাকবে কিনা, আগে টাকা দিয়ে ঠকে যাব কিনা। আমরা লক্ষ্য করলাম, সমস্যাটা প্রোডাক্টে নয়, বিশ্বাসে।",
      "তাই ইমপ্লেসিয়া মার্টে প্রতিটি প্রোডাক্ট অর্ডারের আগে নিজেরা চালিয়ে দেখি, যাচাই করি, এবং সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা রাখি — যাতে আপনি প্রোডাক্ট হাতে পেয়ে, নিজে দেখে তারপর টাকা দিতে পারেন।",
      "শুরুটা হয়েছিল হাতে গোনা কিছু ট্রেন্ডিং গ্যাজেট নিয়ে, কিন্তু আমাদের লক্ষ্য তার চেয়ে অনেক বড় — প্রতিদিনের প্রয়োজনীয় থেকে শুরু করে জনপ্রিয় নানা ক্যাটাগরির প্রোডাক্ট, একই বিশ্বাসযোগ্যতা আর কোয়ালিটি স্ট্যান্ডার্ড মেনে, ধাপে ধাপে আপনার দরজায় পৌঁছে দেওয়াই আমাদের আসল লক্ষ্য।",
    ],
    cta: { label: "সব প্রোডাক্ট", href: "/products" },
    images: [
      {
        src: "/images/products/lamp/lamp-2.jpg",
        alt: "সানসেট ল্যাম্প — কোয়ালিটি চেক করা গ্যাজেট",
      },
      {
        src: "/images/products/baby-products/baby-frock-with-baby.jpeg",
        alt: "হাতে তৈরি বেবি পার্টি ফ্রক",
      },
    ],
  },
  customDresses: {
    kicker: "নতুন সংযোজন",
    title: "শুধু গ্যাজেট নয়, আমরা তৈরি করি গর্জিয়াস ড্রেসও",
    subtitle:
      "ট্রেন্ডিং গ্যাজেটের পাশাপাশি এখন আমরা হাতে তৈরি করছি বাচ্চাদের ও নারীদের জন্য অসাধারণ গর্জিয়াস ড্রেস। আপনার পছন্দের ডিজাইন, কালার ও মাপ জানালেই আমরা বানিয়ে দিব ঠিক আপনার মনের মতো — সেরা ফেব্রিক ও ফিনিশিং কোয়ালিটি বজায় রেখে।",
    features: [
      {
        icon: "design_services",
        title: "কাস্টম ডিজাইন",
        description: "আপনার পছন্দের ডিজাইন, কালার ও মাপ অনুযায়ী তৈরি করি।",
      },
      {
        icon: "back_hand",
        title: "১০০% হাতে তৈরি",
        description: "প্রতিটি ড্রেস তৈরি হয় নিজ হাতে, যত্ন ও নিষ্ঠার সাথে।",
      },
      {
        icon: "checkroom",
        title: "বাচ্চা ও নারীদের জন্য",
        description: "শিশুদের পার্টি ড্রেস থেকে নারীদের গর্জিয়াস গাউন — সবই পাবেন।",
      },
      {
        icon: "verified",
        title: "প্রিমিয়াম কোয়ালিটি",
        description: "উন্নত ফেব্রিক আর নিখুঁত ফিনিশিং সবসময় আমাদের অগ্রাধিকার।",
      },
    ] satisfies AboutFeature[],
    primaryCta: { label: "কাস্টম অর্ডার", href: CUSTOM_DRESS_WHATSAPP_HREF },
    secondaryCta: { label: "গর্জিয়াস ড্রেস", href: "/products?category=fashion" },
    gallery: [
      {
        src: "/images/products/baby-products/baby-frock-with-baby.jpeg",
        alt: "হাতে তৈরি বেবি পার্টি ড্রেস — সরাসরি ব্যবহারের ছবি",
      },
      {
        src: "/images/products/baby-products/female-gorgious-ground-dress.jpeg",
        alt: "নারীদের জন্য হাতে তৈরি গর্জিয়াস গাউন",
      },
      {
        src: "/images/products/baby-products/baby-ground-frog-more.jpeg",
        alt: "পছন্দের কালারে কাস্টম তৈরি বেবি ড্রেস",
      },
      {
        src: "/images/products/baby-products/baby-ground-frog-3.jpeg",
        alt: "হাতে তৈরি বেবি পার্টি ড্রেস — বো ডিটেইল",
      },
      {
        src: "/images/products/baby-products/3-quater-ground-frog2.jpeg",
        alt: "হাতে তৈরি নিত্যদিনের ড্রেস",
      },
      {
        src: "/images/products/baby-products/baby-jama-pant.jpeg",
        alt: "বাচ্চাদের জন্য হাতে তৈরি কম্ফোর্টেবল সেট",
      },
    ] satisfies AboutGalleryImage[],
  },
  missionVision: {
    vision: {
      icon: "visibility",
      title: "আমাদের ভিশন",
      description:
        "বাংলাদেশের সবচেয়ে বিশ্বাসযোগ্য অনলাইন শপিং ডেস্টিনেশন হয়ে ওঠা — যেখানে প্রতিটি ক্যাটাগরির প্রতিটি অর্ডার মানেই নিশ্চিন্ত, ঝুঁকিমুক্ত অভিজ্ঞতা।",
    },
    mission: {
      icon: "rocket_launch",
      title: "আমাদের মিশন",
      description:
        "কোয়ালিটি চেক করা প্রোডাক্ট সহজলভ্য দামে, ক্যাশ অন ডেলিভারিতে এবং সহজ রিটার্ন সুবিধায় সারাদেশে পৌঁছে দেওয়া — আজ ট্রেন্ডিং গ্যাজেট দিয়ে শুরু, আগামীতে আরও অনেক ক্যাটাগরি।",
    },
  },
  values: {
    kicker: "আমাদের মূলনীতি",
    title: "যেভাবে আমরা কাজ করি",
    subtitle: "প্রতিটি সিদ্ধান্তে আমরা এই চারটি মূলনীতি মেনে চলি।",
    items: [
      {
        icon: "verified",
        title: "কোয়ালিটি চেকড",
        description: "ডেলিভারির আগে প্রতিটি প্রোডাক্ট চালিয়ে পরীক্ষা করা হয়।",
      },
      {
        icon: "payments",
        title: "ক্যাশ অন ডেলিভারি",
        description: "আগে টাকা লাগবে না — হাতে পেয়ে, দেখে তারপর পেমেন্ট।",
      },
      {
        icon: "local_shipping",
        title: "সারাদেশে ডেলিভারি",
        description: "ঢাকা থেকে দূরের জেলা — সবখানে দ্রুত পৌঁছে যায়।",
      },
      {
        icon: "assignment_return",
        title: "সহজ রিটার্ন",
        description: "সমস্যা হলে ৩ দিনের মধ্যে সহজেই রিটার্ন করা যায়।",
      },
    ] satisfies AboutValueCard[],
  },
  howItWorks: {
    kicker: "সহজ প্রক্রিয়া",
    title: "কীভাবে অর্ডার করবেন",
    subtitle: "চার ধাপে অর্ডার — হাতে পেয়ে তারপর পেমেন্ট।",
    steps: [
      {
        step: "০১",
        icon: "search",
        title: "প্রোডাক্ট বাছাই করুন",
        description: "পছন্দের প্রোডাক্ট খুঁজে নিন এবং কার্টে যুক্ত করুন।",
      },
      {
        step: "০২",
        icon: "task_alt",
        title: "অর্ডার কনফার্ম করুন",
        description: "নাম, ঠিকানা ও ফোন নাম্বার দিয়ে অর্ডার কনফার্ম করুন।",
      },
      {
        step: "০৩",
        icon: "local_shipping",
        title: "সারাদেশে ডেলিভারি",
        description: "ঢাকা থেকে দূরের জেলা — অর্ডার আপনার ঠিকানায় পৌঁছে যাবে।",
      },
      {
        step: "০৪",
        icon: "payments",
        title: "হাতে পেয়ে পেমেন্ট",
        description: "প্রোডাক্ট দেখে, যাচাই করে তারপর ক্যাশ পেমেন্ট করুন।",
      },
    ] satisfies AboutProcessStep[],
  },
  shopCta: {
    title: "আজই খুঁজে নিন আপনার প্রয়োজনীয় প্রোডাক্ট",
    subtitle:
      "গ্যাজেট হোক বা গর্জিয়াস ড্রেস — হাতে পেয়ে দেখে তারপর ক্যাশ অন ডেলিভারি।",
    primaryCta: { label: "সব প্রোডাক্ট", href: "/products" },
    secondaryCta: { label: "যোগাযোগ", href: "/contact-us" },
  },
} as const;
