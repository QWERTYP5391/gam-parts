<!-- Sync Impact Report
  Version change: (none) → 1.0.0
  Added sections:
    - Core Principles: I. Server Components First, II. Server Actions as Backend,
      III. Type Safety (NON-NEGOTIABLE), IV. Test-Driven Verification, V. Simplicity
    - Technology Stack
    - Quality Gates & Workflow
    - Governance
  Removed sections: (none — initial ratification)
  Modified principles: (none — initial ratification)
  Deferred TODOs: none
-->

# GAM Parts Constitution

## Core Principles

### I. Server Components First

All React components MUST be Server Components (RSC) by default. The `"use client"` directive
is permitted only at leaf-level components where browser APIs, local state, or interactive
event handlers are strictly required. Server-only resources (`db`, secrets, server utilities)
MUST NOT be imported into Client Components. Data flows from Server Components to Client
Components exclusively via props.

**Rationale**: Maximizes performance, minimizes client bundle size, and enforces a clear
security boundary between server-trusted and client-untrusted code.

### II. Server Actions as Backend

All mutations and form submissions MUST use Server Actions (`"use server"`). No standalone
API routes are permitted unless required for webhooks or third-party integrations. Every
Server Action MUST:

- Accept Zod-validated input
- Return a discriminated union (`{ success: true; data: T } | { success: false; error: string; fieldErrors?: Record<string, string[]> }`)
- Call `revalidatePath()` or `revalidateTag()` after mutations
- Never throw; always return the error variant

**Rationale**: A single backend interface simplifies the architecture, eliminates redundant
API surface, and guarantees consistent error handling across the application.

### III. Type Safety (NON-NEGOTIABLE)

TypeScript MUST be configured in strict mode (`"strict": true`). The `any` type is forbidden
unless explicitly justified with an inline comment. Zod schemas MUST validate all Server
Action payloads, URL search params, and environment variables. Environment variables MUST
be typed in `src/env.ts`.

**Rationale**: Strict typing catches errors at compile time and Zod validation catches them
at runtime boundaries, eliminating entire categories of bugs before they reach production.

### IV. Test-Driven Verification

Playwright E2E tests are the primary verification mechanism. All interactive and meaningful
UI elements MUST include a `data-testid` attribute in kebab-case format
(`data-testid="<component>-<element>"`). The Spec Kit workflow enforces traceability:

- Every spec MUST define at least one Playwright test scenario
- Every plan MUST reference the spec it implements
- Every task MUST be traceable to a plan
- No task is considered complete until its Playwright tests pass

**Rationale**: E2E tests verify the system as users experience it. `data-testid` selectors
decouple tests from styling and structure, making them resilient to refactoring.

### V. Simplicity

Start with the minimal implementation that satisfies the requirement. Do not add features,
abstractions, or configurability beyond what is directly requested. Three similar lines of
code are preferable to a premature abstraction. Error handling and validation SHOULD only be
added at system boundaries (user input, external APIs), not for internal invariants already
guaranteed by the type system or framework.

**Rationale**: Premature abstraction and speculative generality are the primary sources of
accidental complexity. YAGNI until proven otherwise.

## Technology Stack

- **Framework**: Next.js App Router — all routes under `src/app/`, no Pages Router
- **Language**: TypeScript strict mode, `@/*` path alias resolves to `./src/*`
- **Database**: PostgreSQL + Drizzle ORM (schema: `src/lib/db/schema.ts`, client: `src/lib/db/index.ts`)
- **Authentication**: Auth.js v5 (NextAuth v5) with database sessions and edge middleware route guards, configured in `src/lib/auth.ts`
- **Validation**: Zod for all payloads, params, and env vars
- **State Management**: `nuqs` for URL search params, `react-hook-form` + `@hookform/resolvers/zod` for forms, Zustand only where strictly necessary
- **Styling & UI**: Tailwind CSS + shadcn/ui (installed into `src/components/ui/`), no CSS modules or CSS-in-JS
- **Testing**: Playwright E2E in `tests/e2e/*.spec.ts`
- **Deployment**: Vercel CLI (`vercel build`, `vercel deploy --prebuilt`)

## Quality Gates & Workflow

### Quality Gates

- `tsc --noEmit` MUST pass with zero errors before any merge
- All Playwright E2E tests MUST pass before any merge
- No `console.log` in production code — use structured logging
- ESLint (Next.js recommended config) and Prettier MUST be clean

### Spec Kit Workflow

All feature work follows the Spec Kit traceability chain:

1. **Spec** (`.spec-kit/specs/`) — Define what to build, acceptance criteria, and Playwright test scenarios
2. **Plan** (`.spec-kit/plans/`) — Break the spec into implementation steps, referencing the parent spec
3. **Task** (`.spec-kit/tasks/`) — Execute each step; not complete until Playwright tests pass

### Directory Structure

```
gam-parts/
  .specify/
    memory/
      constitution.md    # This file
  .spec-kit/
    specs/               # Feature specifications
    plans/               # Implementation plans
    tasks/               # Granular tasks derived from plans
  src/
    app/                 # Next.js App Router pages & layouts
    components/
      ui/                # shadcn/ui components
    lib/
      db/                # Drizzle schema, client, migrations
      actions/           # Server Actions
      auth.ts            # Auth.js v5 config
    env.ts               # Typed environment variables
  tests/
    e2e/                 # Playwright E2E tests
  CLAUDE.md              # Agent memory anchor
  tsconfig.json          # TypeScript config (strict mode)
```

## Governance

This constitution supersedes all other practices and conventions for the GAM Parts project.
All code contributions MUST comply with these principles.

### Amendment Process

1. A spec in `.spec-kit/specs/` describing the proposed change MUST be created
2. Review and approval MUST be obtained before implementation
3. This document MUST be updated as part of the implementing task
4. Version MUST be incremented following semantic versioning:
   - **MAJOR**: Backward-incompatible governance or principle removals/redefinitions
   - **MINOR**: New principle or section added, or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

### Compliance Review

Every pull request and code review MUST verify compliance with these principles. Deviations
require explicit justification documented in the PR description and, if recurring, an
amendment to this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-09-05 | **Last Amended**: 2026-09-05
