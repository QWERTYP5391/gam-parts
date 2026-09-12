# Implementation Plan: GAM Parts Core Marketplace

**Branch**: `001-gam-parts-core` | **Date**: 2026-09-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-gam-parts-core/spec.md`

## Summary

Build a digital automotive spare parts marketplace for The Gambia connecting three user roles (Vehicle Owners, Mechanics, Spare Parts Dealers) with core features: role-based authentication, part search with fuzzy matching, part request/quote system, dealer inventory management, and smart dealer matching. Built as a Next.js App Router application with PostgreSQL/Drizzle ORM, Auth.js v5, and Server Actions as the sole backend interface.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js 18+

**Primary Dependencies**: Next.js (App Router), Auth.js v5, Drizzle ORM, Zod, Tailwind CSS, shadcn/ui, nuqs, react-hook-form, sharp

**Storage**: PostgreSQL 15+ with `pg_trgm` extension for fuzzy search

**Testing**: Playwright E2E (`tests/e2e/*.spec.ts`) targeting `data-testid` selectors

**Target Platform**: Web (modern browsers, mobile-responsive), deployed on Vercel

**Project Type**: Web application (Next.js full-stack)

**Performance Goals**: Search results <2s for 50,000 listings, 500 concurrent users

**Constraints**: Web-only v1, no payment processing, in-app notifications only (no email/SMS), English language, town-level location (no GPS)

**Scale/Scope**: ~10 routes, 9 database tables, 12 Server Actions, 5 Playwright E2E test suites

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Server Components First | PASS | All pages are RSC by default. `"use client"` only on search form, registration form, inventory form, quote form, notification bell |
| II. Server Actions as Backend | PASS | All mutations via Server Actions. No API routes. All return `ActionResponse<T>`. Zod validation on all inputs |
| III. Type Safety | PASS | Strict mode, Zod schemas for all action payloads, typed env vars in `src/env.ts` |
| IV. Test-Driven Verification | PASS | 5 Playwright E2E test suites defined in quickstart.md. All interactive elements will have `data-testid` |
| V. Simplicity | PASS | Flat part categorization, static town lookup, weighted scoring (no ML), filesystem image storage for v1 |

**Post-Phase 1 re-check**: All design artifacts (data-model.md, contracts/server-actions.md) conform to constitution. No violations detected.

## Project Structure

### Documentation (this feature)

```text
specs/001-gam-parts-core/
├── plan.md              # This file
├── research.md          # Phase 0 output — 7 research decisions
├── data-model.md        # Phase 1 output — 9 entities with relationships and indexes
├── quickstart.md        # Phase 1 output — 5 validation scenarios
├── contracts/
│   └── server-actions.md  # Phase 1 output — 12 Server Action contracts
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                 # Root layout with auth provider
│   ├── page.tsx                   # Landing page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Authenticated layout with nav
│   │   ├── dashboard/page.tsx     # Role-specific dashboard
│   │   ├── search/page.tsx        # Part search
│   │   ├── requests/
│   │   │   ├── page.tsx           # Part requests list
│   │   │   └── [id]/page.tsx      # Request detail with quotes
│   │   └── inventory/
│   │       ├── page.tsx           # Dealer inventory list
│   │       └── new/page.tsx       # Add part listing form
│   └── api/
│       └── auth/[...nextauth]/route.ts  # Auth.js route handler
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── auth/
│   │   ├── login-form.tsx         # "use client"
│   │   └── register-form.tsx      # "use client"
│   ├── search/
│   │   ├── search-form.tsx        # "use client"
│   │   └── search-results.tsx     # RSC
│   ├── requests/
│   │   ├── request-form.tsx       # "use client"
│   │   └── quote-form.tsx         # "use client"
│   ├── inventory/
│   │   └── listing-form.tsx       # "use client"
│   └── notifications/
│       └── notification-bell.tsx   # "use client"
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema (all 9 tables)
│   │   ├── index.ts              # Database client
│   │   └── seed.ts               # Town seed data
│   ├── actions/
│   │   ├── auth.ts               # registerUser, loginUser
│   │   ├── search.ts             # searchParts
│   │   ├── requests.ts           # createPartRequest, submitQuote, acceptQuote
│   │   ├── inventory.ts          # addPartListing, updatePartListing, deletePartListing
│   │   └── notifications.ts      # getNotifications, markNotificationRead
│   ├── auth.ts                   # Auth.js v5 config
│   ├── matching.ts               # Smart dealer matching algorithm
│   └── towns.ts                  # Haversine distance helper
├── env.ts                         # Typed environment variables (Zod)
└── middleware.ts                  # Auth.js edge middleware route guards

tests/
└── e2e/
    ├── auth-registration.spec.ts
    ├── dealer-inventory.spec.ts
    ├── part-search.spec.ts
    ├── part-request-flow.spec.ts
    └── smart-matching.spec.ts
```

**Structure Decision**: Next.js App Router with colocated route groups. Auth routes in `(auth)` group (unauthenticated). All authenticated routes in `(dashboard)` group with shared layout and middleware protection. Server Actions in `src/lib/actions/` organized by domain. Client components at leaf level only, colocated by feature domain under `src/components/`.

## Complexity Tracking

No constitution violations detected. No complexity justifications needed.
