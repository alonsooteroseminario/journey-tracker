<div align="center">

<img src="public/brand-icon.png" alt="Cadence" width="96" height="96" />

# Cadence

**Turn big goals into daily momentum.**

Break any goal into daily tasks, keep the streak.

[buildcadence.co](https://buildcadence.co) · [@buildcadence on Instagram](https://instagram.com/buildcadence)

</div>

---

## What it is

Most goals don't die in week 1 — they die in week 3. Week 1 runs on motivation; nothing is required yet. By week 3 there's no structure left, so nothing happens.

Cadence is the space between "I want to" and "I did": a personal goal achievement platform that turns ambitious long-term goals into structured, daily-actionable work.

- **Hierarchical structure** — Goal → Task → Substep, with optional Phases grouping tasks into stages.
- **Daily streak engine** — every completed task or substep logs activity; streaks count consecutive days and earn Bronze/Silver/Gold tiers per goal.
- **Social accountability** — friends, a shared activity feed, cheers and comments, shareable streak/goal cards.
- **Template marketplace** — publish a goal as a template, fork someone else's proven plan.
- **Embedded AI agent** — a Claude-powered assistant with 34 MCP tools and 3 composite skills that can read, create, update and analyze your entire goal graph in natural language.
- **Prompts Wallet** — a three-tier snippet manager (Wallet → Group → Chunk) with compose-and-copy and shareable links.
- **Cost tracker** — BYOK LLM credentials with per-provider usage, budgets and spend breakdown.

### Who it's for

Motivated 20–45 year-old professionals, students and creators who set ambitious goals and start strong, then lose momentum after 2–4 weeks.

### Why not an existing tool

| Tool | Gap |
|---|---|
| Todoist / TickTick | Task management only, no momentum signal |
| Habitica | Gamified habits, no deep goal structure |
| Notion | Flexible, but heavy setup and zero accountability |
| Strava & fitness apps | Domain-locked, not general purpose |
| ChatGPT | Ad-hoc advice, nothing persists |

Full product context: [`docs/prd-journey-tracker-2026-02-20.md`](docs/prd-journey-tracker-2026-02-20.md) (PRD) and [`_bmad-output/planning-artifacts/product-brief-journey-tracker-2026-02-20.md`](_bmad-output/planning-artifacts/product-brief-journey-tracker-2026-02-20.md) (product brief).

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 18) |
| Language | TypeScript 5 |
| Auth | Clerk (`@clerk/nextjs`) |
| Database | MongoDB via Prisma 6 |
| State / data fetching | Redux Toolkit + RTK Query |
| Styling | Tailwind CSS 3 (semantic design tokens, dark mode) |
| AI | Anthropic Claude via `@anthropic-ai/sdk`, custom MCP server |
| Email | Resend + React Email |
| Charts | Recharts |
| Drag & drop | dnd-kit |
| Video | Remotion (marketing renders) |
| Tests | Vitest + happy-dom (unit), Playwright (E2E) |
| Hosting | Vercel (Fluid Compute, cron jobs) |

Requires Node.js 20+.

---

## Quickstart

```bash
git clone git@github.com:alonsooteroseminario/journey-tracker.git
cd journey-tracker
npm install                # postinstall runs `prisma generate`
cp .env.example .env       # fill in the required vars below
npx prisma db push         # sync schema to your MongoDB
npm run dev                # http://localhost:3000
```

### Minimum env vars to boot

| Var | Purpose |
|---|---|
| `DATABASE_URL` | MongoDB connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client key |
| `CLERK_SECRET_KEY` | Clerk server key |
| `NEXT_PUBLIC_APP_URL` | Absolute base URL (used in emails and OG images) |

Optional, per feature: `ANTHROPIC_API_KEY` (AI agent fallback — users normally bring their own key), `RESEND_API_KEY` + `ADMIN_EMAIL` (email notifications), `CRON_SECRET` (guards `/api/cron/*`), `CREDENTIAL_ENCRYPTION_KEY` and `SOCIAL_ENCRYPTION_KEY` (`openssl rand -hex 32`), `TWITTER_*` / `INSTAGRAM_*` (admin social publishing). See [`.env.example`](.env.example) for the full list.

Secrets are never hardcoded — every credential comes from an env var, and BYOK LLM keys are encrypted at rest in the `LLMCredential` table.

---

## Commands

```bash
npm run dev            # dev server
npm run build          # prisma generate + next build
npm run lint           # ESLint
npm run test           # Vitest, watch mode
npm run test:coverage  # Vitest with coverage
npm run test:e2e       # Playwright
npm run test:all       # unit + E2E
npx prisma studio      # MongoDB GUI
npm run video:studio   # Remotion studio (marketing videos)
```

`@/` maps to `src/` in both `tsconfig.json` and `vitest.config.mts`.

---

## Architecture

### Request & auth flow

1. `src/middleware.ts` — Clerk middleware guards everything except `/sign-in`, `/sign-up`, `/api/webhooks/*`.
2. API routes call `auth()` from `@clerk/nextjs/server` for the `userId`.
3. `src/lib/auth.ts` → `getCurrentUser()` resolves a Clerk `userId` to a Prisma `User`, auto-creating on first login and syncing `name` / `email` / `profileImage` from Clerk on every authenticated request (writes only when something changed). No webhooks needed.

### Component tree

```
layout.tsx (server)          ← ClerkProvider
  └── AppShell (client)      ← ReduxProvider + AutoMigration + UndoToastProvider + ChatWidget
        └── page content
```

`src/components/AppShell.tsx` is the single client boundary for the whole app.

### Data layer

- **Prisma + MongoDB** (`prisma/schema.prisma`), 28 models. The `Goal.tasks` field is JSON (an array of Task objects with nested substeps) — every mutation is a **read-modify-write**: fetch the goal, mutate the in-memory array, write it back in one `prisma.goal.update`.
- **RTK Query** is the data-fetching layer. Each domain slice (`goalsSlice`, `profileSlice`, `friendsSlice`, `streaksSlice`, `groupsSlice`, `promptsSlice`) exports both an API definition and a plain slice for local UI state.
- Cache invalidation after the AI agent mutates data happens inside the SSE stream via `invalidatesTags` — the client refetches on its own.

Key models: `User`, `Goal`, `GoalGroup`, `GoalStreak` / `StreakData`, `ActivityLog`, `Friendship`, `FeedItem` / `FeedComment` / `FeedCheer`, `GoalTemplate` / `GoalFork` / `ForkRequest`, `PromptWallet` / `PromptGroup` / `PromptChunk`, `EmailPreferences` / `FeedPreferences`, `CostTransaction` / `Budget` / `LLMCredential`, plus the admin marketing set (`SocialAccount`, `SocialPost`, `MarketingCampaign`, `Video`, `Recording`).

### AI agent / MCP

The in-app chat runs an agent loop in `src/app/api/agent/chat/route.ts`:

- **POST** takes a message array, runs a multi-turn Claude loop (max 25 iterations, 120 s Vercel timeout), and streams status events plus the final response over **SSE**.
- **34 tools** (CRUD over goals, tasks, substeps, friends, feed, templates, profile, streaks, campaigns) and **3 skills** (`goalSummary`, `progressAnalytics`, `smartGoalCreator`) live under `src/lib/mcp/`.
- Each tool file exports a `toolDefinition` (name, description, JSON input schema) and an `execute*(args, userId)` function that hits Prisma directly — no internal HTTP round-trips.
- `src/lib/mcp/tools/index.ts` and `src/lib/mcp/skills/index.ts` are the single source of truth; adding a tool means adding it to the registry array.
- `src/lib/mcp/server.ts` is a singleton `MCPServer` handling registration, lookup and execution. It's also exposed over REST at `/api/mcp/tools`, `/api/mcp/skills` and `/api/mcp/health`.
- Context trimming keeps the first message + last 6 once a conversation passes 8 messages, so bulk operations don't blow the token limit.

**BYOK:** the Anthropic key comes from the user's own `LLMCredential` row via `getUserAgentKey(clerkId)`. `/api/agent/chat` is the **only** caller — no cron job or background task ever calls Claude.

### Security

`src/lib/agent/security.ts` provides rate limiting (30 req/min per user), input sanitization, and ownership verification — every tool checks the target goal/user belongs to the authenticated caller before mutating.

### Scheduled jobs

Vercel cron, configured in [`vercel.json`](vercel.json), all guarded by `CRON_SECRET`:

| Schedule | Route | What it does |
|---|---|---|
| `0 8 * * *` | `/api/cron/daily-reminders` | Morning digest email |
| `0 9 * * *` | `/api/cron/overdue-check` | Overdue task alerts |
| `0 19 * * *` | `/api/cron/check-streaks` | Evening streak reminders |
| `0 */2 * * *` | `/api/cron/task-reminders` | Task reminder digest |
| `0 * * * *` | `/api/cron/streak-protect` | Streak protection window |
| `*/15 * * * *` | `/api/cron/publish-scheduled-posts` | Admin social publishing |

Emails respect the `EmailPreferences` model — a master `enabled` toggle plus a per-notification-type flag, both checked by `notify()` before anything is sent.

---

## Routes

**App:** `/` (landing when signed out, dashboard when signed in), `/goals`, `/board` (kanban), `/feed`, `/friends`, `/profile`, `/marketplace`, `/templates`, `/wallet`, `/cost-tracker`, `/settings/ai-key`, `/admin/*`.

**API:** ~100 routes under `src/app/api/` — `goals`, `groups`, `streaks`, `feed`, `friends`, `invitations`, `templates`, `marketplace`, `fork-requests`, `prompt-{wallets,groups,chunks}`, `cost-tracker/*`, `share/{streak,goal}` (OG image generation), `mcp/*`, `agent/chat`, `cron/*`, `admin/*`.

---

## Testing

- **Unit** — Vitest with `happy-dom`. Test files sit next to their source (`*.test.ts` / `*.test.tsx`); setup in `src/test/setup.ts`. ~1500 tests, ~80% statement coverage on `src/lib/` and `src/app/api/`.
- **E2E** — Playwright, config in `playwright.config.ts`, specs in `e2e/`.

Two happy-dom quirks worth knowing before you write a component test: `fireEvent.click()` doesn't always synchronously flush React 18 state (click → intermediate DOM query → assert), and Tailwind responsive prefixes aren't processed (assert on `.closest('button')`).

---

## Conventions

- ESLint warns on `console.log` — only `console.warn` / `console.error`.
- Remove unused variables and imports; don't rename them to `_var`.
- Colors go through semantic tokens (`bg-surface-primary`, `text-primary`, `border-subtle`) so dark mode keeps working. Palette: `brand-primary #5B50E8`, `brand-secondary #7B6FFF`, `brand-light #EAE8FF`, `brand-dark #2D1B8E`, `brand-accent #F08080`. Source of truth is `tailwind.config.ts` / `src/app/globals.css` — don't invent colors.
- Dates in streak logic use **local** date parts (`getFullYear`/`getMonth`/`getDate`), never `toISOString()` — the UTC/local mismatch breaks streak dedup.

---

## Documentation

| Doc | What's in it |
|---|---|
| [`docs/prd-journey-tracker-2026-02-20.md`](docs/prd-journey-tracker-2026-02-20.md) | PRD — functional/non-functional requirements, success metrics |
| [`docs/architecture-journey-tracker-2026-02-20.md`](docs/architecture-journey-tracker-2026-02-20.md) | Architecture decisions |
| [`docs/plans/INDEX.md`](docs/plans/INDEX.md) | Living status tracker for every feature plan — read this first |
| [`docs/brand/brand-context.md`](docs/brand/brand-context.md) | Brand identity, palette, voice |
| [`docs/brand/social-media-kit.md`](docs/brand/social-media-kit.md) | Social launch kit |
| [`CLAUDE.md`](CLAUDE.md) | Guidance for Claude Code in this repo |
| [`MCP_IMPLEMENTATION.md`](MCP_IMPLEMENTATION.md) | MCP server internals |
| [`SETUP_GUIDE.md`](SETUP_GUIDE.md) | Extended setup walkthrough |

---

## Links

- **Product:** [buildcadence.co](https://buildcadence.co)
- **Instagram:** [@buildcadence](https://instagram.com/buildcadence)
- **Repo:** [github.com/alonsooteroseminario/journey-tracker](https://github.com/alonsooteroseminario/journey-tracker)

---

© 2026 Cadence
