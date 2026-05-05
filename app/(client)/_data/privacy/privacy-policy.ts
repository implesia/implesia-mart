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

export const privacyPolicyCopy = {
  lastUpdated: "Oct 2023",
  hero: {
    title: "Privacy Policy",
    subtitle:
      "Your data is protected and handled with care. We value the trust you place in Implesia Mart.",
  },
  nav: [
    { id: "introduction", label: "Introduction", icon: "info" },
    { id: "collection", label: "Data Collection", icon: "database" },
    { id: "usage", label: "How We Use Data", icon: "query_stats" },
    { id: "cookies", label: "Cookies Policy", icon: "cookie" },
    { id: "rights", label: "Your Rights", icon: "gavel" },
  ] satisfies PrivacyNavItem[],
  sections: {
    introduction: {
      title: "1. Introduction",
      paragraphs: [
        "At Implesia Mart, your privacy is not just a policy—it is a core value of our business. Whether you are browsing our collections or placing an order, we are committed to maintaining the trust and confidence of our customers.",
        "In this Privacy Policy, we provide detailed information on when and why we collect personal information, how we use it, the limited conditions under which we may disclose it to others, and how we keep it secure.",
      ],
    },
    collection: {
      title: "2. Information We Collect",
      cards: [
        {
          icon: "person_search",
          title: "Personal Data",
          description:
            "Name, email, phone number, and shipping address provided during checkout or account creation.",
        },
        {
          icon: "devices",
          title: "Technical Info",
          description:
            "IP address, device type, browser identifiers, and operating system information.",
        },
        {
          icon: "shopping_cart_checkout",
          title: "Order Details",
          description:
            "Historical purchase data, product preferences, and transactional records.",
        },
      ] satisfies PrivacyInfoCard[],
    },
    usage: {
      title: "3. How We Use Information",
      items: [
        {
          title: "Order Fulfillment",
          description:
            "To process your transactions and deliver your products to your doorstep.",
        },
        {
          title: "Personalization",
          description:
            "To tailor editorial content and product recommendations to your tastes.",
        },
        {
          title: "Support",
          description:
            "To provide customer service and handle returns or inquiries effectively.",
        },
      ] satisfies PrivacyUseItem[],
    },
    protection: {
      title: "State-of-the-Art Protection",
      body:
        "We utilize industry-leading encryption and security protocols. Your data is encrypted both in transit and at rest using AES-256 standards.",
      badges: [
        { icon: "lock", label: "256-bit SSL" },
        { icon: "shield", label: "PCI Compliant" },
        { icon: "key", label: "End-to-End Encryption" },
      ],
    },
    sharing: {
      title: "4. Sharing Information",
      body:
        "We do not sell your personal data to third parties for marketing purposes. Your information is only shared with trusted partners essential for operations, such as:",
      chips: ["Logistics Partners", "Payment Processors", "Cloud Infrastructure"],
    },
    cookies: {
      title: "5. Cookies & Tracking",
      quote: "We use cookies to ensure that we give you the best experience on our website.",
      body:
        "Our platform uses session management cookies to keep you logged in and analytics cookies to understand how visitors interact with our site. You can manage preferences through your browser settings.",
    },
    rights: {
      title: "6. Your Legal Rights",
      items: [
        {
          icon: "visibility",
          title: "Right to Access",
          description: "Request a copy of the personal information we hold about you.",
        },
        {
          icon: "edit",
          title: "Right to Correction",
          description: "Correct any inaccurate or incomplete data we maintain.",
        },
        {
          icon: "delete",
          title: "Right to Deletion",
          description:
            'The "Right to be Forgotten" allows you to request removal of your personal data.',
        },
        {
          icon: "block",
          title: "Right to Object",
          description:
            "Object to the processing of your data for specific purposes like direct marketing.",
        },
      ] satisfies PrivacyRight[],
    },
    retentionUpdates: {
      retentionTitle: "Data Retention",
      retentionBody:
        "We retain your information only for as long as necessary to provide services and comply with legal obligations.",
      updatesTitle: "Policy Updates",
      updatesBody:
        "We may update this policy. Users will be notified of significant changes to our data handling practices.",
    },
    support: {
      title: "Still Have Questions?",
      body:
        "Our privacy team is here to assist you with any inquiries regarding your data.",
      email: "privacy@implesiamart.com",
      phone: "+880 1XXX-XXXXXX",
      cta: "CONTACT US",
    },
  },
} as const;

