# Changelog

Newest first. Every task adds an entry: date, what changed, files touched, and anything the backend repo (`implesia-mart-backend`) must change.

- **Phase 8 Customer Dashboard Shell, Overview KPIs, Header Profile Dropdown & Notification Bell (2026-11-21).**
  - **Customer Dashboard Shell (`app/(client)/dashboard/layout.tsx` + `_components/`):**
    - Upgraded to an Admin-inspired shell (`dashboard-shell.tsx`, `dashboard-nav.ts`, `dashboard-ui.tsx`) with 3 grouped navigation sections (**প্রধান**: ওভারভিউ, আমার অর্ডার, অর্ডার ট্র্যাকিং, কেনা পণ্যের হিস্ট্রি; **কার্ট ও অ্যালার্ট**: আমার কার্ট with live cart item count badge, নোটিফিকেশন with live unread count badge; **অ্যাকাউন্ট**: ডেলিভারি ঠিকানা, আমার প্রোফাইল, সেটিংস), active pill indicator + left accent bar, and real customer avatar (`customer.avatarUrl` with initials fallback).
    - Replaced cramped mobile horizontal tabs with a compact top dashboard bar and a slide-out `Sheet` navigation drawer.
  - **Upgraded Dashboard Overview (`app/(client)/dashboard/page.tsx`):**
    - Added 5 crisp KPI cards powered by live backend metrics: মোট অর্ডার (`totalOrders`), চলতি / প্রসেসিং (`activeOrders`), সফল ডেলিভারি (`deliveredOrders`, fixing the prior `total - active` calculation), কেনা প্রোডাক্ট (`totalProductsPurchased`), and সর্বমোট খরচ (`totalSpent` in BDT `৳`).
    - Added a 2-column summary section below KPIs: Recent Orders table (linking to `/dashboard/tracking?order=...` and order detail) alongside Recent Unread Notifications preview (with click-to-mark-read sync) and Default Delivery Address card with quick edit link.
  - **Storefront Header Dropdown & Customer Notification Bell (`header.tsx`, `customer-avatar.tsx`, `customer-notification-bell.tsx`):**
    - Displays real `customer.avatarUrl` (with fallback initials) in the header pill and mobile drawer.
    - Redesigned desktop customer dropdown with rich identity header card ("ভেরিফাইড কাস্টমার" badge), grouped quick links (ড্যাশবোর্ড, আমার অর্ডার, অর্ডার ট্র্যাকিং, কেনা পণ্যের হিস্ট্রি, নোটিফিকেশন with live unread pill, আমার প্রোফাইল, সেটিংস), and styled logout footer.
    - Added `<CustomerNotificationBell />` next to the profile pill when signed in with live unread badge, latest 5 notification preview dropdown, click-to-mark-read, "সব পড়া হয়েছে" action, and link to `/dashboard/notifications`.
  - **Settings & Security Redirect:**
    - Moved password settings to `/dashboard/settings` (`app/(client)/dashboard/settings/page.tsx`) and made `/dashboard/security` redirect cleanly to `/dashboard/settings`.
  - Files touched:
    - `app/(client)/_components/common/customer-avatar.tsx`, `app/(client)/_components/common/customer-notification-bell.tsx`, `app/(client)/_components/common/header.tsx`
    - `app/(client)/dashboard/_components/dashboard-nav.ts`, `app/(client)/dashboard/_components/dashboard-ui.tsx`, `app/(client)/dashboard/_components/dashboard-shell.tsx`
    - `app/(client)/dashboard/layout.tsx`, `app/(client)/dashboard/page.tsx`, `app/(client)/dashboard/settings/page.tsx`, `app/(client)/dashboard/security/page.tsx`
    - `docs/CHANGELOG.md`, `docs/TODO.md`
  - Backend (`implesia-mart-backend`): no new backend changes required; consumes Phase 6/7 endpoints.

- **Phase 7 Frontend BFF, Customer API Wrappers, Avatar Support & Auto Guest-to-Account Cart Merge (2026-11-21).**
  - **Avatar Support in Auth & BFF:**
    - Added `avatar_url?: string | null` to `RawCustomerProfile` and `avatarUrl: string | null` (resolved via `mediaUrl`) to `FormattedCustomerProfile` (`lib/auth/customer-bff.ts`) and `CustomerProfile` (`lib/mart-api/customer.ts`).
    - Updated `proxyCustomerRequest` to support `FormData` and arbitrary `BodyInit` payloads cleanly without forcing `Content-Type: application/json`, and added shared `forbiddenCustomerResponse`, `forwardCustomerResponse`, and `proxyGuestFallbackRequest` helpers.
    - Added `app/api/customer/profile/avatar/route.ts` supporting `POST` (multipart upload to `/api/v1/customer/profile/avatar`) and `DELETE`.
  - **Customer BFF Routes (same-origin checked, cookie rotation via `applyCustomerPair`, `Cache-Control: no-store`):**
    - `GET /api/customer/orders/[number]` → `GET /api/v1/customer/orders/{number}`
    - `GET /api/customer/orders/[number]/tracking` → `GET /api/v1/customer/orders/{number}/tracking`
    - `GET /api/customer/purchased-products` → `GET /api/v1/customer/purchased-products`
    - `GET /api/customer/notifications` → `GET /api/v1/customer/notifications`
    - `PATCH /api/customer/notifications/[id]/read` → `PATCH /api/v1/customer/notifications/{id}/read`
    - `DELETE /api/customer/notifications/[id]` → `DELETE /api/v1/customer/notifications/{id}`
    - `POST /api/customer/notifications/mark-all-read` → `POST /api/v1/customer/notifications/mark-all-read`
    - `POST /api/customer/cart/merge` → `POST /api/v1/customer/cart/merge`
    - `GET/POST/PATCH/DELETE /api/customer/cart/[[...path]]` → `/api/v1/cart...` with customer Bearer token when signed in, falling back cleanly to guest cart if unauthenticated/expired.
    - `GET /api/customer/products/[id]/can-review` → `GET /api/v1/products/{id}/can-review`
    - `POST /api/customer/products/[id]/reviews` → `POST /api/v1/products/{id}/reviews`
  - **Client API Wrappers:**
    - Expanded `lib/mart-api/customer.ts` with `deliveredOrders`, `cancelledOrders`, `totalProductsPurchased`, and `unreadNotifications` on `CustomerDashboardStats`, nullable clearing support on `CustomerProfileUpdateInput`, and typed wrappers for avatar upload/delete, order detail, order tracking, purchased products, notifications (list, mark-read, mark-all-read, delete), and cart merge.
    - Added `lib/mart-api/product-reviews.ts` for public product reviews (`GET /api/v1/products/{id}/reviews`) and customer review checks/submissions through BFF (`/api/customer/products/{id}/can-review`, `/api/customer/products/{id}/reviews`).
  - **Automatic Guest-to-Account Cart Merge & Persistent Account Cart:**
    - Updated `lib/mart-api/cart.ts`, `app/(client)/_providers/customer-auth-provider.tsx`, and `app/(client)/_providers/cart-provider.tsx`:
      - On login, registration, or session restore, if a guest cart token exists in `localStorage` (`implesia.cart.guest.v1`), automatically calls `POST /api/customer/cart/merge`, clears the local guest token, and triggers `CartProvider` to reload the merged account cart.
      - When authenticated, shop cart calls in `lib/mart-api/cart.ts` route through `/api/customer/cart` so cart updates persist to the customer account across devices; on logout, switches back to guest cart mode and reloads cleanly.
  - Files touched:
    - `lib/auth/customer-bff.ts`
    - `lib/mart-api/customer.ts`, `lib/mart-api/product-reviews.ts`, `lib/mart-api/cart.ts`
    - `app/(client)/_providers/customer-auth-provider.tsx`, `app/(client)/_providers/cart-provider.tsx`
    - `app/api/customer/profile/avatar/route.ts`
    - `app/api/customer/orders/[number]/route.ts`, `app/api/customer/orders/[number]/tracking/route.ts`
    - `app/api/customer/purchased-products/route.ts`
    - `app/api/customer/notifications/route.ts`, `app/api/customer/notifications/[id]/read/route.ts`, `app/api/customer/notifications/[id]/route.ts`, `app/api/customer/notifications/mark-all-read/route.ts`
    - `app/api/customer/cart/merge/route.ts`, `app/api/customer/cart/[[...path]]/route.ts`
    - `app/api/customer/products/[id]/can-review/route.ts`, `app/api/customer/products/[id]/reviews/route.ts`
    - `tests/customer-phase7.test.ts`
    - `docs/CHANGELOG.md`, `docs/API.md`, `docs/BUSINESS_LOGIC.md`, `docs/TODO.md`
  - Backend (`implesia-mart-backend`): Phase 6 upgrades already provide all matching endpoints (`DELETE /api/v1/customer/profile/avatar`, `DELETE /api/v1/customer/notifications/{id}`, extended dashboard summary, upgraded tracking timeline, and repeat-purchase history).

- **Customer Authentication, Account Dashboard, Suppliers Page, and Coupons Fullscreen (2026-11-21).**
  - **Customer Authentication & BFF:**
    - Implemented secure, isolated customer cookies (`implesia_cust_access`, `implesia_cust_refresh`) with HTTPOnly and SameSite=Lax.
    - Added BFF proxy endpoints under `app/api/customer/` (`login`, `register`, `logout`, `session`, `profile`, `change-password`, `orders`, `dashboard-summary`).
    - Added client API wrapper `lib/mart-api/customer.ts` and React state provider `app/(client)/_providers/customer-auth-provider.tsx` with `useCustomerAuth()` hook.
    - Integrated with storefront header: shows login button for guests, customer avatar pill and dropdown ("আমার ড্যাশবোর্ড", "আমার অর্ডারসমূহ", "প্রোফাইল সেটিংস", "লগআউট") for authenticated customers, and integrated drawer navigation for mobile.
    - Built responsive authentication pages `/login` and `/register` with BD 11-digit phone validation (013-019), password toggle, and `?next=` query redirect support.
    - Created protected customer dashboard at `/dashboard` with:
      - Overview: KPI cards for total, active, and completed orders, recent orders table, and default delivery address.
      - Orders: Filter tabs (All, Running, Delivered, Cancelled), item thumbnail previews, courier tracking link, and printable invoice modal.
      - Profile: Name, phone, email, district, area, and address editor with instant toast alerts.
      - Security: Password change form.
    - Updated checkout shipping form to auto-fill logged-in customer's details with a verified badge.
  - **Admin Inventory Suppliers Management:**
    - Modernized `/admin/inventory/suppliers` with responsive layout, status filtering, search, and pagination.
    - Replaced basic form with a professional creation modal with input placeholders and validation.
    - Added soft-delete functionality with safety confirmation modal, keeping relational data intact.
    - Fixed React 19 cascading render warning (`react-hooks/set-state-in-effect`).
  - **Admin Coupons Creation Page:**
    - Updated `/admin/coupons/new` and `coupon-form.tsx` to expand across the full screen width.
    - Added live voucher card preview, clear pricing rules, and category/product picker.
  - Files touched:
    - `app/(client)/_components/common/header.tsx`
    - `app/(client)/_providers/customer-auth-provider.tsx`
    - `app/(client)/layout.tsx`
    - `app/(client)/login/page.tsx`
    - `app/(client)/register/page.tsx`
    - `app/(client)/dashboard/**`
    - `app/(client)/checkout/_components/**`
    - `app/api/customer/**`
    - `lib/auth/customer-cookies.ts`, `lib/auth/customer-bff.ts`, `lib/mart-api/customer.ts`
    - `app/admin/inventory/suppliers/page.tsx`, `lib/mart-api/inventory.ts`, `lib/mart-mock/inventory.ts`
    - `app/admin/coupons/_components/coupon-form.tsx`, `app/admin/coupons/new/page.tsx`
    - `docs/TODO.md`, `docs/CHANGELOG.md`

- **Admin-editable home SEO title and description (2026-11-16).**
  - The root layout and the home page `generateMetadata` read `GET /api/v1/site/settings` on the server and put the title and description in the first HTML (`<title>`, meta description, Open Graph, Twitter). The browser does not set the title. A timeout (3s), any failed response, a body that is not the settings object, or a null / blank / over-long field uses the built-in copy. A title template is used only when it contains `%s` exactly once and no other `%`; otherwise other pages keep `%s | Implesia Mart`. Those pages already use the root title template, so a saved template changes their `<title>`. Each page still sets its own Open Graph title.
  - The home route stays `force-dynamic` (CMS must not be cached). The settings row is cached on its own for 60 seconds, including a failed call, so a down API does not add the timeout to every page. A save shows up on the next request after that window.
  - Built-in title: "Implesia Mart — অরিজিনাল গ্যাজেট ও ইলেকট্রনিক্স, সেরা দামে" (58 characters). Built-in description is Bengali, about 150 characters: gadgets and electronics, nationwide cash on delivery, a quality check before delivery, and paying after the product is in hand. Those lines match copy already on the site.
  - Admin › Site › SEO reuses the contact-settings form: title, description, template, live counters (warning past 60 / 160), a Google-style preview, Clear, and Save (`PATCH`, empty sends `null`). Under `/admin`, so no storefront tracking. Until the admin route answers, and only while stand-ins are allowed, the form uses `lib/mart-mock/site-settings.ts`. The storefront does not. A 401 or 403 is shown.
  - Files: `lib/seo.ts`, `lib/site-seo.ts`, `lib/mart-api/site-settings.ts`, `lib/mart-api/site-settings-public.ts`, `lib/mart-mock/site-settings.ts`, `app/layout.tsx`, `app/(client)/page.tsx`, `app/admin/_config/cms.ts`, `app/admin/site/seo/**`, `tests/site-seo.test.ts`, `.env.example`, docs.
  - Backend (implesia-mart-backend PR #19, branch `cursor/storefront-seo-settings-0629`, not changed here): public `GET /api/v1/site/settings` returns `{ seo_title, seo_description, seo_title_template }` (each string or `null`) with `Cache-Control: public, max-age=60`. Admin `GET` / `PATCH /api/v1/admin/site/settings` is editor or above. PATCH omits a field to keep it; `null` or `""` clears it. A set template contains `%s` exactly once and no other `%`. Lengths: title 70, description 170, template 80.

- **Invoice, packet label, and order tracking match the print contract (2026-11-16).**
  - A4 invoice, on the existing print sheets: Invoice ID and order number on separate lines, created date and time (Asia/Dhaka), estimated delivery date, customer name, phone, email only when it is not blank, full address, and an item table with name and variant, SKU, short product ID, quantity, unit price, and line total. Courier and tracking ID show when they are present. The footer keeps the order-number barcode and adds a QR labelled “আমাদের shop দেখুন” that opens the storefront origin from `NEXT_PUBLIC_SITE_URL` (`SITE_URL` in `lib/seo.ts`; production fallback `https://mart.implesia.com`).
  - 4×6 label: order-number barcode, a small invoice ID, customer name, phone, and address, COD amount in bold, item count, courier and tracking ID, the order date, and a small QR to `{origin}/order-status?number={order_number}`. The label does not show email, SKU, product ID, or item lines.
  - `/order-status` is still the only tracking page. The customer enters a phone plus either the order number or the tracking ID. `?number=` (and the older `?order=`) prefills the order number, so a QR or SMS link only asks for the phone. The result shows the status timeline with times, courier and tracking, items with the variant, totals, and the amount still due. A wrong phone or an unknown id shows one Bangla sentence. No new analytics events.
  - Files: `lib/admin/qr.ts`, `lib/admin/print-sheet.ts`, `lib/order-lookup.ts`, `lib/mart-api/orders.ts`, `lib/mart-api/orders-desk.ts`, `lib/mart-mock/orders-desk.ts`, `app/admin/orders/_components/print-documents.tsx`, `app/admin/_components/admin-shell.tsx`, `app/(client)/order-status/page.tsx`, `app/(client)/order-status/_components/order-status-view.tsx`, `app/(client)/checkout/_components/checkout-success.tsx`, `tests/print-sheet.test.ts`, `tests/order-lookup.test.ts`, docs.
  - Backend (implesia-mart-backend PR #18, not changed here): `POST /api/v1/admin/orders/print-data` returns `invoice_id`, `order_number`, `created_at`, `estimated_delivery_date`, `email` (`""` when none), `full_address`, courier, tracking, and per item `title`, `variant_label`, `sku`, `product_id_short`, quantity, unit price, and line total. `POST /api/v1/orders/lookup` takes `phone` plus exactly one of `number` or `tracking_number`, and returns `timeline`, `items[].variant_label`, totals, and `due_amount`. A wrong phone or an unknown id is 404 `Order not found`.

- **Admin orders management: Done (not live) (2026-11-16).**
  - `docs/ROADMAP.md` is not in this repo. Orders management is **Done (not live)**: the admin UI calls the routes below, which are on implesia-mart-backend PR #18 (branch `cursor/admin-orders-management-aaf2`) and not necessarily on the API this app calls yet.
  - Sidebar group Orders Management: Overview, Create Order, Order List, Ready to Pack. The old list URL `/admin/orders?…` redirects to `/admin/orders/list` (`lane=transit` becomes `scope=transit`). `/admin/orders/<uuid>` is still the order page, so alerts and dashboard links keep working.
  - Overview: today, week, and month orders and revenue, pending confirm, ready to pack, shipped, return and cancel rates, online versus offline, status counts, and recent orders. No chart.
  - Create order is offline. Search a customer or type a new one, search a product (and its options when `has_variants`), quantity, catalog price that can be edited, discount, delivery charge, Cash / bKash / Nagad / Card / Due, paid amount, note, and order date. The browser never sends a total. Untouched prices and a blank delivery charge are omitted so the server applies tiers and the zone fee. A public quote is labelled Server preview only when every price is untouched, the discount is 0, and delivery was not typed; otherwise the panel says Estimate. The saved order is the server response. Low stock shows the server message. `Idempotency-Key` is sent and kept until the save succeeds. No analytics.
  - Order list: status tabs with `status_counts`, filters (origin, dates, payment, payment status, call status, courier), search, pagination, bulk status, and bulk print. Badges for status, origin, payment, call, history, and a same-phone 24-hour warning.
  - Order page: header, timeline (including packed), customer and history, call status, shipping, items with images, payment summary, editable courier and tracking, notes, and activity. Items can be replaced only while the order is new. Cancel and return are status changes.
  - Ready to pack lists confirmed orders. Print chooses invoice, label, or both. A4 invoice and 4×6 label, one order per page, Code 128 of the order number drawn in the page (no barcode package). The browser print dialog is the PDF download. Afterwards `POST /printed` (reprint allowed) and Mark packed.
  - Until `GET /api/v1/admin/orders/overview` answers, and only while stand-ins are allowed, `lib/mart-mock/orders-desk.ts` fills these screens. Optional `NEXT_PUBLIC_ORDERS_DESK_MOCK=1`. Not set in production.
  - Files: `app/admin/orders/**`, `app/admin/_config/nav.ts`, `app/admin/_components/admin-shell.tsx`, `app/admin/_components/admin-ui.tsx`, `app/admin/_components/dashboard/dashboard-sections.tsx`, `app/(client)/order-status/_components/order-status-view.tsx`, `lib/admin/orders-desk.ts`, `lib/admin/barcode.ts`, `lib/mart-api/orders.ts`, `lib/mart-api/orders-desk.ts`, `lib/mart-mock/store.ts`, `lib/mart-mock/orders-desk.ts`, `tests/orders-desk.test.ts`, `.env.example`, docs.
  - Backend (implesia-mart-backend PR #18, not changed here): the routes and fields above. Status `packed` sits between confirmed and shipped. `confirmed` is ready to pack. No admin quote route. No hard delete.


- **Purchases and stock adjustments for variant products (2026-11-16).**
  - Creating a purchase for a product that tracks stock per option returned 422 "This product tracks stock per option. Enter the variant_id or the variant sku." The new-purchase search used `GET /api/v1/admin/products`, whose card has `has_variants` and no variant rows, so every line was sent with only `product_id`.
  - The search now loads `GET /api/v1/admin/products/{id}` when `has_variants` is true and lists one row per option (name, option, SKU, on-hand). The same product can be several lines when the options differ. Save sends `variant_id` on those lines and does not send `sku` (`PurchaseItemCreate` rejects unknown fields; SKU matching is the Excel import). A line that still has no option is refused before the request.
  - Adjust stock on the product page has the same gap. When the product has options, the dialog asks which one and posts `variant_id`. A product without options is unchanged. The option's quantity on the form is updated after a successful adjustment so a later save does not put the old count back.
  - The product list search still matches title, subtitle, slug, and category name, not a variant SKU. No backend change.
  - Files: `lib/admin/inventory.ts`, `lib/mart-api/inventory.ts`, `lib/mart-api/products.ts`, `lib/mart-api/admin-variants.ts`, `lib/mart-mock/store.ts`, `app/admin/inventory/purchases/new/page.tsx`, `app/admin/products/_components/product-stock-panel.tsx`, `app/admin/products/_components/product-form.tsx`, `tests/inventory.test.ts`, docs.

- **No stand-in orders, quotes, or coupons in production (2026-11-16).**
  - `lib/mock-mode.ts` `mockFallbackAllowed()` is the single gate for every `lib/mart-mock/*` fallback that fakes data from the API: checkout quote and order (`lib/mart-api/orders.ts`), Admin › Coupons and the coupon report (`lib/mart-api/coupons.ts`), admin new-order alerts, inventory, and reports. It is true only under `next dev` (`NODE_ENV=development`) or with `NEXT_PUBLIC_ENABLE_MOCK=true` at build time. It is not set in `wrangler.jsonc`. The older `NEXT_PUBLIC_*_MOCK=1` switches only work while it is true.
  - Production: a quote or order that fails (404, 501, 5xx, or the API cannot be reached) is an error on the checkout form with a Bangla "try again" message. The order button never shows success and no demo QR is shown. A 4xx keeps the backend message and `error.code` (coupon invalid, expired, ...), and a coupon error code on the quote is also shown next to the coupon field. Buy-now no longer seeds a demo product when the product lookup fails. Admin coupon screens show the API error (the form also shows when products/categories cannot be loaded).
  - Files: `lib/mock-mode.ts`, `lib/mart-api/orders.ts`, `lib/mart-api/coupons.ts`, `lib/mart-api/order-alerts.ts`, `lib/mart-api/inventory.ts`, `lib/mart-api/reports.ts`, `app/(client)/checkout/_components/checkout-form-context.tsx`, `app/admin/coupons/_components/coupon-form.tsx`, `tests/mock-mode.test.ts`, `tests/register-alias.mjs` (extension-less relative imports resolve to `.ts`), `.env.example`, docs. No backend change.

- **Coupons: Done (not live) (2026-11-10).**
  - `docs/ROADMAP.md` is not in this repo. Coupons are **Done (not live)**: the admin and checkout UI call the routes below, but those routes are not on the API this app calls yet.
  - Admin › Coupons lists codes (status, used / limit, validity in Asia/Dhaka), searches by code, and filters by status. Create and edit explain every field. **Generate code** makes an 8-character code (no I, O, 0, or 1). Editors can activate and deactivate. Each coupon has a redemption history. A viewer sees the same screens read-only.
  - Reports has a Coupons tab (uses, total discount, total sales) and an Excel export for the same window.
  - Checkout (cart and buy-now) has **Coupon code আছে?** with Apply and Remove. Apply re-quotes and shows the server discount, the new total, and free delivery. An invalid code shows the server's Bangla message. `?coupon=CODE` on any storefront page is kept in `sessionStorage` (`implesia.coupon.v1`) and filled in at checkout. The order is created with `coupon_code` only. If the code fails at submit, the Bangla message stays on the form. The success page shows the code and the discount.
  - The browser never sends a discount amount and never computes one. The discount line, the total, and the Bangla QR advance/due all come from the quote (or the order, after it is placed). Before a delivery zone is chosen, the shown total is the server subtotal minus the server discount. If a live quote omits `coupon` while a code was sent, the UI does not invent a discount; it says the code could not be checked.
  - An order with a coupon shows the code and the discount on the admin order totals and in Fulfillment (the packing section). An order with no coupon looks the same as before. There is no separate invoice or packing-slip page.
  - The purchase event adds GA4 `coupon` and the same field on the Meta Pixel custom data when the order has a code. `/admin` still does not load trackers.
  - Until `GET /api/v1/admin/coupons` or `POST /api/v1/orders/quote` answers (404, 501, 5xx, or the API cannot be reached), `lib/mart-mock/coupons.ts` prices the quote and fills the admin screens. Optional `NEXT_PUBLIC_COUPONS_MOCK=1` forces that mock. It is not set in production. A live 422 is shown and is not replaced by the mock.
  - Files: `lib/coupons.ts`, `lib/admin/coupons.ts`, `lib/mart-api/coupons.ts`, `lib/mart-api/orders.ts`, `lib/mart-api/order-payload.ts`, `lib/mart-mock/coupons.ts`, `lib/analytics/events.ts`, `lib/analytics/track.ts`, `app/(client)/checkout/_components/checkout-coupon.tsx`, `app/(client)/_components/common/coupon-capture.tsx`, `app/admin/coupons/**`, `app/admin/reports/_components/reports-view.tsx`, `app/admin/orders/[number]/page.tsx`, `app/admin/_config/nav.ts`, `public/images/payment/demo-bangla-qr.svg`, `tests/coupons.test.ts`, `.env.example`, docs.
  - Aligned with implesia-mart-backend PR #15. The quote also sends `phone` once the checkout mobile is valid and a coupon is applied, and it re-quotes when that phone changes. An invalid code stays HTTP 200 on the quote. Order create rejects a bad code with HTTP 422 and `error.code` (`coupon_not_found`, `coupon_inactive`, `coupon_not_started`, `coupon_expired`, `coupon_min_amount`, `coupon_usage_limit`, `coupon_phone_limit`, `coupon_first_order_only`, `coupon_not_eligible`) plus a Bangla `error.message`. The client never sends `coupon_discount`, `total`, `shipping`, or `unit_price`. `coupon_discount` of 0 is a free-delivery coupon and is shown that way. Codes are 3–32 of A–Z, digits, hyphen, and underscore. A chosen category includes its subcategories. Redemptions are paged (`page`, `page_size`). The coupon report uses the same preset or from/to query as the other reports, and the product, category, and channel filters are hidden (`channel_applies: false`). Sales summaries also read `coupon_discount`, which is already inside `discount`.
  - Backend (implesia-mart-backend PR #15, not changed here): `POST /api/v1/orders/quote` accepts optional `coupon_code` and `phone`. The quote adds `coupon` (`code`, `valid`, `discount`, `free_delivery`, `error_code`, `message`). `subtotal` is merchandise after the quantity discount. A valid coupon sets `total = subtotal − discount + shipping`, and free delivery sets `shipping` to 0. `POST /api/v1/orders` accepts `coupon_code`. Order reads add `coupon_code` and `coupon_discount` (null when unused). Admin: `GET`/`POST /api/v1/admin/coupons`, `GET`/`PATCH /api/v1/admin/coupons/{id}`, `POST .../activate` and `.../deactivate`, `GET .../redemptions` (paged), `GET /api/v1/admin/reports/coupons` and `.../export` with the shared report date query. Writes are editor or above. `created_by` is an admin UUID or null. Dates are ISO instants; the admin form types them in Asia/Dhaka.

- **Admin new-order alerts: Done (not live) (2026-11-10).**
  - `docs/ROADMAP.md` is not in this repo. Notifications are **Done (not live)**: the admin shell polls, but the route is not on the API this app calls yet.
  - Every signed-in admin page (not `/admin/login`) polls `GET /api/v1/admin/orders/new` about every 25 seconds. A hidden tab waits 3 minutes and polls as soon as it is visible again. Errors back off (double each time, cap 5 minutes). One tab is the leader (localStorage lock, 3-second heartbeat, stale after 10 seconds; a visible tab takes the lock from a hidden leader) and tells the other tabs through `BroadcastChannel`, with `storage` events as the fallback. Logout or HTTP 401 stops polling. The client sends `cache: "no-store"`. Limit is clamped to 1..50 before the request; 422 backs off and does not use the mock.
  - A new order (staff only): a synthesized two-tone chime (`public/sounds/new-order.mp3`, A5 then E6, generated in this repo with no third-party sample), a toast with the order number, ৳ amount (thousands separators) and a link to `/admin/orders/<uuid>`, an unread badge on the Orders sidebar item, `(N)` in the tab title, and a browser notification when permission is granted (click focuses the tab and opens that order). Only the tab that claims the order plays the sound and shows the notification. Other tabs still update the badge, title, and bell list.
  - Header bell: unread count, recent orders (number, name, amount, payment, relative time in Asia/Dhaka), links to `/admin/orders/<uuid>`, and **সব পড়া হয়েছে**. Sound on/off, volume, and the current notification permission (`granted` / `denied` / `default` / `unsupported`, with a button to ask when it is `default`) are in the same popover. Sound and volume are saved in this browser's localStorage. If playback is blocked, a bar says **শব্দ চালু করতে ক্লিক করুন**.
  - The first response (no cursor yet) is a baseline and does not alert. Later polls keep rows with `created_at` later than the cursor, then store `now` as the next `since`. Read state and the recent list are in localStorage and shared across tabs.
  - Until the route answers (404, 501, or the API cannot be reached on the first try), `lib/mart-mock/order-alerts.ts` is used. `?orderAlertDemo=1` adds one sample order after the baseline so the UI can be tried. Optional `NEXT_PUBLIC_ORDER_ALERTS_MOCK=1` forces the mock and does not add an order by itself. Neither is set in production.
  - Files: `lib/admin/order-alerts.ts`, `lib/mart-api/order-alerts.ts`, `lib/mart-mock/order-alerts.ts`, `app/admin/_components/order-alerts/**`, `app/admin/_components/admin-shell.tsx`, `app/admin/_config/nav.ts`, `public/sounds/new-order.mp3`, `tests/order-alerts.test.ts`, docs.
  - Backend (`implesia-mart-backend` PR #14, stacked on backend PR #13, not changed here): `GET /api/v1/admin/orders/new?since=<ISO, optional>&limit=<1..50, default 20>`, staff auth. `id` is a UUID. `payment_method` is `cod` or `bangla_qr`. Anonymous or non-staff is 401. A limit outside 1..50 is 422. Response `Cache-Control: no-store`, body `{ now, items: [{ id, number, customer_name, total, payment_method, created_at }] }`, newest first, `created_at` > `since`. The admin opens `/admin/orders/<id>`.

- **Storefront analytics: GA4, Meta Pixel, purchase dedupe, Search Console (2026-11-10).**
  - `lib/analytics/` is the only tracking API (`track`, `trackPurchase`). GA4 (`NEXT_PUBLIC_GA4_ID`) and Meta Pixel (`NEXT_PUBLIC_META_PIXEL_ID`) load from the storefront layout with `next/script` (`afterInteractive` / `lazyOnload`). An empty or malformed id skips that tracker with no script and no console message. `/admin` does not mount the loader, and `track` drops `/admin` paths. Another provider (TikTok, Google Ads) can be added in `analyticsProviders` without changing call sites.
  - Page views are sent on client navigations. gtag automatic `page_view` is off, and the Meta snippet does not send its own PageView. Commerce events: `view_item`/`ViewContent`, `add_to_cart`/`AddToCart`, `begin_checkout`/`InitiateCheckout` (once per checkout visit), `purchase`/`Purchase`. Currency `BDT`. Purchase runs only after the order is created, once per order number (`localStorage`). Its event id is `analytics_event_id` from the response, or `purchase_<order_number>`. Other events use a random id (GA4 `event_id`, Meta `eventID`).
  - `POST /api/v1/orders` sends `tracking: { fbp, fbc, event_source_url }` (`_fbp` / `_fbc` cookies; `fbc` is `fb.1.<ms>.<fbclid>` when the cookie is missing but the visit had `fbclid`; nulls when absent).
  - Search Console: `GOOGLE_SITE_VERIFICATION` (runtime, server-rendered meta). `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` remains a fallback. Empty = no tag. Ids and the verification token are read per request (`connection()`), so Cloudflare Workers should set them as **runtime** variables, not build variables.
  - Sitemap already lists published products and categories that have products, and does not list admin, cart, checkout, or order-status. There is no public `/cart`, `/account`, or order-success route (success is the checkout page; `/admin/cart` is covered by `/admin`). `robots.txt` now also disallows `/cart`.
  - `docs/ROADMAP.md` is not in this repo, so it was not updated.
  - Files: `lib/analytics/**`, `lib/seo.ts`, `lib/mart-api/orders.ts`, `app/layout.tsx`, `app/(client)/layout.tsx`, `app/(client)/products/_components/product-info.tsx`, `app/(client)/_providers/cart-provider.tsx`, `app/(client)/checkout/_components/checkout-form-context.tsx`, `app/(client)/checkout/_components/checkout-success.tsx`, `app/(client)/checkout/_components/checkout-view.tsx`, `app/robots.ts`, `.env.example`, `tests/analytics.test.ts`, `tests/robots.test.ts`, `tests/seo-structured.test.ts`, docs.
  - Backend (`implesia-mart-backend`, not changed here): `POST /api/v1/orders` should accept optional `tracking` (`fbp`, `fbc`, `event_source_url`, each a string or null) and ignore it until CAPI stores it — do not 422. The create response should include `analytics_event_id` = `purchase_<order_number>`, and the server Purchase event should use that same id.

- **Workers Builds lockfile includes recharts (2026-11-10).**
  - Cloudflare Workers Builds install with `bun install --frozen-lockfile` (bun 1.4.4) and then run `bun run build`. Adding `recharts` updated `package.json` and `package-lock.json` while `bun.lock` stayed on the previous dependency set, so the install stopped with "lockfile had changes, but lockfile is frozen". `bun.lock` is regenerated with bun 1.4.4. Pull requests #7 and #8 left `package.json`, `package-lock.json`, and `bun.lock` unchanged.
  - CI: a separate job installs with the same bun 1.4.4 frozen lockfile, alongside the existing npm install, test, and build job. Deploy settings are unchanged.
  - Files: `bun.lock`, `.github/workflows/ci.yml`, docs.

- **Admin reports page and dashboard figures from the report API (2026-11-10).**
  - New `/admin/reports` page for every signed-in staff member, including viewers. The sidebar item is Reports. Filters (This week, This month, Last month, Custom, product, category, channel, and chart grain) stay in the URL.
  - Summary cards: Net sales, Profit, Margin, Units sold, Delivered, Returned, Return rate. Each percent compares the previous inclusive range of the same length, loaded by calling the same endpoints with `from` and `to`. The card shows "—" when the previous value is 0 or null, or the current value is null.
  - A net-sales and profit trend chart (recharts). Tabs: Products, Stock, Stock movement, Delivery & Return. Each table sorts, searches, and paginates in the browser. Products and stock are read from the API in pages of 100, up to 1,000 rows. Export Excel on each tab downloads that report's `/export` for the current filters. Print uses a print stylesheet that hides the shell and the filter bar.
  - Unknown-cost lines show a warning with the line count and a link to the products (or the filtered product) so the cost price can be filled in.
  - Money is ৳ with thousands separators. Dates are Asia/Dhaka. Loading, empty, and error states are on the page.
  - The dashboard headline numbers and the chart now come from the report API, so a viewer can see them. The older overview (`GET /api/v1/admin/dashboard`) is still editor-only and still fills order activity, best sellers, recent orders, and areas. "View all reports" links to this page with the same window.
  - Until `GET /api/v1/admin/reports/sales` answers (404, 501, 5xx, or the API cannot be reached), the page uses `lib/mart-mock/reports.ts`.
  - Field names are from implesia-mart-backend PR #10, branch `cursor/admin-sales-reports-b0a9` (`app/schemas/report.py`, `app/api/v1/endpoints/admin_reports.py`, `docs/API.md`): `order_count`, `units_sold`, `gross_sales`, `discount`, `delivery_charge`, `net_sales`, `revenue`, `cost`, `profit`, `margin_percent`, `unknown_cost_lines`, `unknown_cost_units`, `unknown_cost_revenue`, `return_count`, `units_on_hand`, `stock_value`, `low_stock_count`, `low_stock_at`, `no_sale_30d_count`, `period_applies`, `as_of`, `no_sale_since`, `opening_balance`, `opening`, `purchase`, `sale`, `return`, `cancel`, `adjustment`, `closing`, `delivered`, `returned`, `cancelled`, `return_rate_percent`, `grain`, `points[].start`, `points[].net_sales`, `points[].profit`, `channel_applies`, and filters `from` / `to`.
  - Assumed, because the API does not return them: the previous window is the immediately preceding range of equal length; the channel menu lists All and Website (`website` is the only channel the backend names); table sort and search are client-side; dashboard Today / Yesterday / Last 7 days / Last 30 days are inclusive Dhaka `from`/`to` ending today (7 days means today and the six days before it).
  - New dependency: `recharts` 3.10.1. The existing chart draws revenue bars and an order line. Net sales and profit need two time series, a tooltip, and a width that follows the page, with strokes taken from the theme variables (`--color-primary`, `--color-secondary`).
  - Files: `app/admin/reports/**`, `app/admin/_components/dashboard/dashboard-view.tsx`, `app/admin/_config/nav.ts`, `lib/admin/reports.ts`, `lib/mart-api/reports.ts`, `lib/mart-api/dashboard.ts`, `lib/mart-mock/reports.ts`, `tests/reports.test.ts`, `package.json`, `package-lock.json`, docs.
  - Backend: https://github.com/implesia/implesia-mart-backend/pull/10 (branch `cursor/admin-sales-reports-b0a9`). This page stacks on the admin inventory frontend and must merge after it. No deploy in this task.


- **Align admin inventory with backend ledger PR 9 (2026-11-09).**
  - The client now calls `/api/v1/admin/inventory/…` as specified on `implesia-mart-backend` branch `cursor/inventory-ledger-2808` (PR #9). Field names come from `app/schemas/inventory.py`, `admin_inventory.py`, and that branch's `docs/API.md`. Excel columns and the 409 body come from `inventory_excel.py` and `inventory_service.py` on the same branch.
  - Writes stay editor or superadmin. Viewers can list, export, download templates, and preview an import. Confirm, create, adjust, and Record opening stock stay hidden or disabled for viewers.
  - A purchase does not compute `cost_price` in the browser. The product panel refetches `quantity` and `cost_price` from the admin product (or the mock book when the ledger is not mounted). The mock still applies the server weighted-average formula so that refetch shows the new cost.
  - There is no supplier export and no supplier delete. Purchases and movements cannot be edited. Import kinds are `purchases`, `opening`, `stock_count`, and `cost_price`. Export kinds are `products`, `purchases`, and `movements`, with `date_from` and `date_to` only.
  - A repeated file is previewed with `duplicate: true` and, on confirm, HTTP 409 `{ error: { code: "conflict", message, details: { file_hash } } }` until `confirm_duplicate` is true.
  - The adjust-stock dialog is portaled to `document.body`. It sits inside the product form, and a nested form was submitting the product instead of the adjustment.
  - Files: `lib/mart-api/inventory.ts`, `lib/mart-mock/inventory.ts`, `lib/admin/inventory.ts`, `app/admin/inventory/**`, `app/admin/products/_components/product-stock-panel.tsx`, `app/admin/products/_components/product-form.tsx`, `tests/inventory.test.ts`, docs.
  - Backend: https://github.com/implesia/implesia-mart-backend/pull/9 (branch `cursor/inventory-ledger-2808`). This frontend still depends on frontend PR #7 for admin `cost_price` and must merge after it.

- **Admin inventory: suppliers, purchases, stock history, adjustments, Excel (2026-11-09).**
  - Sidebar group Inventory: Suppliers, Purchases, Stock history. Purchases have a new-purchase form (supplier, Asia/Dhaka date, invoice no, product search by name or SKU, qty × unit cost, live line and grand totals). Stock history filters by this week, this month, or a custom range, plus product and movement type, with pagination. The product edit page shows current stock, cost price, a low-stock warning at 5 units (`LOW_STOCK_THRESHOLD`), and Adjust stock (signed quantity and a required reason, with no separate note) for editors.
  - Purchases and stock history export Excel for the date range. Suppliers have no export. Purchases can import a purchases workbook. Stock history can import opening stock, a stock count, or a cost price. Flow: template, upload, green/red preview, confirm. A file whose SHA-256 was already imported returns a duplicate-file prompt before it can be saved. The result toast says how many rows were saved and how many were skipped. Viewers do not see create, confirm, or adjust. They can still preview an import. Cost and these pages are admin-only.
  - Paths in this entry were a guess. The alignment entry above replaces them with backend PR #9.
  - Files: `app/admin/_config/nav.ts`, `app/admin/inventory/**`, `app/admin/products/_components/product-form.tsx`, `app/admin/products/_components/product-stock-panel.tsx`, `lib/admin/inventory.ts`, `lib/admin/xlsx-lite.ts`, `lib/admin/staff-role.ts`, `lib/mart-api/inventory.ts`, `lib/mart-api/products.ts`, `lib/mart-mock/inventory.ts`, `lib/mart-mock/store.ts`, `lib/auth/bff.ts`, `app/admin/login/page.tsx`, `app/admin/_components/admin-shell.tsx`, `tests/inventory.test.ts`, docs.

- **Align cost price and order timestamps with backend PR 8 (2026-11-09).**
  - `cost_price` on admin product reads is a JSON number (float of `numeric(12, 2)`) or `null`, not a decimal string. The form still accepts a decimal string if one arrives. Values above 9,999,999,999.99 are refused before save. Omitting the field on PATCH keeps the stored price; the form sends `null` when the field is empty.
  - Admin `OrderRead` always includes `delivered_at` and `returned_at` (ISO 8601 UTC or `null`), including the order list and `POST /orders`. Public lookup does not. Display stays Asia/Dhaka.
  - Files: `lib/admin/cost-price.ts`, `lib/admin/order-timestamps.ts`, `lib/mart-api/products.ts`, `lib/mart-api/orders.ts`, `lib/mart-mock/store.ts`, `tests/cost-price.test.ts`, `tests/order-timestamps.test.ts`, docs.
  - Backend: https://github.com/implesia/implesia-mart-backend/pull/8 (not merged). Create rejection uses `errors[].field` = `costPrice` (400). A negative cost on update is 422.

- **Admin cost price and order delivered/returned dates (2026-11-09).**
  - Product create/edit: optional "কেনা দাম (Cost price)" beside the selling price, with a ৳ prefix and the note "শুধু অ্যাডমিন দেখবে, কাস্টমার দেখবে না।" Empty sends `cost_price: null` (clears it). A negative number, letters, or more than two decimals shows under the field and blocks save. When both prices are set, a live margin shows profit or loss in taka and as a percent of the selling price (Shopify margin: `(selling − cost) / selling × 100`). Green is profit, red is loss (`text-success` / `text-error`). The storefront does not read or render `cost_price`.
  - Admin order detail: Delivered and Returned dates in the progress timeline and in the rows under it, Asia/Dhaka, `09 Nov 2026, 2:30 PM`, or "—" when missing. A completed step no longer says "Not reached".
  - Files: `lib/admin/cost-price.ts`, `lib/admin/order-timestamps.ts`, `lib/mart-api/products.ts`, `lib/mart-api/orders.ts`, `lib/mart-mock/store.ts`, `app/admin/products/_components/product-form.tsx`, `app/admin/orders/[number]/page.tsx`, `tests/cost-price.test.ts`, `tests/order-timestamps.test.ts`, docs.
  - Backend contract (confirmed in `implesia-mart-backend` PR 8, not merged): see the entry above.

- **Checkout phone accepts +880 / 880 spellings (2026-11-03).**
  - `validateShipping` used `/^01\d{9}$/` on the raw input, so `+8801516527932` showed "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)". It now uses `normalizePhone` (`lib/contact/contact-rules.ts`): `01XXXXXXXXX`, `8801XXXXXXXXX`, `+8801XXXXXXXXX`, spaces/dashes/dots/brackets and Bengali digits ignored, operator prefix 013–019. The order is sent with the normalised `01XXXXXXXXX`. Invalid numbers keep the same message.
  - Files: `app/(client)/checkout/_lib/validate-shipping.ts`, `app/(client)/checkout/_components/checkout-form-context.tsx`, `tests/order-payload.test.ts`, docs.
  - Backend: `OrderCreate`/`OrderLookup` normalise the same way (backend repo, same task, no migration).
- **Bangla QR payment (2026-11-03): admin Payment QR, product-page QR card, checkout partial advance.**
  - Admin: new "Payment QR" tab at `/admin/site/payment` (`SITE_CMS` entry `payment`): upload, replace or remove (with confirm) the single Bangla QR image. Saved instantly through the API; the old file is deleted by the API.
  - Product page: under the WhatsApp button (in-stock branch) a small `BanglaQrCard` shows the QR and "Bangla QR স্ক্যান করে যেকোনো মোবাইল ব্যাংকিং বা ব্যাংক থেকে পেমেন্ট করুন"; tap opens a full-size `<dialog>` lightbox. Hidden when no QR is set or the API call fails. The fetch is `no-store`, so admin changes show on the next load.
  - Checkout: a second payment method "Bangla QR" appears only when the quote has `bangla_qr_options` (QR set and total > 0). The shopper picks 25/50/75/100% advance (each option shows advance and remaining cash on delivery, from the API, rounded up to whole taka), sees the QR and must enter the transaction ID / sender number (4–64 letters, digits, `+`, `-`). The order summary shows "এখন Bangla QR-এ অগ্রিম (N%)" and "ডেলিভারিতে বাকি (ক্যাশ)" under the total. If the option disappears (QR removed) the form falls back to cash on delivery.
  - Admin orders: list badge "Bangla QR + COD"; order detail has a Payment section (method, advance %, advance paid, due on delivery, transaction ID).
  - Button contrast (WCAG): audited every coloured button with dark text (`#042422`). Dark text on teal/gold/WhatsApp green is 4.98–8.94:1, white would be 1.83–3.29:1, so no button changed. Dark buttons already use white text.
  - Tests: `tests/bangla-qr-payment.test.ts` (settings parsing, advance split with ceil, options, reference validation, payload).
  - Files: `lib/payment.ts`, `lib/mart-api/payment-settings.ts`, `lib/mart-api/orders.ts`, `app/(client)/_providers/payment-qr-provider.tsx`, `app/(client)/_components/common/bangla-qr.tsx`, `app/(client)/_data/checkout/checkout.ts`, `app/(client)/products/[ref]/page.tsx`, `app/(client)/products/_components/product-info.tsx`, `app/(client)/checkout/page.tsx`, `app/(client)/checkout/_components/checkout-form-context.tsx`, `app/(client)/checkout/_components/checkout-payment-method.tsx`, `app/(client)/checkout/_components/checkout-order-summary.tsx`, `app/admin/_config/cms.ts`, `app/admin/site/payment/page.tsx`, `app/admin/site/payment/_components/payment-qr-editor.tsx`, `app/admin/orders/page.tsx`, `app/admin/orders/[number]/page.tsx`, `app/admin/_components/admin-ui.tsx`, `tests/bangla-qr-payment.test.ts`, docs.

- **Home Trending strip under the hero, Showcase "Add product" fixes (2026-11-03).**
  - Trending: the showcase row with key `gadgets` (heading from Admin › Home › Showcase, live "Tranding") now renders right under the hero, before the trust strip, as a light-blue rounded box with a bold heading, one horizontally scrollable row of tiles (white rounded square, product image `object-contain`, name centred below in small text, max 2 lines), round `>` arrow on the right (and `<` once scrolled; arrows hide at the ends). Touch swipe with CSS scroll-snap. The other showcase rows keep the product-card grid in the old place. New `TrendingSection` and `splitTrendingRow()` / `TRENDING_ROW_KEY` (`lib/mart-api/showcase-trending.ts`).
  - Admin: Showcase moved right under Hero in the Home section list (`HOME_CMS`); the Trending row is listed first on the Showcase page with an "Under the hero" note. Copy changed from "products from this category" to "published products". When editing a slot whose product was hidden later, that product stays selectable as "(Hidden)" instead of the select silently showing another product.
  - Add product modal / disabled Trending button: fixed in the backend (see below); the modal now only lists published products.
  - Tests: `tests/showcase-trending.test.ts`.
  - Files: `app/(client)/page.tsx`, `app/(client)/_components/home/trending-section.tsx` (new), `lib/mart-api/showcase-trending.ts` (new), `app/admin/_config/cms.ts`, `app/admin/home/_components/showcase-editor.tsx`, `tests/showcase-trending.test.ts` (new), docs.
  - Backend (`implesia-mart-backend`, branch `feat/showcase-trending`): `choices` in `GET /api/v1/admin/home/showcase` must be every **published** product (not the row key's category subtree), and `POST`/`PATCH …/rows/{key}/items` must accept any published product and reject hidden ones with 422 "Choose a published product". Response shape unchanged. Deploy the backend together with (or before) this frontend change, otherwise the live modal keeps the old list.

- **Quantity discount on the line total, rounded up (2026-11-02).**
  - `lib/mart-api/pricing.ts`: `priceLine` now mirrors the backend rule: `unitPrice` = quantity-1 selling price, `subtotal` = unit × quantity, `lineTotal` = `ceil(subtotal − subtotal × tier %/100)` (integer maths, `discountedTotal`), `discountAmount` = subtotal − lineTotal. New `lineDiscount()` helper. Tier lookup unchanged (nearest lower tier).
  - Product page (`product-info.tsx`): the line under the quantity selector updates instantly: `3 × ৳700 = ৳2,100 − ৳15 (0.75% ছাড়) = শেষ দাম ৳2,085`; without an applicable tier only `qty × price = total`. The top price no longer moves with the quantity; its badge shows the base % (`priceView.discountPercent`).
  - Cart drawer and checkout summary: base % next to the unit price, plus "পরিমাণে x% ছাড়: −৳N" when a tier applies; the optimistic cart reprice uses the same rule. `quantity_discount_percent` is now read from cart and quote lines (`quantityPercent`).
  - Tests: `tests/pricing.test.ts` (owner examples, nearest lower tier, no tiers, updated expectations).
  - Files: `lib/mart-api/pricing.ts`, `lib/mart-api/variants.ts`, `lib/mart-api/cart.ts`, `lib/mart-api/orders.ts`, `app/(client)/_lib/cart-shared.ts`, `app/(client)/_providers/cart-provider.tsx`, `app/(client)/_components/cart/cart-drawer.tsx`, `app/(client)/checkout/_components/checkout-order-summary.tsx`, `app/(client)/products/_components/product-info.tsx`, `tests/pricing.test.ts`, docs.
  - Backend (same task, branch `feat/quantity-discount-rounding`): `pricing_service.price_line` applies the rule; `unit_price` on cart/quote/order lines is now the quantity-1 price and `line_total` the discounted, rounded-up amount. Must be deployed together with this change.
- **Home video/media section (2026-11-02): admin-managed image, uploaded video or YouTube block above the testimonials.**
  - Storefront: `HomeMediaSection` renders directly above "কাস্টমাররা যা বলছেন" with heading, optional subheading, the media in a 16:9 frame, an optional description and an optional button. Image → `next/image`; uploaded video → `<video controls playsInline preload="metadata">` with the uploaded thumbnail as `poster`; YouTube → the thumbnail (custom, else YouTube `hqdefault`) with a ▶ button, and only on click a `youtube-nocookie.com` iframe with `autoplay=1`. Hidden when the API returns null (inactive, empty, or no usable media). The fetch is `no-store` and the page is `force-dynamic`, so saves show on the next load.
  - Admin: new "Video / media" tab at `/admin/home/media` (`HOME_CMS` entry `media`): Active/Inactive, heading, subheading, media type (Image / Video / YouTube), image upload (5 MB), MP4/WEBM upload (50 MB, checked before upload), YouTube link with inline validation, optional thumbnail for video/YouTube, alt/title, description, button toggle + text + link (site path `/…` or `https://` only), live preview, success and error toasts. Files picked in the browser are uploaded on Save.
  - Backend must have: `GET /api/v1/home/media` (null when hidden) and `GET/PUT /api/v1/admin/home/media`, `POST …/image`, `POST …/video` (backend migration 0089). Done in the backend repo in the same task; the API removes replaced files.
  - Files: `app/(client)/page.tsx`, `app/(client)/_components/home/media-section.tsx`, `app/admin/_config/cms.ts`, `app/admin/home/_components/section-manager.tsx`, `app/admin/home/_components/media-editor.tsx`, `lib/home-media-view.ts`, `lib/mart-api/home-media.ts`, `tests/home-media-view.test.ts`, docs.
- **SEO follow-ups (2026-11-02): verification, sitemap, product rich results, catalog canonicals, alts, HSTS.**
  - Search Console / Bing: optional `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and `NEXT_PUBLIC_BING_SITE_VERIFICATION` (token only, read at build time) render `google-site-verification` / `msvalidate.01` through `metadata.verification` (`siteVerification()` in `lib/seo.ts`). Nothing is rendered when unset. Documented in `.env.example` (no values).
  - Sitemap (`app/sitemap.ts`, `lib/sitemap-entries.ts`): adds category URLs (`/products?category=<slug>`, only categories with published products); `lastModified` comes from the API (`updated_at` of products and categories, blog publish date; home/products/blogs = newest item); static pages no longer claim "now". The home entry is `https://mart.implesia.com` (no trailing slash), the same as its canonical. If the product catalog API is down the sitemap logs `console.error` and answers 5xx (crawlers keep the last good copy) instead of an almost empty sitemap; a failing category or blog call only drops that section, with a log.
  - Product JSON-LD (`lib/product-structured-data.ts`): `priceValidUntil` (rolling 1 year), `itemCondition`, `seller`, `shippingDetails` (BD, highest enabled delivery charge from `/api/v1/delivery`), `hasMerchantReturnPolicy` (3 days, free, by mail — assumption from the "৩ দিনের ইজি রিটার্ন" storefront copy), up to 6 images; products with options get an `AggregateOffer` (low/high price, count) with one `Offer` per option. No ratings or reviews. Product pages add `og:type=product`, `product:price:amount` and `product:price:currency` (sent through `metadata.other` as `<meta name=…>` because Next rejects og:type "product").
  - Catalog: `/products` pages carry a self-canonical with `category` and `page` (>1) only (sort, filters and search dropped); page 2+ titles get "— পৃষ্ঠা N". A page number past the last page now gets a real 307 from `proxy.ts` (`lib/mart-api/catalog-page-guard.ts`, one extra API call for `page>1` requests) instead of a meta refresh with status 200.
  - Product gallery: an image with an empty alt uses the product title. Admin: under an empty gallery description and an empty main image description a hint says the product name is used.
  - HSTS: `proxy.ts` adds `Strict-Transport-Security: max-age=31536000` (no `includeSubDomains`, no `preload`) on HTTPS responses for non-local hosts (`lib/hsts.ts`). HTTP→HTTPS and www redirects are Cloudflare settings: see TODO.md.
  - Files: `.env.example`, `app/layout.tsx`, `app/sitemap.ts`, `app/(client)/products/(catalog)/page.tsx`, `app/(client)/products/[ref]/page.tsx`, `app/(client)/products/_components/product-gallery.tsx`, `app/(client)/_data/products/catalog-meta.ts`, `app/admin/products/_components/product-content-fields.tsx`, `app/admin/products/_components/product-form.tsx`, `lib/seo.ts`, `lib/hsts.ts`, `lib/product-structured-data.ts`, `lib/sitemap-entries.ts`, `lib/mart-api/catalog-page-guard.ts`, `lib/mart-api/catalog-query.ts`, `lib/mart-api/catalog-product.ts`, `proxy.ts`, `tests/seo-structured.test.ts`.
  - Backend: needs `updated_at` on public product cards/detail and on category tree nodes, and Bengali→Latin slugs for new products (backend repo, same day; no migration).
- **SEO fixes (2026-11-02): metadata in `<head>`, per-page share cards, product SEO fields.**
  - Metadata in `<head>` for every crawler: Next/vinext "streaming metadata" put async `generateMetadata` tags (product pages, `force-dynamic`) in the `<body>` for user agents not listed in `htmlLimitedBots` — Googlebot included. `next.config.ts` now sets `htmlLimitedBots: /.*/`, so metadata is resolved before the head is sent. Verified on a local `vinext build` + `wrangler dev` (workerd) preview with a Googlebot and a Chrome UA: exactly one `<title>`, description and og tags in `<head>`, none in `<body>`, on home, about, product, catalog, blogs, checkout, search, order-status and 404. Not verified on the deployed site (no deploy). Trade-off: the HTML head waits for `generateMetadata` (one product API call).
  - Share cards: `lib/seo.ts` has `OPEN_GRAPH_DEFAULTS` (type, siteName, locale `bn_BD`, default image) and `pageMetadata()`, which every page uses: own canonical, `og:url`, `og:title`, `og:description`, twitter title/description/image. The root layout no longer sets canonical `/` or `og:url`, so checkout, search, order-status, admin and 404 no longer inherit canonical `/`. Checkout and order-status are `noindex, nofollow`, search `noindex, follow`, all without canonical. The 404 page has one robots tag (the duplicate root `robots` was removed; the layout keeps only the `googlebot` max-* directives).
  - Product SEO: `generateMetadata` and the Product JSON-LD use `seo_title` / `seo_description` / `seo_keywords` from the API, falling back to the product title and the description trimmed to ~160 characters at a word boundary. A trailing "| Implesia Mart" in a title is stripped before the template adds it, so the title is never doubled.
  - Admin product form: new **SEO** section (before Publishing) with a Google-style preview, SEO title (counter vs 60, max 120), meta description (counter vs 160, max 320), keywords (comma separated, max 500) and, when editing, the URL slug (lowercase letters, numbers, single hyphens). A taken slug shows the API's 409 on the slug field. Old product slugs keep working: `/products/<old-slug>` 308-redirects to `/products/<id>`.
  - Files: `next.config.ts`, `lib/seo.ts`, `app/layout.tsx`, `app/(client)/page.tsx`, `app/(client)/about-us/page.tsx`, `app/(client)/contact-us/page.tsx`, `app/(client)/faqs/page.tsx`, `app/(client)/privacy-policy/page.tsx`, `app/(client)/shipping-returns/page.tsx`, `app/(client)/sustainability/page.tsx`, `app/(client)/blogs/(list)/page.tsx`, `app/(client)/blogs/[slug]/page.tsx`, `app/(client)/products/(catalog)/page.tsx`, `app/(client)/products/[ref]/page.tsx`, `app/(client)/checkout/page.tsx`, `app/(client)/order-status/page.tsx`, `app/(client)/search/page.tsx`, `app/(client)/_data/products/product-details.ts`, `lib/mart-api/catalog.ts`, `lib/mart-api/product-page.ts`, `lib/mart-api/products.ts`, `lib/mart-mock/store.ts`, `app/admin/products/_components/product-form.tsx`, `app/admin/products/_components/product-seo-fields.tsx`, `tests/seo.test.ts`.
  - Backend: needs migration `0088` (`seo_title`, `seo_description`, `seo_keywords`, table `product_slug_redirects`), the fields on create/update/admin read/public detail, `slug` on `PATCH` with a 409 `{errors:[{field:"slug"}]}` for a taken slug, and old-slug lookup in `GET /products/by-slug/{slug}` (backend repo, same day).
- **Admin-configurable max quantity per order (replaces the hardcoded 5).**
  - Admin › Discounts (`/admin/pricing`): new field "সর্বোচ্চ quantity প্রতি অর্ডার" (default 10, 1–1000, Save is disabled while invalid); the worked example greys out quantities above the limit.
  - Admin product form: under Order limits, "Use store-wide limit" (sends `max_order_quantity: null`) or "Custom maximum for this product" (enables the Maximum field, 1–1000).
  - Product page, mobile buy bar, cart drawer and checkout: the quantity goes up to the API's maximum (min(limit, stock); per option via `variants[].max_quantity`). At the maximum + is disabled and "সর্বোচ্চ Nটি নেওয়া যাবে" is shown (product page, cart drawer, checkout).
  - Tier offers list only quantities that can be bought, so "৮টি কিনলে ৩০% ছাড়" appears with the default limit of 10.
  - Removed the hardcoded 5 (`ORDER_QTY_CAP`, `MAX_CART_QTY`); `QUANTITY_CEILING = 1000` and `DEFAULT_MAX_QUANTITY = 10` live in `lib/mart-api/variants.ts`. Product pages are `no-store`, so admin changes show on the next load.
  - Files: `lib/mart-api/variants.ts`, `lib/mart-api/pricing.ts`, `lib/mart-api/pricing-settings.ts`, `lib/mart-api/cart.ts`, `lib/mart-api/product-page.ts`, `app/(client)/_lib/cart-shared.ts`, `app/(client)/products/_components/buy-quantity-store.ts`, `app/(client)/products/_components/use-purchase-quantity.ts`, `app/(client)/products/_components/product-info.tsx`, `app/(client)/products/_components/product-mobile-buy-bar.tsx`, `app/(client)/products/_components/product-whatsapp-button.tsx`, `app/(client)/_components/cart/cart-drawer.tsx`, `app/(client)/checkout/_components/checkout-order-summary.tsx`, `app/admin/pricing/page.tsx`, `app/admin/products/_components/product-form.tsx`, `tests/variants.test.ts`, `tests/product-page.test.ts`, `tests/pricing.test.ts`.
  - Backend: needs migration `0087`, `max_quantity_per_order` on `/api/v1/admin/pricing` and `variants[].max_quantity` (backend repo, same day).
- **Dynamic discounts (regular price + base % + quantity tiers).**
  - Admin product form: Pricing now takes **Regular price** and **Base discount %** and shows the selling price live; "Quantity discounts" chooses store-wide tiers or custom tiers (add/remove rows). Regular price/base are sent (`regular_price`, `base_discount_percent`) only when changed, so saving other fields never re-rounds an older price.
  - New **Admin › Discounts** page (`/admin/pricing`): store-wide tiers on/off, max %, tier editor and a worked example.
  - Product page: changing the quantity shows the unit price, the total % and the line total at once, regular price struck through; compact tiers such as "৫টি কিনলে ২৯% ছাড়" (only quantities that can be bought).
  - Cart drawer and checkout summary: unit price, struck regular price and "x% ছাড়"; a quantity change reprices instantly from the line's `pricing` block, then the API's numbers replace it.
  - Admin order page: each line shows the stored snapshot (regular, base + quantity = total %).
  - Display maths in `lib/mart-api/pricing.ts` mirrors the backend; the API always prices the cart and order. Product pages stay `no-store`.
  - Files: `lib/mart-api/pricing.ts`, `lib/mart-api/pricing-settings.ts`, `lib/mart-api/variants.ts`, `lib/mart-api/products.ts`, `lib/mart-api/product-page.ts`, `lib/mart-api/catalog.ts`, `lib/mart-api/cart.ts`, `lib/mart-api/orders.ts`, `lib/mart-mock/store.ts`, `app/(client)/_data/products/product-details.ts`, `app/(client)/products/_components/product-info.tsx`, `app/(client)/_lib/cart-shared.ts`, `app/(client)/_providers/cart-provider.tsx`, `app/(client)/_components/cart/cart-drawer.tsx`, `app/(client)/checkout/_components/checkout-order-summary.tsx`, `app/admin/products/_components/product-form.tsx`, `app/admin/_components/quantity-tiers-editor.tsx`, `app/admin/pricing/page.tsx`, `app/admin/_config/nav.ts`, `app/admin/orders/[number]/page.tsx`, `tests/pricing.test.ts`.
  - Backend: needs migration `0086`, `/api/v1/admin/pricing` and the new product/cart/quote/order fields (backend repo, same day).
## 2026-11-02 (summary of today's work)

- **Home page Showcase fixes.**
  - The section was a client component that received the whole store catalog as props, so every published product (not only the pinned ones) was sent in the home page payload. It is now a server component; only the shown cards go to the browser.
  - Removed the unused `BrandsSection` and its mock-catalog import from the same file (it ran a lookup at module load that throws if a seed slug goes missing).
  - When every pinned product is removed or hidden, the section now stays off the page instead of filling itself with auto-picked category products. The category fallback is only used when the showcase API could not be read.
  - Checked: API data arrives, only published products, View All and card links return 200, desktop and mobile layout, no console or network errors from the section.
  - Files: `app/(client)/_components/home/brands-categories-section.tsx`, `lib/mart-api/showcase.ts`.
- **Custom thumbnails for gallery videos and YouTube items.**
  - Admin: each video/YouTube tile has "Add thumbnail", "Change thumbnail" and "Remove". The image stays in the browser until Save and goes up as a `thumbnails` part with `thumbnail_targets`.
  - Storefront product page: a video/YouTube item with a custom thumbnail shows it with a ▶ button; pressing it starts the player (YouTube with `autoplay=1`, video with `autoPlay`). Without a custom thumbnail nothing changes (YouTube hqdefault / first video frame).
  - Cache: product pages are `force-dynamic` and fetch with `cache: "no-store"`; media URLs are unique per upload. Admin changes show on the next page load, no revalidation needed.
  - Files: `app/admin/products/_components/product-content-fields.tsx`, `app/(client)/products/_components/product-gallery.tsx`, `lib/mart-api/products.ts`, `lib/mart-api/catalog.ts`, `lib/mart-api/product-page.ts`, `lib/mart-mock/product-content.ts`, `tests/product-page.test.ts`.
  - Backend: needs `thumbnail` on gallery items and the `thumbnails` / `thumbnail_targets` parts (backend repo, same day).
- **Docs**: added `docs/AI_INSTRUCTIONS.md`, `PROJECT_OVERVIEW.md`, `BUSINESS_LOGIC.md`, `API.md`, `CHANGELOG.md`, `TODO.md`; `AGENTS.md` now points to `docs/AI_INSTRUCTIONS.md`; README starts with the same pointer.
- **Fix: admin Gallery "+ Add" → Image / Video did nothing** (`179fea3`).
  - Cause: the file inputs sat inside the menu. Pressing an option moved focus, the menu closed on blur and unmounted the input before the file picker could open.
  - Fix: the inputs are always mounted (hidden) and the menu buttons trigger them.
  - Also fixed: YouTube items were dropped on save because they have no `src` (`cleanProductContent` now keeps them when they have a `youtubeId`).
  - Files: `app/admin/products/_components/product-content-fields.tsx`, `lib/mart-mock/product-content.ts`.
- **Bulk select and delete on `/admin/products`** (`d724296`): row checkboxes, select all on the page, "N টা selected" bar, confirm modal, result message.
  - Files: `app/admin/products/page.tsx`, `app/admin/_components/confirm-delete.tsx`, `lib/mart-api/products.ts`, `lib/mart-api/product-bulk-delete.ts`, `tests/product-bulk-delete.test.ts`.
  - Backend: needs `DELETE /api/v1/admin/products/bulk` (backend commit `8d3800c`).
- Gallery videos and YouTube links in the product form, and drafts (`885c346`, `56e0672`, `2dba129`, `1d0a85c` and related commits below).

# History from git log

## 2026-11-02

- Fix gallery Image/Video add and YouTube items lost on save (`179fea3`)
- Add bulk select and delete to admin products (`d724296`)
- feat(products): add videos and YouTube links to the gallery and play them on the product page (`1d0a85c`)
- style(products): Shopify-style square image tiles for main image and gallery (`2dba129`)
- fix(products): main image hint says it is needed to publish, not for drafts (`56e0672`)
- feat(products): Save as Draft and Publish buttons, Draft/Published status in admin list (`885c346`)

## 2026-11-01

- Confirm every admin delete with one shared modal (`6d75576`)
- Pass 204 responses through the admin proxy without a body (`9089f8c`)
- feat(products): show field-level create errors on the product form (`f417269`)
- feat(badges): polished on/off switch on admin badges page (`b9d1c7a`)
- feat(badges): icon-only switch toggle on admin badges page (`068ab53`)
- feat(badges): admin badges page, product badge picker, storefront badges (`e05259d`)

## 2026-10-27

- fix(i18n): switch blog and product-card UI labels to English (`cf43b79`)
- fix(seo): use the API media URL for blog sitemap images (`2c6e4d1`)
- feat(blog): redesign listing cards and detail hero with consistent 16:10 covers (`26f65d1`)
- Admin blog post form: field-level validation, a11y and error mapping (`667fb97`)
- fix(search): clear the header search box after a search and on page changes (`f6e9f0d`)
- feat(contact): central dynamic site contact across storefront and admin (`102bcad`)
- feat(product-card): replace Option button with accessible white-on-ink Add to Cart (`e6d3f7b`)

## 2026-10-26

- feat(site): manage the storefront header menu from Admin → Site → Header (`d1d6987`)
- fix(nav): stop the category flyout sweeping in from the left; slide from the right edge (`2cda3e7`)
- feat(admin): create and select a category from the product form (`c4abb5a`)
- fix(blogs): return a real 404 for missing/unpublished posts (keep loading skeleton inside the (list) route group) (`5c71aa9`)
- fix(qa): 400 for malformed percent-encoding, admin a11y names/contrast, target sizes, footer error handling (`b670c1e`)
- fix(footer): name an uploaded footer logo by its alt text (`9de9730`)
- fix(storefront): header spacer heights for the compact mobile bar (`efbfccc`)
- feat(storefront): responsive mobile navbar (focus mgmt, categories in drawer) + data-driven footer and admin footer editor (`059591a`)
- fix(home-banner): stronger flat scrim on narrow screens so text keeps >=4.5:1 contrast (`30b272d`)
- feat(home): promo banner under Featured Products and admin editor (`e2de5f4`)
- feat(blogs): image-safe cards, listing search/paging/states, detail SEO, admin cover upload and SEO fields (`dbfbeb8`)
- fix(search): keep the mobile search icon beside the input when the dropdown opens (`bfbb419`)
- feat(search): live header search, /search results page, backend-driven catalog q (`6d711f5`)

## 2026-10-25

- feat(storefront): canonical /products/{id} URLs with 308 redirects from legacy slugs (`efc4360`)
- feat(storefront): WhatsApp order/inquiry action on the product page (`bb8f5ba`)
- feat(admin): variants editor, order limits and variant-aware product payload (`261d2b3`)
- feat(storefront): variant selection, live price and variant-aware cart and checkout (`076fbb2`)
- feat(cart): show the backend stock refusal to the shopper instead of silently reverting (`cf86441`)
- fix(storefront): move focus into the category flyout once it is laid out (`c0ce6c3`)
- fix(dashboard): label categories from the product's own category path instead of a fixed map (`94abc70`)
- fix(storefront): drop unsupported aria-busy and clamp hero nav depth (`4a037d4`)
- feat(admin): cascading category selects on the product form and dynamic category tabs in the product list (`303e3a5`)
- feat(admin): category tree manager with parent select, search, filter, reorder, safe delete and product counts (`0f7f9d4`)
- test(catalog): cover cascade, reorder, search, chips, preview parsing and open category slugs (`2313865`)
- feat(storefront): backend-driven hero category menu with product panel and generic category listing (`09e6f02`)
- feat(catalog): category tree helpers, preview parser and API client (`6a829e6`)

## 2026-10-17

- fix(categories): send parent_id only when set or cleared (`03da4f4`)
- feat(categories): multi-level hero category menu and admin parent management (`f841c08`)
- style(storefront): remove wrapper cards for a cleaner products and home layout (`cda8c94`)
- feat(storefront): use English section labels and larger footer headings (`7686fc7`)
- fix(storefront): read CMS data per request instead of the exhausted KV fetch cache (`2d12a76`)
- fix(hero): fall back to bundled banner image when a CMS slide image fails to load (`49718f3`)
- fix(build): regenerate bun.lock to match package.json overrides (`e40a714`)
- chore(ci): retrigger Workers Builds for 4c518f5 (`a508c4a`)
- feat(faqs): accurate Bengali FAQs with categories, search and grouped accordion (`4c518f5`)
- feat(storefront): send newsletter and contact forms to the inquiries API (`7183629`)
- feat(admin): add inquiries inbox with filters, drawer and nav badge (`84373c4`)

## 2026-10-15

- fix(contact): fall back to bundled copy for blank fields so the redesign never collapses (`53c87ee`)
- feat(contact): redesign contact page in about-us design language (`6bb08fe`)
- feat(contact): add form validation, WhatsApp hand-off and Dhaka open-hours helpers (`e3d1dcc`)
- feat(admin): single optional photo control for sustainability editors (`afec379`)
- feat(sustainability): redesign storefront in about-us design language with text-only variants (`fba45d5`)
- refactor(about): extract shared hero UI primitives (`4b58066`)
- feat(about): redesign about hero with brand backdrop and framed photo (`7f127a5`)
- feat(about): single photo per hero, story and dress section (`e061b21`)
- feat(about): redesign about-us with simplified single-image sections (`e9f14b3`)
- fix(sustainability): mobile UX, contrast and empty/inactive CMS handling (`b1fb52e`)
- fix(about): mobile UX, contrast, heading order and inactive CMS content (`a31265f`)
- fix(a11y): label breadcrumbs, mark current page and give links 44px hit area (`5324dd7`)
- feat(theme): remove dark/light mode toggle and always render light theme (`a50757e`)
- fix(footer): correct bottom logo aspect, tap targets and safe-area padding (`d9f04a5`)
- feat(products): 2/3/4-column grids, aligned card heights and readable Bengali text (`8a378b7`)
- feat(hero): stack image above copy on phones and stop title ghosting during fade (`d3ab800`)
- feat(home): compact snap category rail with aligned view-all link (`09091e2`)
- feat(header): fit full logo, 44px tap targets and scrollable nav rail on mobile (`f6ca628`)
- fix(ui): honor object-contain on vinext fill images and layer icon styles (`cd25acf`)
- feat(hero): show full product image and rebalance responsive layout (`510badc`)
- fix(build): restore vinext scripts used by Cloudflare Workers Builds (`5b2de12`)

## 2026-10-14

- fix(deps): resolve babel peer conflict so CI install succeeds (`41e9804`)
- Banner settings editor: guard in-app links when there are unsaved changes (`4c91e55`)
- Blog category badges: use primary-ink text for 4.5:1 contrast (`ef25297`)
- Put the h1 first on home, products, product and blog pages (`774242c`)
- QA remediation phase 1+2 (frontend.patch) (`558fe62`)

## 2026-10-07

- Keep the shop readable and the release path on Next.js. (`82fcb28`)

## 2026-10-06

- modified (`89c3492`)
- more modified (`9adcf08`)

## 2026-10-05

- hero section modified (`bc7fad5`)
- more issue solve and improvement (`1e9ee14`)
- Drop the unused EmailJS lockfile entries and pin Turbopack to this app. (`a9ad25c`)
- Keep admin tokens in HttpOnly cookies and stop the shop from falling back to seed products. (`94c8ec2`)
- Keep image previews in the browser so production uploads do not need the Worker disk. (`8015873`)
- issue solved (`d8c20fb`)
- issue solved (`b7ab550`)
- login page modified (`38a9c92`)

## 2026-10-04

- Inline the live Mart API URL into the browser bundle. (`6ec8cec`)
- issue fixed (`60e0c99`)
- issue solved (`8a7adac`)
- Wire FAQ, shipping, and privacy pages to the CMS API. (`3b90b45`)
- sustainablity page api create and api integration done (`5f16c7c`)

## 2026-10-03

- sustainablity page api create and api integration done (`d33dc2b`)
- more modified (`835ae30`)
- about page hero section api create and integrataion done (`3dc392f`)
- home page all api created done (`452b81f`)
- more api create and integration with dashboard (`8a8bdce`)
- dashboard overview api integration done (`458d37c`)
- products size and color added (`01c17e7`)
- order confarmed done (`67a92b0`)
- Point the live storefront at mart.implesia.com and the production API. (`8c6660e`)
- delivary charge system included (`27db2f9`)
- products api, order, add to cart api integration done (`d055943`)

## 2026-10-02

- cart api integration done (`409eb5e`)
- products page api integration done (`a367c14`)

## 2026-10-01

- more page desgin modified (`b5b7b60`)
- blogs page all section modified done (`91756cb`)
- quality done (`66d1a9c`)
- more api create done (`4e1d106`)
- more desgin modified (`d7a247b`)
- products details page done (`76e59a2`)
- more page modified (`27a14e3`)

## 2026-09-30

- order page desgin modified (`9c91149`)
- dashboard home page done (`df3d35a`)
- about page CMS desgin done (`730b084`)
- dashboard home page all section done (`09b0cf1`)

## 2026-09-29

- dashboard home page design modified done (`4a93406`)
- faq's page modified done (`305fe47`)
- faq's page modified done (`2c9e94b`)
- contact us page modified (`cff63a1`)
- sastinablity page modified (`88beb63`)
- about us page modified done (`55770dd`)
- about us page modified (`307f1f7`)
- home page done (`92ca56e`)

## 2026-09-28

- home page and products page modified perfectly (`1b425b5`)
- top header section done (`65a1fd4`)

## 2026-07-22

- some issues fixed (`041d3d2`)
- systenable page modified (`b9dab1f`)
- modified vinext (`6b6adf8`)
- updated (`e749bd4`)

## 2026-07-21

- vinext setup done (`4061b15`)
- vinext setup done (`5b50e3c`)
- added SEO for production (`816d1db`)
- image issue fixed (`52bda17`)
- more section modified (`ea0a83f`)
- more section modified (`a0b23bf`)
- more section modified (`a4fc29e`)
- hero section modified and done (`ec3daff`)
- checkout page more professional (`69d3a83`)
- footer more professional (`1b8470e`)
- blog page done (`9aa7d81`)
- done (`fcc8235`)
- privacy and policy done (`dde67d9`)
- shipping and returns page done (`6f8286b`)
- faq page done (`f19567b`)
- products page fully responsive (`1d6bd40`)
- details page done (`35ec113`)
- tab modified (`1f34c79`)
- products page done (`98824da`)
- products page done (`1f2b83c`)
- card image fully view (`3b51f34`)
- more products added (`8238a2f`)

## 2026-07-20

- about us more section added (`4d3bc0c`)
- navbar and footer sectoin done (`2c1bb4e`)
- contact us page done (`fe1f976`)
- contact us page done (`31443c9`)

## 2026-07-19

- more page modified (`2371061`)
- about us page done (`726ea4f`)
- home page done (`d11e87c`)
- faq section modified (`bfdb464`)
- more section modified (`bb63b27`)
- more section modified (`f913ff9`)
- added out of stack (`31a7dc4`)
- hero sectin modified (`37a4dda`)
- redme.md file done (`af82efd`)
- order system done (`dc7fbae`)
- add to cart done (`30b2dd9`)
- order page modified (`def12a9`)
- details page done (`3262bf2`)
- products added (`5af59d3`)
- hero section done (`ab44d4e`)
- hero sectoin products added (`4e04f44`)
- products added (`8e2c82d`)

## 2026-05-10

- updated footer (`e5dcf62`)
- modify faq and newsLetter sections (`4c49757`)
- modify the testimonial section and convert it to a marquee (`0fa3633`)
- modify organic haritage section (`0740b17`)
- updated flash sale section (`fe90522`)
- updated best selling product section (`18495d8`)

## 2026-05-08

- updated heroSection (`1b9aea2`)

## 2026-05-05

- faqs page done (`ee0039f`)
- shipping and returens page done (`3ee8de1`)
- privacy and policy page done (`eba39a0`)
- contact us page done (`435899d`)
- about us page done (`5fa5cfa`)
- deails page done (`5920a22`)
- products page done (`76f3214`)
- theme provider added (`dc1ec0a`)
- primary color change (`192b46a`)
- header modified (`182c298`)
- header modified (`805bacd`)
- project setup (`5c27e82`)
- Initial commit from Create Next App (`f7ff5bd`)
