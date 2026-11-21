import assert from "node:assert/strict";
import test from "node:test";

import {
  GUEST_CART_KEY,
  isCustomerCartAuthenticated,
  mergeGuestCart,
  setCustomerCartAuthenticated,
  getShopCart,
} from "../lib/mart-api/cart.ts";
import {
  deleteCustomerNotification,
  getCustomerDashboardSummary,
  getCustomerNotifications,
  getCustomerOrderTracking,
  getCustomerPurchasedProducts,
} from "../lib/mart-api/customer.ts";
import {
  getCanReviewProduct,
  getProductReviews,
  submitProductReview,
} from "../lib/mart-api/product-reviews.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("cart client routes shop requests through /api/customer/cart when authenticated", async () => {
  const seen: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    seen.push({ url: String(input), init });
    return jsonResponse({
      id: "cart-1",
      anonymous: false,
      cart_token: null,
      items: [],
      item_count: 0,
      subtotal: 0,
      shipping: 0,
      total: 0,
      inside_dhaka: 60,
      dhaka_suburban: 100,
      outside_dhaka: 120,
    });
  }) as unknown as typeof fetch;

  try {
    assert.equal(GUEST_CART_KEY, "implesia.cart.guest.v1");
    setCustomerCartAuthenticated(true);
    assert.equal(isCustomerCartAuthenticated(), true);

    await getShopCart();
    assert.equal(seen.length, 1);
    assert.equal(seen[0].url, "/api/customer/cart");
    assert.equal(seen[0].init?.credentials, "same-origin");

    await mergeGuestCart("guest-tok-123");
    assert.equal(seen.length, 2);
    assert.equal(seen[1].url, "/api/customer/cart/merge");
    assert.equal(seen[1].init?.method, "POST");
    assert.equal(seen[1].init?.body, JSON.stringify({ guest_token: "guest-tok-123" }));
  } finally {
    setCustomerCartAuthenticated(false);
    globalThis.fetch = originalFetch;
  }
});

test("customer client wrappers map Phase 6/7 dashboard, tracking, purchased, and notifications payloads", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; method?: string }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, method: init?.method });

    if (url === "/api/customer/dashboard-summary") {
      return jsonResponse({
        total_orders: 5,
        active_orders: 1,
        delivered_orders: 3,
        cancelled_orders: 1,
        total_products_purchased: 9,
        unread_notifications: 2,
        total_spent: 4500,
        customer_name: "Rahim",
        phone: "01711223344",
        email: "rahim@example.com",
      });
    }

    if (url === "/api/customer/orders/IM-12345678/tracking") {
      return jsonResponse({
        order_number: "IM-12345678",
        status: "cancelled",
        courier_name: "Steadfast",
        tracking_number: "ST-1",
        tracking_url: null,
        live_events: [],
        timeline: [
          {
            status: "new",
            label: "Placed",
            description: "Order placed",
            timestamp: "2026-11-20T10:00:00Z",
            completed: true,
          },
          {
            status: "cancelled",
            label: "Cancelled",
            description: "Order cancelled",
            timestamp: "2026-11-20T12:00:00Z",
            completed: true,
          },
        ],
      });
    }

    if (url === "/api/customer/purchased-products") {
      return jsonResponse([
        {
          product_id: "prod-1",
          title: "Cotton Panjabi",
          slug: "cotton-panjabi",
          image_url: "/media/products/a.jpg",
          price: 1200,
          quantity: 2,
          line_total: 2400,
          purchased_at: "2026-11-20T10:00:00Z",
          order_number: "IM-11111111",
          order_status: "delivered",
          payment_method: "cod",
          paid_amount: 0,
          due_amount: 2460,
          payment_status: "cod_due",
          can_review: true,
        },
      ]);
    }

    if (url === "/api/customer/notifications?limit=20") {
      return jsonResponse({
        items: [
          {
            id: "notif-1",
            user_id: "u-1",
            order_id: "o-1",
            type: "order_status",
            title: "Confirmed",
            message: "Order confirmed",
            is_read: false,
            language: "bn",
            created_at: "2026-11-20T10:00:00Z",
            updated_at: "2026-11-20T10:00:00Z",
          },
        ],
        unread_count: 1,
      });
    }

    if (url === "/api/customer/notifications/notif-1") {
      return jsonResponse({ message: "Notification deleted" });
    }

    return jsonResponse({}, 404);
  }) as unknown as typeof fetch;

  try {
    const summary = await getCustomerDashboardSummary();
    assert.equal(summary.deliveredOrders, 3);
    assert.equal(summary.cancelledOrders, 1);
    assert.equal(summary.totalProductsPurchased, 9);
    assert.equal(summary.unreadNotifications, 2);

    const tracking = await getCustomerOrderTracking("IM-12345678");
    assert.equal(tracking.orderNumber, "IM-12345678");
    assert.equal(tracking.trackingUrl, null);
    assert.deepEqual(tracking.liveEvents, []);
    assert.equal(tracking.timeline.length, 2);

    const purchased = await getCustomerPurchasedProducts();
    assert.equal(purchased.length, 1);
    assert.equal(purchased[0].quantity, 2);
    assert.equal(purchased[0].lineTotal, 2400);
    assert.equal(purchased[0].orderStatus, "delivered");
    assert.equal(purchased[0].paymentStatus, "cod_due");
    assert.ok(purchased[0].imageUrl?.endsWith("/media/products/a.jpg"));

    const notifs = await getCustomerNotifications(20);
    assert.equal(notifs.unreadCount, 1);
    assert.equal(notifs.items[0].id, "notif-1");

    const del = await deleteCustomerNotification("notif-1");
    assert.equal(del.message, "Notification deleted");
    assert.equal(calls.at(-1)?.method, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("product reviews client maps list, eligibility, and submission", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v1/products/p-1/reviews")) {
      return jsonResponse({
        items: [
          {
            id: "r-1",
            product_id: "p-1",
            user_id: "u-1",
            user_name: "Nadia",
            user_avatar: "/media/avatars/nadia.png",
            rating: 5,
            headline: "Excellent",
            comment: "Loved it",
            is_verified_purchase: true,
            created_at: "2026-11-20T10:00:00Z",
          },
        ],
        summary: {
          average_rating: 5,
          total_reviews: 1,
          rating_histogram: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 1 },
        },
        total: 1,
        page: 1,
        page_size: 10,
        pages: 1,
      });
    }
    if (url === "/api/customer/products/p-1/can-review") {
      return jsonResponse({
        can_review: true,
        reason: "Eligible",
        order_id: "ord-1",
      });
    }
    if (url === "/api/customer/products/p-1/reviews") {
      return jsonResponse(
        {
          id: "r-2",
          product_id: "p-1",
          user_id: "u-2",
          user_name: "Karim",
          user_avatar: null,
          rating: 4,
          headline: "Good",
          comment: "Nice fabric",
          is_verified_purchase: true,
          created_at: "2026-11-21T10:00:00Z",
        },
        201,
      );
    }
    return jsonResponse({}, 404);
  }) as unknown as typeof fetch;

  try {
    const page = await getProductReviews("p-1", { page: 1, pageSize: 10 });
    assert.equal(page.summary.averageRating, 5);
    assert.ok(page.items[0].userAvatar?.endsWith("/media/avatars/nadia.png"));

    const can = await getCanReviewProduct("p-1");
    assert.equal(can.canReview, true);
    assert.equal(can.orderId, "ord-1");

    const created = await submitProductReview("p-1", {
      rating: 4,
      headline: "Good",
      comment: "Nice fabric",
    });
    assert.equal(created.id, "r-2");
    assert.equal(created.rating, 4);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
