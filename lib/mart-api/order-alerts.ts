import {
  newOrdersPath,
  parseNewOrdersPage,
  shouldUseOrderAlertsMock,
  type NewOrdersPage,
} from "@/lib/admin/order-alerts";
import { mockNewOrders } from "@/lib/mart-mock/order-alerts";
import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";
import { mockFallbackAllowed } from "@/lib/mock-mode";

export class OrderAlertsAuthError extends Error {
  constructor() {
    super("Sign in again.");
    this.name = "OrderAlertsAuthError";
  }
}

let mode: "unknown" | "live" | "mock" = "unknown";

export function orderAlertsMode() {
  return mode;
}

export function resetOrderAlertsMode() {
  mode = "unknown";
}

/**
 * Staff-only, through the admin proxy. The request is `cache: "no-store"`
 * (the route answers `Cache-Control: no-store`). Limit is clamped to 1..50
 * before it is sent; a 422 is an error and backs off. 401 (anonymous or not
 * staff) stops the caller. Only when stand-ins are allowed (`mockFallbackAllowed`,
 * never in production builds), a missing route (404/501, or the API cannot be
 * reached on the first try) uses `lib/mart-mock/order-alerts.ts`.
 */
export async function fetchNewOrders(since: string | null, limit = 20): Promise<NewOrdersPage> {
  const mockAllowed = mockFallbackAllowed();
  if (mockAllowed && (process.env.NEXT_PUBLIC_ORDER_ALERTS_MOCK === "1" || mode === "mock")) {
    mode = "mock";
    return mockNewOrders({ since, limit });
  }

  let response: Response;
  try {
    response = await authorizedFetch(newOrdersPath(since, limit), { cache: "no-store" });
  } catch (error) {
    if (mode === "unknown" && mockAllowed) {
      mode = "mock";
      return mockNewOrders({ since, limit });
    }
    throw error;
  }

  if (response.status === 401) throw new OrderAlertsAuthError();
  if (mockAllowed && shouldUseOrderAlertsMock(response.status, mode)) {
    mode = "mock";
    return mockNewOrders({ since, limit });
  }
  if (!response.ok) {
    throw new MartApiError("Could not check for new orders.", {
      kind: response.status >= 500 ? "server" : "request",
    });
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new MartApiError("Could not check for new orders.");
  }
  const parsed = parseNewOrdersPage(body);
  if (!parsed) throw new MartApiError("Could not check for new orders.");
  mode = "live";
  return parsed;
}
