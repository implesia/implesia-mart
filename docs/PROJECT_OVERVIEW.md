# Project overview: Implesia Mart (frontend)

## What it does

Bangla storefront (BDT prices, cash on delivery) for trending gadgets and handmade dresses, plus the `/admin` dashboard that manages it. All data comes from the Mart API (backend repo `implesia-mart-backend`).

- **Storefront**: home sections, catalog and product pages, search, cart, checkout, order lookup, CMS pages (About, Sustainability, FAQs, Shipping & Returns, Privacy, Contact, Blog).
- **Admin** (`/admin`): products (with badges, variants, gallery images/videos/YouTube, drafts, bulk delete), badges, home sections, CMS pages, site header/footer/contact, orders, delivery, inquiries, carts, dashboard.

## Tech stack

- Next.js 16 (App Router; `proxy.ts` replaces middleware), React 19, TypeScript
- Tailwind CSS 4, Base UI + shadcn-style components (`components/ui`), Framer Motion, Swiper
- Tests: Node's built-in test runner (`tests/*.test.ts`), ESLint, `tsc`
- Production: Cloudflare Workers via vinext (`build:vinext`, `deploy:vinext`). CI runs `npm ci`, `npm test`, `npm run build`.

## Folder structure

```
app/
  (client)/              storefront routes (home page is app/(client)/page.tsx)
  admin/                 dashboard routes; _components/ shared admin UI, products/, badges/, home/, ...
  api/auth/              login, logout, session (sets HttpOnly cookies)
  api/proxy/[...path]/   BFF proxy: forwards /api/v1/admin/* to the API with the staff token
lib/
  mart-api/              typed API clients, one module per resource
  auth/                  bff.ts (proxy), cookies.ts, refresh.ts
  mart-mock/             admin form state types and helpers (not live data)
components/ui/           shared UI primitives
proxy.ts                 request guard (malformed paths, admin cookie checks)
tests/                   node:test unit tests
public/                  static assets
docs/                    this documentation
```

## How to run (local)

```bash
cp .env.example .env.local   # set the variable values locally; never commit them
npm install
npm run dev -- -p 3001       # local convention: http://localhost:3001
```

The backend must be running (Docker Compose in the backend repo):

| Service | Host port |
| --- | --- |
| Frontend (Next dev) | 3001 |
| Mart API | 8001 |
| PostgreSQL | 5434 |
| Redis | 6381 |

Checks: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

## Environment variable names

Names only (see `.env.example`). Values must never be committed.

- `NEXT_PUBLIC_SITE_URL`: canonical site URL (metadata, sitemap, robots, JSON-LD).
- `NEXT_PUBLIC_MART_API_URL`: Mart API base URL, no trailing slash.
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`: only for vinext deploys.

## Connection to the backend repo

- API base URL: `NEXT_PUBLIC_MART_API_URL` (exported as `API_BASE_URL` in `lib/mart-api/media-url.ts`; local default `http://127.0.0.1:8001`).
- Storefront modules call public `/api/v1/...` endpoints directly with `publicRequestInit` (`cache: "no-store"`, no credentials, no Authorization header).
- Admin modules call `/api/proxy/api/v1/admin/...`. `lib/auth/bff.ts` (`proxyAdmin`) checks same-origin, allows only `api/v1/admin/*`, attaches the staff access token from the HttpOnly cookie and refreshes it when needed.
- Media URLs from the API (`/media/...`) are made absolute with the API base URL.
- `next.config.ts` allows BFF request bodies up to 110 MB (`proxyClientMaxBodySize`) for gallery uploads.
