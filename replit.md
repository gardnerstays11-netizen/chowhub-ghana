# ChowHub Ghana — Food & Dining Discovery Platform

## Overview

Full-stack food discovery platform for the Ghanaian market. pnpm workspace monorepo with TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite + Tailwind CSS v4
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: JWT (bcrypt + jsonwebtoken), stored in localStorage
- **Build**: esbuild (API server), Vite (frontend)

## Architecture

### Artifacts
- `artifacts/api-server` — Express API server (port 8080)
- `artifacts/chowdeck` — React + Vite web app (previewPath `/`)
- `artifacts/mobile` — Expo React Native mobile app (port 18115, previewPath `/mobile`)
- `artifacts/mockup-sandbox` — Component Preview Server

### Libraries
- `lib/api-spec` — OpenAPI specification
- `lib/api-zod` — Zod schemas generated from OpenAPI
- `lib/api-client-react` — React Query hooks + custom fetch client
- `lib/db` — Drizzle ORM schema and database connection

### Database Schema (PostgreSQL)
- `users` — User accounts (role: user/admin)
- `vendors` — Vendor accounts (status: pending/approved/rejected, plan: free/premium)
- `listings` — Restaurant/food spot listings
- `listing_photos` — Listing photos
- `menu_items` — Menu items per listing
- `reviews` — User reviews with sub-ratings (food, service, ambience, value)
- `reservations` — Table reservations
- `orders` — Food orders (delivery/pickup)
- `saved_places` — User saved/bookmarked listings
- `subscriptions` — Vendor subscription records
- `search_logs` — Search query logs for analytics (query, city, category, filters, resultsCount, userId, sessionId)
- `partners` — Partner logos for homepage display (name, logoUrl, website, sortOrder, active)
- `vendor_events` — Vendor events for discovery feed (title, description, eventDate, endDate, imageUrl, category, listingId, vendorId)
- `site_settings` — Key-value site configuration (branding, SEO meta, analytics IDs, social links, custom scripts)
- `listing_views` — Page view tracking per listing (listingId, userId, sessionId, ipHash, createdAt)
- `subscription_packages` — Admin-managed subscription tiers (name, slug, price, billingCycle, features, maxPhotos, maxMenuItems, analytics access, featured badge, priority support)

### API Routes (under `/api`)
- Auth: `/auth/register`, `/auth/login`, `/auth/me`, `/auth/vendor/*`, `/auth/admin/login`
- Listings: `/listings` (search), `/listings/featured`, `/listings/recent`, `/listings/top-rated`, `/listings/popular`, `/listings/trending`, `/listings/nearby`, `/listings/autocomplete`, `/listings/categories-count`, `/listings/cities-count`, `/listings/cuisines-count`, `/listings/:slug`
- Events: `GET /events/upcoming` (public), `GET/POST/PUT/DELETE /vendor/events`, `GET /admin/events`
- Search Logs: `POST /search-logs` (log search queries for analytics)
- Menu: `/listings/:listingId/menu`
- Reviews: `/listings/:listingId/reviews`, `/reviews/mine`
- Reservations: `/reservations`, `/reservations/mine`
- Orders: `/orders`, `/orders/mine`
- Saved: `/saved`, `/saved/:listingId`
- Vendor Portal: `/vendor/listing`, `/vendor/menu`, `/vendor/photos`, `/vendor/reservations`, `/vendor/orders`, `/vendor/reviews`, `/vendor/stats`
- Admin: `/admin/stats`, `/admin/vendors`, `/admin/listings`, `/admin/users`, `/admin/reviews`, `/admin/search-analytics`, `/admin/partners`
- Partners: `GET /partners` (public active list), `POST/PUT/DELETE /admin/partners`
- Storage: `POST /storage/uploads/request-url`, `GET /storage/objects/*`
- Site Settings: `GET /site-settings` (public), `PUT /admin/site-settings` (admin update)
- Listing Views: `POST /listings/:slug/view` (track view), `GET /listings/:id/views` (view analytics)
- Subscription Packages: `GET/POST /admin/subscription-packages`, `PUT/DELETE /admin/subscription-packages/:id`
- Platform Analytics: `GET /admin/platform-analytics` (page views, top listings, daily trends)

### Design System
- **Colors**: Deep green `hsl(152 45% 22%)` (primary), Amber/Gold `hsl(38 75% 50%)` (secondary), Warm off-white `hsl(48 33% 97%)` (background)
- **Fonts**: Fraunces (display/headings — variable optical-size serif), Inter (body). Mobile uses Inter for all text (400/500/600/700 weights via @expo-google-fonts/inter)
- **Border radius**: `0.5rem` base — tight, editorial feel; no rounded-3xl/rounded-full on containers
- **Theme**: Clean editorial, warm Ghanaian palette, minimal badge usage

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed database with sample data

## Seed Data Credentials

- Admin: admin@chowhub.gh / admin123
- User: ama@example.com / password123
- User: kofi@example.com / password123
- Vendor (premium): muni@chowhub.gh / password123
- Vendor (free): chopbar@chowhub.gh / password123

## Frontend Pages

- `/` — Homepage (hero search with autocomplete, categories, nearby listings via geolocation, featured & recent listings, "Meet Our Partners" section)
- `/search` — Advanced search/browse with autocomplete, filters (cuisine type, price range, dining style, reservations/orders), sort (highest rated, most reviewed, newest, featured, price), search logging
- `/listings/:slug` — Listing detail (description, menu grouped by category, hours, Call Now, WhatsApp, Get Directions via Google Maps)
- `/login`, `/register` — User auth
- `/dashboard` — User dashboard (reservations, orders, saved, reviews)
- `/vendor/login`, `/vendor/register` — Vendor auth
- `/vendor/dashboard` — Vendor dashboard (stat cards, reservations/orders management with VendorLayout)
- `/vendor/menu` — Menu Management (CRUD with category, price, available/popular toggles)
- `/vendor/events` — Event Management (CRUD with datetime pickers and category icons)
- `/vendor/photos` — Photo Gallery (grid view with hover delete)
- `/vendor/reviews` — Customer Reviews (read-only with sub-ratings)
- `/vendor/analytics` — Analytics (daily view/order bar charts + stat cards)
- `/vendor/settings` — Vendor Settings (toggle acceptsReservations and acceptsOrders for listing)
- `/admin/login` — Admin login
- `/admin/dashboard` — Admin dashboard (stats, search analytics, vendor approval, listing moderation) — uses shared AdminLayout
- `/admin/partners` — Manage partner logos (add, edit, delete, toggle visibility, upload logos via object storage) — uses shared AdminLayout
- `/admin/settings` — Site Settings (General: name/tagline/logo/favicon/colors, SEO: meta tags/OG image/keywords, Analytics: GA4/GTM/Facebook Pixel/Hotjar, Social: contact info & social links) — uses shared AdminLayout
- `/admin/subscriptions` — Subscription Packages management (create, edit, delete plans with pricing, features, limits) — uses shared AdminLayout

## Mobile App (Expo)

- **Tabs**: Home (Discover feed: stat banner, categories, nearby, featured picks, top rated, popular joints, trending spots, quick bites, cafes & bakeries, upcoming events, recently added, partners), Search (autocomplete, category chips, sort filters, recent searches, search logging), Saved, Profile
- **Vendor Dashboard**: Enhanced with view counts (total + unique), orders (total, today, weekly, monthly), reservations, rating/reviews, daily views/orders mini-charts, performance overview, quick-action links to Menu & Events management
- **Vendor Menu Management** (`vendor/menu`): Full CRUD for menu items (name, description, price, category, availability toggle, popular badge), grouped by category
- **Vendor Event Management** (`vendor/events`): Full CRUD for events (title, description, dates, category, image URL), past/upcoming visual distinction
- **Listing Detail Quick Order** (`listing/[slug]`): "Add to Order" buttons on menu items, inline quantity controls, floating cart bar (count + total), checkout modal sheet (pickup/delivery, delivery address, note, place order)
- **Screens**: Listing detail (`listing/[slug]`), Auth (login/register), Vendor portal (login/register/dashboard/menu/events), Admin portal (login/dashboard), User screens (reservations/orders/reviews)
- **Auth**: JWT stored in AsyncStorage via AuthContext, supports user/vendor/admin modes
- **API**: Uses `@workspace/api-client-react` generated hooks with `setBaseUrl` pointing to `EXPO_PUBLIC_DOMAIN`
- **Tab bar**: NativeTabs with liquid glass (iOS 26+), classic BlurView Tabs fallback
- **Design**: Same color palette as web (deep green/amber/cream), Inter font throughout

## Vite Proxy

The chowdeck Vite config proxies `/api` requests to `http://localhost:8080` (the API server).
