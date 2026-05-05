import { products, type Product } from "./products";

export type ProductDetail = Product & {
  slug: string;
  breadcrumbs: { label: string; href?: string }[];
  gallery: { src: string; alt: string }[];
  tagline: string;
  rating: { value: number; count: number };
  stockLabel: string;
  description: string;
  colorOptions: { id: string; name: string; swatch: string }[];
  materialDetails: { label: string; value: string }[];
  delivery: { icon: string; title: string; description: string }[];
  details: {
    heading: string;
    body: string;
    bullets: string[];
    authenticity: {
      title: string;
      body: string;
      imageSrc: string;
      imageAlt: string;
    };
  };
  reviews: {
    average: number;
    total: number;
    breakdown: { stars: 5 | 4 | 3 | 2 | 1; percent: number }[];
    items: {
      id: string;
      initials: string;
      name: string;
      meta: string;
      rating: number;
      quote: string;
    }[];
  };
  related: {
    id: string;
    title: string;
    priceLabel: string;
    imageSrc: string;
    imageAlt: string;
  }[];
};

export const sareeDetail: ProductDetail = {
  id: "saree-1",
  slug: "artisanal-heritage-saree",
  title: "Artisanal Heritage Saree",
  subtitle: "Hand-woven Heritage Silk",
  tagline: "Handcrafted Legacy",
  price: 850,
  imageSrc:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBgoBegD_fUzPpuQU_wPpWQgqGnBarHAf4DzrIXW_VLCMHYaGbf0HGpsIGcQ4fHDLkAYcXruGgRTeGg0psXiBbKH8212OJDGrD79OuExS_UOSnzQLP5MvGZsfOXbCCwYASsg8FBMzJJ8CAB6RCMbkEQgxzu6Xa3_S7MOr0RIKT122mfHwvQAcgHM15BOgKpM4sYaQF1jC7kYfjRb3q6FCLc5OfTVY0p6fM0Mu08HBemyTSuIRPUro1VFJH0qV4Jt2Cxboh9VmTcHA",
  imageAlt: "Main product view",
  badge: "New",
  rating: { value: 4.9, count: 128 },
  stockLabel: "In Stock",
  breadcrumbs: [
    { label: "Home", href: "/" },
    { label: "Apparel", href: "/products/fabrics" },
    { label: "Artisanal Collections", href: "/products" },
    { label: "Artisanal Heritage Saree" },
  ],
  gallery: [
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgoBegD_fUzPpuQU_wPpWQgqGnBarHAf4DzrIXW_VLCMHYaGbf0HGpsIGcQ4fHDLkAYcXruGgRTeGg0psXiBbKH8212OJDGrD79OuExS_UOSnzQLP5MvGZsfOXbCCwYASsg8FBMzJJ8CAB6RCMbkEQgxzu6Xa3_S7MOr0RIKT122mfHwvQAcgHM15BOgKpM4sYaQF1jC7kYfjRb3q6FCLc5OfTVY0p6fM0Mu08HBemyTSuIRPUro1VFJH0qV4Jt2Cxboh9VmTcHA",
      alt: "Main product view",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeqrLsrePFl_Y95W098PlkeJWzqanUNdeNBfSSz9Y3Agz5qE--7nkIQLT4VGBgyZPRA1E_ikoPYUw-4oSw1FkeHlfjJjd_RO5WMMnJyFjqmY_nyQI-Pm8hFR9y-Wp-dApdtrLVfeu9g9NL2-IeMcJJ03HhNOu4oMdJfO9fyoqHbZ-lcyZG2DbDjymPKBRMpFL3NbERB5SWcTEGfydWGFzIW9YEA2ratfl-DVkHW2dqTFC2vlp51bS-34RyvbgNX-h_Ftxsba4Z9w",
      alt: "Thumbnail drape view",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGPZOaSol2aomK1pCiTVop1sw1hxI5lzwP8zIsFoWoD1JeukrLj72VdVTFmNQGnJLSe3fA3sThPnSV3fAjTsC5LfCJ1RqA5k5jG-qz07Y080uZ5TBTItFeVuC1TtVRGyVyd5RbJkJG4sBxxy5lH1DIfMQEnGB_n2CP5lV8xI67-9F9LbkLkko_ol-MsPBj6c-xLwbXUDO3SjXI3VU7sAQE3lecBOX_zYiGZOUh8pkpCIL72xQnwKwE_wg0lJV0VGt0Dkl3H5V7cQ",
      alt: "Embroidery detail view",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdvHN_V9f-8qIa-MoxF7FlG5Yd2FqNHcxmOmZqdNUvT2uVI9QO3gWVDwfBvrvkTiZaupzQThEkR4Io22qXwEU-39Q4Xbb8BARyhrk6yL4f_Df_pXmxgc80DYgmSMXw6WtM0ImdHwNtPjDlueSY07zKBLFn1bwVuC5kT_9CH0sac1j2HuArMHNk18R1givWzVHpKI0oIap_rvBtsyfesR9cAJGxC0ilpu7Hamv7Uy_42enIwBe9mfRrHPUb1K4zT-Hz5LXOuhF2kg",
      alt: "Pallu design closeup",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAkMgOmMnRl_HqfFdJrG7tdKS14-YpDjHDKP67B-BKXnC8inkUHldW6hxrOuPPlrE8fxXKpSi-qJaC5Vy12DQ-EE8t3-QqEALTTaiaugJRKSobNudO4ZejAf7WrrsRjyEVJOId4r9MUFts6xOVHsJ5CAIQB25WWdYEf48Jj6g7fx82_gC0ANojFR6dt1Z_HFsyvhFnppcJd4SbkWy-J4_XOoee7IMsg3Uzdydmj4cuGciq87et9qJIrCsVWtlYx-xysHjHui75F9Q",
      alt: "Side profile drape",
    },
  ],
  description:
    "Woven by master artisans in Banaras, this pure silk saree features delicate hand-embroidery with real zari work. Each piece takes over 180 hours of meticulous craftsmanship.",
  colorOptions: [
    { id: "emerald", name: "Emerald Green", swatch: "#004539" },
    { id: "navy", name: "Midnight Navy", swatch: "#001B37" },
    { id: "gold", name: "Antique Gold", swatch: "#D4AF37" },
  ],
  materialDetails: [
    { label: "Fabric", value: "100% Pure Silk" },
    { label: "Zari Type", value: "Real Silver Gilded" },
  ],
  delivery: [
    {
      icon: "local_shipping",
      title: "Complimentary Express Shipping",
      description: "Free on orders over $500. Delivery in 3-5 business days.",
    },
    {
      icon: "assignment_return",
      title: "30-Day Bespoke Returns",
      description: "Easy returns via our premium concierge service.",
    },
  ],
  details: {
    heading: "A Masterpiece of Heritage",
    body: "The Artisanal Heritage Saree is a tribute to the rich textile history of the Indian subcontinent. Each thread is hand-spun and dyed using natural pigments to achieve a depth of color that is unmatched by industrial processes.",
    bullets: [
      "Hand-loomed in the sacred city of Varanasi",
      "Includes unstitched blouse piece in matching silk",
      "Authenticity certificate signed by the artisan",
    ],
    authenticity: {
      title: "Guaranteed Authenticity",
      body: "Every garment is embedded with a traceable NFC tag for provenance verification.",
      imageSrc:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCg23abWXvDEqlXlbyFx0HKElBMCgs825V1PQ36xL9SnomGvBuAhh8Az9RJEwbNrvefL-cogMh_xRdRLhaqTZAK14PrRmORG157EA0bNrTK7NAC49YHUV-AIbEOSL8eRHbwdL4BS7Zhbt5O5F-bqnHmbdG4ZD3cpEHmMmgVNcmEAtFRvtSDUmnxcbTIdRPnz6FHApacaTo7_0fKvE94vc1783wlmGAls3i0cZ6gMEZAUH0htjU0zm2sDCKNBP8Sq5f2T99dZRhgyQ",
      imageAlt: "Fabric close-up",
    },
  },
  reviews: {
    average: 4.9,
    total: 128,
    breakdown: [
      { stars: 5, percent: 92 },
      { stars: 4, percent: 6 },
      { stars: 3, percent: 2 },
      { stars: 2, percent: 0 },
      { stars: 1, percent: 0 },
    ],
    items: [
      {
        id: "r1",
        initials: "SC",
        name: "Sophia Chen",
        meta: "Verified Buyer • 2 weeks ago",
        rating: 5,
        quote:
          "The drape of this silk is extraordinary. The emerald color is even deeper and more vibrant in person. Truly a legacy piece for my wardrobe.",
      },
      {
        id: "r2",
        initials: "MR",
        name: "Marcus Reed",
        meta: "Verified Buyer • 1 month ago",
        rating: 5,
        quote:
          "Purchased this as an anniversary gift. The packaging alone was museum-quality. The artisan's signature adds such a personal touch.",
      },
    ],
  },
  related: [
    {
      id: "rel-1",
      title: "Midnight Silk Scarf",
      priceLabel: "$240.00",
      imageSrc:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDEEz3Qe9ZVwLQgqe_OMRhN_BvT--O6fX3aB90FpyFE2Pw2MWdHY1oarzXR0g9e4GwoAf2a2q1cjPp9TtfNdvVhG0yAq4VPEfmn59YCy4DFRnM-5EtF6l90zC3pK8W9kb2Sarxu3UtZCgP9-uMlAbo_t0USeE4oAPrYv2OFtXQnv-zI4qQVQ0jstDnHPQwgMAe40T9Kq8gndhYIc8RO2O7kQXk5X_1VN3h60hs7Tx5rpayPbTp06-aZ44ADLdE2IA47-L5QoPrQ5w",
      imageAlt: "Midnight Silk Scarf",
    },
    {
      id: "rel-2",
      title: "Emerald Heritage Pendant",
      priceLabel: "$680.00",
      imageSrc:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBhrunZvwoEW0jQEMEyERx-dI1fddg6qMyMtXWy0Lgy661835OfFb0vS__B5M_lbRa3rYSRDYUholK8-X409sY8srlPSklfPFEyKHDE9VoyiiTbPud2JGvxi03Tb1JVdtzxtgUnHmgCyKtZaZkZlGDs-4gPia9DRo8OgMaVA88eh9gsU-siAZPagk9TqSEgnOu3yYrPV1T6nXbqJUIgBmbLXOGCqndF7hdP7yA59nk1U-DCKqF5cpP1udSTN6DJeoWKicC9XV8ocw",
      imageAlt: "Emerald Pendant",
    },
    {
      id: "rel-3",
      title: "Zari Woven Clutch",
      priceLabel: "$310.00",
      imageSrc:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA5v2yQ1A-oYNx7ztha5bre_B5Ei2hHVubTeG90GmmU_m-0uwepaG0wCejcp_SkLaf8tzgLlybFcwBpG6yjvsA9qrshka06p7oq7lcZeMyeQ-SO70h6dYaoyVvLiUhoj1PplJPVTp7BpWh82jaxJsv5PbhndmcTXcmi8a68kVQSspO9-cwzk5BOkPyJU5pOC2c0ZLP0YDRJIJqbyUemLVFTl7H_9hFvsELnYNloEXGwj1jdPf_tx7b3PuZGWz4TDDjDEpqrH7l8IA",
      imageAlt: "Zari Woven Clutch",
    },
    {
      id: "rel-4",
      title: "Imperial Crimson Saree",
      priceLabel: "$920.00",
      imageSrc:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDNJmg2Y6PjGVIcjyfN_1zKA51y1uqmWOR8CNZYN5QDng_6MN5v3Ga3j7ZoVuYuB4DvYMIrbUDY-9I7Tx_7WvnWi2nDcpiKFKJTIksDDPRbKKTSugDeJ16dOjfFQsbKR0Cy-t-OcRHCOdzIMn618QxhOuif52U7zoYKlds9TTN6pwPVfh6OyT2CTBklmg_u_51HE-SRANSvCY0owFJ8lxhoyTXtsFY2An7C2_RjnnvwwLQECvJGvv_Cli09b4ycHHtqgoGnw-XKQw",
      imageAlt: "Imperial Crimson Saree",
    },
  ],
};

export const productDetails: ProductDetail[] = [sareeDetail];

function buildDefaultDetailFromProduct(p: Product): ProductDetail {
  const title = p.title;
  const subtitle = p.subtitle;

  return {
    ...p,
    slug: p.slug,
    tagline: "Curated Essential",
    rating: { value: 4.8, count: 64 },
    stockLabel: "In Stock",
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: title },
    ],
    gallery: [
      { src: p.imageSrc, alt: p.imageAlt },
      { src: p.imageSrc, alt: `${p.imageAlt} - alternate 1` },
      { src: p.imageSrc, alt: `${p.imageAlt} - alternate 2` },
      { src: p.imageSrc, alt: `${p.imageAlt} - alternate 3` },
    ],
    description:
      "A thoughtfully curated piece selected for quality, longevity, and everyday elegance. Crafted to feel premium in hand and effortless in use.",
    colorOptions: [
      { id: "teal", name: "Signature Teal", swatch: "#2bc0b5" },
      { id: "navy", name: "Midnight Navy", swatch: "#001B37" },
      { id: "gold", name: "Antique Gold", swatch: "#D4AF37" },
    ],
    materialDetails: [
      { label: "Collection", value: subtitle },
      { label: "Care", value: "Store in a cool, dry place" },
    ],
    delivery: [
      {
        icon: "local_shipping",
        title: "Complimentary Express Shipping",
        description: "Free on orders over $500. Delivery in 3-5 business days.",
      },
      {
        icon: "assignment_return",
        title: "30-Day Returns",
        description: "Easy returns via our premium concierge service.",
      },
    ],
    details: {
      heading: "Designed for everyday luxury",
      body: "Built around comfort and durability, with a focus on materials and finishing details. A versatile staple that works across settings—from gifting to daily wear.",
      bullets: [
        "Curated for premium build quality",
        "Timeless design with modern finish",
        "Packaging worthy of gifting",
      ],
      authenticity: {
        title: "Guaranteed Authenticity",
        body: "Every item is sourced through verified partners and quality-checked before dispatch.",
        imageSrc: p.imageSrc,
        imageAlt: p.imageAlt,
      },
    },
    reviews: {
      average: 4.8,
      total: 64,
      breakdown: [
        { stars: 5, percent: 88 },
        { stars: 4, percent: 9 },
        { stars: 3, percent: 3 },
        { stars: 2, percent: 0 },
        { stars: 1, percent: 0 },
      ],
      items: [
        {
          id: "r-default-1",
          initials: "IM",
          name: "Implesia Customer",
          meta: "Verified Buyer • Recently",
          rating: 5,
          quote:
            "Beautifully made and arrived fast. The packaging felt premium and the product quality exceeded expectations.",
        },
      ],
    },
    related: products
      .filter((x) => x.slug !== p.slug)
      .slice(0, 4)
      .map((x) => ({
        id: x.id,
        title: x.title,
        priceLabel: x.price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }),
        imageSrc: x.imageSrc,
        imageAlt: x.imageAlt,
      })),
  };
}

export function getProductDetailBySlug(slug: string) {
  const explicit = productDetails.find((p) => p.slug === slug);
  if (explicit) return explicit;
  const fromList = products.find((p) => p.slug === slug);
  return fromList ? buildDefaultDetailFromProduct(fromList) : null;
}
