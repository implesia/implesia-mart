export const productCategories = [
  {
    title: "ট্রেন্ডিং গ্যাজেট",
    href: "/products",
    description: "ইউনিক ও ট্রেন্ডিং গ্যাজেট, সারাদেশে ক্যাশ অন ডেলিভারিতে।",
  },
] as const;

export const headerNav = [
  { type: "link", href: "/", label: "হোম" },
  { type: "link", href: "/products", label: "প্রোডাক্টস" },
  { type: "link", href: "/about-us", label: "আমাদের সম্পর্কে" },
  { type: "link", href: "/sustainability", label: "সাসটেইনেবিলিটি" },
  { type: "link", href: "/contact-us", label: "যোগাযোগ" },
  { type: "link", href: "/blogs", label: "ব্লগ" },
] as const;
