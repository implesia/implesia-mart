# API usage (frontend)

Which page uses which backend endpoint. The full endpoint list (methods, access, request/response) is in the backend repo's `docs/API.md`.

## How calls are made

- **Base URL**: `NEXT_PUBLIC_MART_API_URL` (`API_BASE_URL` in `lib/mart-api/media-url.ts`).
- **Public (storefront)**: modules in `lib/mart-api/` call `${API_BASE_URL}/api/v1/...` directly with `publicRequestInit` (no cache, no credentials). Guest carts send `X-Cart-Token`.
- **Admin**: modules call `/api/proxy/api/v1/admin/...` (`authorizedFetch` / `apiFetch` in `lib/mart-api/products.ts`). The route `app/api/proxy/[...path]/route.ts` hands the request to `proxyAdmin` (`lib/auth/bff.ts`), which:
  - accepts only same-origin requests (otherwise 403),
  - forwards only paths under `api/v1/admin/`,
  - attaches the staff access token from the HttpOnly cookie and rotates it with the refresh token when it expires.
- **Auth routes** (Next.js, not the API): `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`. They call the API's `/api/v1/auth/*` endpoints and set or clear the cookies.

Notes on the tables below:
- They were generated from the imports and path strings in the code. A route lists the modules used by its own folder.
- `/` also lists modules used by the root layout (header, footer, search, cart) because the layout sits next to the home page.
- `{id}` stands for any interpolated value.

## Key admin product calls

| UI action | Endpoint |
| --- | --- |
| List products (`/admin/products`) | `GET /api/v1/admin/products` |
| Create product (`/admin/products/new`) | `POST /api/v1/admin/products` (multipart) |
| Edit product (`/admin/products/[id]`) | `GET` / `PATCH /api/v1/admin/products/{id}` (multipart) |
| Delete one | `DELETE /api/v1/admin/products/{id}` |
| Delete selected | `DELETE /api/v1/admin/products/bulk` (`bulkDeleteMartProducts`) |
| Badge picker | `GET /api/v1/admin/badges` |
| Discount settings and max quantity per order (`/admin/pricing`) | `GET` / `PUT /api/v1/admin/pricing` (`pricing-settings.ts`, `max_quantity_per_order`) |
| Product pricing fields | `regular_price`, `base_discount_percent`, `tier_mode`, `tiers`, and admin-only `cost_price` (`numeric(12, 2)`: JSON number or `null` on admin list/get/create/update; omit on PATCH to keep, `null` to clear). Not on any public product response |
| Product page (storefront) | `GET /api/v1/products/by-slug/{slug}` or `GET /api/v1/products/{id}` (an old slug also resolves; the page then 308-redirects to `/products/{id}`) |
| Product SEO fields | `seo_title`, `seo_description`, `seo_keywords` in the create/update payload and in `AdminProductRead` / `PublicProductDetail`; `slug` on update (409 `{errors:[{field:"slug"}]}` when taken) |
| Sitemap lastmod | `updated_at` on `GET /api/v1/products` cards and on `GET /api/v1/categories/tree` nodes (`app/sitemap.ts`); delivery rates from `GET /api/v1/delivery` feed the product JSON-LD shipping |
| Out-of-range catalog page | `proxy.ts` → `GET /api/v1/products?…&page=1` (same filters) to read `pages`; 3 s timeout, any error = no redirect |

## Page → lib/mart-api modules

| Route | Modules (see the next table for endpoints) |
| --- | --- |
| `/` | `blog-categories`, `blog-cta`, `blog-listing`, `blog-related`, `cart`, `catalog`, `categories`, `category-preview`, `contact-details`, `faq`, `featured`, `footer`, `header`, `hero`, `inquiry-public`, `home-media`, `newsletter`, `products`, `promo`, `reviews`, `search`, `showcase`, `trust` |
| `/about-us` | `about-cta`, `about-dresses`, `about-hero`, `about-mission`, `about-stats`, `about-steps`, `about-stories`, `about-values` |
| `/admin` | `about-cta`, `about-dresses`, `about-hero`, `about-mission`, `about-stats`, `about-steps`, `about-stories`, `about-values`, `blog-categories`, `blog-cta`, `blog-hero`, `blog-listing`, `blog-posts`, `blog-related`, `contact-details`, `contact-faq`, `contact-form`, `contact-hero`, `contact-support`, `dashboard`, `reports`, `faq-callout`, `faq-categories`, `faq-help`, `faq-hero`, `faq-items`, `faq-listing`, `inquiries`, `privacy-collection`, `privacy-contents`, `privacy-hero`, `privacy-introduction`, `privacy-rights`, `privacy-sharing`, `privacy-support`, `privacy-usage`, `products`, `shipping-block`, `shipping-contents`, `shipping-faq`, `shipping-hero`, `shipping-payment`, `shipping-refund`, `shipping-returns`, `shipping-support`, `sustainability-commitment`, `sustainability-cta`, `sustainability-durability`, `sustainability-hero`, `sustainability-impact`, `sustainability-origin`, `sustainability-quality` |
| `/admin/badges` | `badges` |
| `/admin/cart` | `cart`, `products` |
| `/admin/delivery` | `delivery` |
| `/admin/home` | `categories`, `faq`, `featured`, `hero`, `home-media`, `newsletter`, `promo`, `reviews`, `showcase`, `trust` |
| `/admin/home/hero` | `hero` |
| `/admin/home/hero/[id]` | `hero` |
| `/admin/inquiries` | `inquiries` |
| `/admin/inventory/suppliers` | `inventory` |
| `/admin/inventory/purchases` | `inventory` |
| `/admin/inventory/purchases/new` | `inventory`, `products` |
| `/admin/inventory/stock` | `inventory`, `products` |
| `/admin/login` | `products` |
| `/admin/coupons` | `coupons` |
| `/admin/coupons/new` | `coupons` |
| `/admin/coupons/[id]` | `coupons` |
| `/admin/orders` | `orders` |
| `/admin/orders/[number]` | `orders` |
| `/admin/products` | `badges`, `categories`, `products` |
| `/admin/reports` | `reports`, `coupons`, `products`, `categories` |
| `/admin/products/[id]` | `products`, `inventory` |
| `/admin/site/contact` | `site-contact` |
| `/admin/site/footer` | `contact-details`, `footer` |
| `/admin/site/header` | `header` |
| `/admin/site/payment` | `payment-settings` |
| `/blogs` | `blog-categories`, `blog-hero`, `blog-listing`, `blog-posts` |
| `/blogs/[slug]` | `blog-categories`, `blog-cta`, `blog-listing`, `blog-posts`, `blog-related` |
| `/checkout` | `cart`, `delivery`, `orders`, `payment-settings` |
| `/contact-us` | `contact-details`, `contact-faq`, `contact-form`, `contact-hero`, `contact-support`, `inquiry-public` |
| `/faqs` | `delivery`, `faq-callout`, `faq-categories`, `faq-help`, `faq-hero`, `faq-items`, `faq-listing` |
| `/order-status` | `orders` |
| `/privacy-policy` | `privacy-collection`, `privacy-contents`, `privacy-hero`, `privacy-introduction`, `privacy-rights`, `privacy-sharing`, `privacy-support`, `privacy-usage` |
| `/products` | `catalog`, `categories` |
| `/products/[ref]` | `catalog`, `payment-settings`, `site-contact` |
| `/search` | `search` |
| `/shipping-returns` | `catalog`, `shipping-block`, `shipping-contents`, `shipping-faq`, `shipping-hero`, `shipping-payment`, `shipping-refund`, `shipping-returns`, `shipping-support` |
| `/sustainability` | `sustainability-commitment`, `sustainability-cta`, `sustainability-durability`, `sustainability-hero`, `sustainability-impact`, `sustainability-origin`, `sustainability-quality` |

## lib/mart-api module → backend endpoints

Paths are as written in the module; `{id}` stands for any interpolated value.

| Module | Endpoints |
| --- | --- |
| `about-cta.ts` | `/api/v1/admin/pages/about/cta`<br>`/api/v1/pages/about/cta` |
| `about-dresses.ts` | `/api/v1/admin/pages/about/dresses`<br>`/api/v1/admin/pages/about/dresses/order`<br>`/api/v1/admin/pages/about/dresses/{id}`<br>`/api/v1/pages/about/dresses` |
| `about-hero.ts` | `/api/v1/admin/pages/about/hero`<br>`/api/v1/pages/about/hero` |
| `about-mission.ts` | `/api/v1/admin/pages/about/mission`<br>`/api/v1/admin/pages/about/mission/{id}`<br>`/api/v1/pages/about/mission` |
| `about-stats.ts` | `/api/v1/admin/pages/about/stats`<br>`/api/v1/admin/pages/about/stats/order`<br>`/api/v1/admin/pages/about/stats/{id}`<br>`/api/v1/pages/about/stats` |
| `about-steps.ts` | `/api/v1/admin/pages/about/steps`<br>`/api/v1/admin/pages/about/steps/items`<br>`/api/v1/admin/pages/about/steps/items/order`<br>`/api/v1/admin/pages/about/steps/items/{id}`<br>`/api/v1/pages/about/steps` |
| `about-stories.ts` | `/api/v1/admin/pages/about/stories`<br>`/api/v1/admin/pages/about/stories/order`<br>`/api/v1/admin/pages/about/stories/{id}`<br>`/api/v1/pages/about/stories` |
| `about-values.ts` | `/api/v1/admin/pages/about/values`<br>`/api/v1/admin/pages/about/values/items`<br>`/api/v1/admin/pages/about/values/items/order`<br>`/api/v1/admin/pages/about/values/items/{id}`<br>`/api/v1/pages/about/values` |
| `badges.ts` | `/api/v1/admin/badges` |
| `blog-categories.ts` | `/api/v1/admin/pages/blogs/categories`<br>`/api/v1/pages/blogs/categories` |
| `blog-cta.ts` | `/api/v1/admin/pages/blogs/cta`<br>`/api/v1/pages/blogs/cta` |
| `blog-hero.ts` | `/api/v1/admin/pages/blogs/hero`<br>`/api/v1/pages/blogs/hero` |
| `blog-listing.ts` | `/api/v1/admin/pages/blogs/listing`<br>`/api/v1/pages/blogs/listing` |
| `blog-posts.ts` | `/api/v1/admin/pages/blogs/posts`<br>`/api/v1/admin/pages/blogs/posts/cover`<br>`/api/v1/admin/pages/blogs/posts/order`<br>`/api/v1/admin/pages/blogs/posts/{id}`<br>`/api/v1/pages/blogs/posts`<br>`/api/v1/pages/blogs/posts/{id}` |
| `blog-related.ts` | `/api/v1/admin/pages/blogs/related`<br>`/api/v1/pages/blogs/related` |
| `cart.ts` | `/api/v1/admin/carts`<br>`/api/v1/cart{id}`<br>`/api/v1/products/by-slug/{id}` |
| `catalog.ts` | `/api/v1/delivery`<br>`/api/v1/products`<br>`/api/v1/products/by-slug/{id}`<br>`/api/v1/products/{id}` |
| `categories.ts` | `/api/v1/admin/categories`<br>`/api/v1/admin/categories/order`<br>`/api/v1/admin/categories/{id}`<br>`/api/v1/admin/home/categories`<br>`/api/v1/categories/tree`<br>`/api/v1/home/categories` |
| `category-preview.ts` | `/api/v1/categories/{id}/products` |
| `contact-details.ts` | `/api/v1/admin/pages/contact/details`<br>`/api/v1/pages/contact/details` |
| `contact-faq.ts` | `/api/v1/admin/pages/contact/faq`<br>`/api/v1/pages/contact/faq` |
| `contact-form.ts` | `/api/v1/admin/pages/contact/form`<br>`/api/v1/pages/contact/form` |
| `contact-hero.ts` | `/api/v1/admin/pages/contact/hero`<br>`/api/v1/pages/contact/hero` |
| `contact-support.ts` | `/api/v1/admin/pages/contact/support`<br>`/api/v1/pages/contact/support` |
| `coupons.ts` | `/api/v1/admin/coupons`<br>`/api/v1/admin/coupons/{id}`<br>`/api/v1/admin/coupons/{id}/activate`<br>`/api/v1/admin/coupons/{id}/deactivate`<br>`/api/v1/admin/coupons/{id}/redemptions`<br>`/api/v1/admin/reports/coupons`<br>`/api/v1/admin/reports/coupons/export` |
| `dashboard.ts` | `/api/v1/admin/dashboard` |
| `delivery.ts` | `/api/v1/admin/delivery`<br>`/api/v1/delivery` |
| `faq.ts` | `/api/v1/admin/home/faq`<br>`/api/v1/admin/home/faq/items`<br>`/api/v1/admin/home/faq/items/order`<br>`/api/v1/admin/home/faq/items/{id}`<br>`/api/v1/home/faq` |
| `faq-callout.ts` | `/api/v1/admin/pages/faqs/callout`<br>`/api/v1/pages/faqs/callout` |
| `faq-categories.ts` | `/api/v1/admin/pages/faqs/categories`<br>`/api/v1/pages/faqs/categories` |
| `faq-help.ts` | `/api/v1/admin/pages/faqs/help`<br>`/api/v1/pages/faqs/help` |
| `faq-hero.ts` | `/api/v1/admin/pages/faqs/hero`<br>`/api/v1/pages/faqs/hero` |
| `faq-items.ts` | `/api/v1/admin/pages/faqs/items`<br>`/api/v1/admin/pages/faqs/items/order`<br>`/api/v1/admin/pages/faqs/items/{id}`<br>`/api/v1/pages/faqs/items` |
| `faq-listing.ts` | `/api/v1/admin/pages/faqs/listing`<br>`/api/v1/pages/faqs/listing` |
| `featured.ts` | `/api/v1/admin/home/featured`<br>`/api/v1/admin/home/featured/items`<br>`/api/v1/admin/home/featured/items/order`<br>`/api/v1/admin/home/featured/items/{id}`<br>`/api/v1/home/featured` |
| `footer.ts` | `/api/v1/admin/site/footer`<br>`/api/v1/site/footer` |
| `header.ts` | `/api/v1/admin/site/header`<br>`/api/v1/site/header` |
| `hero.ts` | `/api/v1/admin/home/banner`<br>`/api/v1/admin/home/banner/slides`<br>`/api/v1/admin/home/banner/slides/{id}`<br>`/api/v1/admin/home/banner/slides/{id}/move`<br>`/api/v1/home/banner` |
| `inquiries.ts` | `/api/v1/admin/inquiries`<br>`/api/v1/admin/inquiries/counts`<br>`/api/v1/admin/inquiries/{id}` |
| `inventory.ts` | `/api/v1/admin/inventory/suppliers`<br>`/api/v1/admin/inventory/suppliers/{id}`<br>`/api/v1/admin/inventory/purchases`<br>`/api/v1/admin/inventory/purchases/{id}`<br>`/api/v1/admin/inventory/movements`<br>`/api/v1/admin/inventory/adjustments`<br>`/api/v1/admin/inventory/opening-stock`<br>`/api/v1/admin/inventory/imports/templates/{kind}`<br>`/api/v1/admin/inventory/imports/preview`<br>`/api/v1/admin/inventory/imports/confirm`<br>`/api/v1/admin/inventory/exports/{kind}` |
| `inquiry-public.ts` | `/api/v1/inquiries` |
| `home-media.ts` | `/api/v1/admin/home/media`<br>`/api/v1/admin/home/media/image`<br>`/api/v1/admin/home/media/video`<br>`/api/v1/home/media` |
| `newsletter.ts` | `/api/v1/admin/home/newsletter`<br>`/api/v1/admin/home/newsletter/perks`<br>`/api/v1/admin/home/newsletter/perks/order`<br>`/api/v1/admin/home/newsletter/perks/{id}`<br>`/api/v1/home/newsletter` |
| `orders.ts` | `/api/v1/admin/orders`<br>`/api/v1/admin/orders/{id}`<br>`/api/v1/orders`<br>`/api/v1/orders/lookup`<br>`/api/v1/orders/quote` |
| `order-alerts.ts` | `/api/v1/admin/orders/new` |
| `payment-settings.ts` | `/api/v1/admin/site/payment`<br>`/api/v1/admin/site/payment/qr`<br>`/api/v1/site/payment` |
| `pricing-settings.ts` | `/api/v1/admin/pricing` |
| `privacy-collection.ts` | `/api/v1/admin/pages/privacy/collection`<br>`/api/v1/pages/privacy/collection` |
| `privacy-contents.ts` | `/api/v1/admin/pages/privacy/contents`<br>`/api/v1/pages/privacy/contents` |
| `privacy-hero.ts` | `/api/v1/admin/pages/privacy/hero`<br>`/api/v1/pages/privacy/hero` |
| `privacy-introduction.ts` | `/api/v1/admin/pages/privacy/introduction`<br>`/api/v1/pages/privacy/introduction` |
| `privacy-rights.ts` | `/api/v1/admin/pages/privacy/rights`<br>`/api/v1/pages/privacy/rights` |
| `privacy-sharing.ts` | `/api/v1/admin/pages/privacy/sharing`<br>`/api/v1/pages/privacy/sharing` |
| `privacy-support.ts` | `/api/v1/admin/pages/privacy/support`<br>`/api/v1/pages/privacy/support` |
| `privacy-usage.ts` | `/api/v1/admin/pages/privacy/usage`<br>`/api/v1/pages/privacy/usage` |
| `products.ts` | `/api/v1/admin/products`<br>`/api/v1/admin/products/bulk`<br>`/api/v1/admin/products/{id}` |
| `promo.ts` | `/api/v1/admin/home/promo`<br>`/api/v1/home/promo` |
| `reports.ts` | `/api/v1/admin/reports/sales`<br>`/api/v1/admin/reports/profit`<br>`/api/v1/admin/reports/products`<br>`/api/v1/admin/reports/stock`<br>`/api/v1/admin/reports/movements`<br>`/api/v1/admin/reports/delivery`<br>`/api/v1/admin/reports/trend`<br>and the matching `/export` path on each |
| `reviews.ts` | `/api/v1/admin/home/reviews`<br>`/api/v1/admin/home/reviews/items`<br>`/api/v1/admin/home/reviews/items/order`<br>`/api/v1/admin/home/reviews/items/{id}`<br>`/api/v1/home/reviews` |
| `search.ts` | `/api/v1/search` |
| `shipping-block.ts` | `/api/v1/admin/pages/shipping/shipping`<br>`/api/v1/pages/shipping/shipping` |
| `shipping-contents.ts` | `/api/v1/admin/pages/shipping/contents`<br>`/api/v1/pages/shipping/contents` |
| `shipping-faq.ts` | `/api/v1/admin/pages/shipping/faq`<br>`/api/v1/pages/shipping/faq` |
| `shipping-hero.ts` | `/api/v1/admin/pages/shipping/hero`<br>`/api/v1/pages/shipping/hero` |
| `shipping-payment.ts` | `/api/v1/admin/pages/shipping/payment`<br>`/api/v1/pages/shipping/payment` |
| `shipping-refund.ts` | `/api/v1/admin/pages/shipping/refund`<br>`/api/v1/pages/shipping/refund` |
| `shipping-returns.ts` | `/api/v1/admin/pages/shipping/returns`<br>`/api/v1/pages/shipping/returns` |
| `shipping-support.ts` | `/api/v1/admin/pages/shipping/support`<br>`/api/v1/pages/shipping/support` |
| `showcase.ts` | `/api/v1/admin/home/showcase`<br>`/api/v1/admin/home/showcase/rows/{id}`<br>`/api/v1/admin/home/showcase/rows/{id}/items`<br>`/api/v1/admin/home/showcase/rows/{id}/items/order`<br>`/api/v1/admin/home/showcase/rows/{id}/items/{id}`<br>`/api/v1/home/showcase` |
| `site-contact.ts` | `/api/v1/admin/site/contact`<br>`/api/v1/site/contact` |
| `sustainability-commitment.ts` | `/api/v1/admin/pages/sustainability/commitment`<br>`/api/v1/admin/pages/sustainability/commitment/items`<br>`/api/v1/admin/pages/sustainability/commitment/items/order`<br>`/api/v1/admin/pages/sustainability/commitment/items/{id}`<br>`/api/v1/pages/sustainability/commitment` |
| `sustainability-cta.ts` | `/api/v1/admin/pages/sustainability/cta`<br>`/api/v1/pages/sustainability/cta` |
| `sustainability-durability.ts` | `/api/v1/admin/pages/sustainability/durability`<br>`/api/v1/pages/sustainability/durability` |
| `sustainability-hero.ts` | `/api/v1/admin/pages/sustainability/hero`<br>`/api/v1/pages/sustainability/hero` |
| `sustainability-impact.ts` | `/api/v1/admin/pages/sustainability/impact`<br>`/api/v1/admin/pages/sustainability/impact/items`<br>`/api/v1/admin/pages/sustainability/impact/items/order`<br>`/api/v1/admin/pages/sustainability/impact/items/{id}`<br>`/api/v1/pages/sustainability/impact` |
| `sustainability-origin.ts` | `/api/v1/admin/pages/sustainability/origin`<br>`/api/v1/pages/sustainability/origin` |
| `sustainability-quality.ts` | `/api/v1/admin/pages/sustainability/quality`<br>`/api/v1/pages/sustainability/quality` |
| `trust.ts` | `/api/v1/admin/home/trust`<br>`/api/v1/admin/home/trust/order`<br>`/api/v1/admin/home/trust/{id}`<br>`/api/v1/home/trust` |

## Admin inventory

Taken from implesia-mart-backend PR #9, branch `cursor/inventory-ledger-2808` (`app/schemas/inventory.py`, `app/api/v1/endpoints/admin_inventory.py`, `docs/API.md` on that branch). Excel column names are from `app/services/inventory_excel.py` on the same branch. The 409 body is from `ConflictError` plus `confirm_import` (`code: "conflict"`, `details.file_hash`).

Until `GET /api/v1/admin/inventory/suppliers` answers, the admin UI uses `lib/mart-mock/inventory.ts`. The probe is that suppliers list (404, 501, or 5xx falls back).

Reads, including import preview and template download: any signed-in staff. Writes: editor or superadmin. Lists are `{ items, total, page, page_size, pages }`.

| UI | Method | Path |
| --- | --- | --- |
| Suppliers list / one / create / edit | GET, POST, PATCH | `/api/v1/admin/inventory/suppliers`, `/api/v1/admin/inventory/suppliers/{id}` |
| Purchases list / one / create | GET, POST | `/api/v1/admin/inventory/purchases`, `/api/v1/admin/inventory/purchases/{id}` |
| Stock history | GET | `/api/v1/admin/inventory/movements` |
| Adjust stock | POST | `/api/v1/admin/inventory/adjustments` |
| Record opening stock | POST | `/api/v1/admin/inventory/opening-stock` |
| Excel template | GET | `/api/v1/admin/inventory/imports/templates/{kind}` |
| Import preview | POST multipart | `/api/v1/admin/inventory/imports/preview` |
| Import confirm | POST multipart | `/api/v1/admin/inventory/imports/confirm` |
| Excel export | GET | `/api/v1/admin/inventory/exports/{kind}` |
| On-hand and cost after a write | GET | `/api/v1/admin/products/{id}` (`quantity`, `cost_price`) |

- `SupplierCreate`: `name` (required), `phone`, `address`, `note`. `SupplierRead` adds `id`, `created_at`, `updated_at`. No delete. Query `q` matches the name.
- `PurchaseCreate`: `supplier_id`, `purchased_on`, `invoice_no`, `note`, `items[]` of `product_id`, optional `variant_id`, `quantity`, `unit_cost`. `PurchaseRead` adds `supplier_name`, `id`, `created_at`, and item `id`. It does not include a total, product name, or sku. Queries: `supplier_id`, `date_from`, `date_to`.
- `MovementRead`: `id`, `product_id`, `variant_id`, `product_title`, `sku`, signed `quantity`, `movement_type`, `unit_cost`, `order_id`, `purchase_id`, `import_batch_id`, `actor_id`, `note`, `created_at`. Query `movement_type`, not `type`.
- `AdjustmentCreate`: `product_id`, optional `variant_id`, signed `quantity`, `reason`. Response is `MovementRead`.
- `OpeningStockResult`: `created`, `already_recorded`, `untracked`. No body. Does not change stock.
- Import `kind` / form `import_type`: `purchases`, `opening`, `stock_count`, `cost_price`. Export `kind`: `products`, `purchases`, `movements`, with optional `date_from` and `date_to`.
- Preview and confirm send multipart `file` and `import_type`. Confirm also sends `confirm_duplicate` (`true` / `false`). Preview response: `import_type`, `file_hash`, `duplicate`, `valid_count`, `invalid_count`, `rows[]` of `row`, `valid`, `action`, `errors`, `summary`. Confirm response: `import_type`, `file_hash`, `batch_id`, `saved`, `skipped`, `rows`.
- A repeated file is **409** `{ error: { code: "conflict", message: "This file was already imported. Confirm to import it again.", details: { file_hash } } }` until `confirm_duplicate` is true. Every row invalid is 422 and saves nothing.
- Session `GET /api/auth/session` and login JSON include `role` from `UserRead` (`GET /api/v1/auth/me`).

## Admin reports

Taken from implesia-mart-backend PR #10, branch `cursor/admin-sales-reports-b0a9` (`app/schemas/report.py`, `app/api/v1/endpoints/admin_reports.py`, `docs/API.md` on that branch). All of these are GET. Any signed-in staff, including a viewer. There is no write route.

Until `GET /api/v1/admin/reports/sales` answers (404, 501, 5xx, or the API cannot be reached), `/admin` and `/admin/reports` use `lib/mart-mock/reports.ts`. A 401, 403, or 422 is shown as an error and does not fall back.

| UI | Path |
| --- | --- |
| Sales summary | `GET /api/v1/admin/reports/sales` |
| Profit | `GET /api/v1/admin/reports/profit` |
| Products | `GET /api/v1/admin/reports/products` |
| Stock | `GET /api/v1/admin/reports/stock` |
| Stock movement | `GET /api/v1/admin/reports/movements` |
| Delivery and return | `GET /api/v1/admin/reports/delivery` |
| Trend | `GET /api/v1/admin/reports/trend` |
| Excel for the same filters | `GET /api/v1/admin/reports/{kind}/export` |

Query: `preset` (`this_week`, `this_month`, `last_month`) or `from` and `to` (`YYYY-MM-DD`, inclusive Asia/Dhaka days). Optional `product_id`, `category_id`, `channel`. `grain` (`day`, `week`, `month`) on the trend only. `page` and `page_size` (max 100) on products and stock. A range over 366 days, a preset together with dates, or `from` after `to` is 422.

`ReportFilters` uses JSON names `from` and `to` (not `date_from`). `MovementReport` uses `return` for the returned quantity. `DeliveryReport` uses `return_rate_percent`, which is null when nothing was delivered. `ProfitReport.profit` and `margin_percent` are null when every line has no cost. `StockReport.period_applies` is false. `channel_applies` is false on stock and movements.

The dashboard headline calls the same report paths. `GET /api/v1/admin/dashboard` stays editor-only and still fills order activity, best sellers, recent orders, and areas. Its delivered count uses `delivered_at`.

## Admin new orders

Taken from implesia-mart-backend PR #14 (stacked on backend PR #13). Staff only, through `/api/proxy`. The admin shell on every page except `/admin/login` calls it. The order link is `/admin/orders/<id>` (`id` is the UUID, the same value the orders list already uses).

Until the route answers (404, 501, or the API cannot be reached on the first try), the shell uses `lib/mart-mock/order-alerts.ts`. A 401 or 422 does not use the mock. The request is `cache: "no-store"`. The route's response is `Cache-Control: no-store`.

| UI | Method | Path |
| --- | --- | --- |
| Poll for new orders | GET | `/api/v1/admin/orders/new` |

Query: optional `since` (ISO datetime). `limit` is 1..50, default 20. The client clamps `limit` before sending. A value outside 1..50 is **422**. Anonymous or non-staff is **401**, and polling stops.

```json
{ "now": "2026-11-10T08:00:00.000Z", "items": [
  { "id": "11111111-1111-4111-8111-111111111111", "number": "IM-24018", "customer_name": "Nusrat Jahan", "total": 2450, "payment_method": "cod", "created_at": "2026-11-10T07:59:00.000Z" }
]}
```

`payment_method` is `cod` or `bangla_qr`. `items` are newest first and only include rows with `created_at` later than `since`. The next request sends `since` = `now`.

## Admin order timestamps

- Admin `OrderRead` — `GET` and `PATCH /api/v1/admin/orders/{id}`, each item of `GET /api/v1/admin/orders`, and `POST /api/v1/orders` — includes `delivered_at` and `returned_at`: ISO 8601 UTC (`2026-11-09T08:30:00+00:00`) or `null`. A new order has both `null`. Each is set once, on the first transition to that status. The admin order detail page shows both in Asia/Dhaka. `PublicOrderRead` (`POST /api/v1/orders/lookup`) does not include them, and `PublicOrder` does not read them.

## Order create tracking (storefront)

`POST /api/v1/orders` (`placeOrder` in `lib/mart-api/orders.ts`) now sends an optional object alongside the existing order fields:

```json
"tracking": { "fbp": null, "fbc": null, "event_source_url": "https://mart.implesia.com/checkout" }
```

- `fbp` is the `_fbp` cookie, or `null`.
- `fbc` is the `_fbc` cookie. If that cookie is missing and the visit had `fbclid`, the browser sends `fb.1.<unix milliseconds>.<fbclid>`. Otherwise `null`.
- `event_source_url` is the checkout page URL without the hash, or `null`.

The field is always present from this storefront (values may be `null`). An older API that ignores unknown JSON properties still accepts the order. The response may include `analytics_event_id` (string). The storefront uses it as the Purchase `event_id` when it is non-empty, and otherwise uses `purchase_<order number>`.

Backend still to build (separate change, not in this repo): accept `tracking`, and return `analytics_event_id` = `purchase_<order_number>` on create, using that same id for the server Purchase (CAPI) event.

## Coupons

Proposed contract (the backend is not in this repo yet). The browser sends `coupon_code` only. Discount, free delivery, and totals come back on the quote or the order. Writes need an editor or above. A viewer can read.

| What | Method | Path |
| --- | --- | --- |
| Quote with an optional code | POST | `/api/v1/orders/quote` |
| Create an order with an optional code | POST | `/api/v1/orders` |
| List (`q`, `status` = `active` \| `inactive` \| `expired` \| `scheduled`, `page`, `page_size`) | GET | `/api/v1/admin/coupons` |
| Create | POST | `/api/v1/admin/coupons` |
| Read one | GET | `/api/v1/admin/coupons/{id}` |
| Update | PATCH | `/api/v1/admin/coupons/{id}` |
| Activate / deactivate | POST | `/api/v1/admin/coupons/{id}/activate` and `.../deactivate` |
| Redemptions (order id, order number, phone, `discount_amount`, `created_at`, status) | GET | `/api/v1/admin/coupons/{id}/redemptions` |
| Report (`from`, `to`; each row: uses, total discount, total sales) | GET | `/api/v1/admin/reports/coupons` |
| Excel for that window | GET | `/api/v1/admin/reports/coupons/export` |

Quote request adds optional `coupon_code` and optional `phone` (sent when checkout has a valid mobile and a coupon is applied). Response adds `coupon`: `null`, or `{ code, valid, discount, free_delivery, error_code, message }`. An invalid code stays HTTP 200. `message` is Bangla. `subtotal` is merchandise after the quantity discount. A valid coupon sets `total = subtotal − discount + shipping`. Free delivery sets `shipping` to 0. `bangla_qr_options` use that total. `min_order_amount` is compared with that merchandise, before the coupon and before shipping.

Order reads add `coupon_code` and `coupon_discount` (`null` when unused; `0` is a free-delivery-only coupon). An invalid code on create is HTTP 422 in the existing envelope, with `error.code` one of `coupon_not_found`, `coupon_inactive`, `coupon_not_started`, `coupon_expired`, `coupon_min_amount`, `coupon_usage_limit`, `coupon_phone_limit`, `coupon_first_order_only`, `coupon_not_eligible`, and `error.message` in Bangla. Sending `coupon_discount`, `total`, `shipping`, or `unit_price` is also 422, so the client never sends them.

Coupon JSON: `id`, `code`, `discount_type` (`percent` | `fixed`), `value`, `max_discount`, `min_order_amount`, `starts_at`, `ends_at`, `usage_limit_total`, `usage_limit_per_phone`, `first_order_only`, `product_ids`, `category_ids`, `free_delivery`, `is_active`, `status`, `used_count`, `created_by` (admin UUID or null), `created_at`, `updated_at`. A code is 3–32 characters of A–Z, digits, hyphen, and underscore. A listed category includes its subcategories. The admin form shows and edits `starts_at` / `ends_at` in Asia/Dhaka; the wire format is an ISO instant. There is no delete route.

Redemptions are paged (`page`, `page_size`) and return `id`, `coupon_id`, `order_id`, `order_number`, `phone`, `discount_amount`, `status` (`active` | `cancelled`), `cancelled_at`, `created_at`.

The coupon report uses the same date query as the other reports (`preset` or `from` and `to`). Product, category, and channel filters do not apply (`channel_applies: false`). Each row is `coupon_id`, `code`, `times_used`, `total_discount`, `total_sales`. The sales summary adds `coupon_discount`, already included in `discount`.

Production builds never use a stand-in: a failed quote, order, or admin coupon call is shown as an error. Only when `mockFallbackAllowed()` (`lib/mock-mode.ts`: `next dev`, or `NEXT_PUBLIC_ENABLE_MOCK=true` at build time) is true, and `GET /api/v1/admin/coupons` or the quote does not answer (404, 501, 5xx, or the API cannot be reached), checkout pricing and these admin screens use `lib/mart-mock/coupons.ts`. A 401 or 422 is shown and does not fall back. `NEXT_PUBLIC_COUPONS_MOCK=1` forces the mock while stand-ins are allowed.

If a live quote succeeds but omits `coupon` (or returns `null`) while `coupon_code` was sent, the UI does not invent a discount. It shows “কুপন এখন যাচাই করা যাচ্ছে না…” and keeps the server totals.

## Bangla QR payment fields

- `GET /api/v1/site/payment` (public, `no-store`): `{ bangla_qr_src, bangla_qr_enabled }`.
- Admin: `GET /api/v1/admin/site/payment`, `POST /api/v1/admin/site/payment/qr` (multipart field `image`), `DELETE /api/v1/admin/site/payment/qr`; all through `/api/proxy`.
- `POST /api/v1/orders/quote` → `bangla_qr_options: [{ percent, advance, due }]` (empty when no QR or total 0).
- `POST /api/v1/orders` accepts `payment_method` (`cod` | `bangla_qr`), `advance_percent` (25/50/75/100, Bangla QR only) and `payment_reference` (Bangla QR only). Order reads return `payment_method`, `advance_percent`, `advance_amount`, `due_amount`; admin reads and the create response also return `payment_reference`.
