import {
  MART_API_URL,
  MartApiError,
  authorizedFetch,
  mediaUrl,
  publicFetch,
} from "@/lib/mart-api/products";

const GUEST_KEY = "implesia.cart.guest.v1";

export type CartLine = {
  id: string;
  productId: string;
  title: string;
  slug: string;
  imageSrc: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  available: boolean;
  selection: { name: string; label: string; swatch: string }[];
  addedAt?: string;
};

export type ShopCart = {
  id: string | null;
  anonymous: boolean;
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  insideDhaka: number;
  dhakaSuburban: number;
  outsideDhaka: number;
  insideEnabled: boolean;
  suburbanEnabled: boolean;
  outsideEnabled: boolean;
};

export type CartOwner = {
  kind: "user" | "guest";
  userId: string | null;
  email: string | null;
  fullName: string | null;
  role: string | null;
};

export type SavedCart = {
  id: string;
  owner: CartOwner;
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  insideDhaka: number;
  dhakaSuburban: number;
  outsideDhaka: number;
  insideEnabled: boolean;
  suburbanEnabled: boolean;
  outsideEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CartDirectory = {
  items: SavedCart[];
  total: number;
  page: number;
  pages: number;
  metrics: {
    carts: number;
    userCarts: number;
    guestCarts: number;
    units: number;
  };
};

type ApiLine = {
  id: string;
  product_id: string;
  title: string;
  slug: string;
  image_src: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  available: boolean;
  selection?: { name: string; label: string; swatch?: string }[];
  added_at?: string;
};

type ApiShopCart = {
  id: string | null;
  anonymous: boolean;
  cart_token: string | null;
  items: ApiLine[];
  item_count: number;
  subtotal: number;
  shipping: number;
  total: number;
  inside_dhaka: number;
  dhaka_suburban: number;
  outside_dhaka: number;
  inside_enabled?: boolean;
  suburban_enabled?: boolean;
  outside_enabled?: boolean;
};

type ApiSavedCart = {
  id: string;
  owner: {
    kind: "user" | "guest";
    user_id: string | null;
    email: string | null;
    full_name: string | null;
    role: string | null;
  };
  items: ApiLine[];
  item_count: number;
  subtotal: number;
  shipping: number;
  total: number;
  inside_dhaka: number;
  dhaka_suburban: number;
  outside_dhaka: number;
  inside_enabled?: boolean;
  suburban_enabled?: boolean;
  outside_enabled?: boolean;
  created_at: string;
  updated_at: string;
};

function guestToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(GUEST_KEY);
}

function rememberShopper(body: ApiShopCart) {
  if (typeof window === "undefined") return;
  if (body.cart_token) window.localStorage.setItem(GUEST_KEY, body.cart_token);
  if (!body.anonymous) window.localStorage.removeItem(GUEST_KEY);
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to manage the cart.";
  return fallback;
}

function mapLine(item: ApiLine): CartLine {
  return {
    id: item.id,
    productId: item.product_id,
    title: item.title,
    slug: item.slug,
    imageSrc: mediaUrl(item.image_src),
    unitPrice: item.unit_price,
    quantity: item.quantity,
    lineTotal: item.line_total,
    available: item.available,
    selection: (item.selection ?? []).map((choice) => ({
      name: choice.name,
      label: choice.label,
      swatch: choice.swatch ?? "",
    })),
    addedAt: item.added_at,
  };
}

function mapShop(body: ApiShopCart): ShopCart {
  rememberShopper(body);
  return {
    id: body.id,
    anonymous: body.anonymous,
    items: body.items.map(mapLine),
    itemCount: body.item_count,
    subtotal: body.subtotal,
    shipping: body.shipping,
    total: body.total,
    insideDhaka: body.inside_dhaka,
    dhakaSuburban: body.dhaka_suburban,
    outsideDhaka: body.outside_dhaka,
    insideEnabled: body.inside_enabled ?? true,
    suburbanEnabled: body.suburban_enabled ?? true,
    outsideEnabled: body.outside_enabled ?? true,
  };
}

function mapSaved(body: ApiSavedCart): SavedCart {
  return {
    id: body.id,
    owner: {
      kind: body.owner.kind,
      userId: body.owner.user_id,
      email: body.owner.email,
      fullName: body.owner.full_name,
      role: body.owner.role,
    },
    items: body.items.map(mapLine),
    itemCount: body.item_count,
    subtotal: body.subtotal,
    shipping: body.shipping,
    total: body.total,
    insideDhaka: body.inside_dhaka,
    dhakaSuburban: body.dhaka_suburban,
    outsideDhaka: body.outside_dhaka,
    insideEnabled: body.inside_enabled ?? true,
    suburbanEnabled: body.suburban_enabled ?? true,
    outsideEnabled: body.outside_enabled ?? true,
    createdAt: body.created_at,
    updatedAt: body.updated_at,
  };
}

async function shop(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  payload?: object,
) {
  const headers: Record<string, string> = {};
  const guest = guestToken();
  if (guest) headers["X-Cart-Token"] = guest;
  if (payload) headers["Content-Type"] = "application/json";

  const response = await publicFetch(`/api/v1/cart${path}`, {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!response.ok)
    throw new MartApiError(
      await readError(response, "The cart could not be updated."),
    );
  return mapShop((await response.json()) as ApiShopCart);
}

export function getShopCart() {
  return shop("", "GET");
}

export function addCartItem(
  productId: string,
  quantity: number,
  selection: { groupId: string; valueId: string }[] = [],
) {
  return shop("/items", "POST", {
    product_id: productId,
    quantity,
    selection: selection.map((choice) => ({
      group_id: choice.groupId,
      value_id: choice.valueId,
    })),
  });
}

export function setCartItemQuantity(itemId: string, quantity: number) {
  return shop(`/items/${itemId}`, "PATCH", { quantity });
}

export function removeCartItem(itemId: string) {
  return shop(`/items/${itemId}`, "DELETE");
}

export function clearShopCart() {
  return shop("", "DELETE");
}

export async function listCarts(query: {
  q?: string;
  owner?: "all" | "user" | "guest";
  page: number;
}) {
  const search = new URLSearchParams();
  if (query.q) search.set("q", query.q);
  if (query.owner && query.owner !== "all") search.set("owner", query.owner);
  search.set("page", String(query.page));
  search.set("page_size", "8");

  const response = await authorizedFetch(`/api/v1/admin/carts?${search}`);
  if (!response.ok)
    throw new MartApiError(await readError(response, "Could not load carts."));
  const body = (await response.json()) as {
    items: ApiSavedCart[];
    total: number;
    page: number;
    pages: number;
    metrics: {
      carts: number;
      user_carts: number;
      guest_carts: number;
      units: number;
    };
  };
  return {
    items: body.items.map(mapSaved),
    total: body.total,
    page: body.page,
    pages: body.pages,
    metrics: {
      carts: body.metrics.carts,
      userCarts: body.metrics.user_carts,
      guestCarts: body.metrics.guest_carts,
      units: body.metrics.units,
    },
  } satisfies CartDirectory;
}

let catalogIds: Map<string, string> | null = null;

async function productIdForSlug(slug: string) {
  if (!catalogIds) {
    const map = new Map<string, string>();
    let page = 1;
    let pages = 1;
    while (page <= pages && page <= 5) {
      const response = await fetch(
        `${MART_API_URL}/api/v1/products?page=${page}&page_size=48`,
      );
      if (!response.ok) break;
      const body = (await response.json()) as {
        items?: { id: string; slug: string }[];
        pages?: number;
      };
      for (const item of body.items ?? []) {
        if (item.slug && item.id) map.set(item.slug, item.id);
      }
      pages = body.pages ?? 1;
      page += 1;
    }
    catalogIds = map;
  }
  return catalogIds.get(slug) ?? null;
}

let lastSync: Promise<ShopCart | null> = Promise.resolve(null);

async function syncShopAddNow(slug: string, quantity: number) {
  const productId = await productIdForSlug(slug);
  if (!productId) return null;
  return addCartItem(productId, quantity);
}

/** Records a storefront add when the product exists in the catalog API. */
export function syncShopAdd(slug: string, quantity: number) {
  const run = lastSync.then(
    () => syncShopAddNow(slug, quantity),
    () => syncShopAddNow(slug, quantity),
  );
  lastSync = run;
  return run;
}

export function whenShopCartSettled() {
  return lastSync;
}

export function lookupProductId(slug: string) {
  return productIdForSlug(slug);
}

export function guestCartHeaders(): Record<string, string> {
  const guest = guestToken();
  if (!guest) return {};
  return { "X-Cart-Token": guest };
}
