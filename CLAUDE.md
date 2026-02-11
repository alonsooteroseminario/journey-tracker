# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Start Next.js dev server
npm run build          # Generate Prisma client + Next.js production build
npm run lint           # ESLint via next lint
npm run test           # Vitest (unit tests, watch mode)
npm run test:coverage  # Vitest with coverage report
npm run test:e2e       # Playwright end-to-end tests
npm run test:all       # Unit + E2E in sequence
npx prisma generate    # Regenerate Prisma client after schema changes
npx prisma studio      # Open Prisma Studio (MongoDB GUI)
```

Path alias `@/` maps to `src/` (configured in both `tsconfig.json` and `vitest.config.mts`).

## Architecture Overview

**Next.js 15 App Router** app with Clerk auth, Prisma + MongoDB, Redux Toolkit (RTK Query), and an embedded MCP-powered AI agent.

### Request & Auth Flow

1. `src/middleware.ts` — Clerk middleware guards all routes except `/sign-in`, `/sign-up`, and `/api/webhooks/*`.
2. API routes call `auth()` from `@clerk/nextjs/server` to get `userId`.
3. `src/lib/auth.ts` exports `getCurrentUser()` which resolves a Clerk `userId` to a Prisma `User` row, auto-creating on first login.

#### User Data Synchronization

`getCurrentUser()` automatically syncs the latest user data from Clerk to the Prisma User table on every authenticated request:
- Fetches `name`, `email`, and `profileImage` from Clerk
- Updates the User record only if data has changed (optimization)
- Ensures template creator names and profile information are always up-to-date
- No webhooks required - synchronization happens automatically on each auth check

#### Email Notifications

Email notifications respect user preferences stored in the `EmailPreferences` model:
- Master toggle: `enabled` field controls all emails globally
- Individual toggles: Each notification type (goalCreated, streakMilestone, etc.) can be disabled
- The `notify()` function automatically checks preferences before sending
- Preferences are managed via `EmailPreferencesPanel` on the profile page

### Data Layer

- **Prisma + MongoDB** (`prisma/schema.prisma`). The `Goal` model stores `tasks` as a JSON field (array of Task objects with nested substeps). Any API that mutates tasks must do a read-modify-write on that JSON field.
- **RTK Query** is the primary data-fetching layer. Each domain slice (`goalsSlice`, `profileSlice`, `friendsSlice`, `streaksSlice`) exports both an RTK Query API definition and a plain Redux slice for local UI state (selected items, filters, etc.).
- Cache invalidation after the AI agent mutates data is handled inside the SSE stream via `invalidatesTags` — the client re-fetches automatically.

### Component & Provider Tree

```
layout.tsx (server)          ← ClerkProvider
  └── AppShell (client)      ← ReduxProvider + AutoMigration + ChatWidget
        └── page content
```

`AppShell` (`src/components/AppShell.tsx`) is the single client boundary. It wraps every page with Redux and renders the `ChatWidget`.

### AI Agent / MCP

The in-app AI chat is powered by an agent loop in `src/app/api/agent/chat/route.ts`:

- **POST** receives a message array, runs a multi-turn Claude loop (max 25 iterations, 120 s Vercel timeout), and streams status + the final response back over **SSE**.
- The agent has access to **23 tools** (CRUD on goals/tasks/substeps/friends/profile/streaks) and **3 skills** (composite analytics operations). These are all defined under `src/lib/mcp/`.
- Tool implementations live in `src/lib/mcp/tools/*.ts`. Each file exports a `toolDefinition` (name, description, input schema) and an `execute*` function that takes `(args, userId)`. Tools call Prisma directly — no internal HTTP round-trips.
- Skills are higher-level composite operations in `src/lib/mcp/skills/*.ts` following the same export pattern.
- The tool registry (`src/lib/mcp/tools/index.ts`) and skills registry (`src/lib/mcp/skills/index.ts`) are the single source of truth — adding a new tool or skill means adding it to the respective `index.ts` export array.
- `src/lib/mcp/server.ts` is a singleton `MCPServer` that registers all tools and skills and provides lookup/execution.
- Context trimming in the agent loop keeps only the first message + last 6 messages when the conversation grows beyond 8, to avoid token-limit issues during bulk operations.

### Security (Agent)

`src/lib/agent/security.ts` provides: rate limiting (30 req/min per user), input sanitization, and ownership verification (tools check that the target goal/user belongs to the authenticated user).

### Testing

- **Unit tests**: Vitest with `happy-dom` environment. Test files sit alongside source (`*.test.ts` / `*.test.tsx`). Setup file at `src/test/setup.ts`.
- **E2E tests**: Playwright, config in `playwright.config.ts`, test files in `e2e/`.

## Key Conventions

- ESLint warns on `console.log` (only `console.warn`/`console.error` allowed), unused vars prefixed with `_`, and explicit `any`.
- Unused variables/imports should be removed, not renamed to `_var`.
- The `Goal.tasks` JSON field is the trickiest part of the data model. When writing MCP tools that modify tasks or substeps, always fetch the full goal first, mutate the in-memory array, then write it back in a single Prisma `update`.
- `postinstall` runs `prisma generate` automatically, so after `npm install` the client is ready.
