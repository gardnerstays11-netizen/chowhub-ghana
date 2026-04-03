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

### API Routes (under `/api`)
- Auth: `/auth/register`, `/auth/login`, `/auth/me`, `/auth/vendor/*`, `/auth/admin/login`
- Listings: `/listings` (search), `/listings/featured`, `/listings/recent`, `/listings/top-rated`, `/listings/nearby`, `/listings/categories-count`, `/listings/cities-count`, `/listings/cuisines-count`, `/listings/:slug`
- Menu: `/listings/:listingId/menu`
- Reviews: `/listings/:listingId/reviews`, `/reviews/mine`
- Reservations: `/reservations`, `/reservations/mine`
- Orders: `/orders`, `/orders/mine`
- Saved: `/saved`, `/saved/:listingId`
- Vendor Portal: `/vendor/listing`, `/vendor/menu`, `/vendor/photos`, `/vendor/reservations`, `/vendor/orders`, `/vendor/reviews`, `/vendor/stats`
- Admin: `/admin/stats`, `/admin/vendors`, `/admin/listings`, `/admin/users`, `/admin/reviews`

### Design System
- **Colors**: Deep green `hsl(152 45% 22%)` (primary), Amber/Gold `hsl(38 75% 50%)` (secondary), Warm off-white `hsl(48 33% 97%)` (background)
- **Fonts**: Fraunces (display/headings — variable optical-size serif), DM Sans (body)
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

- `/` — Homepage (hero search, categories, featured & recent listings)
- `/search` — Search/browse with filters (city, category, cuisine)
- `/listings/:slug` — Listing detail (description, menu, hours, Call Now, WhatsApp)
- `/login`, `/register` — User auth
- `/dashboard` — User dashboard (reservations, orders, saved, reviews)
- `/vendor/login`, `/vendor/register` — Vendor auth
- `/vendor/dashboard` — Vendor dashboard (manage listing, menu, orders, reservations)
- `/admin/login` — Admin login
- `/admin/dashboard` — Admin dashboard (stats, vendor approval, listing moderation)

## Vite Proxy

The chowdeck Vite config proxies `/api` requests to `http://localhost:8080` (the API server).
