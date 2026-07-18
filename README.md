# Implesia Mart

Implesia Mart is a Bangla-language e-commerce storefront built for selling trending gadgets — such as a sunset projection lamp and an AI face-tracking selfie stand. The site is designed around BDT currency, a cash-on-delivery (COD) model, and fully Bangla UI/copy.

## Features

- **Homepage** — hero slider, best-selling carousel, flash sale, trust/organic highlight section, testimonials, newsletter
- **Product catalog** — filterable/sortable grid, detailed product pages (gallery, video, specifications, FAQ, reviews)
- **Shopping cart** — persistent `localStorage`-based cart, header drawer, quantity controls
- **Checkout** — shipping address form, COD payment, order summary, and order notification emails via [EmailJS](https://www.emailjs.com/)
- **Content pages** — About, Sustainability, FAQs, Shipping & Returns, Privacy Policy, Contact Us
- **Theming** — light/dark mode toggle (system-preference aware)

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router)
- [React 19](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Base UI](https://base-ui.com) + [shadcn](https://ui.shadcn.com)-style components
- [Framer Motion](https://motion.dev) — animations
- [Swiper](https://swiperjs.com) — carousels/sliders
- [EmailJS](https://www.emailjs.com) — serverless order emails

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

## EmailJS configuration

EmailJS is used to send order notification emails from checkout. Credentials and template logic live in `app/(client)/_lib/emailjs/`:

- `config.ts` — service ID, template ID, public key
- `build-template-params.ts` — builds template variables from order data
- `send-order.ts` — sends the email via `@emailjs/browser`
- `order-email-template.html` — HTML template to paste into the EmailJS dashboard (usage instructions in the file's comments)

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
- [EmailJS documentation](https://www.emailjs.com/docs/)
