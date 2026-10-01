import type { Metadata } from "next";
import { JsonLd } from "../../_components/common/json-ld";
import {
  CatalogProductView,
  CustomProductView,
} from "../_components/product-detail-view";
import { getProductDetailBySlug } from "../../_data/products/product-details";
import { products } from "../../_data/products/products";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductDetailBySlug(slug);

  if (!product) {
    return { title: "প্রোডাক্ট পাওয়া যায়নি" };
  }

  const url = `/products/${product.slug}`;
  const keywords = [product.title, product.subtitle, product.tagline].filter(
    (v): v is string => Boolean(v),
  );

  return {
    title: product.title,
    description: product.description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: product.title,
      description: product.description,
      images: [
        {
          url: product.imageSrc,
          alt: product.imageAlt,
          width: 900,
          height: 900,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description,
      images: [product.imageSrc],
    },
  };
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductDetailBySlug(slug);
  if (!product) return <CustomProductView slug={slug} />;

  const productUrl = absoluteUrl(`/products/${product.slug}`);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: [absoluteUrl(product.imageSrc)],
    sku: product.id,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price: product.price,
      availability:
        product.status === "coming-soon"
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.reviews
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.reviews.average,
            reviewCount: product.reviews.total,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: product.breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? absoluteUrl(item.href) : productUrl,
    })),
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <CatalogProductView product={product} />
    </>
  );
}
