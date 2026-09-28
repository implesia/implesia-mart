export type SustainabilityCommitment = {
  icon: string;
  title: string;
  description: string;
};

export type SustainabilityImpactStat = {
  icon: string;
  value: string;
  label: string;
};

export const sustainabilityCopy = {
  hero: {
    eyebrow: "সাসটেইনেবিলিটি",
    title: "দায়িত্বশীল শপিং, দীর্ঘস্থায়ী প্রোডাক্ট",
    subtitle:
      "ভালো প্রোডাক্ট মানেই কম রিপ্লেসমেন্ট, কম বর্জ্য। গ্যাজেট যাচাই করে আর গর্জিয়াস ড্রেস হাতে তৈরি করে — দায়িত্বশীল প্যাকেজিংয়ে পাঠাই।",
    primaryCta: { label: "সব প্রোডাক্ট", href: "/products" },
    secondaryCta: { label: "আমাদের সম্পর্কে", href: "/about-us" },
    imageSrc: "/images/products/lamp/lamp-1.jpg",
    imageAlt: "সানসেট ল্যাম্প — কোয়ালিটি চেক করা গ্যাজেট",
    secondaryImageSrc: "/images/products/baby-products/female-gorgious-ground-dress.jpeg",
    secondaryImageAlt: "হাতে তৈরি গর্জিয়াস উইমেন্স গাউন",
  },
  origin: {
    eyebrow: "আমাদের দৃষ্টিভঙ্গি",
    title: "কোয়ালিটি এখন বিলাসিতা নয়, দায়িত্ব",
    body: "ইমপ্লেসিয়া মার্ট শুরু হয়েছিল একটা সহজ প্রশ্ন থেকে — কেন ভালো প্রোডাক্ট মানেই বেশি ঝুঁকি হবে? প্রতিটি গ্যাজেট অর্ডারের আগে নিজেরা টেস্ট করি, আর প্রতিটি ড্রেস হাতে বানিয়ে চেক করে পাঠাই — যাতে প্রথমবারেই সঠিক জিনিস হাতে পান। কম রিটার্ন, কম বর্জ্য।",
    images: [
      {
        src: "/images/products/lamp/lamp-2.jpg",
        alt: "সানসেট ল্যাম্প — কোয়ালিটি চেক করা প্রোডাক্ট",
      },
      {
        src: "/images/products/baby-products/baby-frock-with-baby.jpeg",
        alt: "হাতে তৈরি বেবি পার্টি ফ্রক",
      },
    ],
    quote: "কোয়ালিটি একটি অভ্যাস, একবারের কাজ নয়।",
  },
  commitment: {
    kicker: "আমাদের অঙ্গীকার",
    title: "আমরা যেভাবে দায়িত্ব পালন করি",
    subtitle: "প্রতিটি সিদ্ধান্তে মানুষ ও পরিবেশ — দুটোকেই মাথায় রাখি।",
    items: [
      {
        icon: "verified",
        title: "কোয়ালিটি চেকড",
        description: "ডেলিভারির আগে গ্যাজেট চালিয়ে, ড্রেসের ফিনিশিং দেখে যাচাই।",
      },
      {
        icon: "eco",
        title: "কম প্লাস্টিক প্যাক",
        description: "যতটা সম্ভব রিসাইক্লেবল ও কম প্লাস্টিক প্যাকেজিং।",
      },
      {
        icon: "volunteer_activism",
        title: "গর্জিয়াস ড্রেস",
        description: "হাতে তৈরি — কাস্টম মাপ ও টেকসই সেলাইয়ে।",
      },
      {
        icon: "assignment_return",
        title: "৩ দিন রিটার্ন",
        description: "সমস্যা হলে তিন দিনের মধ্যে সহজেই রিটার্ন।",
      },
    ] satisfies SustainabilityCommitment[],
  },
  quality: {
    title: "কোয়ালিটি নিশ্চয়তা প্রক্রিয়া",
    body: "প্রোডাক্ট আপনার কাছে পৌঁছানোর আগে আমরা নিজে যাচাই করি — গ্যাজেট চালিয়ে টেস্ট, ড্রেসের সেলাই ও ফেব্রিক আলাদা করে চেক। যা অর্ডার করছেন, তা-ই হাতে পাবেন।",
    imageSrc: "/images/products/lamp/lamp-3.jpg",
    imageAlt: "সানসেট ল্যাম্প — কোয়ালিটি টেস্টেড প্রোডাক্ট",
    steps: [
      "গ্যাজেট চালিয়ে ও ড্রেসের ফিনিশিং দেখে পরীক্ষা",
      "নিরাপদে প্যাক করে পাঠানো",
      "হাতে পেয়ে দেখে তারপর পেমেন্ট (COD)",
    ],
    badges: [
      { icon: "check_circle", label: "চেক করে পাঠাই" },
      { icon: "payments", label: "ক্যাশ অন ডেলিভারি" },
    ],
  },
  durability: {
    title: "দীর্ঘস্থায়ী প্রোডাক্ট, কম বর্জ্য",
    body: "শুধু ট্রেন্ডিং নয় — যেগুলো দীর্ঘদিন কাজে লাগে। ভালো গ্যাজেট মানে কম রিপ্লেসমেন্ট; হাতে তৈরি গর্জিয়াস ড্রেস মানে ফাস্ট ফ্যাশনের চেয়ে কম কাপড়-বর্জ্য।",
    bullets: [
      "মানসম্পন্ন ম্যাটেরিয়াল ও বিল্ড",
      "হাতে তৈরি ড্রেসে টেকসই ফেব্রিক ও সেলাই",
      "কম রিপ্লেসমেন্ট, কম ই-বর্জ্য",
      "হাতে পেয়ে দেখে তারপর পেমেন্ট",
    ],
    imageSrc: "/images/products/baby-products/3-quater-ground-frog.jpeg",
    imageAlt: "হাতে তৈরি গর্জিয়াস ড্রেস — টেকসই ফেব্রিক ও সেলাই",
  },
  impact: {
    kicker: "আমাদের অভ্যাস",
    title: "যা আমরা প্রতিদিন মেনে চলি",
    subtitle: "বড় সংখ্যা নয় — যাচাই করা প্রক্রিয়া।",
    stats: [
      { icon: "payments", value: "COD", label: "ক্যাশ অন ডেলিভারি" },
      { icon: "assignment_return", value: "৩ দিন", label: "ইজি রিটার্ন" },
      { icon: "verified", value: "চেক", label: "পাঠানোর আগে যাচাই" },
      { icon: "eco", value: "কম", label: "প্লাস্টিক প্যাক" },
    ] satisfies SustainabilityImpactStat[],
  },
  cta: {
    title: "কোয়ালিটি চেক করা গ্যাজেট ও গর্জিয়াস ড্রেস",
    subtitle: "হাতে পেয়ে দেখে তারপর ক্যাশ অন ডেলিভারি — সারাদেশে।",
    primaryCta: { label: "সব প্রোডাক্ট", href: "/products" },
    secondaryCta: { label: "যোগাযোগ", href: "/contact-us" },
  },
} as const;
