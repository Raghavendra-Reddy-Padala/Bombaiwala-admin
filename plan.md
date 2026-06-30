
# Bombaiwala Admin Dashboard — Plan

A sophisticated, mobile-responsive admin dashboard for Bombaiwala (Chaat + Juice brands), connected directly to the existing Firebase/Firestore project (`bombaiwala-chat`). Firebase Auth gates the dashboard. Brands are split into two parallel sections in the sidebar, each with its own categories, products, combos, and orders. Orders from both website and WhatsApp bot live in a single `/orders` collection — the dashboard normalizes the two shapes for a unified view.

## Visual direction (no AI-slop colors)

Pulled straight from the logo:
- **Deep maroon** `#5C0A0A` — primary surface accents, sidebar header
- **Warm yellow** `#F5C518` — primary action / highlight
- **Tomato red** `#D9342B` — destructive / status badges
- **Cream** `#FBF6EC` — app background
- **Charcoal** `#1F1A18` — primary text
- Typography: **Bricolage Grotesque** (display, for headings/numbers — echoes the chunky logo type) + **Inter** (UI/body)
- Dense data tables, generous whitespace on cards, subtle 1px borders, no gradients, no neon. Status pills use solid tinted fills, not glows.

## Information architecture

```text
Sidebar
├── Dashboard (overview)
├── Orders (unified, both brands)
├── ── Chaat ──────────
│   ├── Categories
│   ├── Products
│   └── Combos
├── ── Juice ──────────
│   ├── Categories
│   ├── Products
│   └── Combos
├── Customers
├── Analytics
└── Settings
```

Why split brands in sidebar but unify orders: a single order can theoretically contain items from either brand, and the client already stores both in `/orders`. Splitting orders by brand would require re-tagging every line item. Catalog (categories/products/combos) IS brand-specific, so those are split.

## Pages

### 1. Dashboard (overview)
KPI cards: Today's revenue, Orders today, Pending orders, Avg order value. Revenue line chart (last 30 days), Top 5 products, Recent orders table (latest 10), Low-stock / out-of-stock alerts.

### 2. Orders
- Table with: Order ID, Customer (name + phone), Items summary, Total, Source (Website / WhatsApp), Status, Time, Location pin.
- Filters: status (pending / preparing / out-for-delivery / delivered / cancelled), source, date range, search by name/phone/orderId.
- Row click → side drawer with full order detail: items, notes, customer phone (click-to-call), Google Maps link, status timeline, **Update status** action (writes back to Firestore), **Print receipt**, **Mark as delivered**, distance/delivery fee.
- Handles BOTH shapes from `/orders`:
  - Website shape: `customer.{name,phone}`, `items[].{id,name,qty,unitPrice,lineTotal}`, `total`, `notes`, `location`
  - WhatsApp shape: `customerName`, `customerPhone`, `items[].{name,price,qty,total}`, `subtotal`, `deliveryFee`, `totalAmount`, `orderId`, `deliveryType`, `distanceKm`
- Normalizer in `src/lib/orders.ts` maps both into one canonical type.
- Live updates via Firestore `onSnapshot` — new orders appear in real time with a toast + soft sound (toggle in Settings).

### 3. Catalog — per brand (Chaat / Juice each)

**Categories**
- List with drag-to-reorder, icon, name, item count, visibility toggle.
- Create/edit modal: name, slug, icon upload, sort order, active flag.

**Products** (the sophisticated CRUD you asked for)
- Table view + grid/card toggle.
- Per product:
  - Name, category, image(s), description
  - **Selling price** (your price)
  - **MRP / strike-through price**
  - **Discount** (auto-calculated %, or manual)
  - **Competitor prices**: repeatable rows — platform (Zomato / Swiggy / Magicpin / Other), price, URL. Used for the price-comparison view.
  - Variants (e.g. Vada Pav → Plain / Butter / Cheese) with per-variant price + SKU
  - Stock toggle (in-stock / out-of-stock), optional quantity
  - Tags, prep time, veg/non-veg flag, spice level
  - Active / featured flags
- Detail page shows a **price-comparison panel**: our price vs each competitor, cheapest-highlighted, gap %.

**Combos**
- Create combos by picking N products (with chosen variants) → combo name, image, combo price, individual-sum (auto), savings shown.
- Same competitor-price fields available.
- Combos can mix only within the same brand (Chaat combos use Chaat items, Juice combos use Juice items).

### 4. Customers
- Auto-derived from `/orders` (group by phone). Columns: name, phone, total orders, total spent, last order, last location.
- Detail drawer: order history timeline.

### 5. Analytics
- Date range picker (today / 7d / 30d / 90d / custom).
- Revenue over time, orders over time, by source (Website vs WhatsApp), by brand (Chaat vs Juice, derived from item → product → brand mapping), top products, top categories, repeat-customer rate, avg delivery distance, peak hours heatmap (day-of-week × hour).
- Export CSV.

### 6. Settings
- Brand info (logos, tagline), business hours, delivery zones & fees, notification sound toggle, admin user list (read from Firebase Auth), sign-out.

## Auth

- Firebase Auth (email/password) using the provided config.
- `src/routes/auth.tsx` — sign-in page (no signup; admins are added in Firebase console).
- `src/routes/_authenticated/route.tsx` — guards every dashboard route; redirects to `/auth` if no Firebase user.
- `onAuthStateChange` listener in `__root.tsx` keeps router state in sync.
- Optional: gate further via a `roles/{uid}` doc with `admin: true` to prevent any signed-in Firebase user from accessing.

## Data model (Firestore collections)

```text
/orders                    (existing — read + status updates)
/categories/{id}           { brand: 'chaat'|'juice', name, slug, icon, sortOrder, active }
/products/{id}             { brand, categoryId, name, description, images[],
                             sellingPrice, mrp, discountPct,
                             competitorPrices: [{platform, price, url}],
                             variants: [{name, price, sku}],
                             inStock, stockQty, tags[], prepTimeMin,
                             isVeg, spiceLevel, featured, active, createdAt, updatedAt }
/combos/{id}               { brand, name, image, items:[{productId, variant, qty}],
                             comboPrice, competitorPrices[], active }
/roles/{uid}               { admin: true }
/settings/site             { hours, deliveryZones, notificationSound, ... }
```

Firestore security rules will need to be tightened by the user (we can provide a starter ruleset that allows read/write only to UIDs in `/roles` with `admin: true`).

## Technical setup

- `bun add firebase` — Firebase Web SDK v10 (modular).
- `src/integrations/firebase/client.ts` — initialize app, export `auth`, `db`, `storage`. Uses the provided config; the `apiKey` is a public Firebase web key (safe in client), but we'll still store it via Lovable secrets and read through `import.meta.env.VITE_FIREBASE_API_KEY` for cleanliness.
- React Query for caching + `onSnapshot` wrappers for live tables.
- TanStack Router file-based routes under `src/routes/_authenticated/`.
- shadcn sidebar (`collapsible="icon"`) for the responsive nav — collapses to icons on tablet, drawer on mobile.
- Tables: `@tanstack/react-table` for sorting/filtering/pagination.
- Charts: `recharts`.
- Drag-reorder categories: `@dnd-kit/sortable`.
- Image uploads: Firebase Storage (`bombaiwala-chat.firebasestorage.app`).
- Mobile responsive throughout: cards collapse to stacked layout < md, tables become accordion rows on mobile, sidebar becomes a Sheet drawer.

## Build order

1. Firebase client + auth guard + sign-in page + sidebar shell with brand colors/fonts.
2. Orders page (real data, normalizer, live updates, status update, drawer).
3. Categories CRUD (Chaat, then Juice reuses the same component).
4. Products CRUD with variants + competitor prices + image upload.
5. Combos CRUD.
6. Dashboard overview + Analytics.
7. Customers (derived view).
8. Settings + polish + mobile pass.

## Things I need from you before/while building

- Email of the first admin user (so I can tell you to create it in Firebase Console → Authentication → Add user, then add their UID to `/roles`).
- Confirm the Firestore `apiKey` — your message has `@secret:GOOGLE_API_KEY` as the value. Firebase web `apiKey` is public-safe; I'll wire it as `VITE_FIREBASE_API_KEY` and ask you to paste the real key.
- Whether you want me to also write a starter `firestore.rules` file for you to paste into Firebase Console (recommended — without it your dashboard data is wide open).
