export type ProductBadge = "New" | "Best Seller" | "Limited";

export type Product = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  compareAtPrice?: number;
  unitLabel?: string;
  imageSrc: string;
  imageAlt: string;
  badge?: ProductBadge;
};

export const products: Product[] = [
  {
    id: "saree-1",
    title: "Artisanal Saree",
    subtitle: "Hand-woven Heritage Silk",
    price: 850,
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBVuhWuTnt-poPnTqx-EZ0sg__YpmwKzrxlKfxqxdyud1RyhBQdasxWkdxt2LX-uMhoyRgYklO-7HqPAABCU34hnq8BuSm9qhnLQFYiYWlJ0tl3XIdhDK4Q5Uk31fglb5Bd3WLYVxeUJ5gkzzv37qZI55dlYMJf81Sm7qUPxJqwJTpeZoZH6PmVBWa8M-7mDsrCCKTKLgnWAJ6M6cQQInRWKBq3Zp0YcDCTnv9lhTFRmuTEPTtXoUCiGLXdORHn7pry-vhoLQ5U9g",
    imageAlt: "Artisanal Saree",
    badge: "New",
  },
  {
    id: "headphones-1",
    title: "Noise-Cancelling Headphones",
    subtitle: "SonicPure Pro X1",
    price: 349,
    compareAtPrice: 420,
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDgghrtVRmn1eCdHE_72TJinKVQkYN4N9fDcJ8fiNIYW6BKmH53U_d0jzjinJDw6Wp1BmWHl87SggUjVTuU2XossW90zwJ60uApeby1f1U4RXmvd1Y0K72BvT0DTYkVL87MxEs37hwA0ZDAaVXG3V3aNyLL3KxWoo2yX-lOh0J87g3w4gIPnh8bQBJ1eFilEcXYFiAEI9Rxvw6qzsaxdeqF6m1MU0oCcE9Iz95BHGBLqzvqqKjxhqGGSW0pBRDvYu2nsWZq-rcK3Q",
    imageAlt: "Noise-Cancelling Headphones",
    badge: "Best Seller",
  },
  {
    id: "litchi-1",
    title: "Premium Litchi",
    subtitle: "Farm-to-Table Organic",
    price: 24,
    unitLabel: "per kg",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCjBg26Vkx6bi37ISuVO_AbS16P5d0wBFDxDU1ElfofAv7P-arpbFaO9uC6HJ6RAcGJne9uH44GiDB6VOyV6Y8IOc5ROes7iiHbMENrPiC85gU3mkG9QY9qoxaHOOsxE78DvFdXp9CGxU9N8JbNAAGDvxmLXevehv3qihzVIDPyr2bWAozWOwxicDLK9_v3xwrYymIy1SFN0iQGmbr7wG6zLCq8Ww2uC03GXURX7aYD3W3889TEJtB7cDfuQL-IppnUzJIuRSLA",
    imageAlt: "Premium Litchi",
  },
  {
    id: "sneakers-1",
    title: "Crimson Rush Sneakers",
    subtitle: "Performance x Luxury",
    price: 180,
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCKOHuzGjImPolZzhPOsTeeCTBhtbqiun0NAVdKCjIN6QAWegADwxo6lbja7F3j6Nt-2_0vhtaWdAHWGvs8BRfrKZbbobLcMIOjIO8mBxHEBUryV5mAX-cWalgZSydogSNlnKJ9rjUDguTsH8qy-q1trKa-Gr4p8coJSeVAqik4kjohJwDGKOpAXniTWYLlCBhCtYJ5GHB6dfRim5nd9GizMXeggxapSfGEGYX3ZHzS_API3CFPYbPJB47A4fVRYJVmjUMKE4GG5A",
    imageAlt: "Luxury Sneakers",
  },
  {
    id: "watch-1",
    title: "Elysian Chronograph",
    subtitle: "Sapphire Glass Edition",
    price: 1200,
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBfr5dzhoMW81_wRJErQ1oBjnS_V9iZZ-tVeIZLLqhFkzgxgzv9e356AwUYDeghDaySQnBiatT_1yNE0nmH43bLmlj81_zMm3ooljO5HlHvMiZNNbJ8npok9KneJMFJgKTDxZBZeNQZxz4ygedRcdaVQ2FdiBQPa6FfUhJdneE6vGG9RoB5ExJ9HcKAteATnKNyOOyErCxXvKIWIFSXAWSHfnNdKB0rQoF1tNfu7oAd2thsPvGOTlHkQ0RXRyjE6Lo_a31VlESVtg",
    imageAlt: "Designer Watch",
    badge: "Limited",
  },
  {
    id: "bowl-1",
    title: "Artisan Harvest Bowl",
    subtitle: "Chef-Curated Organic Selection",
    price: 45,
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDCE9RtMnFxT2R-ygCbIhvNQmY8aL1R3FIiiQ4URLoxC5zdqe9L3kuROGgD6kVPCaMS3v1KSAYI2ynoT45jBFO6XhIvLwFRX7VNCxOq7HOQJ6QqhRn8use1hSAQ9vJGHateKU7EU7kU5wuPkWYnf0AsuKPKX3R2MINOU2ePOXs74Sc2dtC9E4pu_tHjtMDSJkiP9FLFUQncu9S8_hr0pX-gIc3_oJsbV0mtbsFSnEykSd09POMmf5cChS4eXp7nmxu67SKbW6K0CA",
    imageAlt: "Gourmet Bowl",
  },
];

export const productFilters = {
  categories: [
    { id: "premium-apparel", label: "Premium Apparel" },
    { id: "artisanal-saree", label: "Artisanal Saree" },
    { id: "luxe-electronics", label: "Luxe Electronics" },
    { id: "organic-gourmet", label: "Organic Gourmet" },
  ],
  brands: [
    { id: "luxe-heritage", label: "Luxe Heritage" },
    { id: "sonicpure", label: "SonicPure" },
    { id: "earthbound", label: "EarthBound" },
  ],
  ratings: [
    { id: "4-up", label: "4 & Up", value: 4 },
    { id: "3-up", label: "3 & Up", value: 3 },
  ],
  availability: [{ id: "in-stock", label: "In Stock" }],
  sortOptions: [
    { id: "popularity", label: "Popularity" },
    { id: "price-asc", label: "Price: Low to High" },
    { id: "price-desc", label: "Price: High to Low" },
    { id: "newest", label: "Newest" },
  ],
} as const;
