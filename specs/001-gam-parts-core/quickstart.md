# Quickstart Validation Guide: GAM Parts Core Marketplace

**Feature**: specs/001-gam-parts-core/spec.md
**Date**: 2026-09-06

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ running locally (with `pg_trgm` extension enabled)
- Project dependencies installed (`npm install`)
- Environment variables configured (see `src/env.ts` for required vars)
- Database migrated (`npx drizzle-kit push`)
- Town seed data loaded
- Dev server running (`npm run dev`)

## Validation Scenarios

### Scenario 1: Account Registration & Role-Based Dashboard

**Covers**: User Story 1 (P1), FR-001, FR-002, FR-003, FR-015

**Steps**:

1. Navigate to `/register`
2. Fill in registration form: email, password, name, phone, select "Spare Parts Dealer", choose town
3. Submit the form
4. Verify redirect to dealer dashboard showing inventory management and incoming requests sections
5. Log out
6. Register a second account with role "Vehicle Owner"
7. Verify redirect to vehicle owner dashboard showing part search and request options
8. Attempt to navigate to `/inventory` (dealer-only route)
9. Verify access denied message

**Expected outcome**: Each role sees only their permitted dashboard features. Cross-role access is blocked.

**Playwright test file**: `tests/e2e/auth-registration.spec.ts`

---

### Scenario 2: Dealer Adds Inventory

**Covers**: User Story 4 (P2), FR-012, FR-013, FR-016

**Steps**:

1. Log in as Spare Parts Dealer
2. Navigate to `/inventory`
3. Click "Add Part"
4. Fill in: name="Alternator", condition="New", price=4500, quantity=3, fulfillmentDays=1
5. Add vehicle compatibility: make="Toyota", model="Corolla", yearFrom=2010, yearTo=2020
6. Upload 1 photo (JPEG, <5MB)
7. Submit
8. Verify listing appears in inventory list with all details and "last updated" timestamp

**Expected outcome**: Part listing is created and visible in dealer's inventory view.

**Playwright test file**: `tests/e2e/dealer-inventory.spec.ts`

---

### Scenario 3: Search for a Part

**Covers**: User Story 2 (P1), FR-004, FR-005, FR-006, FR-007

**Prereq**: Scenario 2 completed (at least one part in inventory)

**Steps**:

1. Log in as Vehicle Owner
2. Navigate to `/search`
3. Enter "Alternator" in search field, select make="Toyota", model="Corolla", year=2015
4. Submit search
5. Verify results show: dealer name, dealer location, price (4500), availability, fulfillment time, last-updated timestamp
6. Sort by price — verify ordering
7. Clear search, enter "Alternatr" (misspelled)
8. Verify fuzzy match returns the alternator listing with a "Did you mean 'Alternator'?" suggestion

**Expected outcome**: Search returns matching parts with all required fields. Fuzzy matching handles misspellings.

**Playwright test file**: `tests/e2e/part-search.spec.ts`

---

### Scenario 4: Part Request & Quote Flow

**Covers**: User Story 3 (P2), FR-008, FR-009, FR-010, FR-011

**Steps**:

1. Log in as Vehicle Owner
2. Navigate to `/search`, search for "Brake Caliper Toyota Hilux 2018"
3. Verify "No results found" message with "Create a Part Request" suggestion
4. Click "Create Part Request"
5. Fill in: partName="Brake Caliper", make="Toyota", model="Hilux", year=2018, urgency="high"
6. Submit
7. Log in as Spare Parts Dealer
8. Navigate to dashboard — verify notification about new Part Request
9. View the Part Request details
10. Submit quote: price=3200, isAvailable=true, fulfillmentDays=2
11. Log in as Vehicle Owner
12. Navigate to `/requests` — verify notification about received quote
13. View request, see quote details side by side
14. Accept the quote
15. Verify request status changes to "Accepted"
16. Log in as Dealer — verify notification about accepted quote

**Expected outcome**: Full request-quote-accept cycle works end to end with notifications at each step.

**Playwright test file**: `tests/e2e/part-request-flow.spec.ts`

---

### Scenario 5: Smart Dealer Matching

**Covers**: User Story 5 (P3), FR-014

**Prereq**: Multiple dealers with overlapping inventory in different towns

**Steps**:

1. Seed two dealers: Dealer A in Banjul with "Brake Pad" (price=1500), Dealer B in Brikama with "Brake Pad" (price=1500)
2. Log in as Vehicle Owner located in Banjul
3. Search for "Brake Pad"
4. Verify Dealer A (same town) ranks above Dealer B (different town) in results
5. Update Dealer B to have a higher fulfillment reliability score (simulate via DealerStats)
6. Re-search — verify ranking adjusts based on combined score

**Expected outcome**: Search results reflect weighted scoring from proximity, match accuracy, and dealer performance.

**Playwright test file**: `tests/e2e/smart-matching.spec.ts`

## Run All Validation Tests

```bash
npx playwright test tests/e2e/
```

All scenarios map to Playwright E2E tests targeting `data-testid` selectors per constitution requirements.
