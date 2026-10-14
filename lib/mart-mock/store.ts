import { heroSlides } from "@/app/(client)/_data/home/home";
import {
  emptyProductContent,
  mergeProductContent,
  seedProductContent,
  type ProductStorefrontContent,
} from "@/lib/mart-mock/product-content";
import {
  FEATURED_PRODUCT_SLUGS,
  products,
  type Product,
  type ProductBadge,
  type ProductCategoryId,
  type ProductStatus,
} from "@/app/(client)/_data/products/products";

export const MOCK_EVENT = "implesia-mock-change";

const SESSION_KEY = "implesia.admin.session.v1";
const ORDERS_KEY = "implesia.admin.orders.v1";
const PRODUCT_OVERRIDES_KEY = "implesia.admin.product-overrides.v1";
const CUSTOM_PRODUCTS_KEY = "implesia.admin.custom-products.v1";
const BANNERS_KEY = "implesia.admin.banners.v1";
const DELIVERY_KEY = "implesia.admin.delivery.v1";

export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "নতুন",
  confirmed: "কনফার্ম",
  shipped: "পাঠানো",
  delivered: "ডেলিভার্ড",
  cancelled: "বাতিল",
  returned: "রিটার্ন",
};

export type StockStatus = "available" | "sold-out" | "coming-soon";

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  available: "আছে",
  "sold-out": "শেষ",
  "coming-soon": "শীঘ্রই আসছে",
};

export type MockOrderItem = {
  slug: string;
  title: string;
  quantity: number;
  unitPrice: number;
  imageSrc: string;
};

export type MockOrder = {
  number: string;
  createdAt: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  address: string;
  note: string;
  items: MockOrderItem[];
  deliveryCharge: number;
  courierName: string;
  trackingNumber: string;
};

export type AdminProduct = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  categoryId: ProductCategoryId;
  price: number;
  compareAtPrice: number | null;
  quantity: number | null;
  status: StockStatus;
  badge: ProductBadge | null;
  imageSrc: string;
  featured: boolean;
  published: boolean;
  custom: boolean;
  content: ProductStorefrontContent;
};

export type ProductDraft = Omit<AdminProduct, "slug" | "custom">;

export type HeroAccent = "gold" | "teal" | "rose" | "ink";

export type AdminBanner = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  priceLabel: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  imageSrc: string;
  imageAlt: string;
  accent: HeroAccent;
  published: boolean;
};

export type DeliveryCharges = {
  insideDhaka: number;
  outsideDhaka: number;
};

export const DEFAULT_DELIVERY: DeliveryCharges = {
  insideDhaka: 70,
  outsideDhaka: 70,
};

export type AdminSession = {
  email: string;
};

function emitMockChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MOCK_EVENT));
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  emitMockChange();
}

export function formatTaka(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function phonesMatch(left: string, right: string) {
  const a = phoneDigits(left);
  const b = phoneDigits(right);
  if (a.length < 11 || b.length < 11) return false;
  return a.slice(-11) === b.slice(-11);
}

export function whatsappHref(phone: string) {
  let digits = phoneDigits(phone);
  if (digits.startsWith("0")) digits = `88${digits}`;
  else if (!digits.startsWith("880")) digits = `880${digits}`;
  return `https://wa.me/${digits}`;
}

export function isDhakaDistrict(district: string) {
  const value = district.trim().toLowerCase();
  return value === "ঢাকা" || value === "dhaka";
}

export function feeForDistrict(charges: DeliveryCharges, district: string) {
  return isDhakaDistrict(district) ? charges.insideDhaka : charges.outsideDhaka;
}

export function orderItemsTotal(order: MockOrder) {
  return order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function orderGrandTotal(order: MockOrder) {
  return orderItemsTotal(order) + order.deliveryCharge;
}

export function createMockOrderNumber() {
  const suffix = 8000 + Math.floor(Math.random() * 1000);
  return `IM-${suffix}`;
}

function catalogItem(slug: string, quantity = 1): MockOrderItem {
  const product = products.find((item) => item.slug === slug);
  if (!product) {
    throw new Error(`Missing catalog product: ${slug}`);
  }
  return {
    slug: product.slug,
    title: product.title,
    quantity,
    unitPrice: product.price,
    imageSrc: product.imageSrc,
  };
}

function atDaysAgo(days: number, hours: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, 20, 0, 0);
  return date.toISOString();
}

function seedOrders(): MockOrder[] {
  return [
    {
      number: "IM-1008",
      createdAt: atDaysAgo(0, 9),
      status: "new",
      customerName: "রাফি আহমেদ",
      phone: "01711111101",
      address: "বাড়ি ১২, রোড ৪, ধানমন্ডি, ঢাকা",
      note: "সন্ধ্যায় ডেলিভারি হলে ভালো হয়।",
      items: [catalogItem("sunset-rainbow-projection-lamp")],
      deliveryCharge: 70,
      courierName: "",
      trackingNumber: "",
    },
    {
      number: "IM-1007",
      createdAt: atDaysAgo(0, 14),
      status: "new",
      customerName: "নুসরাত জাহান",
      phone: "01811111102",
      address: "লেভেল ৩, গুলশান ২, ঢাকা",
      note: "",
      items: [catalogItem("custom-gorgeous-womens-gown")],
      deliveryCharge: 70,
      courierName: "",
      trackingNumber: "",
    },
    {
      number: "IM-1006",
      createdAt: atDaysAgo(2, 16),
      status: "new",
      customerName: "মেহেরুন নেসা",
      phone: "01911111103",
      address: "কাজলা, রাজশাহী",
      note: "কালার নোট ফোনে বলব।",
      items: [catalogItem("custom-baby-party-frock")],
      deliveryCharge: 70,
      courierName: "",
      trackingNumber: "",
    },
    {
      number: "IM-1005",
      createdAt: atDaysAgo(1, 12),
      status: "confirmed",
      customerName: "তানভীর হোসেন",
      phone: "01611111104",
      address: "আগ্রাবাদ, চট্টগ্রাম",
      note: "",
      items: [catalogItem("ai-face-tracking-phone-holder")],
      deliveryCharge: 70,
      courierName: "",
      trackingNumber: "",
    },
    {
      number: "IM-1004",
      createdAt: atDaysAgo(3, 11),
      status: "shipped",
      customerName: "সাদিয়া ইসলাম",
      phone: "01511111105",
      address: "জিন্দাবাজার, সিলেট",
      note: "",
      items: [catalogItem("womens-daily-wear-dress")],
      deliveryCharge: 70,
      courierName: "স্টেডফাস্ট",
      trackingNumber: "SF10293",
    },
    {
      number: "IM-1003",
      createdAt: atDaysAgo(5, 10),
      status: "delivered",
      customerName: "ফারহানা আক্তার",
      phone: "01311111106",
      address: "খুলনা সদর",
      note: "",
      items: [catalogItem("baby-comfort-top-shorts-set", 2)],
      deliveryCharge: 70,
      courierName: "পাঠাও",
      trackingNumber: "PT44821",
    },
    {
      number: "IM-1002",
      createdAt: atDaysAgo(4, 18),
      status: "cancelled",
      customerName: "ইমরান কবির",
      phone: "01711111107",
      address: "উত্তরা সেক্টর ৭, ঢাকা",
      note: "কাস্টমার বাতিল করেছেন।",
      items: [catalogItem("sunset-rainbow-projection-lamp")],
      deliveryCharge: 70,
      courierName: "",
      trackingNumber: "",
    },
    {
      number: "IM-1001",
      createdAt: atDaysAgo(6, 13),
      status: "returned",
      customerName: "লামিয়া চৌধুরী",
      phone: "01811111108",
      address: "বরিশাল সদর",
      note: "সাইজ মিলছে না।",
      items: [catalogItem("ai-face-tracking-phone-holder")],
      deliveryCharge: 70,
      courierName: "স্টেডফাস্ট",
      trackingNumber: "SF10011",
    },
  ];
}

export function readOrders() {
  return readJson<MockOrder[]>(ORDERS_KEY) ?? seedOrders();
}

export function writeOrders(orders: MockOrder[]) {
  writeJson(ORDERS_KEY, orders);
}

export function updateOrder(number: string, patch: Partial<MockOrder>) {
  const next = readOrders().map((order) =>
    order.number === number ? { ...order, ...patch, number: order.number } : order,
  );
  writeOrders(next);
  return next.find((order) => order.number === number) ?? null;
}

export function findPublicOrder(number: string, phone: string) {
  const normalized = number.trim().toUpperCase();
  const order = readOrders().find((item) => item.number.toUpperCase() === normalized);
  if (!order || !phonesMatch(order.phone, phone)) return null;
  return order;
}

export function isSameLocalDay(iso: string, now = new Date()) {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function featuredSlug(slug: string) {
  return (FEATURED_PRODUCT_SLUGS as readonly string[]).includes(slug);
}

function catalogDraft(product: Product): ProductDraft {
  return {
    title: product.title,
    subtitle: product.subtitle,
    categoryId: product.categoryId,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    quantity: null,
    status: product.status,
    badge: product.badge ?? null,
    imageSrc: product.imageSrc,
    featured: featuredSlug(product.slug),
    published: true,
    content: seedProductContent(product.slug),
  };
}

function mergeDraft(seed: ProductDraft, stored: Partial<ProductDraft>): ProductDraft {
  return {
    ...seed,
    ...stored,
    content: mergeProductContent(seed.content, stored.content),
  };
}

function readOverrides() {
  return readJson<Record<string, ProductDraft>>(PRODUCT_OVERRIDES_KEY) ?? {};
}

function readCustomProducts() {
  return (readJson<AdminProduct[]>(CUSTOM_PRODUCTS_KEY) ?? []).map((product) => ({
    ...product,
    content: mergeProductContent(emptyProductContent(), product.content),
  }));
}

export function listAdminProducts(): AdminProduct[] {
  const overrides = readOverrides();
  const catalog = products.map((product) => {
    const seed = catalogDraft(product);
    const stored = overrides[product.slug];
    const draft = stored ? mergeDraft(seed, stored) : seed;
    return { ...draft, slug: product.slug, custom: false };
  });
  return [...catalog, ...readCustomProducts()];
}

export function getAdminProduct(slug: string) {
  return listAdminProducts().find((product) => product.slug === slug) ?? null;
}

export function saveAdminProduct(product: AdminProduct) {
  const inCatalog = products.some((item) => item.slug === product.slug);
  if (inCatalog) {
    const overrides = readOverrides();
    // Overrides store everything except the catalog identity fields.
    const draft: ProductDraft & Partial<Pick<AdminProduct, "slug" | "custom">> = { ...product };
    delete draft.slug;
    delete draft.custom;
    overrides[product.slug] = draft;
    writeJson(PRODUCT_OVERRIDES_KEY, overrides);
    return;
  }
  const custom = readCustomProducts().filter((item) => item.slug !== product.slug);
  custom.push({ ...product, custom: true });
  writeJson(CUSTOM_PRODUCTS_KEY, custom);
}

export function createAdminProduct(draft: ProductDraft) {
  const slug = `custom-${Date.now()}`;
  saveAdminProduct({ ...draft, slug, custom: true });
  return slug;
}

export function effectiveStockStatus(slug: string, fallback: ProductStatus): StockStatus {
  if (typeof window === "undefined") return fallback;
  return getAdminProduct(slug)?.status ?? fallback;
}

export function seedBanners(): AdminBanner[] {
  return heroSlides.map((slide) => ({
    id: slide.id,
    eyebrow: slide.eyebrow,
    title: slide.title,
    description: slide.description,
    priceLabel: slide.priceLabel,
    primaryCtaLabel: slide.primaryCta.label,
    primaryCtaHref: slide.primaryCta.href,
    secondaryCtaLabel: slide.secondaryCta.label,
    secondaryCtaHref: slide.secondaryCta.href,
    imageSrc: slide.imageSrc,
    imageAlt: slide.imageAlt,
    accent: slide.accent,
    published: true,
  }));
}

function normalizeBanner(raw: Partial<AdminBanner>, seed?: AdminBanner): AdminBanner {
  return {
    id: raw.id || seed?.id || `slide-${Date.now()}`,
    eyebrow: raw.eyebrow ?? seed?.eyebrow ?? "",
    title: raw.title ?? seed?.title ?? "",
    description: raw.description ?? seed?.description ?? "",
    priceLabel: raw.priceLabel ?? seed?.priceLabel ?? "",
    primaryCtaLabel: raw.primaryCtaLabel ?? seed?.primaryCtaLabel ?? "Order",
    primaryCtaHref: raw.primaryCtaHref ?? seed?.primaryCtaHref ?? "/products",
    secondaryCtaLabel: raw.secondaryCtaLabel ?? seed?.secondaryCtaLabel ?? "",
    secondaryCtaHref: raw.secondaryCtaHref ?? seed?.secondaryCtaHref ?? "/products",
    imageSrc: raw.imageSrc ?? seed?.imageSrc ?? "",
    imageAlt: raw.imageAlt ?? seed?.imageAlt ?? raw.title ?? "",
    accent: raw.accent ?? seed?.accent ?? "teal",
    published: raw.published ?? seed?.published ?? true,
  };
}

export function readBanners() {
  const stored = readJson<Partial<AdminBanner>[]>(BANNERS_KEY);
  if (!stored) return seedBanners();
  const seeds = new Map(seedBanners().map((banner) => [banner.id, banner]));
  return stored.map((banner) => normalizeBanner(banner, banner.id ? seeds.get(banner.id) : undefined));
}

export function saveBanner(banner: AdminBanner) {
  const current = readBanners();
  const next = current.some((item) => item.id === banner.id)
    ? current.map((item) => (item.id === banner.id ? banner : item))
    : [...current, banner];
  writeJson(BANNERS_KEY, next);
}

export function moveBanner(id: string, direction: -1 | 1) {
  const items = readBanners();
  const index = items.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  writeJson(BANNERS_KEY, next);
}

export function createBanner(banner: AdminBanner) {
  writeJson(BANNERS_KEY, [...readBanners(), banner]);
}

export function deleteBanner(id: string) {
  writeJson(BANNERS_KEY, readBanners().filter((item) => item.id !== id));
}

export function blankBanner(): AdminBanner {
  return {
    id: `slide-${Date.now()}`,
    eyebrow: "",
    title: "",
    description: "",
    priceLabel: "",
    primaryCtaLabel: "Order now",
    primaryCtaHref: "/products",
    secondaryCtaLabel: "",
    secondaryCtaHref: "/products",
    imageSrc: "",
    imageAlt: "",
    accent: "teal",
    published: true,
  };
}

export function readDeliveryCharges() {
  const stored = readJson<DeliveryCharges>(DELIVERY_KEY);
  if (!stored) return DEFAULT_DELIVERY;
  return {
    insideDhaka: Number(stored.insideDhaka) || 0,
    outsideDhaka: Number(stored.outsideDhaka) || 0,
  };
}

export function saveDeliveryCharges(charges: DeliveryCharges) {
  writeJson(DELIVERY_KEY, charges);
}

const SESSION_EVENT = "implesia-admin-session";

type StoredSession = {
  email?: string;
  accessToken?: string;
  refreshToken?: string;
};

function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** A refresh token left by the old login. Null when storage only has the email. */
export function readStoredRefreshToken() {
  const parsed = readStoredSession();
  return typeof parsed?.refreshToken === "string" && parsed.refreshToken.trim()
    ? parsed.refreshToken.trim()
    : null;
}

/** Drop any token fields. The email can stay so the shell still knows who is signed in. */
export function dropStoredTokens() {
  const parsed = readStoredSession();
  if (!parsed) return;
  const email = parsed.email?.trim();
  if (!email) {
    clearSession();
    return;
  }
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
}

export function readSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const parsed = readStoredSession();
  const email = parsed?.email?.trim();
  if (!email) return null;
  if (parsed?.accessToken && !parsed.refreshToken) dropStoredTokens();
  return { email };
}

export function writeSession(email: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: email.trim() }));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

const PASSWORD_CHANGED_KEY = "implesia.admin.password-changed";

export function markPasswordChanged() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PASSWORD_CHANGED_KEY, "1");
}

export function passwordChangeNotice() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(PASSWORD_CHANGED_KEY) === "1";
}

export function clearPasswordChanged() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PASSWORD_CHANGED_KEY);
}
