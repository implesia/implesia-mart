export type ContactChannel = {
  icon: string;
  title: string;
  value: string;
};

export type ContactFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const contactCopy = {
  hero: {
    title: "Contact Us",
    subtitle:
      "Our concierge team is available around the clock to ensure your Implesia Mart experience is nothing short of exceptional.",
  },
  form: {
    title: "Send a Message",
    fields: {
      name: { label: "Name", placeholder: "John Doe" },
      email: { label: "Email", placeholder: "john@example.com" },
      subject: { label: "Subject", placeholder: "Inquiry about product sourcing" },
      message: { label: "Message", placeholder: "How can we assist you today?" },
    },
    cta: "Send Message",
  },
  direct: {
    title: "Direct Contact",
    subtitle:
      "Prefer direct communication? Reach out through any of our premium channels.",
    channels: [
      { icon: "mail", title: "Email Concierge", value: "support@implesiamart.com" },
      { icon: "call", title: "Priority Support", value: "+880 1XXX-XXXXXX" },
      { icon: "location_on", title: "Global Flagship", value: "Dhaka, Bangladesh" },
    ] satisfies ContactChannel[],
    badge: "Authorized Retailer",
  },
  map: {
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAmAtrO4GzXlLd4Sj-k1xkq7NIjLJNjm2QeMEc8dqFO3ntCjAR_XQ4SHKlNC_QkfmY-EQSviC9Iyi_fhqVCJrxhE7MOHpCzswkIusXy-4R1VJosRNrEThm-kMGMJruaTBiM58GUiIrtXbQsfVKBg0HOq0VPjOju3lpXDdwSj9vIWvU67R9OGXvHBq-uUlfDdghxkc5Q4w0Bwfei_GValKdNoUjVeKHVMG4KXvFoy_L6fbf03b70twf4kUrVLxKFIC4tTAlzJQiFNg",
    imageAlt: "Map showing our office location",
    cardTitle: "Visit Us",
    cardBody:
      "Our flagship store and support offices are located in a central, easy-to-reach area.",
    cardCta: "Get Directions",
  },
  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Instant answers to common inquiries.",
    items: [
      {
        id: "shipping",
        question: "Shipping & Global Delivery",
        answer:
          "We offer complimentary shipping on select orders. International shipping is handled via trusted courier partners with insured delivery.",
      },
      {
        id: "returns",
        question: "Returns & Exchanges",
        answer:
          "Our returns policy allows returns within 30 days of receipt. Items must be in original, unused condition with tags intact.",
      },
      {
        id: "sourcing",
        question: "Ethical Product Sourcing",
        answer:
          "We’re committed to ethical sourcing. Every item is vetted for sustainable manufacturing practices and fair labor conditions.",
      },
    ] satisfies ContactFaqItem[],
  },
} as const;

