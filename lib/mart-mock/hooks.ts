"use client";

import { useEffect, useState } from "react";

import type { ProductStatus } from "@/app/(client)/_data/products/products";

import {
  readAboutSections,
  seedAboutSections,
  type AboutSections,
} from "./about-sections";
import {
  readHomeSections,
  seedHomeSections,
  type HomeSections,
} from "./home-sections";
import {
  DEFAULT_DELIVERY,
  MOCK_EVENT,
  effectiveStockStatus,
  listAdminProducts,
  readBanners,
  readDeliveryCharges,
  readOrders,
  seedBanners,
  type AdminBanner,
  type AdminProduct,
  type DeliveryCharges,
  type MockOrder,
  type StockStatus,
} from "./store";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(MOCK_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(MOCK_EVENT, listener);
  };
}

export function useOrders() {
  const [orders, setOrders] = useState<MockOrder[] | null>(null);

  useEffect(() => {
    const sync = () => setOrders(readOrders());
    sync();
    return subscribe(sync);
  }, []);

  return orders;
}

export function useAdminProducts() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);

  useEffect(() => {
    const sync = () => setProducts(listAdminProducts());
    sync();
    return subscribe(sync);
  }, []);

  return products;
}

export function useBanners() {
  const [banners, setBanners] = useState<AdminBanner[]>(seedBanners);

  useEffect(() => {
    const sync = () => setBanners(readBanners());
    sync();
    return subscribe(sync);
  }, []);

  return banners;
}

export function useHomeSections() {
  const [sections, setSections] = useState<HomeSections>(seedHomeSections);

  useEffect(() => {
    const sync = () => setSections(readHomeSections());
    sync();
    return subscribe(sync);
  }, []);

  return sections;
}

export function useAboutSections() {
  const [sections, setSections] = useState<AboutSections>(seedAboutSections);

  useEffect(() => {
    const sync = () => setSections(readAboutSections());
    sync();
    return subscribe(sync);
  }, []);

  return sections;
}

export function useDeliveryCharges() {
  const [charges, setCharges] = useState<DeliveryCharges>(DEFAULT_DELIVERY);

  useEffect(() => {
    const sync = () => setCharges(readDeliveryCharges());
    sync();
    return subscribe(sync);
  }, []);

  return charges;
}

export function useCatalogStockStatus(
  slug: string,
  fallback: ProductStatus,
): StockStatus {
  const [status, setStatus] = useState<StockStatus>(fallback);

  useEffect(() => {
    const sync = () => setStatus(effectiveStockStatus(slug, fallback));
    sync();
    return subscribe(sync);
  }, [slug, fallback]);

  return status;
}
