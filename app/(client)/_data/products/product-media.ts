/**
 * Single source of truth for product photography & video.
 * Folder names match `public/images/products/*` (including existing typos).
 *
 * Gallery order on the PDP: video first (when present), then images.
 */

export type ProductMediaItem = {
  src: string;
  alt: string;
};

export type ProductVideoItem = {
  src: string;
  alt: string;
  /** Poster frame for thumbs / before play */
  poster: string;
};

export type ProductGalleryItem = {
  src: string;
  alt: string;
  type: "image" | "video";
  poster?: string;
};

export type ProductMedia = {
  primary: string;
  video?: ProductVideoItem;
  gallery: ProductMediaItem[];
  authenticity: ProductMediaItem;
};

const lamp = (file: string) => `/images/products/lamp/${file}`;
const stand = (file: string) => `/images/products/selfie-stand/${file}`;
const dress = (file: string) => `/images/products/baby-products/${file}`;

export const productMediaById = {
  "sunset-lamp": {
    primary: lamp("lamp-5.jpg"),
    video: {
      src: lamp("lamp.mp4"),
      alt: "সানসেট প্রজেকশন ল্যাম্প — প্রোডাক্ট ভিডিও",
      poster: lamp("lamp-5.jpg"),
    },
    gallery: [
      { src: lamp("lamp-5.jpg"), alt: "সানসেট প্রজেকশন ল্যাম্প কালেকশন — মেইন ভিউ" },
      { src: lamp("lamp-1.jpg"), alt: "সানসেট ল্যাম্পের অ্যাম্বিয়েন্ট প্রজেকশন" },
      { src: lamp("lamp-2.jpg"), alt: "সানসেট ল্যাম্প ক্লোজ-আপ" },
      { src: lamp("lamp-3.jpg"), alt: "সানসেট ল্যাম্প বিভিন্ন অ্যাঙ্গেল" },
      { src: lamp("lamp-4.jpg"), alt: "সানসেট ল্যাম্প রুম সেটআপ" },
    ],
    authenticity: {
      src: lamp("lamp-1.jpg"),
      alt: "কোয়ালিটি চেক করা সানসেট ল্যাম্প",
    },
  },
  "ai-tracking-holder": {
    primary: stand("stand-1.jpg"),
    video: {
      src: stand("stand-video.mp4"),
      alt: "এআই ফেস ট্র্যাকিং সেলফি স্ট্যান্ড — প্রোডাক্ট ভিডিও",
      poster: stand("stand-1.jpg"),
    },
    gallery: [
      { src: stand("stand-1.jpg"), alt: "এআই ফেস ট্র্যাকিং সেলফি স্ট্যান্ড — মেইন ভিউ" },
      { src: stand("stand-2.jpg"), alt: "সেলফি স্ট্যান্ড এক্সটেন্ডেড ট্রাইপড মোড" },
      { src: stand("stand-3.jpg"), alt: "সেলফি স্ট্যান্ড প্যাকেজিং ও ফোল্ডেড ভিউ" },
      { src: stand("stand-4.jpg"), alt: "সেলফি স্ট্যান্ড অতিরিক্ত অ্যাঙ্গেল" },
      { src: stand("stand-5.jpg"), alt: "সেলফি স্ট্যান্ড ডিটেইল শট" },
    ],
    authenticity: {
      src: stand("stand-3.jpg"),
      alt: "কোয়ালিটি চেক করা সেলফি স্ট্যান্ড",
    },
  },
  "tws-earbuds": {
    primary: "/images/products/earbuts/earbuts.jpg",
    gallery: [
      { src: "/images/products/earbuts/earbuts.jpg", alt: "TWS ওয়্যারলেস ইয়ারবাড" },
    ],
    authenticity: {
      src: "/images/products/earbuts/earbuts.jpg",
      alt: "TWS ইয়ারবাড — কোয়ালিটি ভিউ",
    },
  },
  neckband: {
    primary: "/images/products/neckbrand/neckbrand.jpg",
    gallery: [
      { src: "/images/products/neckbrand/neckbrand.jpg", alt: "ব্লুটুথ নেকব্যান্ড ইয়ারফোন" },
    ],
    authenticity: {
      src: "/images/products/neckbrand/neckbrand.jpg",
      alt: "নেকব্যান্ড — কোয়ালিটি ভিউ",
    },
  },
  "car-holder": {
    primary: "/images/products/car-holder/car-holder.jpg",
    gallery: [
      { src: "/images/products/car-holder/car-holder.jpg", alt: "ম্যাগনেটিক কার ফোন হোল্ডার" },
    ],
    authenticity: {
      src: "/images/products/car-holder/car-holder.jpg",
      alt: "কার হোল্ডার — কোয়ালিটি ভিউ",
    },
  },
  "charging-cable": {
    primary: "/images/products/3-in-1-cable/3-in-1-cable.jpg",
    gallery: [
      {
        src: "/images/products/3-in-1-cable/3-in-1-cable.jpg",
        alt: "ফাস্ট চার্জিং ৩-ইন-১ ক্যাবল",
      },
    ],
    authenticity: {
      src: "/images/products/3-in-1-cable/3-in-1-cable.jpg",
      alt: "৩-ইন-১ ক্যাবল — কোয়ালিটি ভিউ",
    },
  },
  "power-bank": {
    primary: "/images/products/power-bank/power-bank.jpg",
    gallery: [
      { src: "/images/products/power-bank/power-bank.jpg", alt: "স্লিম পাওয়ার ব্যাংক ১০,০০০mAh" },
    ],
    authenticity: {
      src: "/images/products/power-bank/power-bank.jpg",
      alt: "পাওয়ার ব্যাংক — কোয়ালিটি ভিউ",
    },
  },
  "mini-printer": {
    primary: "/images/products/mini-printer/mini-printer.jpg",
    gallery: [
      { src: "/images/products/mini-printer/mini-printer.jpg", alt: "মিনি থার্মাল প্রিন্টার" },
    ],
    authenticity: {
      src: "/images/products/mini-printer/mini-printer.jpg",
      alt: "মিনি প্রিন্টার — কোয়ালিটি ভিউ",
    },
  },
  "smart-ring": {
    primary: "/images/products/smart-ring/smart-ring.jpg",
    gallery: [
      { src: "/images/products/smart-ring/smart-ring.jpg", alt: "স্মার্ট ফিটনেস রিং" },
    ],
    authenticity: {
      src: "/images/products/smart-ring/smart-ring.jpg",
      alt: "স্মার্ট রিং — কোয়ালিটি ভিউ",
    },
  },
  /** Photography pending — temporary branded placeholder until assets land. */
  "galaxy-humidifier": {
    primary:
      "https://placehold.co/900x900/4c5e7d/ffffff.png?text=Galaxy%20Humidifier&font=roboto",
    gallery: [
      {
        src: "https://placehold.co/900x900/4c5e7d/ffffff.png?text=Galaxy%20Humidifier&font=roboto",
        alt: "গ্যালাক্সি প্রজেক্টর হিউমিডিফায়ার",
      },
      {
        src: "https://placehold.co/900x900/0d5c56/ffffff.png?text=Night%20Glow&font=roboto",
        alt: "গ্যালাক্সি হিউমিডিফায়ার নাইট গ্লো প্রিভিউ",
      },
    ],
    authenticity: {
      src: "https://placehold.co/900x900/4c5e7d/ffffff.png?text=Galaxy%20Humidifier&font=roboto",
      alt: "গ্যালাক্সি হিউমিডিফায়ার — প্রিভিউ",
    },
  },
  "custom-baby-frock": {
    primary: dress("baby-frock-with-baby.jpeg"),
    gallery: [
      { src: dress("baby-frock-with-baby.jpeg"), alt: "কাস্টম বেবি পার্টি ফ্রক — পরিহিত অবস্থায়" },
      { src: dress("baby-ground-frog.jpeg"), alt: "কাস্টম বেবি পার্টি ফ্রক — পিংক" },
      { src: dress("baby-ground-frog-2.jpeg"), alt: "কাস্টম বেবি পার্টি ফ্রক — গ্লিটার ফিনিশ" },
      { src: dress("baby-ground-frog-3.jpeg"), alt: "কাস্টম বেবি পার্টি ফ্রক — বো ডিটেইল" },
      { src: dress("baby-ground-frog-new.jpeg"), alt: "কাস্টম বেবি পার্টি ফ্রক — পাফ স্লিভ ডিজাইন" },
      { src: dress("baby-ground-frog-more.jpeg"), alt: "কাস্টম বেবি পার্টি ফ্রক — কালার অপশন" },
      { src: dress("baby-frock.jpeg"), alt: "কাস্টম বেবি পার্টি ফ্রক — গোল্ড বেল্ট ডিটেইল" },
    ],
    authenticity: {
      src: dress("baby-ground-frog-3.jpeg"),
      alt: "নিজ হাতে তৈরি ও কোয়ালিটি চেক করা বেবি ফ্রক",
    },
  },
  "womens-gorgeous-gown": {
    primary: dress("wedding-dress.jpeg"),
    gallery: [
      {
        src: dress("wedding-dress.jpeg"),
        alt: "গর্জিয়াস উইমেন্স গাউন — এমব্রয়ডারি ডিটেইল",
      },
    ],
    authenticity: {
      src: dress("wedding-dress.jpeg"),
      alt: "নিজ হাতে তৈরি ও কোয়ালিটি চেক করা উইমেন্স গাউন",
    },
  },
  "baby-jama-pant-set": {
    primary: dress("baby-jama-pant.jpeg"),
    gallery: [
      { src: dress("baby-jama-pant.jpeg"), alt: "বেবি কমফোর্ট টপ-শর্ট সেট — কালার অপশন" },
    ],
    authenticity: {
      src: dress("baby-jama-pant.jpeg"),
      alt: "নিজ হাতে তৈরি ও কোয়ালিটি চেক করা টপ-শর্ট সেট",
    },
  },
  "baby-daily-frock": {
    primary: dress("3-quater-ground-frog.jpeg"),
    gallery: [
      { src: dress("3-quater-ground-frog.jpeg"), alt: "উইমেন্স ডেইলি ওয়্যার ড্রেস — পীচ কালার" },
      { src: dress("3-quater-ground-frog2.jpeg"), alt: "উইমেন্স ডেইলি ওয়্যার ড্রেস — রাস্ট কালার" },
    ],
    authenticity: {
      src: dress("3-quater-ground-frog.jpeg"),
      alt: "নিজ হাতে তৈরি ও কোয়ালিটি চেক করা উইমেন্স ডেইলি ওয়্যার ড্রেস",
    },
  },
} as const satisfies Record<string, ProductMedia>;

export type ProductMediaId = keyof typeof productMediaById;

export function getProductMedia(id: ProductMediaId): ProductMedia {
  return productMediaById[id];
}

/** PDP gallery order: video (if any) → images */
export function getProductGalleryItems(id: ProductMediaId): ProductGalleryItem[] {
  const media = getProductMedia(id);
  const items: ProductGalleryItem[] = [];

  if (media.video) {
    items.push({
      type: "video",
      src: media.video.src,
      alt: media.video.alt,
      poster: media.video.poster,
    });
  }

  for (const image of media.gallery) {
    items.push({
      type: "image",
      src: image.src,
      alt: image.alt,
    });
  }

  return items;
}
