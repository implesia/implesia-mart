import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getStoreProduct } from "@/lib/mart-api/catalog";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

import { JsonLd } from "../../_components/common/json-ld";
import { ProductDetailLayout } from "../_components/product-detail-view";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProduct(slug);

  if (!product) {
    return { title: "প্রোডাক্ট পাওয়া যায়নি", robots: { index: false, follow: false } };
  }

  const url = `/products/${product.slug}`;
  const keywords = [product.title, product.subtitle, product.tagline].filter(
    (value): value is string => Boolean(value),
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
      images: product.imageSrc
        ? [{ url: product.imageSrc, alt: product.imageAlt, width: 900, height: 900 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description,
      images: product.imageSrc ? [product.imageSrc] : undefined,
    },
  };
}

function availability(status: string) {
  if (status === "coming-soon") return "https://schema.org/PreOrder";
  if (status === "sold-out") return "https://schema.org/OutOfStock";
  return "https://schema.org/InStock";
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getStoreProduct(slug);
  if (!product) notFound();

  const productUrl = absoluteUrl(`/products/${product.slug}`);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.imageSrc ? [absoluteUrl(product.imageSrc)] : undefined,
    sku: product.id,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price: product.price,
      availability: availability(product.status),
      itemCondition: "https://schema.org/NewCondition",
    },
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
      <ProductDetailLayout product={product} />
    </>
  );
}
