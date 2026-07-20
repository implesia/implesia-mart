export type ContactChannel = {
  icon: string;
  title: string;
  value: string;
  href: string;
};

export type ContactQuickLink = {
  icon: string;
  label: string;
  href: string;
};

export type ContactSocialLink = {
  platform: "facebook" | "linkedin";
  label: string;
  href: string;
};

export type ContactFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const WHATSAPP_NUMBER = "8801516527932";
const WHATSAPP_DEFAULT_MESSAGE =
  "হ্যালো, আমি ইমপ্লেসিয়া মার্ট সম্পর্কে জানতে চাই।";

export function getWhatsAppHref(message = WHATSAPP_DEFAULT_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_HREF = getWhatsAppHref();


export const contactCopy = {
  hero: {
    eyebrow: "যোগাযোগ করুন",
    title: "আমরা সাহায্য করতে সবসময় প্রস্তুত",
    subtitle:
      "অর্ডার, ডেলিভারি বা প্রোডাক্ট নিয়ে যেকোনো প্রশ্ন থাকলে নিচের ফর্মে মেসেজ পাঠান অথবা সরাসরি কল/হোয়াটসঅ্যাপ করুন — আমাদের টিম দ্রুত রেসপন্স করবে।",
  },
  form: {
    title: "মেসেজ পাঠান",
    subtitle: "নিচের ফর্মটি পূরণ করুন, আমরা দ্রুততম সময়ে যোগাযোগ করব।",
    fields: {
      name: { label: "নাম", placeholder: "আপনার নাম লিখুন" },
      phone: { label: "ফোন নাম্বার", placeholder: "০১XXX-XXXXXX" },
      subject: { label: "বিষয়", placeholder: "যেমন: অর্ডার সম্পর্কে জানতে চাই" },
      message: { label: "মেসেজ", placeholder: "আমরা কীভাবে সাহায্য করতে পারি লিখুন..." },
    },
    cta: "মেসেজ পাঠান",
    successTitle: "মেসেজ পাঠানো হয়েছে!",
    successBody: "ধন্যবাদ। আমাদের টিম দ্রুত আপনার সাথে যোগাযোগ করবে।",
  },
  direct: {
    title: "সরাসরি যোগাযোগ",
    subtitle: "নিচের যেকোনো মাধ্যমে সরাসরি যোগাযোগ করতে পারেন।",
    channels: [
      {
        icon: "call",
        title: "কল করুন",
        value: "+880 1516-527932",
        href: "tel:+8801516527932",
      },
      {
        icon: "chat",
        title: "হোয়াটসঅ্যাপ",
        value: "+880 1516-527932",
        href: WHATSAPP_HREF,
      },
      {
        icon: "mail", 
        title: "ইমেইল করুন",
        value: "implesiaitltd@gmail.com",
        href: "mailto:implesiaitltd@gmail.com",
      },
      {
        icon: "location_on",
        title: "সার্ভিস এরিয়া",
        value: "সারাদেশে ৬৪ জেলা কভারেজ",
        href: "/sustainability",
      },
    ] satisfies ContactChannel[],
    badge: "যাচাইকৃত ও নিরাপদ বিক্রেতা",
    social: [
      {
        platform: "facebook",
        label: "ফেসবুক গ্রুপ",
        href: "https://www.facebook.com/implesiamart",
      },
      {
        platform: "linkedin",
        label: "লিংকডইন",
        href: "https://www.linkedin.com/company/implesia-mart",
      },
    ] satisfies ContactSocialLink[],
  },
  support: {
    title: "কাস্টমার সাপোর্ট সময়সূচি",
    subtitle: "নিচের সময়ে আমাদের টিম সরাসরি রেসপন্স দিতে পারবে।",
    hours: [
      { label: "শনি – বৃহস্পতি", value: "সকাল ৯টা – রাত ১০টা" },
      { label: "শুক্রবার", value: "দুপুর ২টা – রাত ১০টা" },
    ],
    quickLinks: [
      { icon: "help", label: "সাধারণ প্রশ্নোত্তর", href: "/faqs" },
      { icon: "local_shipping", label: "শিপিং ও রিটার্ন", href: "/shipping-returns" },
      { icon: "storefront", label: "সব প্রোডাক্ট", href: "/products" },
    ] satisfies ContactQuickLink[],
  },
  faq: {
    title: "সচরাচর জিজ্ঞাসিত প্রশ্ন",
    subtitle: "যোগাযোগ নিয়ে সাধারণ কিছু প্রশ্নের উত্তর।",
    items: [
      {
        id: "response-time",
        question: "মেসেজ পাঠানোর পর কতক্ষণে রিপ্লাই পাব?",
        answer:
          "সাধারণত আমরা কর্মঘণ্টার মধ্যে ১-২ ঘণ্টার মধ্যে রিপ্লাই দিই। দ্রুত সাহায্যের জন্য সরাসরি কল বা হোয়াটসঅ্যাপ করতে পারেন।",
      },
      {
        id: "order-status",
        question: "আমার অর্ডার স্ট্যাটাস কীভাবে জানব?",
        answer:
          "অর্ডার করার সময় দেওয়া ফোন নাম্বারে আমাদের ডেলিভারি টিম যোগাযোগ করবে। এছাড়া সরাসরি কল করেও অর্ডার স্ট্যাটাস জানতে পারবেন।",
      },
      {
        id: "cod-question",
        question: "ক্যাশ অন ডেলিভারিতে কি কোনো সমস্যা হলে যোগাযোগ করা যাবে?",
        answer:
          "হ্যাঁ, প্রোডাক্ট হাতে পাওয়ার আগে বা পরে কোনো সমস্যা হলে আমাদের সাপোর্ট টিমে সরাসরি কল বা মেসেজ করুন, আমরা সমাধান করে দেব।",
      },
    ] satisfies ContactFaqItem[],
  },
} as const;
