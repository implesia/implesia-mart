export const productCategories = [
  {
    title: "Trending Gadgets",
    href: "/products",
    description: "Unique and trending gadgets, delivered nationwide with cash on delivery.",
  },
] as const;

export const headerNav = [
  { type: "link", href: "/", label: "Home" },
  { type: "link", href: "/products", label: "Products" },
  { type: "link", href: "/about-us", label: "About Us" },
  { type: "link", href: "/sustainability", label: "Sustainability" },
  { type: "link", href: "/contact-us", label: "Contact Us" },
  { type: "link", href: "/blogs", label: "Blog" },
] as const;
