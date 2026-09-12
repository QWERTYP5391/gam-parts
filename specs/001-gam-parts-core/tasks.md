# Tasks: GAM Parts Core Marketplace

**Input**: Design documents from `specs/001-gam-parts-core/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — Next.js App Router with all required dependencies

- [x] T001 Initialize Next.js project with App Router, TypeScript strict mode, and Tailwind CSS in project root
- [x] T002 Install all dependencies: next, react, react-dom, drizzle-orm, @auth/drizzle-adapter, next-auth@5, zod, @hookform/resolvers, react-hook-form, nuqs, sharp, pg, and dev dependencies: drizzle-kit, @types/node, @types/react, typescript, @playwright/test, eslint, eslint-config-next, prettier
- [x] T003 [P] Configure TypeScript strict mode with noUncheckedIndexedAccess and path alias @/* → ./src/* in tsconfig.json
- [x] T004 [P] Configure ESLint with Next.js recommended config and Prettier in .eslintrc.json and .prettierrc
- [x] T005 [P] Create typed environment variables with Zod validation in src/env.ts (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
- [x] T006 [P] Create ActionResponse<T> type and shared Zod schema utilities in src/lib/types.ts
- [x] T007 Install and configure shadcn/ui with base primitives (Button, Input, Label, Card, Select, Table, Badge, Dialog, Textarea, DropdownMenu) in src/components/ui/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, auth, and routing infrastructure that MUST be complete before ANY user story

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create Drizzle database client in src/lib/db/index.ts connecting to PostgreSQL using DATABASE_URL from src/env.ts
- [x] T009 Define complete Drizzle schema for all 9 tables in src/lib/db/schema.ts: users, towns, partListings, partListingImages, partVehicles, partRequests, quotes, notifications, dealerStats (per data-model.md)
- [x] T010 Create drizzle.config.ts at project root and run initial migration with drizzle-kit push
- [x] T011 Create Gambian town seed data (~50-100 towns with coordinates) in src/lib/db/seed.ts and a seed script in package.json
- [x] T012 [P] Configure Auth.js v5 with Drizzle adapter, credentials provider, database sessions, and custom role field in src/lib/auth.ts
- [x] T013 [P] Create Auth.js API route handler in src/app/api/auth/[...nextauth]/route.ts
- [x] T014 Create edge middleware for route protection in src/middleware.ts — protect all (dashboard) routes, redirect unauthenticated users to /login
- [x] T015 [P] Create Haversine distance helper function in src/lib/towns.ts for computing distance between two towns by their coordinates
- [x] T016 Create root layout with auth session provider in src/app/layout.tsx
- [x] T017 Create landing page with links to login/register in src/app/page.tsx
- [x] T018 [P] Create notification helper function for creating notifications in src/lib/actions/notifications.ts (createNotification utility, getNotifications, markNotificationRead Server Actions)

**Checkpoint**: Foundation ready — database, auth, middleware, and shared utilities in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Account Registration by Role (Priority: P1) MVP

**Goal**: Users can register with one of three roles (Vehicle Owner, Mechanic, Dealer) and see a role-specific dashboard. Login/logout works with session persistence.

**Independent Test**: Register three accounts (one per role), verify each sees correct dashboard. Attempt cross-role access and verify denial.

### Implementation for User Story 1

- [x] T019 [US1] Implement registerUser Server Action in src/lib/actions/auth.ts — Zod-validated input (email, password, name, phone, role, townId), hash password, create user, return ActionResponse
- [x] T020 [US1] Implement loginUser Server Action in src/lib/actions/auth.ts — delegates to Auth.js signIn(), returns ActionResponse
- [x] T021 [P] [US1] Create registration form client component in src/components/auth/register-form.tsx — react-hook-form with Zod resolver, role selector (Vehicle Owner / Mechanic / Dealer), town dropdown, all fields with data-testid attributes
- [x] T022 [P] [US1] Create login form client component in src/components/auth/login-form.tsx — react-hook-form with Zod resolver, email/password fields, all fields with data-testid attributes
- [x] T023 [US1] Create register page (RSC) at src/app/(auth)/register/page.tsx — renders register-form component
- [x] T024 [US1] Create login page (RSC) at src/app/(auth)/login/page.tsx — renders login-form component
- [x] T025 [US1] Create authenticated dashboard layout at src/app/(dashboard)/layout.tsx — navigation bar with role-aware links, notification bell, logout button, all with data-testid attributes
- [x] T026 [US1] Create role-specific dashboard page at src/app/(dashboard)/dashboard/page.tsx — read session, display role-appropriate sections (Vehicle Owner: search + requests, Mechanic: search + requests + clients, Dealer: inventory + incoming requests)
- [x] T027 [US1] Update middleware in src/middleware.ts to enforce role-based route access — dealers only for /inventory, vehicle_owner and mechanic only for /requests/new
- [x] T028 [US1] Write Playwright E2E test in tests/e2e/auth-registration.spec.ts — register as each role, verify dashboard content, test duplicate email error, test login/logout, test cross-role access denial

**Checkpoint**: User Story 1 complete. Three roles can register, log in, see role-specific dashboards, and are blocked from unauthorized routes.

---

## Phase 4: User Story 2 — Find a Part (Priority: P1)

**Goal**: Vehicle Owners and Mechanics can search for parts by name and vehicle details, see results with dealer info, sort results, and get fuzzy match suggestions.

**Independent Test**: Search for a known part, verify all result fields display. Search with misspelling, verify "Did you mean?" suggestion.

**Dependencies**: Requires dealer inventory data to exist (US4 provides the UI, but we can seed test data directly)

### Implementation for User Story 2

- [x] T029 [US2] Implement searchParts Server Action in src/lib/actions/search.ts — Zod-validated input (query, vehicleMake, vehicleModel, vehicleYear, sortBy, page, limit), pg_trgm fuzzy matching via Drizzle SQL, join partListings → partVehicles → users → towns, return paginated results with matchScore and distanceKm
- [x] T030 [US2] Enable pg_trgm extension and create GIN trigram index on partListings.name in a migration (add to src/lib/db/schema.ts index definitions and run drizzle-kit push)
- [x] T031 [US2] Create search form client component in src/components/search/search-form.tsx — react-hook-form with part name, vehicle make/model/year fields, sort dropdown (price/distance/availability), nuqs for URL search params, all with data-testid attributes
- [x] T032 [US2] Create search results RSC component in src/components/search/search-results.tsx — displays result cards with dealer name, location, price, quantity, condition, availability, fulfillment time, last-updated timestamp, images, and match score
- [x] T033 [US2] Create search page (RSC) at src/app/(dashboard)/search/page.tsx — renders search-form and search-results, reads search params via nuqs, calls searchParts, shows "No results" with link to create Part Request
- [x] T034 [US2] Write Playwright E2E test in tests/e2e/part-search.spec.ts — seed dealer with inventory, search by name + vehicle, verify result fields, test sorting, test fuzzy match suggestion, test empty results message

**Checkpoint**: User Story 2 complete. Part search with fuzzy matching, sorting, and pagination works end to end.

---

## Phase 5: User Story 3 — Part Request System (Priority: P2)

**Goal**: Vehicle Owners and Mechanics can create Part Requests when search fails. Dealers receive notifications, submit quotes. Requesters compare and accept quotes.

**Independent Test**: Create a request, dealer submits a quote, requester accepts it. Verify notifications at each step.

### Implementation for User Story 3

- [x] T035 [US3] Implement createPartRequest Server Action in src/lib/actions/requests.ts — Zod-validated input (partName, vehicleMake, vehicleModel, vehicleYear, urgency, notes), create request, notify relevant dealers, return ActionResponse
- [x] T036 [US3] Implement submitQuote Server Action in src/lib/actions/requests.ts — Zod-validated input (requestId, price, isAvailable, fulfillmentDays, notes), validate request status is not 'accepted', enforce one quote per dealer per request, update request status to 'quoted' on first quote, notify requester
- [x] T037 [US3] Implement acceptQuote Server Action in src/lib/actions/requests.ts — validate ownership, set quote to 'accepted', decline other quotes, set request status to 'accepted', notify dealer, update DealerStats
- [x] T038 [P] [US3] Create part request form client component in src/components/requests/request-form.tsx — react-hook-form with part name, vehicle details, urgency selector (low/medium/high), notes textarea, data-testid attributes
- [x] T039 [P] [US3] Create quote submission form client component in src/components/requests/quote-form.tsx — react-hook-form with price, availability toggle, fulfillment days, notes, data-testid attributes
- [x] T040 [US3] Create part requests list page (RSC) at src/app/(dashboard)/requests/page.tsx — show user's requests (for vehicle owners/mechanics) or available requests (for dealers), filter by status, data-testid attributes
- [x] T041 [US3] Create request detail page (RSC) at src/app/(dashboard)/requests/[id]/page.tsx — show request details, list quotes side by side (for requester), show quote form (for dealers), accept button on quotes, data-testid attributes
- [x] T042 [US3] Create notification bell client component in src/components/notifications/notification-bell.tsx — displays unread count badge, dropdown with recent notifications, mark-as-read on click, data-testid attributes
- [x] T043 [US3] Write Playwright E2E test in tests/e2e/part-request-flow.spec.ts — create request, verify dealer notification, submit quote, verify requester notification, compare quotes, accept quote, verify status changes

**Checkpoint**: User Story 3 complete. Full request → quote → accept cycle works with notifications at each step.

---

## Phase 6: User Story 4 — Dealer Inventory Management (Priority: P2)

**Goal**: Dealers can add, edit, deactivate, and delete part listings with photos and vehicle compatibility info.

**Independent Test**: Dealer adds a part with photos and vehicle info, edits price, marks out of stock, deletes listing. Verify each state change.

### Implementation for User Story 4

- [x] T044 [US4] Implement addPartListing Server Action in src/lib/actions/inventory.ts — Zod-validated input (name, description, price, quantity, condition, fulfillmentDays, vehicles array, images), handle image upload with sharp resize, create listing + partVehicles + partListingImages, return ActionResponse
- [x] T045 [US4] Implement updatePartListing Server Action in src/lib/actions/inventory.ts — Zod-validated partial input, verify dealer ownership, update listing fields, replace vehicles if provided, update updatedAt timestamp
- [x] T046 [US4] Implement deletePartListing Server Action in src/lib/actions/inventory.ts — verify dealer ownership, cascade delete images/vehicles, hard delete listing
- [x] T047 [US4] Create listing form client component in src/components/inventory/listing-form.tsx — react-hook-form with part name, description, price, quantity, condition selector, fulfillment days, dynamic vehicle compatibility rows (make/model/yearFrom/yearTo), image upload (max 4, JPEG/PNG, 5MB), data-testid attributes
- [x] T048 [US4] Create dealer inventory list page (RSC) at src/app/(dashboard)/inventory/page.tsx — display dealer's listings in a table with name, price, quantity, condition, status (active/inactive/out of stock), last updated, edit/deactivate/delete actions, data-testid attributes
- [x] T049 [US4] Create add part listing page (RSC) at src/app/(dashboard)/inventory/new/page.tsx — renders listing-form component for creating new listings
- [x] T050 [US4] Create edit part listing page (RSC) at src/app/(dashboard)/inventory/[id]/edit/page.tsx — pre-populates listing-form with existing data for editing
- [x] T051 [US4] Create public uploads directory structure and configure Next.js to serve uploaded images from public/uploads/ in next.config.ts
- [x] T052 [US4] Write Playwright E2E test in tests/e2e/dealer-inventory.spec.ts — add listing with photo and vehicle info, verify in inventory table, edit price, verify update, mark out of stock, verify hidden from search, delete listing, verify removal

**Checkpoint**: User Story 4 complete. Dealers can fully manage their inventory with photos, vehicle compatibility, and lifecycle states.

---

## Phase 7: User Story 5 — Smart Dealer Matching (Priority: P3)

**Goal**: Search results and Part Request notifications are ranked by a weighted scoring model considering match accuracy, proximity, response history, and fulfillment reliability.

**Independent Test**: Seed two dealers in different towns, search for same part. Verify closer dealer with better stats ranks higher.

### Implementation for User Story 5

- [x] T053 [US5] Implement smart dealer matching algorithm in src/lib/matching.ts — weighted scoring function: matchAccuracy (40%) from pg_trgm similarity, proximity (30%) from Haversine distance, responseRate (15%) from DealerStats, fulfillmentReliability (15%) from DealerStats. New dealers get neutral 0.5 scores.
- [x] T054 [US5] Integrate matching algorithm into searchParts Server Action in src/lib/actions/search.ts — apply matchScore to results, use as default sort order when sortBy='relevance'
- [x] T055 [US5] Integrate matching into Part Request dealer notification in src/lib/actions/requests.ts — prioritize notifications to dealers with higher match scores for the requested part
- [x] T056 [US5] Add DealerStats update logic — update stats when quote is submitted (totalQuotes, avgResponseHours) and when quote is accepted (acceptedQuotes, avgFulfillmentDays) in src/lib/actions/requests.ts
- [x] T057 [US5] Write Playwright E2E test in tests/e2e/smart-matching.spec.ts — seed two dealers in different towns with same part, log in as user in same town as Dealer A, search, verify Dealer A ranks higher, modify DealerStats, re-verify ranking

**Checkpoint**: User Story 5 complete. Smart matching ranks dealers by multi-factor weighted score across search and requests.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all user stories

- [x] T058 [P] Add loading states and error boundaries to all client components (search-form, register-form, login-form, listing-form, request-form, quote-form)
- [x] T059 [P] Ensure all interactive elements have data-testid attributes — audit all components in src/components/ and src/app/
- [x] T060 [P] Add mobile-responsive styles to all pages — verify Tailwind responsive classes on dashboard layout, search results, inventory table, request list
- [x] T061 Run tsc --noEmit and fix any TypeScript errors across the entire codebase
- [x] T062 Run ESLint and Prettier across the codebase, fix all violations
- [x] T063 Remove all console.log statements from production code, replace with structured logging where needed
- [x] T064 Run all 5 Playwright E2E test suites and fix any failures: npx playwright test tests/e2e/
- [x] T065 Run quickstart.md validation scenarios end to end against a fresh database

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — first story, provides auth for all others
- **US2 (Phase 4)**: Depends on Foundational + benefits from US4 data (can seed test data)
- **US3 (Phase 5)**: Depends on Foundational — independent of US2/US4
- **US4 (Phase 6)**: Depends on Foundational — independent of US2/US3
- **US5 (Phase 7)**: Depends on US2 (search action) and US3 (request actions) for integration
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational
    ↓
    ├── Phase 3: US1 (Auth & Dashboards) ─── MVP CHECKPOINT
    │       ↓
    ├── Phase 4: US2 (Search) ──────────┐
    ├── Phase 5: US3 (Requests/Quotes) ─┤── Can run in parallel after US1
    ├── Phase 6: US4 (Inventory) ───────┘
    │       ↓
    └── Phase 7: US5 (Smart Matching) ──── Needs US2 + US3
            ↓
    Phase 8: Polish
```

### Parallel Opportunities Per User Story

**US1**: T021 (register-form) and T022 (login-form) can run in parallel
**US2**: T031 (search-form) can start while T029 (searchParts action) is in progress
**US3**: T038 (request-form) and T039 (quote-form) can run in parallel
**US4**: T047 (listing-form) can start while T044 (addPartListing action) is in progress
**US5**: T053 (matching algorithm) is independent of T056 (stats update logic)

---

## Parallel Example: User Story 1

```text
# After Foundational phase, launch in parallel:
Task T021: "Create register-form client component in src/components/auth/register-form.tsx"
Task T022: "Create login-form client component in src/components/auth/login-form.tsx"

# Then sequentially (depends on forms):
Task T023: "Create register page at src/app/(auth)/register/page.tsx"
Task T024: "Create login page at src/app/(auth)/login/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Auth & Dashboards)
4. **STOP and VALIDATE**: Register 3 accounts, verify dashboards, test access control
5. Deploy/demo if ready — users can create accounts and see role-specific dashboards

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Auth) → **MVP!** Users can register and log in
3. Add US4 (Inventory) → Dealers can list parts (supply side)
4. Add US2 (Search) → Buyers can find parts (demand meets supply)
5. Add US3 (Requests) → Request/quote flow for unlisted parts
6. Add US5 (Smart Matching) → Enhanced ranking
7. Polish → Production-ready quality

### Parallel Team Strategy

With multiple developers after Foundational is complete:
- Developer A: US1 (Auth) → US5 (Matching)
- Developer B: US2 (Search) + US4 (Inventory)
- Developer C: US3 (Requests/Quotes)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All Server Actions return ActionResponse<T> per constitution
- All client components use react-hook-form + Zod per constitution
- All interactive elements must have data-testid attributes per constitution
