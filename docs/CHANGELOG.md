# Changelog

Newest first. Every task adds an entry: date, what changed, files touched, and anything the backend repo (`implesia-mart-backend`) must change.

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
