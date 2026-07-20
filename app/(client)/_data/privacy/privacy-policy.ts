export type PrivacyNavItem = {
  id: string;
  label: string;
  icon: string;
};

export type PrivacyInfoCard = {
  icon: string;
  title: string;
  description: string;
};

export type PrivacyUseItem = {
  title: string;
  description: string;
};

export type PrivacyRight = {
  icon: string;
  title: string;
  description: string;
};

export type PrivacyBadge = {
  icon: string;
  label: string;
};

export const privacyPolicyCopy = {
  lastUpdated: "জুলাই ২০২৬",
  hero: {
    eyebrow: "গোপনীয়তা নীতি",
    title: "আপনার তথ্য, আমাদের দায়িত্ব",
    subtitle:
      "ইমপ্লেসিয়া মার্টে আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখা আমাদের অগ্রাধিকার। অর্ডার থেকে সাপোর্ট পর্যন্ত কী সংগ্রহ করি ও কীভাবে ব্যবহার করি — সব স্বচ্ছভাবে জানুন।",
  },
  nav: {
    title: "নীতিমালা",
    subtitle: `সর্বশেষ আপডেট: জুলাই ২০২৬`,
    items: [
      { id: "introduction", label: "ভূমিকা", icon: "info" },
      { id: "collection", label: "তথ্য সংগ্রহ", icon: "database" },
      { id: "usage", label: "ব্যবহার ও সুরক্ষা", icon: "query_stats" },
      { id: "sharing", label: "তথ্য শেয়ারিং", icon: "share" },
      { id: "rights", label: "আপনার অধিকার", icon: "gavel" },
      { id: "support", label: "যোগাযোগ", icon: "support_agent" },
    ] satisfies PrivacyNavItem[],
  },
  introduction: {
    heading: "ভূমিকা",
    paragraphs: [
      "ইমপ্লেসিয়া মার্টে আপনার গোপনীয়তা শুধু একটি নথি নয় — এটি আমাদের ব্যবসার মূল মূল্যবোধ। আপনি যখন আমাদের প্রোডাক্ট ব্রাউজ করেন বা অর্ডার দেন, আমরা আপনার বিশ্বাস রক্ষা করতে প্রতিশ্রুতিবদ্ধ।",
      "এই নীতিতে বলা আছে আমরা কখন ও কেন ব্যক্তিগত তথ্য সংগ্রহ করি, কীভাবে ব্যবহার করি, কোন সীমিত ক্ষেত্রে অন্যদের সাথে শেয়ার করতে পারি এবং কীভাবে তা সুরক্ষিত রাখি।",
    ],
  },
  collection: {
    heading: "যে তথ্য আমরা সংগ্রহ করি",
    intro: "সেবা দেওয়ার জন্য প্রয়োজনীয় তথ্যই সংগ্রহ করা হয় — অপ্রয়োজনীয় কিছু চাওয়া হয় না।",
    cards: [
      {
        icon: "person_search",
        title: "ব্যক্তিগত তথ্য",
        description:
          "চেকআউট বা যোগাযোগের সময় দেওয়া নাম, ফোন নম্বর, ইমেইল ও শিপিং ঠিকানা।",
      },
      {
        icon: "devices",
        title: "প্রযুক্তিগত তথ্য",
        description:
          "ডিভাইস ধরন, ব্রাউজার, আইপি ঠিকানা ও সাইট ব্যবহারের সাধারণ তথ্য — সাইট উন্নত করতে।",
      },
      {
        icon: "shopping_cart_checkout",
        title: "অর্ডারের বিবরণ",
        description:
          "কেনা প্রোডাক্ট, অর্ডার ইতিহাস ও লেনদেনের রেকর্ড — ডেলিভারি ও সাপোর্টের জন্য।",
      },
    ] satisfies PrivacyInfoCard[],
  },
  usage: {
    heading: "তথ্য কীভাবে ব্যবহার করি",
    intro: "আপনার তথ্য শুধু সেবা ও অভিজ্ঞতা উন্নত করতে ব্যবহার করা হয়।",
    items: [
      {
        title: "অর্ডার সম্পন্ন করা",
        description: "অর্ডার প্রসেস, প্যাকিং ও নির্ভরযোগ্য ডেলিভারির জন্য।",
      },
      {
        title: "কাস্টমার সাপোর্ট",
        description: "প্রশ্ন, রিটার্ন, এক্সচেঞ্জ বা অর্ডার আপডেটে দ্রুত সাহায্য করতে।",
      },
      {
        title: "অভিজ্ঞতা উন্নয়ন",
        description: "প্রোডাক্ট সুপারিশ ও সাইট ব্যবহার আরও সহজ করতে (প্রয়োজনে)।",
      },
      {
        title: "নিরাপত্তা ও জালিয়াতি প্রতিরোধ",
        description: "অস্বাভাবিক অর্ডার বা অপব্যবহার শনাক্ত ও প্রতিরোধ করতে।",
      },
    ] satisfies PrivacyUseItem[],
    protection: {
      title: "তথ্য সুরক্ষা",
      body: "আমরা নিরাপদ সংযোগ ও যুক্তিসঙ্গত প্রযুক্তিগত ব্যবস্থা ব্যবহার করি যাতে আপনার তথ্য অননুমোদিত প্রবেশ থেকে সুরক্ষিত থাকে।",
      badges: [
        { icon: "lock", label: "সুরক্ষিত সংযোগ" },
        { icon: "shield", label: "সীমিত অ্যাক্সেস" },
        { icon: "verified_user", label: "বিশ্বস্ত পার্টনার" },
      ] satisfies PrivacyBadge[],
    },
  },
  sharing: {
    heading: "তথ্য শেয়ারিং",
    body: "আমরা আপনার ব্যক্তিগত তথ্য মার্কেটিংয়ের জন্য তৃতীয় পক্ষের কাছে বিক্রি করি না। শুধু সেবা চালানোর জন্য প্রয়োজনীয় বিশ্বস্ত পার্টনারদের সাথে সীমিত তথ্য শেয়ার করা হয়:",
    chips: ["কুরিয়ার / লজিস্টিক্স", "পেমেন্ট সহায়ক", "হোস্টিং / ক্লাউড"],
  },
  rights: {
    heading: "আপনার অধিকার",
    intro: "আপনার তথ্য সম্পর্কে আপনার নিয়ন্ত্রণ আছে — অনুরোধ জানালে আমরা সাহায্য করব।",
    items: [
      {
        icon: "visibility",
        title: "দেখার অধিকার",
        description: "আমাদের কাছে থাকা আপনার ব্যক্তিগত তথ্যের কপি চাইতে পারেন।",
      },
      {
        icon: "edit",
        title: "সংশোধনের অধিকার",
        description: "ভুল বা অসম্পূর্ণ তথ্য সংশোধন করতে বলতে পারেন।",
      },
      {
        icon: "delete",
        title: "মুছে ফেলার অধিকার",
        description:
          "আইনি বাধ্যবাধকতা না থাকলে আপনার তথ্য মুছে ফেলার অনুরোধ করতে পারেন।",
      },
      {
        icon: "block",
        title: "আপত্তির অধিকার",
        description: "নির্দিষ্ট ব্যবহার (যেমন মার্কেটিং) থেকে বিরত থাকতে বলতে পারেন।",
      },
    ] satisfies PrivacyRight[],
    retention: {
      title: "তথ্য রাখার সময়সীমা",
      body: "সেবা দেওয়া ও আইনি বাধ্যবাধকতা পূরণের জন্য যতদিন প্রয়োজন, ততদিনই তথ্য রাখা হয়।",
    },
    updates: {
      title: "নীতি আপডেট",
      body: "প্রয়োজনে এই নীতি আপডেট হতে পারে। গুরুত্বপূর্ণ পরিবর্তন হলে সাইট বা যোগাযোগ মাধ্যমে জানানোর চেষ্টা করা হবে।",
    },
  },
  support: {
    title: "গোপনীয়তা নিয়ে প্রশ্ন আছে?",
    subtitle:
      "আপনার তথ্য বা এই নীতি নিয়ে যেকোনো জিজ্ঞাসায় আমাদের টিম সাহায্য করতে প্রস্তুত।",
    phone: "+880 1516-527932",
    email: "implesiaitltd@gmail.com",
    cta: "যোগাযোগ করুন",
    whatsapp: "হোয়াটসঅ্যাপে চ্যাট",
  },
} as const;
