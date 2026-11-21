# Daily Handoff & Cross-Device Sync — 2026-11-21

> **Purpose:** Single source of truth for resuming work seamlessly between **Office PC** and **Home Laptop** without copying local AI chat databases.
> **Language Preference (Tushar):** Communicate with Tushar in **Bengali (বাংলা)** in chat sessions.
> **Repos Synced:**
> - Frontend: `implesia-mart` (`main`, latest feature commit `46b3a51`)
> - Backend: `implesia-mart-backend` (`main`, latest feature commit `cabc203`)

---

## 1. Planning Workstream (Completed Today)

1. **Customer Dashboard & Reviews Audit (Phases 6–10):**
   - Audited full customer auth, dashboard, cart merge, 30-day notification retention, avatar upload/delete, order tracking, purchased products history, header dropdown + notification bell, and verified purchaser product reviews.
   - Produced detailed phase-by-phase implementation specs (Phases 6–10) — **all implemented and merged to `main`**.
2. **SaaS Admin Upgrade & Accounting Audit (Phases A–G):**
   - Identified and resolved key architectural & accounting gaps:
     - Optional `products.supplier_id` relation + per-variant `product_variants.cost_price`.
     - Excluded `returned` orders from realized sales & profit SQL aggregates.
     - Fixed offline walk-in counter order sync (immediate `delivered` option aligned to `order_date`, customer `user_id` linking by phone, subsequent due payment collection).
     - Designed Admin-only (`superadmin`) safe deletion with dependency impact preview and atomic zero-conflict reconciliation/merge for Orders (stock ledger offsetting entries + audit snapshot), Badges (merge/unlink), and Suppliers (merge/archive/guarded hard delete).
     - Restructured Admin sidebar into collapsible SaaS modules, upgraded Executive Dashboard KPIs, added `/admin/products/[id]/view` + sticky `Actions` (`View`/`Edit`/`Delete`), and built the 7-page SaaS Reports suite.
   - Produced phase-by-phase specs (Phases A–G) — **all implemented and merged to `main`**.
3. **Notification Architecture Audit:**
   - Confirmed **no WebSocket or SSE** is currently used.
   - Active channels:
     - **Admin New-Order Alerts:** Smart HTTP Polling (`25s` visible / `3m` hidden) + `localStorage` Leader-Tab Election + `BroadcastChannel` + Audio chime + Browser Notification API (`order-alerts-provider.tsx`). Admin Inquiry badge polls every `60s`.
     - **Customer In-App Notifications:** PostgreSQL `customer_notifications` table + REST API + `60s` HTTP polling + `window focus` & custom DOM event (`customer-notification-bell.tsx`).
     - **Admin Instant Mobile Alerts:** Telegram Bot API via FastAPI `BackgroundTasks` (`telegram_notify.py`).
     - **Customer SMS:** Provider adapter ready (`customer_notify.py`, currently `log`/`noop` until SSL Wireless credentials are configured).
   - Future guidance: use **SSE + Web Push** if instant one-way notifications are needed later; reserve **WebSocket** for two-way live support chat (Helpline Chat).
4. **Cross-Device Sync Standard (Option 2 Adopted):**
   - Keep `docs/HANDOFF.md`, `docs/WORK_REPORT_*.md`, `docs/TODO.md`, and `docs/CHANGELOG.md` updated and pushed to Git instead of copying local Antigravity SQLite files.

---

## 2. Implesia Mart Implementation Summary (Merged to `main`)

### Backend (`implesia-mart-backend`, commit `cabc203` + `9577b4c`)
- **Customer Platform (Phases 6–10 / Migrations `0102`–`0104`):**
  - Customer auth, profile + avatar upload/delete, auto cart merge, orders/tracking (activity timestamps, cancelled/returned handling, future courier live-event fields), full repeat-purchase history, enriched dashboard summary, 30-day physical notification auto-purge, and verified purchaser product reviews.
- **SaaS Accounting, Reports & Safe Delete (Phases A–C / Migration `0105`):**
  - **Phase A (`0105_product_supplier_and_variant_cost.py`):** `products.supplier_id`, `product_variants.cost_price`, offline `initial_status`/`mark_delivered` + `POST /api/v1/admin/orders/{id}/payments`, returned orders excluded from realized sales/profit.
  - **Phase B:** Extended report presets/filters (`today`, `7d`, `this_week`, `this_month`, `last_month`, `this_year`, `supplier_id`, `origin`, `profit_filter`, `sort`), `/profit-loss`, `/channels`, `/suppliers` (+ `.xlsx` exports), enriched `/products` & `/stock`, and `GET /api/v1/admin/products/{id}/analytics`.
  - **Phase C:** `RequireSuperadmin` safe delete + `GET .../delete-impact` for Orders (atomic stock ledger reconciliation + `ORDER_DELETED` audit snapshot), Badges (`merge`/`unlink`), and Suppliers (`merge`/`archive`/`hard_delete`).
- **Verification:** `ruff check .` clean, `mypy app` 0 issues, single Alembic head (`0105`), pytest suites passing.

### Frontend (`implesia-mart`, commit `46b3a51` + `fadd952`)
- **Customer Platform (Phases 7–10):**
  - Full isolated Customer BFF routes (`/api/customer/*`), automatic guest-to-account cart merge on login/register, Admin-grade Customer Dashboard shell (all 9 pages: Overview, Orders, Tracking, Purchases, Cart, Notifications, Address, Profile+Avatar, Settings), upgraded Header Dropdown + Notification Bell, and live Verified Product Reviews tab on `/products/[ref]`.
- **SaaS Admin Platform (Phases D–G):**
  - **Phase D:** Collapsible SaaS sidebar, upgraded `/admin` Executive Dashboard (6 financial KPIs, Online vs Offline bar, Unknown Cost audit banner, profit-enriched Best Sellers), optional `SupplierPicker` on product form, per-variant `cost_price` + live Unit Profit/Margin % preview.
  - **Phase E:** Dedicated `/admin/products/[id]/view` executive detail page + visible sticky-right `Actions` (`View`, `Edit`, `Delete`) and inline Cost/Profit/Margin on `/admin/products`.
  - **Phase F:** 7-page SaaS Reports Suite (`/admin/reports`, `profit-loss`, `products`, `sales`, `inventory`, `suppliers`, `delivery-coupons`) with shared URL-synced `ReportFilterBar`, `.xlsx` exports, and Print/PDF.
  - **Phase G:** `superadmin`-only `ImpactDeleteModal` on Orders, Badges, and Suppliers; walk-in immediate delivery toggle on `/admin/orders/new`; due payment collection on `/admin/orders/[number]`; SaaS KPI & sub-nav polish on Inquiries, Cart, and Inventory.
- **Verification:** `npx next typegen` passed, `npm test` **387/387**, `npm run lint` 0 errors, `npm run typecheck` 0 errors, `npm run build` clean (71 routes).

See also: [WORK_REPORT_2026-11-21.md](WORK_REPORT_2026-11-21.md) and [TODO.md](TODO.md).

---

## 3. DevOps & Deployment Status (Pending Production Rollout)

- **Live Audit Conducted Today:**
  - Checked `mart-api.implesia.com` (VPS `72.60.199.155`, Docker Compose behind Cloudflare Proxy) and `mart.implesia.com` (Cloudflare Workers `vinext`).
  - Live API returned `404` on newly added customer/review endpoints → **production is still on an older release** (migrations `0100`–`0105` have NOT been applied to production yet).
  - GitHub Actions runs CI tests/lint/typecheck/build only (no auto-deploy).
  - Local Cloudflare Workers account/token verified valid for frontend deploy (`npm run deploy:vinext`).
- **Deployment Blocker (Waiting on Tushar's Approval & VPS SSH Access):**
  - Need VPS SSH username & SSH key/password (supplied interactively at deploy time — **never store credentials in Git**).
- **Exact Deployment Order (Zero Data Loss):**
  1. **Backup Production DB First** (`pg_dump` on VPS `72.60.199.155`).
  2. **Backend Deploy (First):**
     - Pull `main` on VPS (`implesia-mart-backend`).
     - Run migrations through `0105`:
       ```bash
       docker compose -f docker-compose.prod.yml --env-file .env.production run --rm api alembic upgrade head
       ```
     - Rebuild & restart backend container:
       ```bash
       docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
       ```
  3. **Frontend Deploy (Second):**
     - From `implesia-mart` on `main`, run:
       ```bash
       npm run deploy:vinext
       ```
  4. **Post-Deploy Live Smoke Test:**
     - Verify Customer Auth, Dashboard, Notifications, Cart Merge, and Product Reviews on `https://mart.implesia.com`.
     - Verify `/admin`, `/admin/products/[id]/view`, all 7 `/admin/reports/*` pages + `.xlsx` exports, walk-in offline order creation, due payment collection, and superadmin-only delete-impact/merge modals.

---

## 4. Pending Backlog (After Production Deploy)

- [ ] **Production Deploy & Smoke Test** (Steps 1–4 above).
- [ ] **SSL Wireless SMS:** Connect `SMS_SSLWIRELESS_API_TOKEN` & `SMS_SSLWIRELESS_SID` in backend `.env.production` once account is active.
- [ ] **Remove Dev Mock Fallbacks:** Clean up remaining `lib/mart-mock/*` fallbacks once live API responses are confirmed in all environments.
- [ ] **PATCH Product Validation Parity:** Align `PATCH /api/v1/admin/products/{id}` 422 errors with Bengali per-field error format used by `POST`.
- [ ] **Cloudflare & SEO Manual Checks:** Confirm SSL `Full (strict)`, `www` 301 redirect, Google Search Console sitemap submission, and 100 MB video upload limit on Cloudflare Workers.

---

## 5. How to Resume on Home Laptop (Quick Checklist)

1. Pull latest `main` in both repos:
   ```bash
   git -C implesia-mart pull origin main
   git -C implesia-mart-backend pull origin main
   ```
2. Sync local PostgreSQL schema on laptop:
   ```bash
   cd implesia-mart-backend && alembic upgrade head
   ```
3. In a new Antigravity chat on your laptop, say:
   > *"আমার সাথে বাংলায় কথা বলবে। `docs/HANDOFF.md` পড়ো—এখন আমি [ডিপ্লয় / পরবর্তী কাজ] শুরু করতে চাই।"*
