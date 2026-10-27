/**
 * Bundled FAQ copy. The /faqs page shows it while the CMS has no published
 * questions; once an admin publishes questions the CMS content is used instead.
 *
 * Keep every answer to policies that exist elsewhere in the shop:
 * - payment: cash on delivery only (orders API accepts `cod` only; checkout copy)
 * - delivery zones/charges: live rates from /api/v1/delivery (filled in at render)
 * - delivery times, returns, refund: shipping-returns copy
 * - order lookup: /order-status (order number + checkout mobile)
 * - contact details and hours: contact copy
 */
import { SITE_CONTACT_DEFAULTS } from "@/lib/site-contact";

export type FaqCategory = {
  id: string;
  label: string;
  icon: string;
};

export type FaqLink = { label: string; href: string };

export type FaqItem = {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  link?: FaqLink;
};

export const FAQ_PHONE: string = SITE_CONTACT_DEFAULTS.phone;
export const FAQ_EMAIL: string = SITE_CONTACT_DEFAULTS.email;

export const faqsCopy = {
  hero: {
    eyebrow: "প্রশ্নোত্তর",
    title: "অর্ডার, ডেলিভারি ও রিটার্ন — সহজ উত্তর",
    subtitle:
      "ক্যাশ অন ডেলিভারি, ডেলিভারি চার্জ, ৩ দিনের রিটার্ন আর অর্ডার স্ট্যাটাস নিয়ে সাধারণ প্রশ্নের উত্তর এখানে।",
    placeholder: "প্রশ্ন খুঁজুন — যেমন: রিটার্ন, ডেলিভারি চার্জ",
    trendingLabel: "দ্রুত খুঁজুন",
    trending: ["ডেলিভারি চার্জ", "রিটার্ন", "ক্যাশ অন ডেলিভারি", "অর্ডার স্ট্যাটাস"],
  },
  sidebar: {
    title: "ক্যাটাগরি",
    subtitle: "বিষয় অনুযায়ী দেখুন",
    allLabel: "সব প্রশ্ন",
  },
  categories: [
    { id: "orders", label: "অর্ডার ও স্ট্যাটাস", icon: "package_2" },
    { id: "payment", label: "পেমেন্ট", icon: "payments" },
    { id: "delivery", label: "ডেলিভারি ও চার্জ", icon: "local_shipping" },
    { id: "returns", label: "রিটার্ন ও এক্সচেঞ্জ", icon: "assignment_return" },
    { id: "support", label: "যোগাযোগ", icon: "support_agent" },
  ] satisfies FaqCategory[],
  callout: {
    eyebrow: "জেনে রাখুন",
    body: "এখন শুধু ক্যাশ অন ডেলিভারি — প্রোডাক্ট হাতে পেয়ে টাকা দিন। ঢাকার ভেতরে সাধারণত ২৪–৪৮ ঘণ্টা, ঢাকার বাইরে ২৪–৭২ ঘণ্টার মধ্যে ডেলিভারি হয়।",
  },
  empty: {
    title: "কোনো উত্তর পাওয়া যায়নি",
    body: "অন্য শব্দ দিয়ে খুঁজুন বা ক্যাটাগরি বদলে দেখুন। না পেলে কল বা হোয়াটসঅ্যাপে জিজ্ঞাসা করুন।",
  },
  items: [
    // Orders & status
    {
      id: "how-to-order",
      categoryId: "orders",
      question: "কীভাবে অর্ডার করব?",
      answer:
        "পছন্দের প্রোডাক্ট কার্টে যোগ করে চেকআউটে যান। নাম, মোবাইল নম্বর, জেলা, এলাকা ও পুরো ঠিকানা দিন, ডেলিভারি এলাকা বেছে নিন, তারপর ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করুন। ইমেইল ও অর্ডার নোট ঐচ্ছিক।",
      link: { label: "প্রোডাক্ট দেখুন", href: "/products" },
    },
    {
      id: "order-number",
      categoryId: "orders",
      question: "অর্ডার নম্বর কোথায় পাব?",
      answer:
        "অর্ডার কনফার্ম হলে স্ক্রিনে অর্ডার নম্বর দেখানো হয় — IM- দিয়ে শুরু, তারপর ৮টি অক্ষর (যেমন IM-9F216D67)। নম্বরটি লিখে বা স্ক্রিনশট নিয়ে রাখুন; স্ট্যাটাস দেখতে আর সাপোর্টে যোগাযোগে এটি লাগবে।",
    },
    {
      id: "order-status",
      categoryId: "orders",
      question: "অর্ডার স্ট্যাটাস কীভাবে দেখব?",
      answer:
        "অর্ডার স্ট্যাটাস পেজে অর্ডার নম্বর আর চেকআউটে দেওয়া ১১ সংখ্যার মোবাইল নম্বর দিন। দুটো মিললে অর্ডারের বর্তমান ধাপ দেখাবে: সেভ হয়েছে → কনফার্ম → পাঠানো → হাতে পৌঁছেছে।",
      link: { label: "অর্ডার স্ট্যাটাস দেখুন", href: "/order-status" },
    },
    {
      id: "order-confirmation",
      categoryId: "orders",
      question: "অর্ডার কনফার্ম হয়েছে কীভাবে বুঝব?",
      answer:
        "অর্ডার কনফার্ম হলে চেকআউটে দেওয়া মোবাইলে কল বা মেসেজ করা হয়, আর অর্ডার স্ট্যাটাস পেজে ধাপটি “কনফার্ম” দেখায়। তাই চেকআউটে সচল মোবাইল নম্বর দিন।",
    },
    // Payment
    {
      id: "payment-method",
      categoryId: "payment",
      question: "কীভাবে পেমেন্ট করব?",
      answer:
        "এখন শুধু ক্যাশ অন ডেলিভারি (COD) চালু আছে। প্রোডাক্ট হাতে পেয়ে ডেলিভারি পার্সনকে টাকা দিন। অনলাইন বা কার্ড পেমেন্ট এখন নেওয়া হয় না।",
    },
    {
      id: "advance-payment",
      categoryId: "payment",
      question: "অর্ডারের সময় কি আগে টাকা দিতে হয়?",
      answer:
        "না। অর্ডার করতে অগ্রিম টাকা লাগে না। প্রোডাক্টের দাম আর আপনার এলাকার ডেলিভারি চার্জ মিলিয়ে মোট কত দিতে হবে, তা চেকআউটেই দেখানো হয় — সেই টাকা ডেলিভারির সময় দেবেন।",
    },
    // Delivery
    {
      id: "delivery-areas",
      categoryId: "delivery",
      question: "কোথায় কোথায় ডেলিভারি দেন?",
      answer:
        "ঢাকাসহ সারা বাংলাদেশে কুরিয়ারের মাধ্যমে ডেলিভারি দেওয়া হয়। চেকআউটে তিনটি এলাকা থেকে বেছে নিতে হয়: ঢাকার ভেতরে (ঢাকা উত্তর ও দক্ষিণ সিটি), ঢাকার শহরতলি (সিটির বাইরে, ঢাকা জেলার এলাকা) এবং ঢাকার বাইরে (অন্য সব জেলা)।",
    },
    {
      id: "delivery-charge",
      categoryId: "delivery",
      question: "ডেলিভারি চার্জ কত?",
      answer:
        "ডেলিভারি চার্জ এলাকা অনুযায়ী আলাদা। চেকআউটে এলাকা বেছে নিলে চার্জ মোট দামের সাথে যোগ হয়ে দেখায়।",
      link: { label: "শিপিং ও রিটার্ন নীতি", href: "/shipping-returns" },
    },
    {
      id: "delivery-time",
      categoryId: "delivery",
      question: "ডেলিভারি পেতে কত দিন লাগে?",
      answer:
        "ঢাকার ভেতরে সাধারণত ২৪–৪৮ ঘণ্টা আর ঢাকার বাইরে ২৪–৭২ ঘণ্টার মধ্যে ডেলিভারি হয়। কাস্টম ড্রেসে স্টিচিংসহ ৩–৭ কর্মদিবস লাগতে পারে।",
    },
    {
      id: "delivery-delay",
      categoryId: "delivery",
      question: "ডেলিভারি দেরি হলে কী করব?",
      answer:
        "প্রথমে অর্ডার স্ট্যাটাস পেজে দেখে নিন অর্ডারটি কোন ধাপে আছে। এরপরও দেরি মনে হলে অর্ডার নম্বরসহ কল বা হোয়াটসঅ্যাপ করুন — আমরা খোঁজ নিয়ে জানাব।",
      link: { label: "অর্ডার স্ট্যাটাস দেখুন", href: "/order-status" },
    },
    // Returns & exchange
    {
      id: "return-policy",
      categoryId: "returns",
      question: "রিটার্ন বা এক্সচেঞ্জ করা যায়?",
      answer:
        "হ্যাঁ। ডেলিভারির পর ৩ দিনের মধ্যে প্রোডাক্ট ত্রুটিপূর্ণ (ডিফেক্ট) বা অর্ডারের চেয়ে ভিন্ন হলে রিটার্ন বা রিপ্লেসমেন্ট করা যায়। প্রোডাক্ট অব্যবহৃত ও আসল অবস্থায় থাকতে হবে; সম্ভব হলে আসল প্যাকেজিং ও অ্যাকসেসরিজসহ ফেরত দিন।",
      link: { label: "রিটার্ন নীতি বিস্তারিত", href: "/shipping-returns" },
    },
    {
      id: "return-how",
      categoryId: "returns",
      question: "রিটার্ন বা এক্সচেঞ্জের জন্য কী করতে হবে?",
      answer:
        "৩ দিনের মধ্যে কল বা হোয়াটসঅ্যাপে অর্ডার নম্বর, সমস্যার বিবরণ আর ডিফেক্ট/ভুল আইটেমের ছবি পাঠান। প্রোডাক্ট ফেরত এলে আমাদের টিম কন্ডিশন যাচাই করে, তারপর রিপ্লেসমেন্ট বা প্রযোজ্য ক্ষেত্রে রিফান্ডের ব্যবস্থা করে — কোন পদ্ধতিতে হবে তা আগেই জানিয়ে দেওয়া হয়।",
    },
    {
      id: "return-exceptions",
      categoryId: "returns",
      question: "কোন ক্ষেত্রে রিটার্ন হয় না?",
      answer:
        "ব্যবহৃত, ক্ষতিগ্রস্ত বা নিজের ভুলে অর্ডার করা আইটেম সাধারণত রিটার্নযোগ্য নয়। কাস্টম মেড ড্রেসে শুধু সাইজ বা ডিজাইন পছন্দ না হওয়ার কারণে রিটার্ন সীমিত; তবে সেলাই বা ফেব্রিকে ত্রুটি থাকলে সমাধান করা হয়।",
    },
    {
      id: "refund",
      categoryId: "returns",
      question: "টাকা ফেরত (রিফান্ড) কীভাবে পাব?",
      answer:
        "ক্যাশ অন ডেলিভারি অর্ডারে সাধারণত এক্সচেঞ্জ বা রিপ্লেসমেন্টকে অগ্রাধিকার দেওয়া হয়। টাকা ফেরতের প্রয়োজন হলে তা কেস অনুযায়ী ঠিক করা হয় এবং পদ্ধতি আগেই জানিয়ে দেওয়া হয়।",
    },
    // Support
    {
      id: "contact",
      categoryId: "support",
      question: "কীভাবে যোগাযোগ করব?",
      answer: `কল বা হোয়াটসঅ্যাপ: ${FAQ_PHONE}। ইমেইল: ${FAQ_EMAIL}। যোগাযোগ পেজের ফর্মেও মেসেজ পাঠাতে পারেন। অর্ডার নিয়ে জানতে চাইলে অর্ডার নম্বরটি সাথে দিন।`,
      link: { label: "যোগাযোগ পেজ", href: "/contact-us" },
    },
    {
      id: "support-hours",
      categoryId: "support",
      question: "কখন যোগাযোগ করা যাবে?",
      answer:
        "শনি থেকে বৃহস্পতিবার সকাল ৯টা – রাত ১০টা, আর শুক্রবার দুপুর ২টা – রাত ১০টা। এই সময়ের মধ্যে রিপ্লাই দেওয়ার চেষ্টা করি।",
    },
  ] satisfies FaqItem[],
  helpCta: {
    title: "উত্তর খুঁজে পাননি?",
    subtitle: "কল বা হোয়াটসঅ্যাপ করুন — অর্ডার নিয়ে হলে অর্ডার নম্বরটি সাথে দিন।",
    button: "যোগাযোগ পেজ",
    whatsapp: "হোয়াটসঅ্যাপ",
    email: FAQ_EMAIL,
    phone: FAQ_PHONE,
  },
} as const;

type Rates = {
  insideDhaka: number;
  dhakaSuburban: number;
  outsideDhaka: number;
  insideEnabled: boolean;
  suburbanEnabled: boolean;
  outsideEnabled: boolean;
};

const bnNumber = (value: number) => value.toLocaleString("bn-BD");

/** Delivery-charge answer from the live rates; the generic copy when they are unavailable. */
export function deliveryChargeAnswer(rates: Rates | null): string {
  const generic = faqsCopy.items.find((item) => item.id === "delivery-charge")?.answer ?? "";
  if (!rates) return generic;
  const zones = [
    { label: "ঢাকার ভেতরে", value: rates.insideDhaka, enabled: rates.insideEnabled },
    { label: "ঢাকার শহরতলি", value: rates.dhakaSuburban, enabled: rates.suburbanEnabled },
    { label: "ঢাকার বাইরে", value: rates.outsideDhaka, enabled: rates.outsideEnabled },
  ].filter((zone) => zone.enabled);
  if (!zones.length) return generic;
  const list = zones.map((zone) => `${zone.label} ৳${bnNumber(zone.value)}`).join(", ");
  return `${list}। চেকআউটে এলাকা বেছে নিলে এই চার্জ মোট দামের সাথে যোগ হয়ে দেখায়, আর ডেলিভারির সময় প্রোডাক্টের দামের সাথে একসাথে দিতে হয়।`;
}
