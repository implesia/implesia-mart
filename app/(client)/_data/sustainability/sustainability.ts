export type SustainabilityCommitment = {
  icon: string;
  title: string;
  description: string;
};

export type SustainabilityImpactStat = {
  value: string;
  label: string;
};

export type SustainabilityTestimonial = {
  quote: string;
  name: string;
  role: string;
  avatarSrc: string;
  avatarAlt: string;
};

export const sustainabilityCopy = {
  hero: {
    title: "Rooted in Quality, Driven by Trust",
    subtitle:
      "From the soil that nurtures our ingredients to the hands that craft our garments, we are dedicated to a legacy of conscious excellence.",
    cta: "Explore Our Products",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAyGGZe56owz0Zd9ynHAuQMp1GqY11AyXztBRl71OahzCf0ZU-eTuKmustYA2ZsqwzwYkze3VWFY3olI7Z4J1pGai3ZXOOQw26u0oi_35q41Tn_gHvJ_AOVOqLPDYkp_EC_RlutOGLULQ2YjU6RtwLJn0DI6KnsbVEnXvfgazXEKeAu82_VN2AW70jn2QVmgnFMEDLHqOmJuiQAjcbzQPfWYhjxLeg886C_iS1CEgpm3-eIU-n2ZlcKshCPh3XikcvSj5YsBgyZEA",
    imageAlt:
      "Wide-angle view of a lush organic farm at sunrise with soft morning mist",
  },
  origin: {
    eyebrow: "The Origin",
    title: "A Vision for Pure Living",
    body:
      "Implesia Mart began with a simple question: why has quality become a luxury? We sought to return to the basics—organic nutrients and authentic craftsmanship. Our journey took us to hidden valleys and artisan workshops across the globe.",
    images: [
      {
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBAlgU3MDXVEOb7jNVK128HOMASOOLk6r28s5C7SHGBHPOVXSOd5zLutKeq8cSKHa3lo2LBkjay_CqeiBqBNP_Bw2B_6A8kvYXypegSdPauJA1lBz5TZekKCzL1k1yhTt9PQ5-FFPtKs8fteHKQnAH_B2MtV_DnbC6mTGPjjhAkiZr0scub1Xcgy88n5xLCc4HMxlXYJ-k-7bOmETj9auivJUpnCWINWzwMdWGElL1S9r8-Ge7h8Hvlv51UaueId5typhO1qUgwTQ",
        alt: "Artisan weaver hands on a traditional wooden loom",
      },
      {
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5_IrkEqk9mfSwTEgARNKv2CKAsGfpX2v6uxfmAeRWyy6Ez-529HLPO3ux-hgq4OqGm0JDn4Kf-EbQ-YR_u81PY3nS1Yb7OU65QwmmFZT4qEa-uUhiajL1PMmesFL9P1KAqQeUNeCtFghSByVVCXQLsT5_Ye0QHwoJ_CmJO4kIIM7oBlDLqFRoIqnGVrR1uoeLsb25mX7CkLZGKHKo7kKoFauTcJtAku6OxDN6nX6_H04gN6Sb9rVCzOYaPYihQcD16GrZhimUYQ",
        alt: "Organic farmer holding fresh heirloom tomatoes",
      },
    ],
    featureImage: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBTnPWOnOHMTjP6EfZwGII3WyA5HbuRzJP2dlUBv2KzWiOJlq9YgdVamiXYEsj7My5mICwv38_iHjV3PAq1uqzOtGba0By2_aGI86OBhSoI-JPgtysIo30H-4X6uTo_n5tvPlbdCNLhgkS5-XE0bQqAaik_AKp8sWkmLBXxfHK2QQoboniIywS4h3GLSPIBG3GQBfa4ur-bTNHrvP6bmDYElZMHqnSPCiIj_nwKLJZX1VMmoCyMtdWdq9wtiDyYsn87YF8epRHRDg",
      alt: "Aerial view of neat rows of organic crops",
    },
    quote: "“Quality is not an act, it is a habit.”",
  },
  commitment: {
    title: "Our Commitment",
    subtitle: "We believe in a circular future where every choice respects the planet and its people.",
    items: [
      {
        icon: "verified_user",
        title: "Ethical Sourcing",
        description: "Direct partnerships ensuring fair wages and safe conditions.",
      },
      {
        icon: "package_2",
        title: "Eco-friendly Packaging",
        description: "100% biodegradable or recycled materials used in all shipping.",
      },
      {
        icon: "agriculture",
        title: "Local Support",
        description: "Investing in small-scale farmers to preserve regional heritage.",
      },
      {
        icon: "co2",
        title: "Carbon Reduction",
        description: "Continuous efforts to offset and reduce our logistics footprint.",
      },
    ] satisfies SustainabilityCommitment[],
  },
  organic: {
    title: "The Organic Food Promise",
    body:
      "We bridge the gap between rural bounty and urban living. Every product in our pantry is traceably sourced, ensuring you receive nature's finest without compromise.",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBpDcoAjQxSYHvjuqGYDVeFKkpBPEOz3Cwk8le2pL5_uDPpiXM90wlNHs8TD5tWdyOP4mPDCayqqlcKzx5ABd-f3EcVVAlg2RUDn53IYtXnhV2wrQG8ZdmKCo7p0yIwGu0x5tFMKWdT2g-AGUCjAF32cXiX7fQ_64MLo17u-Q4pX9dsrlM670lFghTzEZkbRqfbE_x51NsicUUZJv_hRbpc9usSxyJ9Ff2bgeV9OFpKYYgv3gnev1KPC2RS0XZPYuSlgnowtpx1bA",
    imageAlt: "Fresh organic harvest on a rustic wood background",
    steps: [
      "Harvested at Peak Freshness",
      "Zero-Contact Sustainable Transport",
      "Direct to Your Doorstep",
    ],
    badges: [
      { icon: "check_circle", label: "100% NATURAL" },
      { icon: "block", label: "NO PRESERVATIVES" },
    ],
  },
  fashion: {
    title: "Fashion for the Future",
    body:
      "We create forever pieces—garments designed to outlive trends. Using high-grade organic cotton, recycled fibers, and ethical labor, we ensure your wardrobe is as kind as it is beautiful.",
    bullets: [
      "Fair Labor Certified Factories",
      "Biodegradable Natural Dyes",
      "Long-lasting Design Aesthetic",
    ],
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD6MYZD7WYgeMHrPv5wnTxXikvDanhARc5LsDV1bgoa_VWSKGBLCBn4I9phFsdL637-BsdZa-7BAMllYdXMH9g15qHmKWGVxYzruvtLrgCRxcSHVAJJ-JXC4OoT4Vyb0pe0aoOc2MDo7EU1pViutH_yRhVFsKB4Cm5CWJ7ReSddPVwOSZuB_FJlFZpWlUcWYpLCEm7-LVznlYptyTGAGmDGj-yqJbJ5cJSJgb_OwTYNYFGRconZ7tCjAEj4yQ1fGMXCTA5c2j4bGg",
    imageAlt: "Sustainable cotton fabric textures draped in soft lighting",
  },
  impact: {
    stats: [
      { value: "500+", label: "Farmers Supported" },
      { value: "50k+", label: "Orders Delivered" },
      { value: "99.9%", label: "Quality Satisfaction" },
    ] satisfies SustainabilityImpactStat[],
  },
  trust: {
    testimonials: [
      {
        quote:
          "The transparency is what sold me. Knowing exactly which farm my food comes from and how my clothes are made has changed how I shop forever.",
        name: "Sarah Jenkins",
        role: "Conscious Consumer",
        avatarSrc:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDzu-ORI2h9XuFBy-jnBfu56iZFMua_TrKA8SxCc0qEgtJl8xFhLZBYleV3VkH0BTrEuR_9CtGKuUHSNJOiFi3Xdho9wzEZ0KVepRCf55oaclheJ6UzVK51_7G9ZzqwSOHcLcT0GE80KT9GPQjxBwRs2tRNGQw_6-XHOj1VLU41IakaST0GyfBVznf9GiBTqYSGEniqyh5gjgTOkIbbf7jq_OwrgBGJCSmrLET8Bo9Pn6OpnEZCiNEyfjB0muG7XM1kErt7Xgpq8w",
        avatarAlt: "Portrait of a satisfied modern woman customer",
      },
      {
        quote:
          "Implesia Mart doesn't just sell products; they sell a philosophy. The quality of the organic linens is unmatched by any high-street brand.",
        name: "Mark Robertson",
        role: "Interior Architect",
        avatarSrc:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAaama1I_ifmId8ccF6D6yQDhYiHnqRtUuDn6L-21GXVEXfYwEl9hc6Wol9NCJGyilgUbRc9U_N26EaKL_wzpa-xTMOxlqLM4OK9-GLMUA8J_OAgqxSXUqzUd1XvqZ5p8oo3qQGnjfZj8CbnEcQWYtravfVPvzoRYIjRvVTNwhQLtm9tsvyiqMRV3jGlmwjenQqV4t0ly8F4RuXKKldPsQZ5mY5MAIxrbva2Jl7mcGLx4dkXLgZrRwDw8tWe-Bhxglg--GiirHS4w",
        avatarAlt: "Portrait of a sophisticated male client in premium sustainable attire",
      },
    ] satisfies SustainabilityTestimonial[],
  },
  cta: {
    title: "Join Our Conscious Journey",
    subtitle:
      "Subscribe to our newsletter for exclusive updates on our sustainability projects and seasonal artisan releases.",
    primary: "Shop Now",
    secondary: "Contact Us",
    backgroundSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAq2aII_Y_i3ftprtQS8H6CjzMxB788KJocvx57VD758sNVp3Bt3FXeFYVaHMgLMGzdU5x_V0hF1AzlqVJJkSz9MNJvPVpB-ScXWiVBT9QYQvLudZl9kBmBMY-SyEhelq3AVVY6JzTetnK2velW62VwAegDTHt2WV_2d20d-QL-nY3KdwFhMzRSJ2cZ0ZqbhU0ZgRNNMi5Uyye2DapTkMERdh65rAL80BkiN8KBEf2VgzEcf0d_RYFxMe7FXKbqUDbVQRzWdBylGw",
    backgroundAlt: "Faint background texture of an organic green field",
  },
} as const;

