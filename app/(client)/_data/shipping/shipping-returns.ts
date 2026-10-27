import { SITE_CONTACT_DEFAULTS } from "@/lib/site-contact";

export type ShippingTimeline = {
  label: string;
  value: string;
};

export type ShippingFeatureCard = {
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
  variant?: "default" | "primary";
};

export type PaymentCard = {
  icon: string;
  badge: string;
  title: string;
  body: string;
  footnote?: string;
};

export type SpecialNote = {
  icon: string;
  title: string;
  body: string;
};

export type MiniFaqItem = {
  id: string;
  q: string;
  a: string;
};

export type NavItem = {
  id: string;
  label: string;
  icon: string;
};

export const shippingReturnsCopy = {
  hero: {
    eyebrow: "শিপিং ও রিটার্ন",
    title: "ডেলিভারি, COD ও ৩ দিন রিটার্ন",
    subtitle:
      "ঢাকায় ২৪–৪৮ ঘণ্টা, বাইরে ২৪–৭২ ঘণ্টা। ক্যাশ অন ডেলিভারি চালু। না বুঝলে কল বা হোয়াটসঅ্যাপ করুন।",
  },
  nav: {
    title: "নীতিমালা",
    subtitle: "বিষয় অনুযায়ী দেখুন",
    items: [
      { id: "shipping", label: "শিপিং তথ্য", icon: "local_shipping" },
      { id: "payment", label: "পেমেন্ট পদ্ধতি", icon: "payments" },
      { id: "returns", label: "রিটার্ন ও এক্সচেঞ্জ", icon: "assignment_return" },
      { id: "refund", label: "রিফান্ড প্রক্রিয়া", icon: "receipt_long" },
      { id: "support", label: "সাপোর্ট", icon: "support_agent" },
    ] satisfies NavItem[],
  },
  shipping: {
    heading: "শিপিং তথ্য",
    intro: "স্টক থাকা প্রোডাক্ট দ্রুত পাঠানো হয়; কাস্টম ড্রেসে স্টিচিংয়ের পর ডেলিভারি শুরু হয়।",
    cards: [
      {
        icon: "public",
        eyebrow: "কভারেজ",
        title: "সারাদেশে ডেলিভারি",
        body: "ঢাকাসহ সারা বাংলাদেশে (৬৪ জেলা) নির্ভরযোগ্য কুরিয়ারের মাধ্যমে ডেলিভারি করা হয়।",
        variant: "default",
      },
      {
        icon: "payments",
        eyebrow: "সুবিধা",
        title: "ক্যাশ অন ডেলিভারি",
        body: "প্রোডাক্ট হাতে পাওয়ার পর টাকা পরিশোধ করুন — আগে থেকে পেমেন্ট বাধ্যতামূলক নয়।",
        variant: "primary",
      },
    ] satisfies ShippingFeatureCard[],
    timelinesTitle: "ডেলিভারি সময়সূচি",
    timelines: [
      { label: "ঢাকার ভেতরে", value: "২৪–৪৮ ঘণ্টা" },
      { label: "ঢাকার বাইরে", value: "২৪–৭২ ঘণ্টা" },
      { label: "কাস্টম ড্রেস (স্টিচিংসহ)", value: "৩–৭ কর্মদিবস" },
    ] satisfies ShippingTimeline[],
    notes: [
      {
        icon: "bolt",
        title: "দ্রুত প্রসেসিং",
        body: "স্টক থাকা অর্ডার সাধারণত কনফার্মের পর দ্রুত প্যাক করে পাঠানোর চেষ্টা করা হয়।",
      },
      {
        icon: "design_services",
        title: "কাস্টম অর্ডার",
        body: "মাপ/ডিজাইন কনফার্ম হওয়ার পর স্টিচিং শুরু হয়; তারপর সারাদেশে ডেলিভারি করা হয়।",
      },
    ],
  },
  payment: {
    heading: "পেমেন্ট পদ্ধতি",
    intro: "পেমেন্ট সহজ ও স্বচ্ছ — চেকআউট বা অর্ডার কনফার্মের সময় সব চার্জ জানিয়ে দেওয়া হয়।",
    cards: [
      {
        icon: "handshake",
        badge: "জনপ্রিয়",
        title: "ক্যাশ অন ডেলিভারি",
        body: "প্রোডাক্ট হাতে পেয়ে যাচাই করার পর টাকা দিন। সারাদেশে উপলব্ধ।",
        footnote: "হাতে পেয়ে টাকা দেওয়া যায়",
      },
      {
        icon: "account_balance_wallet",
        badge: "অনুরোধে",
        title: "মোবাইল ব্যাংকিং",
        body: "প্রয়োজনে বিকাশ/নগদ ইত্যাদি গাইড করে দেওয়া হয় — অর্ডারের সময় মেসেজে জানান।",
        footnote: "কাস্টম/বিশেষ অর্ডারে প্রযোজ্য হতে পারে",
      },
    ] satisfies PaymentCard[],
  },
  returns: {
    heading: "রিটার্ন ও এক্সচেঞ্জ",
    eligibilityTitle: "৩ দিনের ইজি রিটার্ন",
    eligibilityBody:
      "ডেলিভারির পর ৩ দিনের মধ্যে প্রোডাক্ট ডিফেক্ট বা ভিন্ন হলে সহজে রিটার্ন বা রিপ্লেসমেন্ট করা যায়।",
    rules: [
      "প্রোডাক্ট অব্যবহৃত ও আসল অবস্থায় থাকতে হবে।",
      "সম্ভব হলে আসল প্যাকেজিং ও অ্যাকসেসরিজসহ ফেরত দিন।",
      "ডিফেক্ট/ভুল আইটেমের ছবিসহ দ্রুত সাপোর্টে জানান।",
      "কাস্টম মেড ড্রেসে সাইজ/ডিজাইন পছন্দ না হওয়ার কারণে রিটার্ন সীমিত।",
    ],
    special: [
      {
        icon: "devices",
        title: "গ্যাজেট",
        body: "ম্যানুফ্যাকচারিং ডিফেক্টে সাপোর্ট/রিপ্লেসমেন্ট দেওয়া হয়। ব্যবহারজনিত ক্ষতি আলাদা বিবেচ্য।",
      },
      {
        icon: "checkroom",
        title: "ড্রেস / ফ্যাশন",
        body: "ডিফেক্ট সেলাই বা ফেব্রিকে সমস্যা থাকলে সমাধান করা হয়। কাস্টম পিসে এক্সচেঞ্জ সীমিত।",
      },
      {
        icon: "info",
        title: "যা রিটার্নযোগ্য নয়",
        body: "ব্যবহৃত, ক্ষতিগ্রস্ত বা কাস্টমারের ভুলে অর্ডার করা আইটেম সাধারণত রিটার্নযোগ্য নয়।",
      },
    ] satisfies SpecialNote[],
  },
  refund: {
    heading: "রিফান্ড প্রক্রিয়া",
    steps: [
      {
        title: "অনুরোধ জানান",
        body: "হোয়াটসঅ্যাপ বা কলে অর্ডার নম্বরসহ রিটার্ন/রিফান্ডের কারণ জানান।",
      },
      {
        title: "যাচাই",
        body: "প্রোডাক্ট ফেরত এলে আমাদের টিম কন্ডিশন ও ডিফেক্ট যাচাই করে।",
      },
      {
        title: "সমাধান",
        body: "রিপ্লেসমেন্ট অথবা প্রযোজ্য ক্ষেত্রে রিফান্ড — পদ্ধতি আগেই জানিয়ে দেওয়া হয়।",
      },
    ],
    note: "ক্যাশ অন ডেলিভারি অর্ডারে রিফান্ড সাধারণত এক্সচেঞ্জ/রিপ্লেসমেন্ট অগ্রাধিকার পায়; নগদ ফেরত কেসের ভিত্তিতে সাজানো হয়।",
  },
  support: {
    title: "এখনও সাহায্য দরকার?",
    subtitle: "অর্ডার, ডেলিভারি বা রিটার্ন — কল বা হোয়াটসঅ্যাপে জিজ্ঞাসা করুন।",
    phone: SITE_CONTACT_DEFAULTS.phone,
    email: SITE_CONTACT_DEFAULTS.email,
    cta: "যোগাযোগ",
    whatsapp: "হোয়াটসঅ্যাপ",
  },
  miniFaq: {
    title: "সংক্ষিপ্ত প্রশ্নোত্তর",
    items: [
      {
        id: "track",
        q: "অর্ডার কীভাবে ট্র্যাক করব?",
        a: "শিপমেন্টের পর ফোন/মেসেজে আপডেট দেওয়া হয়। অর্ডার নম্বর দিয়ে যেকোনো সময় জানতে পারবেন।",
      },
      {
        id: "delay",
        q: "ডেলিভারি দেরি হলে কী করব?",
        a: "নির্ধারিত সময় পেরিয়ে গেলে ৪৮ ঘণ্টার মধ্যে সাপোর্টে যোগাযোগ করুন — আমরা স্ট্যাটাস চেক করে জানাব।",
      },
      {
        id: "weekend",
        q: "সপ্তাহান্তে ডেলিভারি হয়?",
        a: "কুরিয়ার নেটওয়ার্ক অনুযায়ী শনিবার পর্যন্ত ডেলিভারি হতে পারে; শুক্রবারে বিলম্ব হতে পারে।",
      },
      {
        id: "custom-return",
        q: "কাস্টম ড্রেস রিটার্ন করা যায়?",
        a: "সাইজ/ডিজাইন পছন্দ না হলে সাধারণত নয়। তবে সেলাই বা ফেব্রিক ডিফেক্ট থাকলে অবশ্যই সমাধান করা হয়।",
      },
    ] satisfies MiniFaqItem[],
  },
} as const;
