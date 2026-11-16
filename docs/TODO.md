# TODO

Open items found in the code and in recent work. Remove an item when it is done.

## Done (not live)

- **Admin new-order notifications (2026-11-10).** Polling, sound, toast, sidebar badge, tab title, browser notification, and the header bell are in the admin shell. They call `GET /api/v1/admin/orders/new` (backend PR #14, stacked on backend PR #13). Until that route answers, `lib/mart-mock/order-alerts.ts` is used. Remove the fallback once it answers in the environment this app calls. Not live. `docs/ROADMAP.md` is not in this repo.

## Open

- **Reports API fallback**: `/admin` and `/admin/reports` call the report paths in `docs/API.md` (backend PR #10, branch `cursor/admin-sales-reports-b0a9`). A missing `GET /api/v1/admin/reports/sales` still falls back to `lib/mart-mock/reports.ts`. Remove that fallback once those routes answer in the environment this app calls. The mock books a sale movement on the delivery day; the live ledger uses the movement's `created_at`.
- **Inventory API fallback**: the admin inventory screens call the ledger paths in `docs/API.md` (backend PR #9, branch `cursor/inventory-ledger-2808`). A missing `GET /api/v1/admin/inventory/suppliers` still falls back to `lib/mart-mock/inventory.ts`. Remove that fallback once those routes answer in the environment this app calls. `LOW_STOCK_THRESHOLD` is 5 until the shop has a setting for it. The history "Who" column shows `actor_id` because the movement payload has no name.
- **PATCH product errors**: the API's `PATCH /api/v1/admin/products/{id}` still answers 422 with English messages in the default envelope. The edit form shows that as a general error instead of per-field Bengali errors like create. Needs a backend change first.
- **Browser verification**: the bulk-delete UI on `/admin/products` passed lint, type check, build, unit tests and curl checks but has not had a full manual browser walkthrough (desktop and mobile).
- **Upload size limit in production**: the BFF accepts bodies up to 110 MB (`proxyClientMaxBodySize` in `next.config.ts`) and the form allows up to 100 MB of new video per save. Confirm the production proxy / Cloudflare Workers request limit accepts that size.
- **Prettier drift**: some existing files are not Prettier-formatted. Format them in a separate, formatting-only commit.
- **Image format text**: the product form description says "JPG, PNG, WEBP, GIF, or AVIF", but AVIF is refused on save (the API accepts JPEG, PNG, WEBP, GIF only). Fix the text.
- **Gallery order after save**: new uploads are appended after existing items by the API, so the order arranged in the form can change after save.
- **SEO on the deployed site**: the head-metadata fix (`htmlLimitedBots`) was verified on a local vinext/workerd preview only. After the next deploy, curl a product page with a Googlebot UA and check one `<title>` in `<head>`, and re-test in Search Console (URL inspection).
- **SEO blog post check**: no published blog post existed locally, so `blogs/[slug]` metadata (article og tags) was checked by type check/build only.
- **Search Console and Bing (manual)**: 1) Search Console → Add property. Preferred: *Domain* property `implesia.com` (verify with the DNS TXT record in Cloudflare DNS; covers every host and protocol). Alternative: *URL prefix* `https://mart.implesia.com/` with the HTML tag method: put only the `content` value in `GOOGLE_SITE_VERIFICATION` (runtime variable on the Worker; `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` still works if that name is already set), then press Verify. 2) Sitemaps → submit `https://mart.implesia.com/sitemap.xml`. 3) Bing Webmaster Tools: import from Search Console, or set `NEXT_PUBLIC_BING_SITE_VERIFICATION` (the `msvalidate.01` content) and submit the same sitemap. 4) Test a product URL in the Rich Results Test (merchant listing / product snippet). GA4 and Meta stay off until `NEXT_PUBLIC_GA4_ID` and `NEXT_PUBLIC_META_PIXEL_ID` are set as Worker runtime variables.
- **Cloudflare HTTPS and www (manual, cannot be done from code)**: in the Cloudflare dashboard for `implesia.com`: 1) SSL/TLS → Overview → mode **Full (strict)**. 2) SSL/TLS → Edge Certificates → **Always Use HTTPS** = On (HTTP → HTTPS 301). 3) If `www.mart.implesia.com` (or any other alias) resolves: DNS → proxied record for it, then Rules → Redirect Rules → "hostname equals www.mart.implesia.com" → dynamic redirect to `concat("https://mart.implesia.com", http.request.uri.path)`, status **301**, preserve query string. 4) HSTS: the app already sends `max-age=31536000` for this host. Do not turn on Cloudflare HSTS with `includeSubDomains` or preload unless every `implesia.com` subdomain is HTTPS-only. 5) Check: `curl -sI http://mart.implesia.com/` → 301 to https; `curl -sI https://www.mart.implesia.com/` → 301 to `https://mart.implesia.com/`; `curl -sI https://mart.implesia.com/ | grep -i strict-transport`.
- **SEO follow-ups on the deployed site**: sitemap, product JSON-LD, catalog 307 and HSTS were verified on a local vinext/workerd preview only. After deploy, re-check them and the Rich Results Test.
- **Return policy and shipping in JSON-LD are assumptions** (3 days, free, by mail; one BD-wide rate = the highest delivery charge). Confirm with the business and edit `lib/product-structured-data.ts`, or move them to admin settings.
- **Home media uploads on the deployed site**: the 50 MB video upload goes through the BFF; confirm the production Workers/Cloudflare request limit accepts it (same item as product video uploads). Checked locally only (dev server, desktop 1366 px and mobile 390 px).

## Code comments

- No `TODO` / `FIXME` comments in `app/`, `lib/`, `components/`, `tests/` or `proxy.ts` as of 2026-11-02.
