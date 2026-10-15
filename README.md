# Implesia Mart

Bangla storefront for trending gadgets and handmade dresses. Prices are in BDT. Checkout is cash on delivery.

## Features

- **Homepage** — hero, product sections, reviews, and newsletter loaded from the Mart API
- **Catalog** — filterable product grid and product pages. A failed catalog response shows no stand-in products
- **Cart** — line items, prices, and delivery rates live on the API. A guest stores only the cart token `implesia.cart.guest.v1` in the browser
- **Checkout** — shipping form and cash on delivery. The browser sends product ids, quantities, and a delivery-zone hint. The API sets price, stock, shipping, and the total
- **Order lookup** — a shopper can check a recent order by number and phone. The browser may remember that number locally; the order itself stays on the API
- **Content** — About, Sustainability, FAQs, Shipping & Returns, Privacy, Contact, and Blog, loaded from the API
- **Admin** — `/admin` uses HttpOnly session cookies. Every admin API call still requires a staff token

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router)
- [React 19](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Base UI](https://base-ui.com) + [shadcn](https://ui.shadcn.com)-style components
- [Framer Motion](https://motion.dev) — animations
- [Swiper](https://swiperjs.com) — carousels
- `npm run build` (Next.js) is checked in CI. Production on Cloudflare Workers (Workers Builds) runs `npm run build:vinext` and `npm run deploy:vinext`; keep those scripts.

> The Next.js version in this repo may include breaking changes from upstream. Check `node_modules/next/dist/docs/` before writing new code.

## Getting started

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_MART_API_URL`. Catalog, cart, and checkout need the Mart API running.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The homepage is `app/(client)/page.tsx`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the development server (Webpack) |
| `npm run build` | Creates the production build. This is the release path |
| `npm run start` | Runs the production build |
| `npm run lint` | Lints the codebase with ESLint |
| `npm run test` | Runs the storefront tests |
| `npm run typecheck` | Typechecks the project |

## Project structure

```
app/
├─ (client)/                 # Storefront
│  ├─ checkout/              # Checkout form and shipping validation
│  ├─ products/              # Catalog and product pages
│  ├─ order-status/          # Order lookup
│  └─ ...                    # Home and content pages
├─ admin/                    # Staff screens
lib/
├─ mart-api/                 # Catalog, cart, checkout, and CMS clients
└─ auth/                     # HttpOnly admin session cookies
```

The Mart API is the price authority. The storefront does not calculate order totals.

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
