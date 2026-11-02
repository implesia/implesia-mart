# TODO

Open items found in the code and in recent work. Remove an item when it is done.

## Open

- **PATCH product errors**: the API's `PATCH /api/v1/admin/products/{id}` still answers 422 with English messages in the default envelope. The edit form shows that as a general error instead of per-field Bengali errors like create. Needs a backend change first.
- **Browser verification**: the bulk-delete UI on `/admin/products` passed lint, type check, build, unit tests and curl checks but has not had a full manual browser walkthrough (desktop and mobile).
- **Upload size limit in production**: the BFF accepts bodies up to 110 MB (`proxyClientMaxBodySize` in `next.config.ts`) and the form allows up to 100 MB of new video per save. Confirm the production proxy / Cloudflare Workers request limit accepts that size.
- **Prettier drift**: some existing files are not Prettier-formatted. Format them in a separate, formatting-only commit.
- **Image format text**: the product form description says "JPG, PNG, WEBP, GIF, or AVIF", but AVIF is refused on save (the API accepts JPEG, PNG, WEBP, GIF only). Fix the text.
- **Gallery order after save**: new uploads are appended after existing items by the API, so the order arranged in the form can change after save.
- **SEO on the deployed site**: the head-metadata fix (`htmlLimitedBots`) was verified on a local vinext/workerd preview only. After the next deploy, curl a product page with a Googlebot UA and check one `<title>` in `<head>`, and re-test in Search Console (URL inspection).
- **SEO blog post check**: no published blog post existed locally, so `blogs/[slug]` metadata (article og tags) was checked by type check/build only.

## Code comments

- No `TODO` / `FIXME` comments in `app/`, `lib/`, `components/`, `tests/` or `proxy.ts` as of 2026-11-02.
