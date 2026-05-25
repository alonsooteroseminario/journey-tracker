---
project_name: 'Cadence (formerly Journey Tracker)'
user_name: 'Alonsooteroseminario'
date: '2026-05-24'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'data_layer_rules', 'mcp_rules', 'testing_rules', 'code_quality_rules']
status: 'complete'
rule_count: 62
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Layer | Package | Version |
|-------|---------|---------|
| Framework | next | ^16.1.6 (App Router, `--webpack` flag required) |
| Language | typescript | ^5 (strict mode enabled) |
| Auth | @clerk/nextjs | ^6.37.1 |
| ORM | @prisma/client + prisma | ^6.19.2 |
| Database | MongoDB | (Atlas, via DATABASE_URL env var) |
| AI SDK | @anthropic-ai/sdk | ^0.72.1 |
| State | @reduxjs/toolkit + react-redux | ^2.11.2 / ^9.2.0 |
| Drag & Drop | @dnd-kit/core / sortable / utilities | 6.3.1 / 10.0.0 / 3.2.2 |
| Email | resend + @react-email/components | ^6.9.1 / ^1.0.7 |
| Video | remotion + @remotion/cli + @remotion/renderer | 4.0.234 |
| Styling | tailwindcss | ^3.4.1 |
| Charts | recharts | ^3.7.0 |
| Date Utils | date-fns | ^4.1.0 |
| Validation | zod | ^4.3.6 |
| Unit Tests | vitest + @testing-library/react | ^4.0.18 / ^16.3.2 |
| Test DOM | happy-dom | ^20.5.0 |
| E2E Tests | @playwright/test | ^1.58.1 |

**Critical version notes:**
- Run `npm run dev` with `--webpack` flag (not Turbopack) — hardcoded in scripts
- `postinstall` auto-runs `prisma generate` after `npm install`
- After any schema change: run `npx prisma generate` manually before testing
- Path alias `@/` maps to `src/` in both `tsconfig.json` and `vitest.config.mts`

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- **Strict mode is enforced** — `tsconfig.json` has `"strict": true`. No implicit `any`, no
  implicit returns, no unused locals. `npx tsc --noEmit` must produce zero errors.
- **No `any` without justification** — ESLint flags explicit `any`. If unavoidable, add an
  inline `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with a comment
  explaining why.
- **No `console.log`** — ESLint warns on `console.log`. Use `console.warn` or `console.error`
  only. Violations block CI.
- **No unused variables or imports** — ESLint enforces this. Remove unused code; do not rename
  to `_var` as a workaround (CLAUDE.md explicitly forbids this pattern).
- **Import alias `@/`** — Always use `@/` instead of relative `../../` for imports within `src/`.
  Both tsconfig and vitest are configured with this alias.
- **Prisma types from `@prisma/client`** — Import Prisma model types (e.g., `User`, `Goal`)
  directly from `@prisma/client`, not from local type files.
- **Server-only modules** — Files that use Prisma or Clerk server SDK must either be in
  Server Components, API routes, or import from `server-only`. Never import Prisma in client
  components.
- **Async/await preferred** — Use `async/await` throughout; avoid raw `.then()` chains except
  for fire-and-forget calls (e.g., `notify(...).catch(err => console.error(err))`).
- **Error handling pattern in API routes** — Wrap body in `try/catch`, return typed JSON
  responses: `NextResponse.json({ error: '...' }, { status: 4xx/5xx })`.
- **Zod for all external input validation** — Use Zod schemas (in `src/lib/validations.ts`) to
  validate any user-supplied input before it touches Prisma. Never trust raw `args` from MCP
  tools or request bodies.

### Framework-Specific Rules

#### Next.js App Router

- **Server Components by default** — All files in `src/app/` are Server Components unless
  they begin with `'use client'`. Never add `'use client'` to a file that uses Prisma or
  Clerk server SDK.
- **`AppShell` is the single client boundary** — `src/components/AppShell.tsx` wraps all pages
  with `ReduxProvider` and renders `ChatWidget`. Do not create additional top-level client
  providers; nest inside `AppShell`.
- **API route pattern** — Every API route under `src/app/api/` must call `auth()` from
  `@clerk/nextjs/server` first, then call `getCurrentUser()` to get the Prisma `User`. Return
  early with 401 if either returns null.
- **Public routes** — The following are already whitelisted in `src/middleware.ts`:
  `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks(.*)`, `/marketplace(.*)`,
  `/api/marketplace(.*)`. Add new public routes here — nowhere else.
- **No internal HTTP calls from API routes** — MCP tools call Prisma directly. API routes call
  Prisma directly. Never `fetch('/api/...')` from inside a server route.
- **`server-only` import** — Add `import 'server-only'` at the top of any file that must never
  be bundled client-side (e.g., Prisma utilities, Clerk server calls).

#### Authentication — Two Distinct Patterns (NEVER MIX)

| Context | Function | Import |
|---------|----------|--------|
| API routes (`src/app/api/`) | `getCurrentUser()` | `@/lib/auth` |
| MCP tools (`src/lib/mcp/tools/`) | `resolveUser(clerkId)` | `@/lib/agent/resolveUser` |

- `getCurrentUser()` calls `auth()` internally — use in API routes where Clerk session is live.
- `resolveUser(clerkId)` accepts the Clerk ID passed by the agent loop — use in MCP tools.
- Mixing these causes either "not authenticated" errors or double Clerk SDK calls.

#### Prisma + MongoDB — The Tasks JSON Field (Most Common Bug Source)

- **`Goal.tasks` is a JSON field** — It stores a `Task[]` array (with nested `Substep[]`)
  as a single BSON document. There is NO separate `tasks` collection.
- **Read-modify-write pattern is mandatory** — To add, update, or delete a task or substep:
  1. `prisma.goal.findUnique({ where: { id: goalId } })` → get full goal
  2. Parse `goal.tasks as Task[]`
  3. Mutate the in-memory array
  4. `prisma.goal.update({ where: { id: goalId }, data: { tasks: mutatedArray } })`
- **Never do partial task updates** — There is no `prisma.task.update()`. All task mutations
  must go through the parent `Goal` document.
- **Task and substep IDs** — Generated with `randomUUID()` from Node's `crypto` module at
  creation time. Never use `Math.random()` or sequential numbers.
- **Always verify ownership** — Before any goal mutation: confirm `goal.userId === user.id`.
  Return 403 if mismatch. MCP tools use `securityGuard.verifyOwnership()`.

#### Redux Toolkit + RTK Query

- **RTK Query is the data-fetching layer** — Domain slices (`goalsSlice`, `profileSlice`,
  `friendsSlice`, `streaksSlice`) each export both an RTK Query API definition AND a plain
  Redux slice for local UI state.
- **Cache invalidation after every write** — After any mutation (API route or MCP tool write),
  the relevant `invalidatesTags` must be called so the UI re-fetches. Missing this causes
  silent stale data.
- **Use typed hooks** — Import `useAppDispatch` and `useAppSelector` from `@/store/hooks`,
  not the raw `useDispatch`/`useSelector` from react-redux.
- **Local UI state in plain slices** — Selected items, filters, modal open/close go in the
  plain Redux slice, not RTK Query cache.

#### Clerk Data Sync

- `getCurrentUser()` automatically syncs `name`, `email`, `profileImage` from Clerk on every
  call. It only writes to Prisma if the data has changed (optimization).
- **First-login race condition is handled** — A `P2002` unique constraint error on `user.create`
  is caught and the user is re-fetched. Do not add additional retry logic.
- **Never store Clerk data manually** — Do not copy Clerk user fields into other models; always
  join through the `User` table which is kept in sync by `getCurrentUser()`.

### Data Layer & Activity Tracking Rules

#### Streak System

- **Single shared utility — never inline** — All streak recording must call
  `recordStreakActivity(userId, timezone?)` from `@/lib/streaks/updateStreak`.
  Never recalculate streaks inline in tools, routes, or components.
- **`calculateStreakFromHistory(history, today)`** — The single source of truth for streak
  calculation. Import from `@/lib/streaks/updateStreak`. Never duplicate this logic.
- **Date format is YYYY-MM-DD string, not DateTime** — `streakHistory` stores strings like
  `"2026-02-21"`. Use `getTodayInTimezone(timezone)` from `@/lib/dateUtils` to get today's
  date string. Never use `new Date().toISOString()` for streak dates — it returns UTC.
- **Idempotent by design** — Calling `recordStreakActivity` multiple times on the same day is
  safe; it returns early without writing if today is already in `streakHistory`.
- **Milestone detection** — `recordStreakActivity` returns `{ milestone: number | null }`.
  Check this return value after every call; if non-null, create a feed item and send email.

#### Activity Tracking System

- **`trackActivity()` is at `@/lib/activity`** — This module does NOT yet exist and must be
  created as part of STORY-001. The import path is already referenced in MCP tools.
- **Always fire-and-forget** — Call as:
  ```ts
  trackActivity({ userId, type, action, feedContent, goalId, metadata, feedVisibility })
    .catch(err => console.error('Failed to track activity:', err));
  ```
  Never `await` it in the hot path. It must never block a response.
- **ActivityLog is ALWAYS created** — Regardless of `FeedPreferences`, an `ActivityLog` entry
  is written for every mutation. Only `FeedItem` creation is gated by preferences.
- **FeedPreferences model already exists** — `prisma.feedPreferences` is in the schema with
  fields: `goalEvents`, `taskEvents`, `substepEvents`, `costEvents`, `noteEvents`,
  `profileEvents`, `socialEvents`, `streakEvents`. Check this before creating `FeedItem`.
- **ActivityLog model already exists** — `prisma.activityLog` is in the schema with fields:
  `id`, `userId`, `type`, `action`, `goalId`, `taskId`, `substepId`, `metadata`, `timestamp`.
  STORY-001 creates the `trackActivity()` utility that wraps this model — no schema migration
  needed.
- **Activity types are defined in `src/types/index.ts`** — `ActivityLogEntry.type` is a
  discriminated union. Use these exact string literals; do not invent new type strings.
- **Call from ALL mutation paths** — MCP tools, REST API routes, and Kanban status-change
  endpoints must all call `trackActivity()`. Missing any path breaks feed completeness.

#### Prisma Model Key Facts

- **`FeedItem`** — `type` is a plain `String` (not an enum in Prisma). Use the TypeScript
  `FeedItem.type` union from `src/types/index.ts` as the source of truth.
- **`StreakData.streakHistory`** — `String[]` in Prisma (MongoDB array of strings). Prisma
  returns this as `string[]` in TypeScript.
- **`Goal.tasks`, `Goal.phases`, `Goal.budget`** — All `Json` type in Prisma. Always cast with
  `as Task[]`, `as Phase[]`, etc. after reading. Prisma returns these as `Prisma.JsonValue`.
- **MongoDB ObjectId strings** — All `id` fields use `@db.ObjectId` and are 24-character hex
  strings. When storing goalId/taskId/substepId as strings in other models, store the raw
  string — no conversion needed.
- **`@@map` names** — Prisma collection names differ from model names:
  `User → users`, `Goal → goals`, `StreakData → streaks`, `ActivityLog → activity_logs`,
  `FeedItem → feed_items`, `GoalTemplate → goal_templates`.

### MCP Tool Architecture Rules

#### Tool File Structure (mandatory pattern)

Every tool file in `src/lib/mcp/tools/` must export exactly two things:

```ts
// 1. Tool definition (name, description, JSON schema)
export const toolDefinition: ToolDefinition = {
  name: 'tool-name',          // kebab-case
  description: '...',
  input_schema: { type: 'object', properties: { ... }, required: [...] },
};

// 2. Execute function (async, takes args + userId)
export async function executeToolName(
  args: Record<string, any>,
  userId?: string
): Promise<ToolResult> { ... }
```

- **File naming** — camelCase matching the execute function: `createGoal.ts` → `executeCreateGoal`
- **Tool name** — kebab-case in `toolDefinition.name`: `'create-goal'`
- **Registering a new tool** — Add to `src/lib/mcp/tools/index.ts` export array. The
  `MCPServer` singleton at `src/lib/mcp/server.ts` auto-registers everything in that array.
  Missing this step = tool silently unavailable to the agent.

#### Tool Execute Function Rules

- **Always check `userId` first** — Return `{ success: false, error: 'Unauthorized' }` if null.
- **Resolve user next** — Call `resolveUser(userId)` from `@/lib/agent/resolveUser` to get the
  Prisma `User`. Return `{ success: false, error: 'User not found' }` if null.
- **Validate inputs with Zod** — Call `validateRequest(Schema, args)` before any Prisma call.
- **Verify ownership before writes** — Check `resource.userId === user.id`. Do not rely solely
  on querying `WHERE userId = user.id` — always verify after fetch.
- **Return shape** — Always return `ToolResult`: `{ success: boolean, data?: any, error?: string, message: string }`.
- **Never throw** — Wrap the entire body in `try/catch`; return error `ToolResult` on failure.
- **Fire-and-forget side effects** — Email (`notify()`) and activity tracking (`trackActivity()`)
  must be called without `await` with `.catch(err => console.error(...))`.
- **Update `conversationStore`** — After creating a goal/task, call
  `conversationStore.setLastGoal(userId, goal.id)` so the agent retains context across turns.

#### Agent Loop Constraints

- **Max 40 tool iterations per conversation turn** — Hardcoded in the agent route. Tools that
  loop internally must stay well under this budget.
- **Context trimming** — The agent loop keeps only the first message + last 12 messages when
  the conversation grows beyond 14. Do not rely on early messages being available.
- **SSE streaming** — The agent route (`src/app/api/agent/chat/route.ts`) streams responses
  via Server-Sent Events. Tool status updates are streamed as `data:` lines before the final
  response. Never buffer the full response before streaming.
- **Parallel tool execution** — Read-only tools run in parallel. Write tools to the same
  `goalId` run sequentially. Write tools to different `goalId`s run in parallel.
  This is handled by the agent loop — tool implementations do not need to manage this.

#### Skills (higher-level composites)

- Skills live in `src/lib/mcp/skills/` and follow the same `toolDefinition` + `execute*`
  export pattern.
- Skills are registered in `src/lib/mcp/skills/index.ts` (separate from tools index).
- Skills can call multiple Prisma operations and compose tool-level logic, but still receive
  `(args, userId)` and return `ToolResult`.

### Testing Rules

#### Test Environment Setup

- **Framework**: Vitest ^4.0.18 with `happy-dom` environment (not jsdom — check config).
- **Setup file**: `src/test/setup.ts` runs before every test. It globally mocks:
  - `@/lib/prisma` — all Prisma model methods are `vi.fn()`
  - `@clerk/nextjs` — `useUser`, `useAuth`, `ClerkProvider` mocked
  - `next/navigation` — `useRouter`, `usePathname`, `useSearchParams`, `useParams` mocked
  - `global.fetch` — set to `vi.fn()`
  - Do **not** re-mock these in individual test files; they are already globally mocked.
- **Test files live alongside source** — `src/lib/foo/bar.ts` → `src/lib/foo/__tests__/bar.test.ts`
  or `src/lib/foo/bar.test.ts`. Both patterns exist; prefer `__tests__/` subdirectory for
  utility/API files, co-located for components.
- **Coverage target**: ≥80% for `src/lib/` and `src/app/api/`. Run `npm run test:coverage`.
- **E2E tests**: Playwright, config in `playwright.config.ts`, test files in `e2e/`.
  E2E tests are excluded from Vitest (`exclude: ['e2e']` in `vitest.config.mts`).
- **`.worktrees/` excluded** — `exclude: ['.worktrees']` in vitest config; git worktrees do not
  pollute test discovery.

#### happy-dom Gotchas (CRITICAL — agents miss these constantly)

- **Tailwind responsive prefixes are not processed** — `sm:hidden` and `hidden sm:inline` both
  render simultaneously. `getByText('Desktop')` returns the `<span>`, not the `<button>`.
  For button class assertions, always chain `.closest('button')!`.
- **React 18 state flush is not synchronous** — After `fireEvent.click()`, do NOT immediately
  assert on newly rendered content. Insert an intermediate DOM query (e.g.,
  `screen.getByText('something already visible')`) between the click and the assertion to
  trigger the state flush.
- **@dnd-kit children may not render** — Task titles inside `DndContext` + `SortableContext`
  may not appear in happy-dom. Assert on content outside the DnD context instead (e.g.,
  header text, completion counts).

#### Prisma Mock Pattern

```ts
// In test files — access the already-mocked prisma:
import { prisma } from '@/lib/prisma';

// Cast to get vi.fn() type:
vi.mocked(prisma.goal.findUnique).mockResolvedValue({ ... });
vi.mocked(prisma.goal.update).mockResolvedValue({ ... });

// Assert calls:
expect(prisma.goal.update).toHaveBeenCalledWith({ where: { id: 'goal-id' }, data: { ... } });
```

- **New Prisma models need to be added to the mock** — When adding a new model (e.g.,
  `activityLog` is already mocked), add it to the `prisma` mock object in `src/test/setup.ts`
  with the needed methods as `vi.fn()`.
- **`feedPreferences` is already mocked** in setup.ts with `findUnique`, `create`, `update`,
  `upsert`. Check before adding duplicates.

#### Test Naming & Structure

```ts
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should [expected behavior] when [condition]', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

- Use `it('should ...')` not `test('...')` for consistency with existing tests.
- `afterEach` cleanup (`cleanup()`, `vi.clearAllMocks()`) is handled globally in setup.ts —
  do not add it to individual test files.

### Code Quality & Style Rules

#### File & Folder Conventions

- **Components**: `PascalCase.tsx` — e.g., `GoalCard.tsx`, `ChatWidget.tsx`
- **Utilities/hooks**: `camelCase.ts` — e.g., `useChat.ts`, `updateStreak.ts`
- **API routes**: `src/app/api/[resource]/route.ts` (Next.js App Router convention)
- **MCP tools**: `src/lib/mcp/tools/camelCaseName.ts`
- **Test files**: `__tests__/camelCaseName.test.ts` alongside source, or co-located `.test.ts`
- **Types**: Domain types in `src/types/index.ts`; agent-specific types in `src/types/agent.ts`
- **Scripts**: `src/scripts/` for one-off migration/utility scripts (run via `npx tsx`)

#### Naming Conventions

- React components: `PascalCase` function names, default exports
- Hooks: `useXxx` prefix, camelCase
- MCP tool execute functions: `executeXxx` matching the tool's camelCase filename
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `TASK_STATUS_CONFIG`, `MILESTONES`)
- Prisma model instances: camelCase matching the model name (`goal`, `user`, `streakData`)

#### What NOT to Do (Anti-Patterns)

- ❌ **Never inline streak calculation** — always import from `@/lib/streaks/updateStreak`
- ❌ **Never `fetch('/api/...')` from server code** — call Prisma/utilities directly
- ❌ **Never add `'use client'` to files importing Prisma or Clerk server SDK**
- ❌ **Never use `new Date()` for streak date strings** — always use `getTodayInTimezone(tz)`
- ❌ **Never skip `invalidatesTags`** after a write — UI will silently show stale data
- ❌ **Never use `Math.random()` for entity IDs** — use `randomUUID()` from `crypto`
- ❌ **Never directly mutate `Goal.tasks` with `prisma.goal.update({ data: { tasks: { push: ... } } })`** —
  MongoDB Prisma JSON fields require read-modify-write of the full array
- ❌ **Never re-declare mocks that already exist in `src/test/setup.ts`** — causes double-mock
  conflicts and flaky tests
- ❌ **Never `await` activity tracking or email calls in the hot path** — they must be
  fire-and-forget with `.catch()`
- ❌ **Never add a new MCP tool without registering it in `src/lib/mcp/tools/index.ts`**
- ❌ **Never store task/substep data outside `Goal.tasks` JSON** — there is no separate
  tasks collection in MongoDB
- ❌ **Never add a new public route without updating `src/middleware.ts`** — Clerk will
  block unauthenticated access

#### Security Rules

- Every API route must verify `user.id` ownership of the target resource before any write.
- MCP tools must call `securityGuard.verifyOwnership()` — never skip this.
- Rate limiting (30 req/min per user) is enforced at the agent route level — do not add
  per-tool rate limiting.
- Never expose internal MongoDB `_id` fields; always use the mapped `id` from Prisma.
- Input sanitization runs in `src/lib/agent/security.ts` before reaching tools — do not
  duplicate sanitization inside tools.

#### Performance Rules

- Paginate all feed/activity list queries — default 20 items, never fetch unbounded lists.
- Use `prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })` with
  `select` to avoid fetching the full `tasks` JSON when only goal metadata is needed.
- `trackActivity()` and `notify()` are always non-blocking — never make the user wait for them.

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code in this project
- Follow ALL rules exactly as documented — they exist because violations have caused bugs
- When in doubt about patterns, check `src/lib/mcp/tools/createGoal.ts` as the reference implementation
- The most common mistake is the `Goal.tasks` JSON field — always read-modify-write
- Update this file if you discover new patterns during implementation

**For Humans:**
- Keep this file lean and focused on what agents miss, not what they already know
- Update when technology versions change or new patterns are established
- Review after each sprint for outdated or unnecessary rules

_Last Updated: 2026-05-24_

---

## Project State Summary (2026-05-24)

**App name**: Cadence (renamed from Journey Tracker, April 2026)

All original sprint stories complete + 20+ unplanned features shipped. See `docs/sprint-status.yaml` for the full inventory.

**New systems since Feb 2026 that agents must know:**

### BYOK Agent Key
- `src/lib/agent/getUserAgentKey.ts` — `clerkId` → `LLMCredential` → decrypted Anthropic key
- `src/lib/email/generateAiContext.ts` — Haiku call (max 200 tokens, 5s timeout), `string | null`
- `LLMCredential` Prisma model: one per user, AES-encrypted

### Dark Mode (Semantic Token System)
- **Never use raw color classes** (`bg-white`, `text-gray-900`) — always semantic tokens
- Tokens: `bg-surface-primary`, `bg-surface-secondary`, `text-primary`, `text-secondary`, `border-subtle`, etc.
- Defined in `tailwind.config.ts` → `theme.extend.colors` with `.dark:` CSS-variable variants
- `ThemeToggle` in Header; `LandingPage` pinned to light via `data-theme="light"`

### Prompts Wallet (/wallet)
- Models: `PromptWallet` → `PromptGroup` → `PromptChunk` (3 separate collections, not JSON)
- `src/store/slices/promptsSlice.ts` — 19-endpoint RTK Query API
- `src/store/slices/composeSlice.ts` — client-only compose drawer (7 actions)
- Components: `src/components/prompts/`
- Public sharing via `shareToken` field + `/share/[token]` route

### Lock / Undo / Copy
- `src/lib/locks/lockGuards.ts` — `canEdit`, `canDelete`, `cycleLock`
- `src/components/undo/UndoToastProvider.tsx` — **always mock in component tests**:
  ```ts
  vi.mock('@/components/undo/UndoToastProvider', () => ({
    useUndoToast: () => ({ showUndoToast: vi.fn() }),
    UndoToastProvider: ({ children }: any) => <>{children}</>,
  }));
  ```

### Email Cron System (3 crons)
- `src/app/api/cron/task-reminders/` — 2hr interval, `reminderStartTime`, 15-min retry dedup
- `src/app/api/cron/streak-protect/` — hourly, `streakProtectTime`, daily dedup
- `src/app/api/cron/daily-reminders/` — morning digest (legacy)
- All require `Authorization: Bearer CRON_SECRET`; `?force=true` for manual testing
- Both reminder templates accept `aiContext?: string` → italic paragraph before CTA

### MCP REST API
- `POST /api/mcp/tools` — list + execute tools externally
- `POST /api/mcp/skills` — list + execute skills externally
- `GET /api/mcp/health` — health check

**Test state**: 1444 total, 1429 passing, 15 pre-existing failures (agent/chat, wallet validation, daily-reminders cron, ChatWidget).
