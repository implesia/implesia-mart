import { MartApiError } from "./products";

export type CustomerProfile = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  district: string | null;
  area: string | null;
  address: string | null;
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
  email?: string;
  district?: string;
  area?: string;
  address?: string;
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
      firstItemImage: item.first_item_image,
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
    total_spent: number;
    customer_name: string;
    phone: string | null;
    email: string | null;
  };
  return {
    totalOrders: raw.total_orders,
    activeOrders: raw.active_orders,
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

