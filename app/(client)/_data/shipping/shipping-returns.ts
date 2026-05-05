export type ShippingTimeline = {
  label: string;
  value: string;
};

export type ShippingFeatureCard = {
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  variant?: "default" | "primary";
};

export type PaymentCard = {
  icon: string;
  badge: { label: string; variant: "success" | "muted" };
  title: string;
  body: string;
  footnote?: string;
};

export type ReturnRule = string;

export type SpecialNote = {
  icon: string;
  title: string;
  body: string;
  tone: "tertiary" | "secondary" | "primary";
};

export type MiniFaq = {
  q: string;
  a: string;
};

export const shippingReturnsCopy = {
  hero: {
    title: "Shipping & Returns",
    subtitle:
      "Fast delivery, easy returns, and transparent policies designed for your convenience.",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAbWmaXZBxuMrKMimhgVMY0711a2gK9ouYDOPRkPsJpT2w1ffMqiyc87ovTTwD1PhFEUwmSdxGSiQ4ZSVpw-bxBnDVOzwF3j17SsHUWYeP6Zw18k8ShbDcSulfHhKFIFMcSl97lyYSXfyTQ9HGbURkityqlzbEM4fZbDVYhgSRnXztn7CWwzCjfOQhWfU90Oyt4fYs0WLrioURPHHcaQrRGEHAdwq1BqZfnDF1cCHFiMff7182qQ4UU8ZuQ_3P5J3wKm6zDapgCow",
    imageAlt: "Modern logistics warehouse symbolizing efficient shipping operations",
  },
  nav: {
    title: "Customer Care",
    subtitle: "Policy & Information",
    items: [
      { id: "shipping", label: "Shipping Policy", icon: "local_shipping" },
      { id: "payment", label: "Payment Methods", icon: "payments" },
      { id: "returns", label: "Returns & Exchanges", icon: "keyboard_return" },
      { id: "refund", label: "Refund Process", icon: "receipt_long" },
      { id: "support", label: "Support Center", icon: "help_outline" },
    ],
  },
  shipping: {
    heading: "Shipping Information",
    cards: [
      {
        eyebrow: "Domestic Delivery",
        title: "Nationwide Coverage",
        subtitle: "We deliver to every corner",
        body: "We deliver to every corner of the country using our premium logistics partners.",
        variant: "default",
      },
      {
        eyebrow: "Premium Benefit",
        title: "Free Delivery",
        subtitle: "Orders over $500",
        body: "Enjoy complimentary shipping on all orders exceeding $500. Applied automatically at checkout.",
        variant: "primary",
      },
    ] satisfies ShippingFeatureCard[],
    timelinesTitle: "Delivery Timelines",
    timelines: [
      { label: "Inside City Limits", value: "1 - 3 Days" },
      { label: "Outside City / Regional", value: "3 - 5 Days" },
    ] satisfies ShippingTimeline[],
    express: {
      title: "Express Processing",
      body: "All orders are processed and dispatched within 24 hours of confirmation.",
      icon: "bolt",
    },
  },
  payment: {
    heading: "Payment Methods",
    cards: [
      {
        icon: "credit_card",
        badge: { label: "SECURE", variant: "success" },
        title: "Online Payment",
        body: "Safe and encrypted checkout. All major cards accepted.",
      },
      {
        icon: "handshake",
        badge: { label: "LOCAL", variant: "muted" },
        title: "Cash on Delivery",
        body: "Pay conveniently when your package arrives at your doorstep.",
        footnote: "Available Nationwide",
      },
    ] satisfies PaymentCard[],
  },
  returns: {
    heading: "Returns & Exchanges",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB-B6z4y42cJf6VMXxlGhM9ZLjvQDdMPcHzYIHAevJzP947AHix6uJQ_VFNG6dLdnaBM6whh9Cjd2VtHgBIOJu43Q5Oe6jD03vr_c_zGxgkS3c_fBMdmbwZSyyLVix9v18MwRoxY5wacIl6Yl_t2N5LbPZdlusq-mBCQm7aFbqJ1KkNorz-Q-0RjGnWIRwsJyJmuXOosLhyVw_jk83sskhxUHPrBHE1NhJW1cjGrgqZ6gCyt3EuOULPObGqfYzcIb0hFiGc4mtcaw",
    imageAlt: "Minimalist luxury packaging emphasizing premium return standards",
    eligibilityTitle: "7-Day Eligibility",
    rules: [
      "Items must be returned within 7 days of delivery.",
      "Products must be unused and in original condition.",
      "All original tags and packaging must be intact.",
    ] satisfies ReturnRule[],
    special: [
      {
        tone: "tertiary",
        icon: "restaurant",
        title: "Organic Food",
        body: "Non-returnable due to health and safety regulations.",
      },
      {
        tone: "secondary",
        icon: "devices",
        title: "Electronics",
        body: "Includes standard 1-year manufacturer warranty from date of purchase.",
      },
      {
        tone: "primary",
        icon: "apparel",
        title: "Clothing",
        body: "Size exchanges are available subject to stock availability.",
      },
    ] satisfies SpecialNote[],
  },
  support: {
    title: "Need Further Assistance?",
    subtitle:
      "Our dedicated support team is here to help you with tracking, returns, or any policy questions.",
    phone: "+880 1XXX-XXXXXX",
    email: "support@implesiamart.com",
    cta: "Visit Contact Us Page",
  },
  miniFaq: {
    title: "Frequently Asked Questions",
    items: [
      {
        q: "How can I track my order?",
        a: "Tracking details are sent via SMS and email immediately after dispatch.",
      },
      {
        q: "Missing delivery?",
        a: "If your package hasn't arrived within the timeline, please contact support within 48 hours.",
      },
      {
        q: "Weekend deliveries?",
        a: "We currently deliver Monday through Saturday. Sunday deliveries are not available.",
      },
    ] satisfies MiniFaq[],
  },
} as const;

