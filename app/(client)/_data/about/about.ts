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

export const aboutCopy = {
  hero: {
    eyebrow: "আমাদের সম্পর্কে",
    title: "ট্রেন্ডিং গ্যাজেট, নিশ্চিন্ত শপিং।",
    subtitle:
      "ইমপ্লেসিয়া মার্ট শুরু হয়েছিল একটাই লক্ষ্য নিয়ে — বাংলাদেশের মানুষ যেন ঘরে বসেই কোয়ালিটি চেক করা ট্রেন্ডিং গ্যাজেট, ক্যাশ অন ডেলিভারিতে, কোনো ঝুঁকি ছাড়াই অর্ডার করতে পারে।",
    primaryCta: { label: "সব প্রোডাক্ট দেখুন", href: "/products" },
    secondaryCta: { label: "যোগাযোগ করুন", href: "/contact-us" },
    imageSrc: "/images/products/lamp/lamp-1.jpg",
    imageAlt: "সানসেট ল্যাম্প — ইমপ্লেসিয়া মার্টের জনপ্রিয় গ্যাজেট",
    secondaryImageSrc: "/images/products/selfie-stand/stand-2.jpg",
    secondaryImageAlt: "AI সেলফি স্ট্যান্ড — ইমপ্লেসিয়া মার্টের জনপ্রিয় গ্যাজেট",
  },
  stats: [
    { icon: "diversity_3", value: "৫,০০০+", label: "সন্তুষ্ট কাস্টমার" },
    { icon: "location_on", value: "৬৪ জেলা", label: "সারাদেশে ডেলিভারি" },
    { icon: "star", value: "৪.৮/৫", label: "কাস্টমার রেটিং" },
    { icon: "payments", value: "১০০%", label: "ক্যাশ অন ডেলিভারি" },
  ] satisfies AboutStat[],
  story: {
    kicker: "আমাদের যাত্রা",
    title: "কেন ইমপ্লেসিয়া মার্ট শুরু হলো",
    paragraphs: [
      "অনলাইনে গ্যাজেট অর্ডার করা মানেই ছিল একরাশ দুশ্চিন্তা — প্রোডাক্ট আসল কিনা, কোয়ালিটি ঠিক থাকবে কিনা, আগে টাকা দিয়ে ঠকে যাব কিনা। আমরা লক্ষ্য করলাম, সমস্যাটা প্রোডাক্টে নয়, বিশ্বাসে।",
      "তাই ইমপ্লেসিয়া মার্টে প্রতিটি প্রোডাক্ট অর্ডারের আগে নিজেরা চালিয়ে দেখি, যাচাই করি, এবং সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা রাখি — যাতে আপনি প্রোডাক্ট হাতে পেয়ে, নিজে দেখে তারপর টাকা দিতে পারেন।",
      "আজ সানসেট ল্যাম্প থেকে AI সেলফি স্ট্যান্ড — প্রতিটি গ্যাজেট বাছাই করা হয় একই মানদণ্ডে: ট্রেন্ডিং, কার্যকর, এবং দামের তুলনায় সেরা কোয়ালিটি।",
    ],
    cta: { label: "সব প্রোডাক্ট দেখুন", href: "/products" },
    images: [
      {
        src: "/images/products/lamp/lamp-2.jpg",
        alt: "সানসেট ল্যাম্প — কোয়ালিটি চেক করা প্রোডাক্ট",
      },
      {
        src: "/images/products/selfie-stand/stand-3.jpg",
        alt: "AI সেলফি স্ট্যান্ড — কনটেন্ট ক্রিয়েটরদের পছন্দ",
      },
    ],
  },
  missionVision: {
    vision: {
      icon: "visibility",
      title: "আমাদের ভিশন",
      description:
        "বাংলাদেশের সবচেয়ে বিশ্বাসযোগ্য অনলাইন গ্যাজেট শপ হয়ে ওঠা — যেখানে প্রতিটি অর্ডার মানেই নিশ্চিন্ত, ঝুঁকিমুক্ত অভিজ্ঞতা।",
    },
    mission: {
      icon: "rocket_launch",
      title: "আমাদের মিশন",
      description:
        "কোয়ালিটি চেক করা ট্রেন্ডিং গ্যাজেট সহজলভ্য দামে, ক্যাশ অন ডেলিভারিতে এবং সহজ রিটার্ন সুবিধায় সারাদেশে পৌঁছে দেওয়া।",
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
    subtitle: "চারটি সহজ ধাপে অর্ডার করুন, ঘরে বসেই পণ্য পেয়ে যান।",
    steps: [
      {
        step: "০১",
        icon: "search",
        title: "প্রোডাক্ট বাছাই করুন",
        description: "পছন্দের গ্যাজেট খুঁজে নিন এবং কার্টে যুক্ত করুন।",
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
        title: "দ্রুত ডেলিভারি",
        description: "সারাদেশে ২৪-৭২ ঘণ্টার মধ্যে প্রোডাক্ট পৌঁছে যাবে।",
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
    title: "আজই খুঁজে নিন আপনার পছন্দের গ্যাজেট",
    subtitle:
      "হাজারো কাস্টমারের বিশ্বাস নিয়ে আমরা এগিয়ে যাচ্ছি। ক্যাশ অন ডেলিভারিতে নিশ্চিন্তে অর্ডার করুন আজই।",
    primaryCta: { label: "সব প্রোডাক্ট দেখুন", href: "/products" },
    secondaryCta: { label: "যোগাযোগ করুন", href: "/contact-us" },
  },
} as const;
