export const productCategories = [
  {
    title: "Trending Gadgets",
    href: "/products",
    description: "Unique and trending gadgets, delivered nationwide with cash on delivery.",
  },
] as const;

export const headerNav = [
  { type: "link", href: "/", label: "হোম" },
  { type: "link", href: "/products", label: "প্রোডাক্ট" },
  { type: "link", href: "/about-us", label: "আমাদের সম্পর্কে" },
  { type: "link", href: "/sustainability", label: "সাসটেইনেবিলিটি" },
  { type: "link", href: "/contact-us", label: "যোগাযোগ" },
  { type: "link", href: "/blogs", label: "ব্লগ" },
] as const;
