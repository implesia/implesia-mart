export const productCategories = [
  {
    title: "Fabrics",
    href: "/products/fabrics",
    description: "Tailored textiles and premium seasonal edits.",
  },
  {
    title: "Electronics",
    href: "/products/electronics",
    description: "Curated tech with performance and aesthetic harmony.",
  },
  {
    title: "Organic Food",
    href: "/products/organic",
    description: "Single-origin ingredients, delivered at peak freshness.",
  },
  {
    title: "Accessories",
    href: "/products/accessories",
    description: "Watches, carry, and finishing details.",
  },
] as const;

export const headerNav = [
  { type: "link", href: "/", label: "Home" },
  { type: "products", href: "/products", label: "Products" },
  { type: "link", href: "/about", label: "About Us" },
  { type: "link", href: "/contact", label: "Contacts" },
  { type: "link", href: "/blogs", label: "Blogs" },
] as const;

