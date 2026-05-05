export type AboutTrustBadge = {
  icon: string;
  title: string;
  description: string;
};

export type AboutTeamMember = {
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
  imageAlt: string;
};

export const aboutCopy = {
  hero: {
    eyebrow: "Our Heritage",
    title: "Defining the Modern Standard of Luxury.",
    subtitle:
      "We believe that true quality lies in the intersection of traditional craftsmanship and uncompromising organic sourcing.",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBknpY0mBgdApsCoi85ZRCpzh7vLQtU4tlisMBUNyIFd0iQ3FMXS5y4akHPxJ077Fq-DKfJDV-ZBAPtGbXANTVcU_GKR6NWex8jbMaqtcaeKVRUrRMB6kpq2P0HN9c5aD-qrpAKCbj0WDjhfTTqNPORhADVNgmfA1fTA6VW_E9V_OX1pCpjGsxegPCaNJgc-_oNCtw-ecEAZL6Eer20iSscKXfV8FFUh_HYB41R08_TJIHXe89Ta8QTEdMxnOWbuT2Iv5Fe2k5_Xw",
    imageAlt:
      "Close-up of artisan hand weaving organic linen fabric with soft natural lighting and neutral earth tones",
  },
  story: {
    title: "From Soil to Sanctuary",
    paragraphs: [
      "Our journey began with a simple observation: the world was moving too fast, and the objects we surrounded ourselves with were losing their soul. We sought to reconnect with the origin of things.",
      "Every piece in our collection tells a story of farm-to-table integrity. We source our raw materials from local artisans and organic farms that share our commitment to regenerative practices and ethical labor.",
      "It’s not just about the final product; it’s about the soil that nurtured the cotton, the hands that carved the wood, and the legacy we leave for the generations to follow.",
    ],
    cta: "Explore Our Process",
    images: [
      {
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDodXJY6zGc7thCPgkQXg2OpNQ59TCG5-liMEYlVDxs1YSCs9TP7WBxKHabcKg_aqTsl5q2x7W4ym2fW8GDtBEeB-xx9PY0YMjMLry0Cnovw9OSdGx4_Rh83-GmmXU79QNDeRSHY9uxfeZNFup4f-l9RzuIU7tvMD4RoeYgiZQVqHAN8eH6S0oNqFU4RA4pQg54a0BtY5oGyPN6dJU9VRD6QhLbCp2DSgzEZnzH-BUPVA3ESwFXkVL4B6_UP0dgkfRN8MSrSA_7DQ",
        alt: "Aerial view of a sustainable organic cotton field with neat rows and morning mist",
      },
      {
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEvGzb6z712P2oAerJOuROvau9fcXKEcnO1R61_jEQWiPs1HTZ9dmJzpBJgNWcd-9LDGIOqatrD8uuMcbj3YGKqKPy2Bauk73NLLQSO3s7hzFxgffNM5aGUAVoAaRD4hsoBDCYEWdqX9GuNBWWwChDsuJWJd_soqsvJDCuxXYkGaNqm4WK-EUUpoFt_trfQ3ZwInMNFeC6rSrdVj7r65P-uKufHj6uloxx-tlo5QMgPXmb3xBZxOnYVNalk7Z8NmDUAUvQSJ9E9A",
        alt: "Artisan hands shaping a clay vessel on a pottery wheel with sunlight streaming through a studio window",
      },
    ],
  },
  missionVision: {
    vision: {
      icon: "visibility",
      title: "Our Vision",
      description:
        "To be the global benchmark for conscious consumption, where every purchase supports a circular economy and celebrates artisan mastery over mass production.",
    },
    mission: {
      icon: "rocket_launch",
      title: "Our Mission",
      description:
        "To provide a curated registry of exceptional products that combine high-end aesthetics with the rigorous standards of organic certification and environmental stewardship.",
    },
  },
  trust: {
    title: "Crafted for Excellence",
    subtitle:
      "Our commitment to quality is backed by rigorous certifications and a relentless pursuit of perfection.",
    badges: [
      {
        icon: "front_hand",
        title: "Handcrafted",
        description: "Every piece is finished by hand to ensure unique character.",
      },
      {
        icon: "eco",
        title: "Sustainable",
        description: "Completely carbon-neutral production and shipping.",
      },
      {
        icon: "verified",
        title: "Organic Certified",
        description: "100% GOTS and OEKO-TEX certified materials.",
      },
      {
        icon: "local_shipping",
        title: "Express Shipping",
        description: "Secure, insured global delivery within 48 hours.",
      },
    ] satisfies AboutTrustBadge[],
  },
  team: {
    title: "The Curators",
    subtitle:
      "Meet the minds behind our brand—a collective of designers, environmentalists, and craft enthusiasts dedicated to elevating your everyday.",
    linkLabel: "Join Our Team",
    members: [
      {
        name: "Elena Vance",
        role: "CEO & Creative Director",
        bio: "Elena leads our vision with 15 years of experience in luxury brand stewardship.",
        imageSrc:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDfILNAZ5sUsIMvQ1C2X-1lZebdSJxd55Byg6NX1R5krcbMxQ4z7H4bHRzQY126_xu6ZeCXP3HfgNAAGPdY5-2qdRZqB_UGtYLFeDsyWWqpIyuPyV0-Qp8T3iYTpAfPqeCdubQl3lHhgpwE3jOha9mqW_VoaFQIcSJR02ybL2CNW_X50xDreV4kzHshCCbO_nUX4Tn7lxzH2xXvtI-pm73BgwR9G-4GV1WE64f03tUuhLCbroovnLRpRVAfw-ESYCiQndL7yNSwKQ",
        imageAlt:
          "Professional portrait of a woman with a confident expression, wearing a tailored navy blazer in a minimal modern office",
      },
      {
        name: "Marcus Thorne",
        role: "Chief Sustainability Officer",
        bio: "Marcus ensures our environmental footprint remains negative and our impact positive.",
        imageSrc:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCVmB1-RmKSXeyuwnX8oz80c-L5txx2_zAwcNjzXvb3mcJGw97uqcPtNMNepJOQmAZAsZXoaFAl9xioMxbD-JbHv0H4RCD4_FWiBrY3f18lXu-CIlKARU3RVXOIx12RLsaDZiwWmxQQSuQym7ANbkebr-CETymO1N9zkXeBfolXoO16KlEeWxraHFlqzbFvTsf7WPPYofD_DXGg6Mz21tJwPq05FbFdKXh-I2PvUwgFK4AuAOSpuEapzVE0JTy15kPy31F_3QIM2w",
        imageAlt:
          "Professional portrait of a man in a crisp white shirt, clean background with soft cinematic lighting",
      },
      {
        name: "Sarah Chen",
        role: "Head of Sourcing",
        bio: "Sarah travels globally to build lasting partnerships with organic farming cooperatives.",
        imageSrc:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDq1C3LbCIcCd4zONzoDIIGcYoKPg8cHztP7wWifla-k0H8ATx9fsxujddnjRJtz4uuRDN779pcwwC0ouIIzg1K4BFlJrCFHuHeLNsC1WpIUzXi5l6dpuvp_mXifFrrl6TwkntXnkctSLgTccUFZOVVDLDIvSAvRC2moy-WpBnCjAbC3IgTrpJzO45pueRCehqShdyUY3swzlZ32ph816Jr4ySlMtTdy-NP-LE9jEMb2dF1EgSgIfAFHSj8_qS28z-nRK-w_8mW4Q",
        imageAlt:
          "Portrait of a woman with creative energy, wearing minimalist jewelry and a neutral-toned sweater",
      },
      {
        name: "Julian Ross",
        role: "Operations Director",
        bio: "Julian streamlines our logistics to ensure the artisan's work reaches you perfectly.",
        imageSrc:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAAj2LXqWn8szHTJ3C-q5wALTExMHyGe9yxO5jC6EgDdD8sBXSZg-Czw_sqtfAka36WK5M7ws2xCBql-NMMTwf6iRnRksLjqUsTq-N0ep61UXmJM6KvaVj1tPSIjArChHWdTA4yGti5a9YyhNvkOh0F9ZhW-ZKqjKIzPKgBAbvZ0Q4abp5vvUFKiIV-hDDb7HLdfGf8lkTgT_-eicMmP6U0X9CMD8e7wEf6AfsldOMNg9pe9m8RcxTKIK4VX9Gv95LiITVOvIOQLQ",
        imageAlt:
          "Executive portrait of a man in a modern workspace, blurred architectural background with natural light",
      },
    ] satisfies AboutTeamMember[],
  },
  newsletter: {
    title: "Stay Inspired",
    subtitle:
      "Receive our monthly journal featuring artisan spotlights, sustainability reports, and exclusive early access to new collections.",
    placeholder: "Your email address",
    cta: "Subscribe",
  },
} as const;

