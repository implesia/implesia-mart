# Implesia Mart

Implesia Mart is a Bangla-language e-commerce storefront built for selling trending gadgets — such as a sunset projection lamp and an AI face-tracking selfie stand. The site is designed around BDT currency, a cash-on-delivery (COD) model, and fully Bangla UI/copy.

## Features

- **Homepage** — hero slider, best-selling carousel, flash sale, trust/organic highlight section, testimonials, newsletter
- **Product catalog** — filterable/sortable grid, detailed product pages (gallery, video, specifications, FAQ, reviews)
- **Shopping cart** — persistent `localStorage`-based cart, header drawer, quantity controls
- **Checkout** — shipping address form, COD payment, and server-priced order placement
- **Content pages** — About, Sustainability, FAQs, Shipping & Returns, Privacy Policy, Contact Us
- **Theming** — light/dark mode toggle (system-preference aware)

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router)
- [React 19](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Base UI](https://base-ui.com) + [shadcn](https://ui.shadcn.com)-style components
- [Framer Motion](https://motion.dev) — animations
- [Swiper](https://swiperjs.com) — carousels/sliders
- Production build path is `npm run build` (Next.js). `dev:vinext` / `deploy:vinext` are an optional Cloudflare target.

> **Note:** The Next.js version in this repo may include breaking changes from upstream. Check `node_modules/next/dist/docs/` before writing new code.

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the result.

You can start editing the homepage in `app/page.tsx` — the page auto-updates as you save changes.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the development server (Webpack) |
| `npm run build` | Creates a production build |
| `npm run start` | Runs the production build |
| `npm run lint` | Lints the codebase with ESLint |

## Project structure

```
app/
├─ (client)/
│  ├─ _components/     # Shared UI (header, footer, home sections, cart)
│  ├─ _data/           # Static content/copy and product data
│  ├─ _lib/            # Cart helpers, EmailJS integration
│  ├─ _providers/      # Cart and theme context providers
│  ├─ products/        # Product listing and detail pages
│  ├─ checkout/        # Checkout flow
│  └─ ...              # about-us, faqs, sustainability, and other content pages
components/ui/         # shadcn/Base UI primitive components
public/images/products/ # Product image/video assets
```

Orders are created by the Mart API. The browser sends product ids and quantities. The API calculates price, stock, and delivery. Admin sign-in stores tokens in HttpOnly cookies on this app; the API still receives a Bearer token from the server.

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
- [EmailJS documentation](https://www.emailjs.com/docs/)
