# Business logic (frontend)

How the UI applies the API's rules. The API is the source of truth (see the backend repo's `docs/BUSINESS_LOGIC.md`); the frontend checks the same limits early to give better messages. Update this file whenever a rule changes.

## General

- Storefront data always comes from the API. A failed catalog response shows no stand-in products.
- Public calls use `publicRequestInit` (`lib/mart-api/public-request.ts`): `cache: "no-store"`, no credentials, no Authorization header. Admin changes therefore show on the next storefront request.
- Admin pages are behind `proxy.ts`: without the access or refresh cookie, `/admin/*` redirects to `/admin/login`.
- Admin API calls go through the BFF (`/api/proxy/...`), which only forwards `api/v1/admin/*`, requires same-origin requests and attaches the staff token.

## Badges

Code: `lib/mart-api/badge-rules.ts`, `lib/mart-api/badges.ts`, `app/admin/badges/`.

- Name max 32 characters; at most 8 badges per product; tones `primary`, `gold`, `dark`, `alert`, `soft`, `soft-gold` (mapped to brand classes in `BADGE_TONE_CLASS`).
- Product cards show at most 2 badges (`CARD_BADGE_LIMIT`); the product page shows all active ones.
- Built-in badges and badges in use cannot be deleted; the UI offers switching them off instead (the API returns 409).

## Products: drafts and published

- A product can be saved as a draft with only a name.
- Publishing needs a price (unless it has variants), a category and a main image; the form shows the missing fields.
- Drafts never appear on the storefront (the API filters them).

## Inventory (admin)

Code: `lib/admin/inventory.ts`, `lib/mart-api/inventory.ts`, `lib/mart-mock/inventory.ts`, `app/admin/inventory/`, `app/admin/products/_components/product-stock-panel.tsx`. The storefront does not import these modules.

- Staff roles come from `GET /api/v1/auth/me` (`viewer`, `editor`, `superadmin`) and are kept on the admin session. A viewer can open the inventory pages, export, download a template, and preview an import. Create, edit, confirm import, Record opening stock, and Adjust stock need an editor or superadmin. A session with no role stored is not treated as a viewer.
- Suppliers have a name (required, 160), phone (40), address (500) and note (500). There is no delete.
- A purchase needs a supplier, an Asia/Dhaka calendar date (`purchased_on`), and 1–100 lines. Invoice number and note are optional (64 and 500). Each line is `product_id`, quantity of 1 or more, and `unit_cost` (non-negative `numeric(12, 2)`). A product that tracks stock per option also needs that option's `variant_id`. The new-purchase search lists one row per option (the list card only says `has_variants`, so the form loads the product to read the options). The same product can be several lines when the options differ. The same option is not added twice. The JSON body sends `variant_id` and does not send `sku`. A line with no option is refused before save. The form shows a line total and a grand total from the numbers the user typed. `PurchaseRead` has no total; the list sums `quantity × unit_cost` of the returned lines for display only.
- The server, not the browser, sets `cost_price` to the weighted average when a purchase is saved and increases on-hand stock. The product panel refetches `quantity` and `cost_price` from the admin product after an adjustment, and whenever the product page loads. The mock applies the same formula so that refetch works while the ledger routes are missing.
- Stock movements are insert-only. `movement_type` is `opening`, `purchase`, `sale`, `return`, `cancel`, or `adjustment`. The history table shows `product_title`, signed `quantity`, and `actor_id` (the API does not return a name or email). `sku` is filled for a variant movement.
- Adjust stock posts `{ product_id, variant_id?, quantity, reason }`. `quantity` is a non-zero signed difference. Reason is required (500) and is stored as the movement note. A product that tracks stock per option requires `variant_id`: the dialog asks which option, and a plain product omits the field. The response is the movement, not the new balance. The panel then refetches the product and writes that option's new quantity back onto the form.
- `POST /opening-stock` records one opening movement per tracked product or variant and does not change the count. It is idempotent (`created`, `already_recorded`, `untracked`). An opening import must quote the current stock or leave quantity blank; it does not change the number. A second opening is rejected.
- Low stock: on-hand quantity at or below `LOW_STOCK_THRESHOLD` (5), including zero. There is no admin setting for this yet. A blank catalog quantity (made to order) is not low stock. Customers never see cost price, unit cost, or these admin stock tools.
- Dates and times on these pages use Asia/Dhaka. "This week" on the stock history page is Monday–Sunday. "This month" there is the calendar month. Custom from/to dates are inclusive. A timestamp just after Dhaka midnight belongs to the new Dhaka date, not the previous UTC date.
- Excel import is two steps. Preview (`POST /imports/preview`) saves nothing and returns `rows[]` of `row`, `valid`, `action`, `errors`, and `summary`. Confirm saves every valid actionable row in one transaction and returns `saved` and `skipped`. The toast is "N rows saved. M skipped." The same file bytes are a 409 conflict (`error.code` `conflict`, `details.file_hash`) until the editor confirms the re-import.
- Export Excel is `products`, `purchases`, or `movements`. The API date filter is `date_from` and `date_to`. Product and movement-type filters stay on the stock history list; they are not export query parameters. There is no supplier workbook.

## Admin cost price (কেনা দাম)

Code: `lib/admin/cost-price.ts`, `app/admin/products/_components/product-form.tsx`. The storefront does not import this module and does not read `cost_price`.

- Optional. The field sits next to the selling price. Empty is sent as `cost_price: null`, which clears a saved cost. Leaving the field out of a PATCH keeps the stored value (the form always sends the current value). A negative number, letters, more than two decimal places, or a value above 9,999,999,999.99 (`numeric(12, 2)`) is shown under the field and blocks Save draft and Publish. Nothing invalid is sent.
- Bengali digits are accepted. A trailing dot (`10.`) is the whole taka. Admin reads return a JSON number (the float of that decimal, so `12.50` is `12.5`) or `null`. A decimal string is still shown if one arrives.
- Margin uses the Shopify convention: percent of the **selling price**, not markup on cost.
  - profit taka = selling price − cost price
  - margin % = profit taka ÷ selling price × 100 (nearest 0.01; no percent when the selling price is 0)
- The selling price in that formula is the quantity-1 price after the base discount. On a product with variants it is the lowest active variant price (the same price the product list shows). Green (`--color-success`) when profit is above 0, red (`--color-error`) when it is below 0.
- Customers never see the cost or the margin. Only the admin product create/update/read payload carries `cost_price`.

## Admin new-order alerts

Code: `lib/admin/order-alerts.ts`, `lib/mart-api/order-alerts.ts`, `lib/mart-mock/order-alerts.ts`, `app/admin/_components/order-alerts/`. The storefront does not import these modules. Not live until `GET /api/v1/admin/orders/new` answers (backend PR #14).

- Signed-in staff on any admin page except `/admin/login` poll that route. A visible tab waits 25 seconds. A hidden tab waits 3 minutes and polls as soon as it is shown again. After an error the wait doubles, up to 5 minutes. HTTP 401 (anonymous or not staff) stops polling and the existing admin client clears the session. HTTP 422 (limit outside 1..50) backs off and does not switch to the mock. The client never sends a limit outside 1..50.
- One browser tab holds the poll lock. The lock is stale after 10 seconds without a heartbeat (every 3 seconds). A visible tab takes the lock from a hidden leader. That tab broadcasts each result. The others update from the broadcast, or from `localStorage` if `BroadcastChannel` is missing.
- The first response, when this browser has no cursor yet, is remembered and not announced. After that, a row counts as new only when its `created_at` is later than the cursor. The cursor becomes the response `now`. Rows are newest first. `id` is a UUID. `payment_method` is `cod` (Cash on delivery) or `bangla_qr` (Bangla QR). Anything else is ignored. The order link is `/admin/orders/<id>`.
- Unread orders add a count to the Orders Management item in the sidebar and `(N)` to the tab title. **সব পড়া হয়েছে** clears the unread count and leaves the recent list (up to 20). Sound on/off and volume are stored in this browser. The browser's notification permission is not stored; the popover shows `granted`, `denied`, `default`, or `unsupported`.
- Sound and the browser notification run once per order, on the tab that claimed it. A toast on that tab names the order number and the ৳ amount (thousands separators) and links to the order. If the browser blocks playback, the bar **শব্দ চালু করতে ক্লিক করুন** unlocks it. Times in the list are relative, using the Asia/Dhaka calendar day.
- Customers never see this. Nothing is polled on the storefront.

## Order delivered and returned times

Code: `lib/admin/order-timestamps.ts`, `app/admin/orders/[number]/page.tsx`.

- The admin order page shows **Delivered** (`delivered_at`) and **Returned** (`returned_at`) in the progress timeline. Packed sits between confirmed and shipped.
- Admin `OrderRead` (list, detail, status update, and the response from placing an order) always includes both: an ISO 8601 UTC timestamp such as `2026-11-09T08:30:00+00:00`, or `null`. The page formats them in Asia/Dhaka as `09 Nov 2026, 2:30 PM`. Null or unreadable is "—".
- Each timestamp is set once, the first time the status becomes delivered or returned, and is not replaced later. Returning an order keeps `delivered_at`. Public order lookup does not include either field, and the storefront type does not read them.

## Admin orders management

Code: `lib/admin/orders-desk.ts`, `lib/admin/barcode.ts`, `lib/mart-api/orders-desk.ts`, `lib/mart-mock/orders-desk.ts`, `app/admin/orders/`. The storefront does not import these modules. Not live until `GET /api/v1/admin/orders/overview` answers (backend PR #18). `docs/ROADMAP.md` is not in this repo.

- The sidebar group is Orders Management: Overview (`/admin/orders`), Create Order (`/admin/orders/new`), Order List (`/admin/orders/list`), and Ready to Pack (`/admin/orders/ready-to-pack`). An old list URL such as `/admin/orders?status=new` or `?lane=transit` redirects to the list (`lane=transit` becomes `scope=transit`). The order page stays `/admin/orders/<uuid>`, including the new-order alert and the dashboard recent-order links.
- Statuses are `new`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`, and `returned`. Confirmed is the ready-to-pack queue. Allowed moves: new → confirmed or cancelled; confirmed → packed or cancelled; packed → shipped or cancelled; shipped → delivered or returned; delivered → returned. Cancelled and returned are final. The buttons use `next_statuses` when the API sends that array. Cancel and return are status changes. The browser asks for confirmation first, because stock goes back. Nothing is deleted.
- `origin` is `online` or `offline`. `call_status` is `not_called`, `confirmed`, `no_answer`, or `fake`. The list can filter by it, and the order page can set it. A customer history badge shows total orders, delivered, and returned plus cancelled for that phone. `duplicate_warning` means another order with the same phone was created within 24 hours.
- Offline create (`POST /api/v1/admin/orders/offline`) sends `Idempotency-Key` (the same key is reused until the save succeeds). Payment methods are cash, bKash, Nagad, card, and due. The browser does not send a total. A price left as the catalog price is omitted so the server applies quantity tiers. A blank delivery charge is omitted so the server uses the zone fee. The public quote is used only as a preview when every price is untouched, the discount is 0, and delivery was not typed. Anything else is labelled Estimate. The saved order is the server response. A low-stock refusal shows the server message. This page does not send analytics.
- The list has status tabs with `status_counts`, filters, search, pagination, and a selection for bulk status and bulk print. Ready to pack lists confirmed orders. Print asks for invoice, label, or both, draws a Code 128 barcode in the page, and uses the browser print dialog (Save as PDF). The invoice is A4 and the label is 4×6. One order is one page. After the dialog, `POST /admin/orders/printed` records the print. Reprint is allowed. Mark packed uses the bulk status route.
- While an order is new, items, quantity, price, discount, and delivery can be replaced with `PUT /admin/orders/{id}/items`. Totals and stock come back on the order. Courier name, tracking number, and the note are saved with `PATCH`.
- Until the overview route answers (404, 501, 5xx, or the API cannot be reached), and only while stand-ins are allowed, `lib/mart-mock/orders-desk.ts` fills these screens. Optional `NEXT_PUBLIC_ORDERS_DESK_MOCK=1` forces that mock. It is not set in production. A 401 or 422 is shown and is not replaced by the mock.

## Create errors contract

- `POST /api/v1/admin/products` returns `{"errors": [{"field","message","fix"}]}` (Bengali) with 400/409/500. The form maps each `field` to its input and shows `message` + `fix`. A rejected `cost_price` uses `field: "costPrice"`.
- `PATCH` still returns the default `{"error": {...}}` envelope (422, English); the form shows that message as a general error (see TODO.md). A negative `cost_price` on update is one of those 422s.

## Product media (gallery, video, YouTube)

Code: `app/admin/products/_components/product-content-fields.tsx`, `lib/mart-api/products.ts`, `lib/mart-api/youtube.ts`.

- Gallery "+ Add" menu: Image, Video, YouTube link. At most 12 gallery items.
- Images: JPG, PNG, WEBP or GIF, up to 5 MB. AVIF is refused before upload ("Use a JPG, PNG, WEBP, or GIF image.").
- Videos: MP4 or WEBM, up to 50 MB each (API limit). At most 100 MB of new video per save; above that the save stops with "Too many new videos to upload at once…".
- YouTube: a YouTube link or 11-character id; saved as the id. The thumbnail shown is YouTube's `hqdefault` image.
- Home Showcase: rows and pinned products come from `/api/v1/home/showcase` (published products only). A row with no visible products is hidden; if no row has any, the whole section is hidden. Category auto-rows are used only when the showcase API cannot be read.
- Home Trending: the showcase row with key `gadgets` (`TRENDING_ROW_KEY`) is shown right under the hero as a scrollable tile strip; the remaining rows stay as product-card grids below the promo banner. Admin › Showcase "Add product" lists only published products from any category; the button is disabled only when every published product is already in that row.
- Custom thumbnail (videos and YouTube only): "Add thumbnail" / "Change thumbnail" / "Remove" under the tile, same image rules as photos. New thumbnails go up as `thumbnails` files with `thumbnail_targets` (the item id, or `video:<n>` for a video uploaded in the same save); a removed one is sent as an empty `thumbnail` and the API deletes the file.
- Storefront: a video/YouTube item with a custom thumbnail shows that image with a ▶ button and starts playing when pressed. Without one, YouTube uses `hqdefault` and a video its first frame, as before.
- Freshness: product pages are `force-dynamic` and every API fetch is `no-store`; media URLs are unique per upload. Admin changes appear on the next page load.
- Save: existing gallery items are sent in the JSON payload and new files as multipart parts; the API appends new uploads after existing items, so order can change after save.
- Empty gallery items are dropped on save (`cleanProductContent`): images/videos need a `src`, YouTube items need a `youtubeId`.
- The main image falls back to the first gallery photo, never a video.

## Home video/media section

Code: `app/(client)/_components/home/media-section.tsx`, `app/admin/home/_components/media-editor.tsx`, `lib/home-media-view.ts`, `lib/mart-api/home-media.ts`.

- One section, directly above the testimonials. Shown only when the API returns it (Active, heading set, and usable media for the chosen type); otherwise nothing is rendered.
- Media type: Image (needs alt text), Video (MP4/WEBM up to 50 MB; optional thumbnail used as the poster) or YouTube (watch / youtu.be / shorts / embed link or id, stored as the id; optional thumbnail, else YouTube `hqdefault`). YouTube loads only after ▶ is pressed, from `youtube-nocookie.com`.
- Button: optional (toggle). Needs text and a link that is a site path (`/…`, no `//` or `..`) or `https://`. `http://`, `javascript:` and others are refused in the editor and by the API. A turned-off button is never shown.
- Saving uploads newly picked files first, then saves. The API keeps only the chosen type's files and deletes replaced or dropped ones.
- Freshness: home page is `force-dynamic`, the fetch is `no-store` and the API sends `Cache-Control: no-store`, so a save shows on the next page load.

## SEO

Code: `lib/seo.ts`, `next.config.ts`, `app/admin/products/_components/product-seo-fields.tsx`.

- Every page builds its metadata with `pageMetadata()`: own canonical, `og:url`, `og:title`, `og:description` and twitter tags on top of `OPEN_GRAPH_DEFAULTS` (site name, `bn_BD`, default share image). The root layout sets no canonical or `og:url`.
- Not indexed (robots tag, no canonical): checkout and order-status (`noindex, nofollow`), search (`noindex, follow`), 404 (`noindex`), admin.
- `htmlLimitedBots: /.*/` makes metadata render in `<head>` for every user agent (no streamed metadata in `<body>`).
- Product title = SEO title or product title; description = SEO description or the product description trimmed to ~160 characters; keywords = SEO keywords or the defaults. A trailing "| Implesia Mart" is removed before the site template adds it. The JSON-LD uses the same name and description.
- Admin limits: SEO title max 120 (counter warns above 60 incl. the brand suffix), meta description max 320 (counter vs 160), keywords max 500, slug `^[a-z0-9]+(-[a-z0-9]+)*$`, editable only on an existing product. Canonical product URLs stay `/products/<id>`; a slug (current or old) 308-redirects there.
- Site verification: `GOOGLE_SITE_VERIFICATION` (server-only, read on each request) adds `<meta name="google-site-verification">`. `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is used only when that is empty. `NEXT_PUBLIC_BING_SITE_VERIFICATION` adds the Bing tag. Empty token = no tag.
- Sitemap: static pages, categories with published products (`/products?category=<slug>`), published products (`/products/<id>`, with images) and blog posts. `lastModified` only from real dates (API `updated_at`, blog publish date); none for static pages. Catalog API down → 5xx + log; category/blog API down → that section is left out + log. `/admin`, `/cart`, `/checkout`, `/order-status` and `/api` are not listed. There is no public cart or account page and no separate order-success URL (success is a state on `/checkout`).
- `robots.txt` disallows `/admin` (includes `/admin/cart`), `/cart`, `/checkout`, `/order-status` and `/api`.
- Product JSON-LD: `Product` with `Offer` (or `AggregateOffer` + one `Offer` per option), `priceValidUntil` = today + 365 days, shipping = highest enabled delivery charge, country BD, return policy 3 days / free / by mail. These are assumptions in `lib/product-structured-data.ts` (`RETURN_POLICY`, `PRICE_VALID_DAYS`); change them there if the shipping-returns policy changes. No ratings until real reviews exist.
- Catalog canonical: `/products` with only `category` and `page` (>1). A page past the last one 307-redirects (from `proxy.ts`) to the last page with the same filters; page counts change, so the redirect is temporary.
- Image alt: an empty gallery/main image description falls back to the product title on the storefront; the admin form says so.
- HSTS (`max-age=31536000`, this host only, no preload) is sent by `proxy.ts` on HTTPS responses.

## Delete and bulk delete

- Single delete uses the shared confirm modal (`app/admin/_components/confirm-delete.tsx`).
- Bulk delete on `/admin/products` (`lib/mart-api/product-bulk-delete.ts`):
  - A checkbox on every row and mobile card; the header checkbox selects all on the current page (indeterminate when some are selected).
  - Selection belongs to the current page and filter; changing either clears it.
  - A bar shows "N টা selected", Clear and "Delete selected" (max 100 per request).
  - "Delete selected" opens the confirm modal; nothing is deleted before confirm.
  - Result message, for example "1 product deleted · 1 skipped (already removed) · 2 could not be deleted". If nothing was deleted the result is shown as an error.
  - After the request the list reloads and the selection clears.
- Deleting a product keeps past orders (order lines keep name and price).

## Storefront analytics

Code: `lib/analytics/`. The storefront calls `track` / `trackPurchase` only. `/admin` does not mount the loader, and `track` ignores any `/admin` path.

- GA4 (`NEXT_PUBLIC_GA4_ID`, shape `G-…`) and Meta Pixel (`NEXT_PUBLIC_META_PIXEL_ID`, digits). An empty or malformed id turns that tracker off: no script, no event, no console message. The ids are read on the server per request and passed into the page. There is no consent banner; a tracker runs only when its id is set.
- Scripts load after hydration (GA4, `afterInteractive`) and at idle (Meta, `lazyOnload`). gtag is configured with `send_page_view: false`. The Meta snippet does not send its own PageView. One `page_view` / `PageView` is sent on each client route change, including the first load.
- Events, GA4 name = Meta name: `view_item` = `ViewContent` (product page), `add_to_cart` = `AddToCart` (after the cart API accepts the line), `begin_checkout` = `InitiateCheckout` (once, when checkout first has lines), `purchase` = `Purchase`. Currency is `BDT`. Payload carries product id, name, price, quantity, and for checkout/purchase the order total (`value`). Purchase also sends the order number as `transaction_id`.
- Every event has an id: GA4 param `event_id`, Meta option `eventID`. Non-purchase ids are random. The purchase id is `analytics_event_id` from the order-create response when that string is non-empty, otherwise `purchase_<order_number>`.
- Purchase is sent only after `placeOrder` succeeds, and only once per order number. The order number is kept in `localStorage` (`implesia.analytics.purchases.v1`), so a refresh, back navigation, or a later visit to that success state does not send it again. When the order has a coupon code, the purchase event also sends GA4 `coupon` and the same field on the Meta Pixel custom data. An order with no coupon omits it. `/admin` does not send events.
- `POST /api/v1/orders` includes `tracking: { fbp, fbc, event_source_url }`. `fbp` and `fbc` are the `_fbp` and `_fbc` cookies. If `_fbc` is missing but this visit had `fbclid` (this URL, or earlier in the same tab), `fbc` is `fb.1.<milliseconds>.<fbclid>`. A missing value is `null`. Older APIs that ignore unknown JSON fields keep working.

## Cart and checkout

- A guest stores only the cart token (`implesia.cart.guest.v1`) in the browser; the API holds lines, prices and delivery rates and identifies the cart by the `X-Cart-Token` header.
- Checkout sends product ids, quantities, a delivery-zone hint, and, when the customer applied one, `coupon_code`. The API sets price, stock, shipping, the discount, and the total. The browser never sends a discount amount.
- **Coupon code আছে?** Apply asks for a new quote and shows the server's discount line, free delivery, and the new total. A free-delivery coupon with discount 0 is labelled ফ্রি ডেলিভারি. Remove asks again without the code. An invalid code stays a successful quote and shows the Bangla `message`; it does not change the merchandise total. Once the mobile number is valid, the quote also sends `phone`, and a change to that number re-quotes while a coupon is applied (per-phone limit and first order). `?coupon=CODE` on any storefront page is stored in `sessionStorage` (`implesia.coupon.v1`) and filled in at checkout (cart and buy now). The same code is sent when the order is created. If it is no longer valid then, the create error (Bangla, HTTP 422) stays on the form and the order is not placed. A code is 3–32 letters, numbers, hyphens, or underscores.
- Before a zone is chosen, the checkout total is the server subtotal minus the server discount (delivery is still hidden). After a zone is chosen it is the server `total`. Bangla QR advance and due are the quote's `bangla_qr_options`, which the server builds from that discounted total. A live quote that omits `coupon` while a code was sent does not get a client-side discount; the form says the code could not be checked.
- Admin › Coupons (editor and above can write; a viewer is read-only): code (3–32 letters, numbers, hyphens, or underscores), percent or fixed value, a maximum discount for percent, minimum order (merchandise after the quantity discount, before the coupon and delivery), start and end in Asia/Dhaka, a total use limit, a per-phone limit, first order only, optional product and category limits (a category includes its subcategories), free delivery, and active. Status is active, inactive, expired, or scheduled. Reports › Coupons uses the same preset or from/to window as the other reports, lists uses, discount given, and sales, and exports that table to Excel. Product, category, and channel filters are hidden on that tab.
- An admin order that has `coupon_code` shows the code and `coupon_discount` on the payment summary. An older order with both null is unchanged. Printing an invoice or a packet label is under Orders Management (see below).
- Prices and discounts: a product has a regular price and a base % (the quantity-1 selling price). Quantity tiers give a % off the line total: `total = selling price × quantity`, `final = ceil(total − total × tier % / 100)` (always rounded up to whole taka), `discount = total − final`. A quantity without its own tier uses the nearest lower tier; no tier → no discount. The tier % is capped so base + tier ≤ min(max %, 99.99 %). The API sends a `pricing` block on the product page and on each cart line; `lib/mart-api/pricing.ts` (`priceLine`, `discountedTotal`, integer maths) uses it only to show prices instantly. The cart, quote and order totals always come from the API.
- Display: product page shows `qty × price = total − discount (x% ছাড়) = শেষ দাম final` only when a tier applies; a product without tiers shows just `qty × price = total`. Cart drawer and checkout show `price / পিস`, the base % and, when a tier applies, "পরিমাণে x% ছাড়: −৳discount" (discount = `unit_price × quantity − line_total`). All money is whole taka.
- Max quantity per line: the store-wide limit (Admin › Discounts, default 10) or the product's custom maximum, capped by stock. The API sends the result (`max_per_order`, `variants[].max_quantity`, cart `max_quantity`); selectors stop there, disable + and show "সর্বোচ্চ Nটি নেওয়া যাবে". Hard ceiling 1000 (`QUANTITY_CEILING`).
- Only reachable tiers are shown (tiers above that maximum are hidden).
- Checkout phone: Bangladesh mobile `01[3-9]XXXXXXXX`; `880…` / `+880…`, spaces, dashes and Bengali digits are accepted and sent as `01XXXXXXXXX` (the API normalises the same way).
- Order lookup needs the order number and phone; the browser may remember the number locally.

## Bangla QR payment

- One Payment QR for the whole store, managed at Admin › Site › Payment QR (upload, replace, remove). The public `GET /api/v1/site/payment` is read with `no-store`; no QR (or a failed call) hides every QR card and the checkout option.
- Product page: QR card with the hint text near the price / Add to Cart; tap opens a lightbox. It is information only; ordering still goes through checkout.
- Checkout methods: cash on delivery (default) and "Bangla QR" (only when the quote returns `bangla_qr_options`). Bangla QR = pay an advance of 25, 50, 75 or 100% now by scanning the QR, and the rest in cash on delivery.
- Advance = `ceil(total × % / 100)` whole taka, due = total − advance. The API computes the options and the stored amounts; the browser only shows them (`advanceSplit` is a display mirror).
- The transaction ID / sender number is required for Bangla QR (trimmed, 4–64 letters, digits, `+`, `-`). Cash on delivery sends no percent and no reference.
- The API rejects Bangla QR when no QR is set, a percent outside 25/50/75/100, or a missing/invalid reference (422, Bengali message shown on the form).
- The payment is not verified automatically: staff check the transaction ID in Admin › Orders › order detail (Payment section) before confirming.

## Sales reports (admin)

Code: `lib/admin/reports.ts`, `lib/mart-api/reports.ts`, `lib/mart-mock/reports.ts`, `app/admin/reports/`. The storefront does not import these modules. The API is the source of truth (backend PR #10, branch `cursor/admin-sales-reports-b0a9`).

- Any signed-in staff member, including a viewer, can open Reports and export. There is no write action on this page.
- The window is a preset or a from/to pair, never both. Presets match the API: This week is Monday through today, This month is the 1st through today, Last month is the whole previous calendar month. Custom dates are inclusive Asia/Dhaka days. A range longer than 366 days, a missing end date, or from after to is refused before the request.
- Sales, profit, products, delivery, and the trend count delivered orders by `delivered_at`. A later return keeps the sale on the delivery day. Profit and margin use only lines that have a cost. They are blank when every line in the window has no cost, or when there were no known-cost lines. Margin is profit divided by that known-cost revenue. Delivery charge is not part of profit.
- The summary cards compare the previous period of the same number of days. The page calls the same endpoints again with that from/to. The percent is "—" when the previous value is 0 or null, or the current value is null.
- Unknown-cost lines are not treated as zero cost. The warning names how many lines lack a cost and links to the product list, or to that product when one product is filtered.
- Stock on hand ignores the date range and the channel. Low stock is on-hand quantity at or below 5, including zero. A blank quantity (made to order) is not low stock. "No sale in 30 days" uses the API's `no_sale_since`.
- Stock movement shows the ledger totals. A sale quantity is negative. Closing is the opening balance plus opening, purchase, sale, return, cancel, and adjustment. Channel is not applied.
- Return rate is returned divided by delivered. It is blank when nothing was delivered. It can be over 100% when more orders were returned in the window than delivered in it.
- The trend grain defaults the way the API does: day up to 31 days, week up to 92, otherwise month. An empty day has profit 0. A day whose only sales have no cost has profit blank.
- The dashboard headline (the same seven figures and the trend chart) uses this API. Order activity, best sellers, recent orders, and areas still come from `GET /api/v1/admin/dashboard`, which remains editor-only. Its delivered count is orders whose `delivered_at` is in the window, including an order that was later returned.
- Customers never see these reports, the cost, or the margin.
