# GAM Parts

A digital automotive spare parts marketplace for The Gambia that connects vehicle owners, mechanics, and spare parts dealers. Search for parts, request quotes from multiple dealers, and find the best match by price, proximity, and reliability.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React Server Components)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Auth**: Auth.js v5 (NextAuth) with credentials provider
- **Validation**: Zod
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: nuqs (URL params), react-hook-form (forms)
- **Testing**: Playwright (E2E), Vitest (unit/integration)

## Features

- **Role-based accounts** — Vehicle owners, mechanics, and dealers each get tailored dashboards and permissions
- **Part search** — Full-text fuzzy search powered by PostgreSQL `pg_trgm`, with filters for vehicle make/model/year and sorting by price, distance, or relevance
- **Part requests & quotes** — Buyers post what they need; dealers submit competing quotes; buyers compare and accept
- **Dealer inventory** — Dealers manage listings with pricing, quantity, condition (new/used/refurbished), vehicle compatibility, and fulfillment time
- **Smart dealer matching** — Weighted scoring ranks dealers by inventory match, geographic proximity, response history, and fulfillment reliability

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)

## Getting Started

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker compose up -d

# Push database schema and enable fuzzy search
npm run db:push

# Seed Gambian towns
npm run db:seed

# Start dev server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=postgresql://gamparts:gamparts_dev@127.0.0.1:5433/gamparts
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login & registration pages
│   ├── (dashboard)/      # Protected routes
│   │   ├── dashboard/    # Role-specific dashboard
│   │   ├── inventory/    # Dealer inventory CRUD
│   │   ├── requests/     # Part requests & quotes
│   │   └── search/       # Part search
│   └── api/auth/         # Auth.js route handler
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── auth/             # Login & register forms
│   ├── inventory/        # Listing form, delete button
│   ├── requests/         # Request & quote forms
│   ├── search/           # Search form & results
│   └── notifications/    # Notification bell
├── lib/
│   ├── actions/          # Server Actions (auth, inventory, requests, search)
│   ├── db/               # Drizzle schema, client, seed
│   ├── auth.ts           # NextAuth config (full)
│   ├── auth.config.ts    # NextAuth config (edge-safe)
│   ├── matching.ts       # Dealer matching algorithm
│   └── towns.ts          # Gambian towns + Haversine distance
└── middleware.ts          # Route protection
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed towns data |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:e2e` | Run Playwright E2E tests |

## Testing

```bash
# Unit & integration tests
npm run test

# E2E tests (requires dev server + database)
npm run test:e2e
```

**E2E test coverage by user story:**

| Suite | Tests | Covers |
|-------|-------|--------|
| auth-registration | 13 | Registration, login, logout, route protection |
| part-search | 6 | Search, filters, sorting, empty state |
| part-request-flow | 8 | Requests, quotes, acceptance |
| dealer-inventory | 7 | Add, edit, delete listings, access control |
| smart-matching | 6 | Multi-dealer results, sort by relevance/price/distance |

## Architecture

- **Server Components** by default; `"use client"` only at leaf level for interactivity
- **Server Actions** handle all backend logic — no standalone API routes
- All actions return a discriminated union: `{ success: true; data: T } | { success: false; error: string }`
- **Edge middleware** enforces authentication and role-based route access
- **Haversine formula** calculates distances between Gambian towns for proximity sorting

## License

Private
