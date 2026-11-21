import { mediaUrl } from "./media-url";
import { MartApiError } from "./products";

export type CustomerProfile = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  district: string | null;
  area: string | null;
  address: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type CustomerRegisterInput = {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
};

export type CustomerProfileUpdateInput = {
  fullName?: string;
  phone?: string;
  email?: string | null;
  district?: string | null;
  area?: string | null;
  address?: string | null;
};

export type CustomerOrderSummary = {
  id: string;
  number: string;
  status: string;
  createdAt: string;
  total: number;
  paymentMethod: string;
  itemsCount: number;
  courierName: string;
  trackingNumber: string;
  firstItemImage: string | null;
  firstItemTitle: string | null;
};

export type CustomerDashboardStats = {
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalProductsPurchased: number;
  unreadNotifications: number;
  totalSpent: number;
  customerName: string;
  phone: string | null;
  email: string | null;
};

export type CustomerOrdersPage = {
  items: CustomerOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

export type TrackingTimelineStep = {
  status: string;
  label: string;
  description: string;
  timestamp: string | null;
  completed: boolean;
};

export type OrderTrackingDetail = {
  orderNumber: string;
  status: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl: string | null;
  liveEvents: Record<string, unknown>[];
  timeline: TrackingTimelineStep[];
};

export type PurchasedProductItem = {
  productId: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  lineTotal: number;
  purchasedAt: string;
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  canReview: boolean;
};

export type CustomerNotificationItem = {
  id: string;
  userId: string;
  orderId: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  language: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerNotificationsResponse = {
  items: CustomerNotificationItem[];
  unreadCount: number;
};

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: string | Array<{ msg?: string }>;
      error?: { message?: string };
      message?: string;
    };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
    if (data.error?.message) return data.error.message;
    if (data.message) return data.message;
    return fallback;
  } catch {
    return fallback;
  }
}

export async function loginCustomer(
  identifier: string,
  password: string,
): Promise<CustomerProfile> {
  const res = await fetch("/api/customer/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Sign in failed."));
  }
  const data = (await res.json()) as { customer: CustomerProfile };
  return data.customer;
}

export async function registerCustomer(
  input: CustomerRegisterInput,
): Promise<CustomerProfile> {
  const res = await fetch("/api/customer/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: input.fullName,
      phone: input.phone,
      email: input.email || undefined,
      password: input.password,
    }),
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Registration failed."));
  }
  const data = (await res.json()) as { customer: CustomerProfile };
  return data.customer;
}

export async function logoutCustomer(): Promise<void> {
  const res = await fetch("/api/customer/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Sign out failed."));
  }
}

export async function getCustomerSession(): Promise<{
  authenticated: boolean;
  customer: CustomerProfile | null;
}> {
  try {
    const res = await fetch("/api/customer/session", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return { authenticated: false, customer: null };
    return (await res.json()) as {
      authenticated: boolean;
      customer: CustomerProfile | null;
    };
  } catch {
    return { authenticated: false, customer: null };
  }
}

export async function getCustomerProfile(): Promise<CustomerProfile> {
  const res = await fetch("/api/customer/profile", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not load profile."));
  }
  return (await res.json()) as CustomerProfile;
}

export async function updateCustomerProfile(
  input: CustomerProfileUpdateInput,
): Promise<CustomerProfile> {
  const res = await fetch("/api/customer/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      full_name: input.fullName,
      phone: input.phone,
      email: input.email,
      district: input.district,
      area: input.area,
      address: input.address,
    }),
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not update profile."));
  }
  return (await res.json()) as CustomerProfile;
}

export async function getCustomerOrders(params?: {
  page?: number;
  pageSize?: number;
}): Promise<CustomerOrdersPage> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("page_size", String(params.pageSize));

  const qs = query.toString();
  const url = `/api/customer/orders${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not load customer orders."));
  }
  const data = (await res.json()) as {
    items: Array<{
      id: string;
      number: string;
      status: string;
      created_at: string;
      total: number;
      payment_method: string;
      items_count: number;
      courier_name: string;
      tracking_number: string;
      first_item_image: string | null;
      first_item_title: string | null;
    }>;
    total: number;
    page: number;
    page_size: number;
    pages: number;
  };

  return {
    items: data.items.map((item) => ({
      id: item.id,
      number: item.number,
      status: item.status,
      createdAt: item.created_at,
      total: item.total,
      paymentMethod: item.payment_method,
      itemsCount: item.items_count,
      courierName: item.courier_name,
      trackingNumber: item.tracking_number,
      firstItemImage: item.first_item_image ? mediaUrl(item.first_item_image) || null : null,
      firstItemTitle: item.first_item_title,
    })),
    total: data.total,
    page: data.page,
    pageSize: data.page_size,
    pages: data.pages,
  };
}

export async function getCustomerDashboardSummary(): Promise<CustomerDashboardStats> {
  const res = await fetch("/api/customer/dashboard-summary", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not load dashboard statistics."));
  }
  const raw = (await res.json()) as {
    total_orders: number;
    active_orders: number;
    delivered_orders?: number;
    cancelled_orders?: number;
    total_products_purchased?: number;
    unread_notifications?: number;
    total_spent: number;
    customer_name: string;
    phone: string | null;
    email: string | null;
  };
  return {
    totalOrders: raw.total_orders,
    activeOrders: raw.active_orders,
    deliveredOrders: raw.delivered_orders ?? 0,
    cancelledOrders: raw.cancelled_orders ?? 0,
    totalProductsPurchased: raw.total_products_purchased ?? 0,
    unreadNotifications: raw.unread_notifications ?? 0,
    totalSpent: raw.total_spent,
    customerName: raw.customer_name,
    phone: raw.phone,
    email: raw.email,
  };
}

export type CustomerOrderItemDetail = {
  title: string;
  slug: string;
  imageSrc: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  sku: string | null;
};

export type CustomerOrderDetail = {
  id: string;
  number: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  customerName: string;
  phone: string;
  district: string;
  area: string;
  address: string;
  subtotal: number;
  shipping: number;
  total: number;
  couponDiscount: number;
  manualDiscount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  courierName: string;
  trackingNumber: string;
  items: CustomerOrderItemDetail[];
};

export async function changeCustomerPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const res = await fetch("/api/customer/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not update password."));
  }
  return (await res.json()) as { message: string };
}

export async function uploadCustomerAvatar(file: File): Promise<CustomerProfile> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/customer/profile/avatar", {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not upload profile photo."));
  }
  return (await res.json()) as CustomerProfile;
}

export async function deleteCustomerAvatar(): Promise<CustomerProfile> {
  const res = await fetch("/api/customer/profile/avatar", {
    method: "DELETE",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not remove profile photo."));
  }
  return (await res.json()) as CustomerProfile;
}

export async function getCustomerOrderDetail(
  orderNumber: string,
): Promise<CustomerOrderDetail> {
  const res = await fetch(
    `/api/customer/orders/${encodeURIComponent(orderNumber)}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not load order details."));
  }
  const raw = (await res.json()) as {
    id: string;
    number: string;
    status: string;
    created_at: string;
    delivered_at: string | null;
    customer_name: string;
    phone: string;
    district: string;
    area: string;
    address: string;
    subtotal: number;
    shipping: number;
    total: number;
    coupon_discount: number | null;
    manual_discount: number;
    paid_amount: number;
    due_amount: number | null;
    payment_method: string;
    courier_name: string;
    tracking_number: string;
    items: Array<{
      title: string;
      slug: string;
      image_src: string;
      unit_price: number;
      quantity: number;
      line_total: number;
      sku: string;
    }>;
  };
  return {
    id: raw.id,
    number: raw.number,
    status: raw.status,
    createdAt: raw.created_at,
    deliveredAt: raw.delivered_at,
    customerName: raw.customer_name,
    phone: raw.phone,
    district: raw.district,
    area: raw.area,
    address: raw.address,
    subtotal: raw.subtotal,
    shipping: raw.shipping,
    total: raw.total,
    couponDiscount: raw.coupon_discount ?? 0,
    manualDiscount: raw.manual_discount ?? 0,
    paidAmount: raw.paid_amount ?? 0,
    dueAmount: raw.due_amount ?? Math.max(raw.total - (raw.paid_amount ?? 0), 0),
    paymentMethod: raw.payment_method,
    courierName: raw.courier_name,
    trackingNumber: raw.tracking_number,
    items: raw.items.map((item) => ({
      title: item.title,
      slug: item.slug,
      imageSrc: item.image_src ? mediaUrl(item.image_src) || null : null,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      lineTotal: item.line_total,
      sku: item.sku || null,
    })),
  };
}

export async function getCustomerOrderTracking(
  orderNumber: string,
): Promise<OrderTrackingDetail> {
  const res = await fetch(
    `/api/customer/orders/${encodeURIComponent(orderNumber)}/tracking`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not load order tracking."));
  }
  const raw = (await res.json()) as {
    order_number: string;
    status: string;
    courier_name: string;
    tracking_number: string;
    tracking_url?: string | null;
    live_events?: Record<string, unknown>[];
    timeline: Array<{
      status: string;
      label: string;
      description: string;
      timestamp: string | null;
      completed: boolean;
    }>;
  };
  return {
    orderNumber: raw.order_number,
    status: raw.status,
    courierName: raw.courier_name,
    trackingNumber: raw.tracking_number,
    trackingUrl: raw.tracking_url ?? null,
    liveEvents: raw.live_events ?? [],
    timeline: raw.timeline.map((step) => ({
      status: step.status,
      label: step.label,
      description: step.description,
      timestamp: step.timestamp,
      completed: step.completed,
    })),
  };
}

export async function getCustomerPurchasedProducts(): Promise<
  PurchasedProductItem[]
> {
  const res = await fetch("/api/customer/purchased-products", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not load purchased products."));
  }
  const raw = (await res.json()) as Array<{
    product_id: string;
    title: string;
    slug: string;
    image_url: string | null;
    price: number;
    quantity?: number;
    line_total?: number;
    purchased_at: string;
    order_number: string;
    order_status?: string;
    payment_method: string;
    paid_amount?: number;
    due_amount?: number;
    payment_status?: string;
    can_review: boolean;
  }>;
  return raw.map((item) => ({
    productId: item.product_id,
    title: item.title,
    slug: item.slug,
    imageUrl: item.image_url ? mediaUrl(item.image_url) || null : null,
    price: item.price,
    quantity: item.quantity ?? 1,
    lineTotal: item.line_total ?? item.price * (item.quantity ?? 1),
    purchasedAt: item.purchased_at,
    orderNumber: item.order_number,
    orderStatus: item.order_status ?? "",
    paymentMethod: item.payment_method,
    paidAmount: item.paid_amount ?? 0,
    dueAmount: item.due_amount ?? 0,
    paymentStatus: item.payment_status ?? "cod_due",
    canReview: item.can_review,
  }));
}

export async function getCustomerNotifications(
  limit?: number,
): Promise<CustomerNotificationsResponse> {
  const query = new URLSearchParams();
  if (limit != null) query.set("limit", String(limit));
  const qs = query.toString();
  const res = await fetch(`/api/customer/notifications${qs ? `?${qs}` : ""}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not load notifications."));
  }
  const raw = (await res.json()) as {
    items: Array<{
      id: string;
      user_id: string;
      order_id: string | null;
      type: string;
      title: string;
      message: string;
      is_read: boolean;
      language: string;
      created_at: string;
      updated_at: string;
    }>;
    unread_count: number;
  };
  return {
    items: raw.items.map((item) => ({
      id: item.id,
      userId: item.user_id,
      orderId: item.order_id,
      type: item.type,
      title: item.title,
      message: item.message,
      isRead: item.is_read,
      language: item.language,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })),
    unreadCount: raw.unread_count,
  };
}

export async function markCustomerNotificationRead(
  notificationId: string,
): Promise<{ message: string }> {
  const res = await fetch(
    `/api/customer/notifications/${encodeURIComponent(notificationId)}/read`,
    {
      method: "PATCH",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not mark notification as read."));
  }
  return (await res.json()) as { message: string };
}

export async function markAllCustomerNotificationsRead(): Promise<{
  message: string;
}> {
  const res = await fetch("/api/customer/notifications/mark-all-read", {
    method: "POST",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not mark notifications as read."));
  }
  return (await res.json()) as { message: string };
}

export async function deleteCustomerNotification(
  notificationId: string,
): Promise<{ message: string }> {
  const res = await fetch(
    `/api/customer/notifications/${encodeURIComponent(notificationId)}`,
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not delete notification."));
  }
  return (await res.json()) as { message: string };
}

export async function mergeCustomerCart(guestToken: string): Promise<void> {
  const res = await fetch("/api/customer/cart/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ guest_token: guestToken }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not merge guest cart."));
  }
}

