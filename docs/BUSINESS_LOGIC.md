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

## Create errors contract

- `POST /api/v1/admin/products` returns `{"errors": [{"field","message","fix"}]}` (Bengali) with 400/409/500. The form maps each `field` to its input and shows `message` + `fix`.
- `PATCH` still returns the default `{"error": {...}}` envelope (422, English); the form shows that message as a general error (see TODO.md).

## Product media (gallery, video, YouTube)

Code: `app/admin/products/_components/product-content-fields.tsx`, `lib/mart-api/products.ts`, `lib/mart-api/youtube.ts`.

- Gallery "+ Add" menu: Image, Video, YouTube link. At most 12 gallery items.
- Images: JPG, PNG, WEBP or GIF, up to 5 MB. AVIF is refused before upload ("Use a JPG, PNG, WEBP, or GIF image.").
- Videos: MP4 or WEBM, up to 50 MB each (API limit). At most 100 MB of new video per save; above that the save stops with "Too many new videos to upload at once…".
- YouTube: a YouTube link or 11-character id; saved as the id. The thumbnail shown is YouTube's `hqdefault` image.
- Home Showcase: rows and pinned products come from `/api/v1/home/showcase` (published products only). A row with no visible products is hidden; if no row has any, the whole section is hidden. Category auto-rows are used only when the showcase API cannot be read.
- Custom thumbnail (videos and YouTube only): "Add thumbnail" / "Change thumbnail" / "Remove" under the tile, same image rules as photos. New thumbnails go up as `thumbnails` files with `thumbnail_targets` (the item id, or `video:<n>` for a video uploaded in the same save); a removed one is sent as an empty `thumbnail` and the API deletes the file.
- Storefront: a video/YouTube item with a custom thumbnail shows that image with a ▶ button and starts playing when pressed. Without one, YouTube uses `hqdefault` and a video its first frame, as before.
- Freshness: product pages are `force-dynamic` and every API fetch is `no-store`; media URLs are unique per upload. Admin changes appear on the next page load.
- Save: existing gallery items are sent in the JSON payload and new files as multipart parts; the API appends new uploads after existing items, so order can change after save.
- Empty gallery items are dropped on save (`cleanProductContent`): images/videos need a `src`, YouTube items need a `youtubeId`.
- The main image falls back to the first gallery photo, never a video.

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

## Cart and checkout

- A guest stores only the cart token (`implesia.cart.guest.v1`) in the browser; the API holds lines, prices and delivery rates and identifies the cart by the `X-Cart-Token` header.
- Checkout sends product ids, quantities and a delivery-zone hint; the API sets price, stock, shipping and total.
- Order lookup needs the order number and phone; the browser may remember the number locally.
