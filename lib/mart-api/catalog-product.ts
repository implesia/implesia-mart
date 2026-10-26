import type { Product } from "@/app/(client)/_data/products/catalog-meta";
import type { PublicCatalogCard } from "@/lib/mart-api/catalog-query";
import { mediaUrl } from "@/lib/mart-api/media-url";

/** A public API card as the storefront's `Product` (shared by the catalog and search). */
export function cardToProduct(card: PublicCatalogCard): Product {
  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    subtitle: card.subtitle,
    price: card.price,
    compareAtPrice: card.compareAtPrice,
    unitLabel: card.unitLabel || undefined,
    imageSrc: mediaUrl(card.imageSrc),
    imageAlt: card.imageAlt || card.title,
    badge: card.badge,
    status: card.status,
    categoryId: card.category,
    categorySlug: card.categorySlug,
    categoryName: card.categoryName || undefined,
    featured: card.featured,
    hasVariants: card.hasVariants,
  };
}
