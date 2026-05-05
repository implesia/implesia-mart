export type FaqCategory = {
  id: string;
  label: string;
  icon: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  defaultOpen?: boolean;
};

export const faqsCopy = {
  hero: {
    title: "How can we help you today?",
    placeholder: "Search for questions, orders, or policies...",
    trending: ["Track Shipment", "Return Policy", "Gift Cards"],
  },
  sidebar: {
    title: "Help Center",
    subtitle: "Find answers quickly",
    categories: [
      { id: "orders", label: "Orders & Returns", icon: "package" },
      { id: "shipping", label: "Shipping Info", icon: "local_shipping" },
      { id: "sizing", label: "Sizing Guide", icon: "straighten" },
      { id: "care", label: "Product Care", icon: "auto_fix_high" },
      { id: "contact", label: "Contact Us", icon: "mail" },
    ] satisfies FaqCategory[],
  },
  content: {
    title: "Orders & Delivery",
    subtitle:
      "Everything you need to know about your purchase journey from checkout to your doorstep.",
    callout: {
      eyebrow: "Top Priority Info",
      body:
        "Standard international shipping is currently experiencing delays of up to 48 hours due to high seasonal demand. Expedited services remain unaffected.",
    },
    items: [
      {
        id: "track-order",
        question: "How can I track my boutique order?",
        answer:
          'Once your order has been dispatched, you will receive a confirmation email containing your tracking number and a link to the courier\'s website. You can also view your tracking details in your Account Dashboard under "Recent Orders".',
        defaultOpen: true,
      },
      {
        id: "same-day",
        question: "Do you offer same-day delivery?",
        answer:
          "Same-day delivery is available for select metropolitan areas if the order is placed before 10:00 AM local time. This option will be presented at checkout if your delivery address qualifies.",
      },
      {
        id: "change-address",
        question: "Can I change my shipping address after purchase?",
        answer:
          "We process orders rapidly to ensure timely delivery. Address changes can only be made within 1 hour of placing your order. Please contact Support immediately for assistance.",
      },
      {
        id: "returns-window",
        question: "What is your returns window for luxury items?",
        answer:
          "We offer a complimentary 30-day return window for all items, provided they are in their original, unworn condition with all security tags intact.",
      },
    ] satisfies FaqItem[],
    helpCta: {
      title: "Still need help?",
      subtitle:
        "Our concierge team is available 24/7 to assist with any inquiries regarding your experience.",
      button: "Contact Support",
      email: "support@implesiamart.com",
      phone: "+880 1XXX-XXXXXX",
    },
  },
} as const;

