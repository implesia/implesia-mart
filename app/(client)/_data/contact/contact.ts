import {
  DEFAULT_SITE_CONTACT,
  internationalDigits,
  SITE_CONTACT_DEFAULTS,
} from "@/lib/site-contact";

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

/** Built-in fallback only; the live number is the central site contact (Admin -> Site -> Contact). */
export const WHATSAPP_NUMBER = internationalDigits(SITE_CONTACT_DEFAULTS.whatsapp) ?? "";
const WHATSAPP_DEFAULT_MESSAGE =
  "হ্যালো, আমি ইমপ্লেসিয়া মার্ট সম্পর্কে জানতে চাই।";

export function getWhatsAppHref(message = WHATSAPP_DEFAULT_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_HREF = getWhatsAppHref();

export const contactCopy = {
  hero: {
    eyebrow: "যোগাযোগ",
    title: "অর্ডার বা প্রোডাক্ট নিয়ে সাহায্য লাগলে বলুন",
    subtitle:
      "কল বা হোয়াটসঅ্যাপে সরাসরি যোগাযোগ করুন। কর্মঘণ্টায় রিপ্লাই দেওয়ার চেষ্টা করি।",
    primaryCta: { label: "হোয়াটসঅ্যাপ", href: WHATSAPP_HREF },
    secondaryCta: { label: "কল করুন", href: DEFAULT_SITE_CONTACT.telHref },
  },
  form: {
    title: "মেসেজ পাঠান",
    subtitle: "মেসেজ সরাসরি আমাদের টিমের কাছে পৌঁছাবে। পাঠানোর পর চাইলে হোয়াটসঅ্যাপে ফলো-আপ করতে পারবেন।",
    fields: {
      name: { label: "নাম", placeholder: "আপনার নাম লিখুন" },
      phone: { label: "ফোন নাম্বার", placeholder: "০১XXX-XXXXXX" },
      subject: { label: "বিষয়", placeholder: "যেমন: অর্ডার সম্পর্কে জানতে চাই" },
      message: { label: "মেসেজ", placeholder: "আমরা কীভাবে সাহায্য করতে পারি লিখুন..." },
    },
    cta: "মেসেজ পাঠান",
    hint: "আপনার তথ্য শুধু যোগাযোগের জন্য ব্যবহার করা হবে।",
  },
  direct: {
    title: "সরাসরি যোগাযোগ",
    subtitle: "যেকোনো মাধ্যমে যোগাযোগ করতে পারেন।",
    channels: [
      {
        icon: "call",
        title: "কল করুন",
        value: DEFAULT_SITE_CONTACT.phone,
        href: DEFAULT_SITE_CONTACT.telHref,
      },
      {
        icon: "chat",
        title: "হোয়াটসঅ্যাপ",
        value: DEFAULT_SITE_CONTACT.whatsapp,
        href: WHATSAPP_HREF,
      },
      {
        icon: "mail",
        title: "ইমেইল করুন",
        value: DEFAULT_SITE_CONTACT.email,
        href: DEFAULT_SITE_CONTACT.mailtoHref,
      },
      {
        icon: "location_on",
        title: "সার্ভিস এরিয়া",
        value: "সারাদেশে ৬৪ জেলা",
        href: "/shipping-returns",
      },
    ] satisfies ContactChannel[],
    badge: "ক্যাশ অন ডেলিভারি",
    social: [
      {
        platform: "facebook",
        label: "ফেসবুক",
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
    title: "সাপোর্ট সময়সূচি",
    subtitle: "এই সময়ে সরাসরি রেসপন্সের চেষ্টা করি।",
    hours: [
      { label: "শনি – বৃহস্পতি", value: "সকাল ৯টা – রাত ১০টা" },
      { label: "শুক্রবার", value: "দুপুর ২টা – রাত ১০টা" },
    ],
    quickLinks: [
      { icon: "receipt_long", label: "আমার অর্ডার", href: "/order-status" },
      { icon: "help", label: "সাধারণ প্রশ্নোত্তর", href: "/faqs" },
      { icon: "local_shipping", label: "শিপিং ও রিটার্ন", href: "/shipping-returns" },
      { icon: "storefront", label: "সব প্রোডাক্ট", href: "/products" },
    ] satisfies ContactQuickLink[],
  },
  faq: {
    title: "যোগাযোগ নিয়ে সাধারণ প্রশ্ন",
    subtitle: "কল, মেসেজ ও অর্ডার স্ট্যাটাস — সংক্ষেপে।",
    items: [
      {
        id: "response-time",
        question: "মেসেজের পর কতক্ষণে রিপ্লাই পাব?",
        answer:
          "কর্মঘণ্টার মধ্যে রিপ্লাই দেওয়ার চেষ্টা করি। তাড়াতাড়ি লাগলে কল বা হোয়াটসঅ্যাপ করুন।",
      },
      {
        id: "order-status",
        question: "অর্ডার স্ট্যাটাস কীভাবে জানব?",
        answer:
          "আমার অর্ডার পেজে অর্ডার নম্বর আর চেকআউটের মোবাইল মিলিয়ে স্ট্যাটাস দেখুন। না পেলে কল বা হোয়াটসঅ্যাপ করুন।",
      },
      {
        id: "cod-question",
        question: "COD-এ সমস্যা হলে কী করব?",
        answer:
          "প্রোডাক্ট হাতে পাওয়ার আগে বা পরে সমস্যা হলে কল বা হোয়াটসঅ্যাপ করুন — ৩ দিনের মধ্যে রিটার্নও করা যায়।",
      },
    ] satisfies ContactFaqItem[],
  },
} as const;
