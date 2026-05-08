import bannerHero from "../../../../public/images/hero/bannerHero.png";
import womenFasion from "../../../../public/images/hero/women.jpg";
export const SITE_NAME = "Implesia Mart";

export const navLinks = [
  { href: "#fabrics", label: "Fabrics", active: true },
  { href: "#electronics", label: "Electronics", active: false },
  { href: "#organic", label: "Organic Food", active: false },
] as const;

export const hero = {
  badge: "New Arrival",
  titleLines: ["Seasonal", "Fashion Bloom"],
  description:
    "Discover the intersection of artisanal craftsmanship and modern silhouettes. Our Spring Collection defines effortless luxury for the conscious curator.",
  primaryCta: "Shop The Edit",
  secondaryCta: "Lookbook",
  imageSrc:bannerHero.src,
  imageAlt: "Seasonal Fashion",
};

export const featuredCategories = [
  {
    id: "Mens",
    title: "Men's Fashion",
    subtitle: "Tailored Perfection",
    imageSrc:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCKse9AFtyij7Uu0PGGHPrprlA43yNDxebFB4lLhLjexYbKEJC6AX4ynEO14ch7IBnqlNswdHEFIB0GVoF7rniZQtkIFkJ_5KuUCEcYQJLFq_21CtFtpB_y7e8hssFZYN148hS-pbEuIZyBPwU7Du7krw4T6JAT6WD79hTA5blFFrf_0t_TXLRzfwZBIPs2SdYszUePcTYn6SG2JUnmMvYcSlPaqKPF8mkkZ_XsjzgDcxC4tXoevVkflsY7-tHDEePhWDUWVmgUqA",
    imageAlt: "men's Fashion",
    colSpan: 2,
    rowSpan: 2,
    headlineClass: "font-headline-md",
  },
  {
    id: "electronics",
    title: "Electronics",
    subtitle: "Premium Audio",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBSyEEkSYzbQZAmA-ssXe4cFVeGHadVevQRTVuqX870oU9EWBO7cKWACPeoaAqhSG7nBgealGT5AJ0E5g78jTnJ_2cy4uxsn_Bq3J7p9YQVMn9sgoEB_4U4a1ccgRCtx5r9inzcs19RVxI__vwY3a74idyZdCp9f9Fvb7HV_U7gL99_I02iZeYEQpy2M3Hn4AmHnn1-uV4B7UUXOiZv3LIn29-cOg883R3rLYs9co8SQkqpIxXou7DiUCF6xK5fNd5y9gx48lRMYw",
    imageAlt: "Electronics",
    colSpan: 1,
    rowSpan: 1,
    subtitleUppercase: true,
  },
  {
    id: "mangoes",
    title: "Organic Mangoes",
    subtitle: "Farm Fresh",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDozWpzdoQo4Sb20Ve11D0uMW3SmxDkgi491e-ME5lh5iazJDG-s4nIViyTLTdqfneQidM9vwse0cnEBtip9o8QeYZC0uv1p6EA24OQZE0M1hhPyWzBs1e8zSZOkzVWcPn199LAgdlmXhzZtDSR1bm6uUfEUpJmhaICZkjjrg-XWXZjqShe-jCaSftHZbFs4C4T_jQ5eEnJVyNZ8LFNvVFF6ilKFdugXCqNc1a6eYlGMP1bKOnn2xzP_ARW2FI3ZmSxXMr7RirfZQ",
    imageAlt: "Organic Mangoes",
    colSpan: 1,
    rowSpan: 1,
    subtitleUppercase: true,
  },
  {
    id: "womens",
    title: "Women's Fashion",
    subtitle: "Modern Classics",
    imageSrc: womenFasion.src,
    imageAlt: "Women's Fashion",
    colSpan: 2,
    rowSpan: 1,
    headlineClass: "font-headline-md",
  },
] as const;

export const bestSellingProducts = [
  {
    id: "1",
    category: "Fabrics",
    name: "Heritage Trench Coat",
    price: "$1,250.00",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAVJ2KzJWd5L5U-EJzjf4L0ySprBug9RZpOL596FZs0hfkXSzI7TH3cMvxFqvQ0kW_hp2OTnipK-mVHUyxnXMTmfG0F9eYcRcLJIh0TPcqIynRyw5v7YY-cZ058PHdcQIhf_BJsR2Kzm84fQvB4PDuwYQE-QfujaGWyBfcO_5FygdWWEaNyiejvKe-myXDdphyg-41Tt334Uo4O6HdA1G_DYnQAa0vtoN_AMHKq5MGLMiV6W67WjoIUfS3lzS4J5ztvCnSSWP64Zg",
    imageAlt: "Trench Coat",
    favorite: true,
  },
  {
    id: "2",
    category: "Electronics",
    name: "Ultra Vision Tablet Pro",
    price: "$999.00",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCrjMtZnE-7b-IKmB_LxU0GWDZGBU6HfHqlMEzd0_lhNkUi-z57fiNIyQKpWXJlk9tBXPpMz35DB8Vo9JtBEbnGUYhF3o4auIYrDXpWjU9rCmJYrkynEEbdnh93Rj13Nuyk2kQzX6zhr-pAQ624gq_7I1fVUKr91RVyZyrp7RWr5mfnrVK4qdphbuQy4Rxre8Br1BMp0GeKViJgxlIDtSbjfzmfOZ3oUsaAigLOEXjwlii1AlP2o_k8xJYPZDiG5CRjuL3d7UXqjQ",
    imageAlt: "Tablet Pro",
  },
  {
    id: "3",
    category: "Organic",
    name: "Cold-Pressed Mustard Oil",
    price: "$45.00",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCVwDQJdirpva4dzhJjSK_2Pynr1zHg4L-90HFZbgvS5CWgsdRQy48gUJSfNUfaFYs9yuD8p6DgR5sNbOT_TbBYKUtJdXgSlFRjXL_vaVSydOka0Du4SiPwwGBpBwMZWHZ4Mp4APyMkjCg_lHEHOHAhXrkoghlobBWK7HNFjgNgXk-jftgWN-6xKeZ84PdUAYdLsR2gOC__gfhGmOpNqc8Hz0-UUAvzQ_MtllMrIVdgZJyLFp1t_KQZYn9pwCzhd2GFjXAWYuqd6Q",
    imageAlt: "Organic Oil",
  },
  {
    id: "4",
    category: "Accessories",
    name: "Chrono-Master Gold Edition",
    price: "$2,400.00",
    imageSrc:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDCz0pm43svopQLQtiRM2mq0GC_Tdlw6UWzZNmdwoOEAThj7srNe_XzzAgqv2IIJ-lzXgXJvulPR7ZtJQh0jKviuz11NQNroXx5cGwEZx0rSwuEKWkVkR90CACDIVY5RkTxXeSy00Gs4ySCe3rzx3dFZPmNHLfa9XcxtZ6W7ROS2jra5bzVnFOALd9K-szD3VZcMJTNeoQDcRN0dCmu2ujT8_m6msNgaIzeAd_gtRLGCrIvN6u_dMqoN-xPhefRCuyXwRZnD6SsYg",
    imageAlt: "Watch",
  },
] as const;

export const flashSale = {
  titleLines: ["Up to 40% Off", "The Electronics Suite"],
  badge: "Limited Flash Offer",
  cta: "Shop The Sale",
  hours: "08",
  minutes: "42",
  seconds: "15",
  imageSrc:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAhim-wi9KjzZvM6OS2uU8B7m1anf6fiPPohKCe9dGDf1MW4WYA1h-BZ9vlTNkVNEOgR3zXG1inrm7scQKvx-BHGhhCQQXK1WXWbp_9xyjGJ96tA0-h8k_UKE5j3pgKvxplHCBe8mQON67wcJwTwfOYvZbSleehIsVTpCkBXQdzLrkPE4wcRfXwmsqMBHbD--nmk1Y4ecMo4nR8q80ypTuNO94eiiZpHAg4K48fvUcscf08PQ0ZiyWVCgHfyCArv3RYjXNTsgoRvQ",
  imageAlt: "Electronics Offer",
};

export const organicHighlight = {
  kicker: "From Root to Ritual",
  title: "The Purity of Our Organic Heritage",
  description:
    "We believe luxury is found in the simplest, most natural states. Our Organic collective bridges the gap between traditional farming and modern wellbeing, bringing you Mangoes, Oils, and Litchis that haven't been touched by synthetic intervention.",
  cta: "Our Story",
  bullets: [
    { icon: "verified" as const, label: "100% Single-Origin Sourcing" },
    {
      icon: "energy_savings_leaf" as const,
      label: "Sustainably Harvested & Packaged",
    },
    { icon: "schedule" as const, label: "Farm-to-Table within 24 Hours" },
  ],
  images: [
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbM99ICxijnrCvD3q3rTSxEOG5VwyIbc5isZbtVlztxd_8_5dPTQVgWOomPIkZ6LftGC94jXUXvo-U9864vnP40WPiVeJmF55CoiSZaN4UR46DRNiWJtS07g7bWYiyHctEwatQLzOty3rC-Z25_atnV2wl8ZwDdvGG_0qJ_7GyKb2uaO-OsUxUETjMapt0KqKeq9S1VvfDFD9M_u97ej0fbSkSa0vLBO_GMF4KqKBFOQRGwuoVabxpRqnLMUDnZIDXBWjGvjqIww",
      alt: "Litchi",
      className: "h-64",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJQvk7PEsLbhWh1rH49bpWik5wPIeFfKzK7sl-ymR2gsXDgHa4JkCObO6MtR63FlDW52a_7E__KQsdeIzoyoMSVFQJvT_v745Ub81CM-G0xKwcG9rzCQUGIRQ808iHwmYWnmTub7StybRXwz9OK0p7yulK2YkiB_xl8FNR07mDL82Fm7aClhllUwCr1g-1lbyspV3bEdlUmaBd5UWykn0QkDcpwWzHQaPRT-rp-1SK7m-BJ9OIgIKqPUnG8_kI9ZIGIUUMib3Kkw",
      alt: "Organic Gur",
      className: "h-80 -mt-10",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSQbHzkcJBRaR9GKLrJ7XOjJK5mquYm_rVHscKASSqG16Zqx1bFazS1vcGcDGA6-B1g5F6Ta292KJ-Aw6q-Mn3re0DMlCYFAmCvFsbGIoBfm-TAjS1Y1g8JZZniH4Hc5iws58IMkc90heePmfLStKE8BRgXZryPe_oIy5gxt5qUPZxZvhoNln6_onql9Hj-Y01KG4hwfRt24_RkrNbn4uETzjTeVA8nIzMSGm8Yx4759xpGneptLhXFtgLgfDs0EhKYu5wPqVqbA",
      alt: "Our Farm",
      className: "h-80",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCurPVRujGd2RQZUsY4r3VPU7x16J5NDFbm7iFq7h44gfPCDuAY_w6r1CZ9ImZ16zVGwstWtfHVGiwhuDEAN8tZ0s_o56KQf-dqO_OB-FM8YTtWMysbFdyhdPC0WiN_uMFrSgmcLtj8P5mgMh319VBgWDRXbvgrf1mHOZypibn2-6IE1soO__1WSAnu4292XULCt0g9xgbLLFvRAXteiCIjSTcvxXDyx7IGSyZklWgInoBQuvY3alHolrCKqOtmosCiiNz0RgZkkA",
      alt: "Pure Honey",
      className: "h-64 -mt-10",
    },
  ],
};

export const testimonials = [
  {
    id: "1",
    quote:
      "The quality of the silk fabrics I ordered exceeded all expectations. Implesia Mart truly understands the meaning of craftsmanship. Their attention to detail in packaging is unparalleled.",
    name: "Alexandra Vance",
    role: "Interior Designer",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBoWkoP2ONFsYeb0Toeupyt41fpGPgPBgTGYmurhi7mx4Rj5LnbTctbUysI7Yxp6Isy7cdp5T4So3UAITr8WXefBflhEg3vU2k1WxrPFSLiOGF2CYULkEBmH7tbc3UNxdIJBWCgq25_l541b_VPKG5sJIxOwzOA-91ffUFUb9CdQJAB9OlRyDscDUXf3PPswBJ8JrxfYwKR-HisOJEdBeuuoxmP3Zy2zDtxbXlDBgZjgLkiIDp3FrcnJBzPrMi6bwM7IOC7h04SNQ",
  },
  {
    id: "2",
    quote:
      "I've been searching for authentic organic mangoes for years. The delivery from Luxe was perfectly timed, and the taste took me back to my childhood summers.",
    name: "Marcus Thornton",
    role: "Culinary Critic",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtL9lTX_4ez6hgMlbMksDcrJd8ONfWartvXoB6AFV7Gah8KkKRvGN7BX2wzwwbY7uA7Vb7e-IhaCXpVLv5nUUyeXw9Dk444zSJg0aICh3AiPVHNN_EtFP3ex6oOwKI7qHkeNyNdrFjgCE0M7w07U0AcE0wR5kRJi7wXQwIK_6lfDEx6XN375XwyIZQe4AI9Cdq7ed0be-4TA0GsjQjZr0NGY6BJdf0oPDw-Cgc3DHKMF1S9txmYq8K2dA5DWaCYU25-O-JDDMdgg",
  },
  {
    id: "3",
    quote:
      "Their tech collection isn't just about specs; it's about aesthetic integration. The tablet fits perfectly into my professional workflow and looks stunning on my desk.",
    name: "Elena Rodriguez",
    role: "Tech Architect",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBhK0aJ_xcaxS8e-13FpPJU2k_0Jyaid16AOGdycl2SqgjgnCqu998K88KkFUZYqIIrmlqFxZVcmaOWeby8m6Ed3VWqLCm1SfJnuv4hB2DJz_ETmEO1DyZK9wXZwx-jOWdHnBt23LR9d8Q5qN8yNBdU3ve5lCHZ4FvBWKrK4CCnz6Jd9PUSsvtZq6wTu4fo9fErgmTLobZw_Lcwrfe8eDAn46u1Vt5pLNwkztO7ICWzOWgnZbujWp4pg2CF4RrHFkwSoIlxZTOXCw",
  },
] as const;

export const faqSections = [
  {
    category: "Orders & Shipping",
    question: "How long does delivery take?",
    answer:
      "Our standard concierge delivery takes 3-5 business days for domestic orders. International shipping typically arrives within 7-10 business days, depending on customs processing in your region.",
  },
  {
    category: "Payments",
    question: "Do you offer cash on delivery?",
    answer:
      "We currently accept all major credit cards, digital wallets, and bank transfers. To maintain our premium service standard, we do not offer cash on delivery at this time.",
  },
  {
    category: "Returns & Refunds",
    question: "Can I return a product?",
    answer:
      "Yes, we offer a complimentary 14-day return window for fashion and electronics in their original condition. Please note that for hygiene and freshness reasons, organic food items are non-returnable unless arrived damaged.",
  },
  {
    category: "Product Quality",
    question: "Are your organic products certified?",
    answer:
      "Every item in our Organic Collective is sourced from certified single-origin farms. We ensure freshness through our 24-hour farm-to-table logistics, guaranteeing the highest nutritional value and flavor profile.",
  },
] as const;
