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
| Product pricing fields | `regular_price`, `base_discount_percent`, `tier_mode`, `tiers` in the create/update payload |
| Product page (storefront) | `GET /api/v1/products/by-slug/{slug}` or `GET /api/v1/products/{id}` (an old slug also resolves; the page then 308-redirects to `/products/{id}`) |
| Product SEO fields | `seo_title`, `seo_description`, `seo_keywords` in the create/update payload and in `AdminProductRead` / `PublicProductDetail`; `slug` on update (409 `{errors:[{field:"slug"}]}` when taken) |
| Sitemap lastmod | `updated_at` on `GET /api/v1/products` cards and on `GET /api/v1/categories/tree` nodes (`app/sitemap.ts`); delivery rates from `GET /api/v1/delivery` feed the product JSON-LD shipping |
| Out-of-range catalog page | `proxy.ts` → `GET /api/v1/products?…&page=1` (same filters) to read `pages`; 3 s timeout, any error = no redirect |

## Page → lib/mart-api modules

| Route | Modules (see the next table for endpoints) |
| --- | --- |
| `/` | `blog-categories`, `blog-cta`, `blog-listing`, `blog-related`, `cart`, `catalog`, `categories`, `category-preview`, `contact-details`, `faq`, `featured`, `footer`, `header`, `hero`, `inquiry-public`, `newsletter`, `products`, `promo`, `reviews`, `search`, `showcase`, `trust` |
| `/about-us` | `about-cta`, `about-dresses`, `about-hero`, `about-mission`, `about-stats`, `about-steps`, `about-stories`, `about-values` |
| `/admin` | `about-cta`, `about-dresses`, `about-hero`, `about-mission`, `about-stats`, `about-steps`, `about-stories`, `about-values`, `blog-categories`, `blog-cta`, `blog-hero`, `blog-listing`, `blog-posts`, `blog-related`, `contact-details`, `contact-faq`, `contact-form`, `contact-hero`, `contact-support`, `dashboard`, `faq-callout`, `faq-categories`, `faq-help`, `faq-hero`, `faq-items`, `faq-listing`, `inquiries`, `privacy-collection`, `privacy-contents`, `privacy-hero`, `privacy-introduction`, `privacy-rights`, `privacy-sharing`, `privacy-support`, `privacy-usage`, `products`, `shipping-block`, `shipping-contents`, `shipping-faq`, `shipping-hero`, `shipping-payment`, `shipping-refund`, `shipping-returns`, `shipping-support`, `sustainability-commitment`, `sustainability-cta`, `sustainability-durability`, `sustainability-hero`, `sustainability-impact`, `sustainability-origin`, `sustainability-quality` |
| `/admin/badges` | `badges` |
| `/admin/cart` | `cart`, `products` |
| `/admin/delivery` | `delivery` |
| `/admin/home` | `categories`, `faq`, `featured`, `hero`, `newsletter`, `promo`, `reviews`, `showcase`, `trust` |
| `/admin/home/hero` | `hero` |
| `/admin/home/hero/[id]` | `hero` |
| `/admin/inquiries` | `inquiries` |
| `/admin/login` | `products` |
| `/admin/orders` | `orders` |
| `/admin/orders/[number]` | `orders` |
| `/admin/products` | `badges`, `categories`, `products` |
| `/admin/products/[id]` | `products` |
| `/admin/site/contact` | `site-contact` |
| `/admin/site/footer` | `contact-details`, `footer` |
| `/admin/site/header` | `header` |
| `/blogs` | `blog-categories`, `blog-hero`, `blog-listing`, `blog-posts` |
| `/blogs/[slug]` | `blog-categories`, `blog-cta`, `blog-listing`, `blog-posts`, `blog-related` |
| `/checkout` | `cart`, `delivery`, `orders` |
| `/contact-us` | `contact-details`, `contact-faq`, `contact-form`, `contact-hero`, `contact-support`, `inquiry-public` |
| `/faqs` | `delivery`, `faq-callout`, `faq-categories`, `faq-help`, `faq-hero`, `faq-items`, `faq-listing` |
| `/order-status` | `orders` |
| `/privacy-policy` | `privacy-collection`, `privacy-contents`, `privacy-hero`, `privacy-introduction`, `privacy-rights`, `privacy-sharing`, `privacy-support`, `privacy-usage` |
| `/products` | `catalog`, `categories` |
| `/products/[ref]` | `catalog`, `site-contact` |
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
| `inquiry-public.ts` | `/api/v1/inquiries` |
| `newsletter.ts` | `/api/v1/admin/home/newsletter`<br>`/api/v1/admin/home/newsletter/perks`<br>`/api/v1/admin/home/newsletter/perks/order`<br>`/api/v1/admin/home/newsletter/perks/{id}`<br>`/api/v1/home/newsletter` |
| `orders.ts` | `/api/v1/admin/orders`<br>`/api/v1/admin/orders/{id}`<br>`/api/v1/orders`<br>`/api/v1/orders/lookup`<br>`/api/v1/orders/quote` |
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
