# GAM Parts - Project Constitution

This document defines the architectural rules, technology choices, and verification standards for the GAM Parts project. All specs, plans, tasks, and code must conform to these constraints.

---

## Technology Stack

### Framework
- **Next.js** with **App Router** (no Pages Router)
- All routes live under `src/app/`
- Use Server Components by default; add `"use client"` only when client interactivity is required

### Language
- **TypeScript** in **strict mode** (`"strict": true` in `../tsconfig.json`)
- No `any` types unless explicitly justified with a comment
- Path alias `@/*` maps to `./src/*`

### Database & ORM
- **Drizzle ORM** for all database access
- Schema definitions live in `src/lib/db/schema.ts`
- Migrations managed via `drizzle-kit`
- Database client instantiated in `src/lib/db/index.ts`

### Backend Pattern
- **Server Actions** for all mutations and form submissions
- Server Actions live in colocated `actions.ts` files or `src/lib/actions/`
- No standalone API routes unless required for webhooks or third-party integrations

### Authentication
- **Auth.js v5** (NextAuth v5)
- Configuration in `src/lib/auth.ts`
- Session accessed via `auth()` helper in Server Components and Server Actions

### Styling & UI
- **Tailwind CSS** for all styling
- **shadcn/ui** component library (installed into `src/components/ui/`)
- No CSS modules, styled-components, or other CSS-in-JS solutions

---

## Testing & Verification

### E2E Testing
- **Playwright** for all end-to-end tests
- Test files live in `../tests/e2e`
- Test file naming: `*.spec.ts`

### Test Selectors
- All interactive and meaningful UI elements **must** include a `data-testid` attribute
- Format: `data-testid="<component>-<element>"` (kebab-case)
- Examples: `data-testid="login-form"`, `data-testid="parts-table-row"`

### Verification Rules
1. Every spec must define at least one Playwright test scenario
2. Every plan must reference the spec it implements
3. Every task must be traceable to a plan
4. No task is considered complete until its Playwright tests pass
5. `tsc --noEmit` must pass with zero errors before any merge

---

## Code Quality

- ESLint with Next.js recommended config
- Prettier for formatting
- No console.log in production code (use structured logging)
- All environment variables typed in `src/env.ts`

---

## Directory Structure

```
gam-parts/
  .spec-kit/
    constitution.md    # This file
    specs/             # Feature specifications
    plans/             # Implementation plans
    tasks/             # Granular tasks derived from plans
  src/
    app/               # Next.js App Router pages & layouts
    components/
      ui/              # shadcn/ui components
    lib/
      db/              # Drizzle schema, client, migrations
      actions/         # Server Actions
      auth.ts          # Auth.js v5 config
    env.ts             # Typed environment variables
  tests/
    e2e/               # Playwright E2E tests
  CLAUDE.md            # Agent memory anchor
  tsconfig.json        # TypeScript config (strict mode)
```

---

## Amendment Process

Changes to this constitution require:
1. A spec in `../.spec-kit/specs` describing the proposed change
2. Review and approval before implementation
3. Update to this document as part of the implementing task
