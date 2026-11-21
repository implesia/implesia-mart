import assert from "node:assert/strict";
import test from "node:test";

import { offlineCreateBody, type OfflineOrderInput } from "@/lib/admin/orders-desk";
import { canWriteInventory, isSuperadmin } from "@/lib/admin/staff-role";
import { ORDERS_DESK_PATHS } from "@/lib/mart-api/orders-desk";

const BASE_OFFLINE: OfflineOrderInput = {
  customerName: "Rahim Mia",
  phone: "01712345678",
  email: "",
  district: "Dhaka",
  area: "Mirpur",
  address: "House 12, Road 4, Mirpur 10",
  notes: "",
  items: [
    {
      productId: "11111111-1111-4111-8111-111111111111",
      variantId: null,
      quantity: 2,
      unitPrice: 1200,
      priceEdited: false,
    },
  ],
  manualDiscount: 0,
  deliveryCharge: 0,
  paymentMethod: "cash",
  paidAmount: 2400,
  paymentReference: "",
  orderDate: "2026-11-21",
};

test("Phase G: isSuperadmin strictly restricts superadmin-only delete controls", () => {
  assert.equal(isSuperadmin("superadmin"), true);
  assert.equal(isSuperadmin("editor"), false);
  assert.equal(isSuperadmin("viewer"), false);
  assert.equal(isSuperadmin(undefined), false);
  assert.equal(isSuperadmin(null), false);
  assert.equal(canWriteInventory("editor"), true);
  assert.equal(canWriteInventory("viewer"), false);
});

test("Phase G: offlineCreateBody includes initial_status and mark_delivered only when set", () => {
  const baseBody = offlineCreateBody(BASE_OFFLINE);
  assert.equal("initial_status" in baseBody, false);
  assert.equal("mark_delivered" in baseBody, false);

  const counterBody = offlineCreateBody({
    ...BASE_OFFLINE,
    initialStatus: "delivered",
    markDelivered: true,
  });
  assert.equal(counterBody.initial_status, "delivered");
  assert.equal(counterBody.mark_delivered, true);
});

test("Phase G: order delete-impact, delete, and payment collection paths match backend API", () => {
  const id = "22222222-2222-4222-8222-222222222222";
  assert.equal(ORDERS_DESK_PATHS.deleteImpact(id), `/api/v1/admin/orders/${id}/delete-impact`);
  assert.equal(ORDERS_DESK_PATHS.deleteOrder(id), `/api/v1/admin/orders/${id}`);
  assert.equal(ORDERS_DESK_PATHS.payments(id), `/api/v1/admin/orders/${id}/payments`);
});
