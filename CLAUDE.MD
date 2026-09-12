# GAM Parts - Agent Memory

> **Constitution**: All work on this project is governed by `.specify/constitution.md`. Read it before making any changes.

## Ground Truth Stack

- **Framework**: Next.js App Router, Server Components by default
- **Language**: TypeScript strict mode (`"strict": true`, `"noUncheckedIndexedAccess": true`)
- **Data Layer**: PostgreSQL + Drizzle ORM (schema in `src/lib/db/schema.ts`, client in `src/lib/db/index.ts`)
- **Backend**: Server Actions (`"use server"`) as the single backend interface. No standalone API routes unless needed for webhooks
- **Authentication**: Auth.js v5 (NextAuth v5) with database sessions and edge middleware route guards
- **Validation**: Zod schemas for all Server Action payloads, URL params, and env vars
- **State**: `nuqs` for URL search params, `react-hook-form` + `@hookform/resolvers/zod` for forms, minimal Zustand only where strictly necessary
- **Styling & UI**: Tailwind CSS + shadcn/ui. Every interactive primitive must expose `data-testid`
- **Testing**: Playwright E2E suites in `tests/e2e/*.spec.ts` targeting `data-testid` selectors
- **Deployment**: Vercel CLI (`vercel build`, `vercel deploy --prebuilt`)

## Server & Client Boundaries

- Components are React Server Components (RSC) by default
- `"use client"` only at the leaf level where interaction, local state, or browser APIs are mandatory
- Never import `db`, secrets, or server utilities into Client Components
- Data fetching in Server Components via direct Drizzle queries, passed to Client Components via props

## Server Action Conventions

- Every Server Action accepts Zod-validated input
- Actions return a discriminated union:
  ```ts
  type ActionResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string; fieldErrors?: Record<string, string[]> };
  ```
- Call `revalidatePath()` or `revalidateTag()` after mutations
- Never throw from Server Actions; always return the error variant

## Path Alias

`@/*` resolves to `./src/*`

## Spec Kit Workflow

1. **Spec** (`.spec-kit/specs/`) - Define what to build and acceptance criteria with Playwright test scenarios
2. **Plan** (`.spec-kit/plans/`) - Break the spec into implementation steps, referencing the parent spec
3. **Task** (`.spec-kit/tasks/`) - Execute each step; not complete until Playwright tests pass

## Quality Gates

- `tsc --noEmit` must pass with zero errors before any merge
- All Playwright tests must pass
- No `console.log` in production code

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
