# Sprint Plan: Journey Tracker

**Date:** 2026-02-20
**Scrum Master:** Alonsooteroseminario
**Project Level:** 4 (Enterprise — 40+ stories)
**Total Stories:** 22
**Total Points:** 102
**Planned Sprints:** 4
**Team Capacity:** 30 points/sprint (1 senior developer, 2-week sprints)
**Target Completion:** ~April 17, 2026 (Private Beta Ready)

---

## Executive Summary

Journey Tracker has a stable core (auth, goal hierarchy, streak engine, AI agent, friends, templates, email, basic kanban) already shipped. This sprint plan covers the remaining 22 stories needed to complete the planned feature set for private beta launch: a comprehensive activity feed, feed visibility controls, enhanced Kanban with drill-down and filters, the public landing page, the mobile stats FAB, task enhancements (priority, due dates, notes), and quality improvements.

**Key Metrics:**
- Total Stories: 22 (all unimplemented features only)
- Total Points: 102
- Sprints: 4 (8 weeks)
- Team Capacity: 30 points/sprint
- Target Completion: ~April 17, 2026
- Private Beta Launch: April 2026

---

## Already Implemented (Not in Sprint Plan)

The following FRs are shipped and stable — no stories needed:

| FR | Feature |
|----|---------|
| FR-001–004 | Auth, profile, Clerk sync, timezone |
| FR-005–009 | Goal CRUD, detail view, progress, phases |
| FR-012 | Cost tracking per substep |
| FR-013–015 | Task/substep CRUD, three-state status |
| FR-019 | Task reordering via @dnd-kit |
| FR-020 | Boolean-to-status data migration |
| FR-021–023 | Streak recording, display, milestones |
| FR-026–030 | AI agent (23 MCP tools), streaming, rate limiting, security |
| FR-036 | Friends system (add/accept/decline/remove) |
| FR-037–038 | Template marketplace browse and search |
| FR-041, FR-043 | Basic Kanban board (3 columns), drag-and-drop |
| FR-045–047 | Email notifications, per-type prefs, master toggle |

---

## Story Inventory

---

### STORY-001: ActivityLog Prisma Model & trackActivity() Utility

**Epic:** EPIC-006 — Social Feed & Activity Tracking
**Priority:** Must Have
**Points:** 5

**User Story:**
As a developer, I want a centralized `trackActivity()` utility and `ActivityLog` model so that every mutation in the system creates an auditable activity entry with before/after diffs.

**Acceptance Criteria:**
- [ ] `ActivityLog` model added to `prisma/schema.prisma` with fields: `id`, `userId`, `type`, `entityId`, `entityType`, `metadata` (JSON with `before`/`after` diffs), `goalId`, `createdAt`
- [ ] Activity type enum covers: `goal_created`, `goal_updated`, `goal_deleted`, `task_created`, `task_updated`, `task_deleted`, `task_status_changed`, `substep_created`, `substep_updated`, `substep_deleted`, `substep_status_changed`, `cost_updated`, `note_updated`, `profile_updated`, `friend_added`, `friend_removed`, `template_published`, `template_forked`, `streak_milestone`
- [ ] `trackActivity(userId, type, metadata, goalId?)` utility exported from `src/lib/activity/trackActivity.ts`
- [ ] Function is fire-and-forget (does not throw; logs errors with `console.error`)
- [ ] Unit tests in `src/lib/activity/__tests__/trackActivity.test.ts`

**Technical Notes:**
- New Prisma model; run `npx prisma generate` after schema change
- `metadata` is a JSON field: `{ before?: object, after?: object, summary?: string }`
- No UI changes in this story — this is purely the data layer

**Dependencies:** None

---

### STORY-002: Wire Activity Tracking into MCP Tools

**Epic:** EPIC-006 — Social Feed & Activity Tracking
**Priority:** Must Have
**Points:** 5

**User Story:**
As a user interacting with the AI agent, I want all AI-driven mutations (create goal, complete task, etc.) to be logged in the activity system so my activity history is complete.

**Acceptance Criteria:**
- [ ] `trackActivity()` called in all MCP tool `execute*` functions that perform writes
- [ ] `goal_created`, `goal_updated`, `goal_deleted` types wired in goal tools
- [ ] `task_created`, `task_updated`, `task_deleted`, `task_status_changed` wired in task tools
- [ ] `substep_created`, `substep_updated`, `substep_deleted`, `substep_status_changed` wired in substep tools
- [ ] `cost_updated` wired in cost tool
- [ ] `friend_added`, `friend_removed` wired in friends tools
- [ ] Before/after diff captured for all `*_updated` and `*_status_changed` types
- [ ] `trackActivity()` is non-blocking (does not affect tool response latency)

**Technical Notes:**
- Edit each `src/lib/mcp/tools/*.ts` file to add `trackActivity()` after successful Prisma writes
- For update tools: capture `before` from the fetched record before writing, `after` from the update result

**Dependencies:** STORY-001

---

### STORY-003: Wire Activity Tracking into REST API Routes

**Epic:** EPIC-006 — Social Feed & Activity Tracking
**Priority:** Must Have
**Points:** 5

**User Story:**
As a user making changes through the UI, I want all UI-driven mutations to be logged in the activity system so my feed reflects all my activity regardless of how I made changes.

**Acceptance Criteria:**
- [ ] `trackActivity()` called in all REST API route mutation handlers under `src/app/api/`
- [ ] Goal API routes: `POST /api/goals`, `PATCH /api/goals/:id`, `DELETE /api/goals/:id`
- [ ] Task API routes: any direct task REST mutations (if they exist outside MCP)
- [ ] Status change routes (Kanban drag-and-drop status API) emit `*_status_changed` type
- [ ] Profile update route: emits `profile_updated` type
- [ ] Template publish route: emits `template_published`; fork route: emits `template_forked`
- [ ] Streak completion via REST API emits `streak_milestone` if milestone reached

**Technical Notes:**
- Kanban drag-and-drop calls a PATCH endpoint to update status; wire `trackActivity()` there
- This story completes the "all mutation paths" requirement from FR-031

**Dependencies:** STORY-001

---

### STORY-004: Enhanced Social Feed Display

**Epic:** EPIC-006 — Social Feed & Activity Tracking
**Priority:** Must Have
**Points:** 8

**User Story:**
As a user, I want to see a rich, paginated feed of all activities from myself and my friends so that I can follow our progress in detail, not just goal creation and milestone events.

**Acceptance Criteria:**
- [ ] `FeedItem` generation updated to source from `ActivityLog` for all activity types (not just `goal_created` and `streak_milestone`)
- [ ] Feed page (`/feed`) displays: actor avatar, actor name, action description with entity name, timestamp (relative), activity icon per type
- [ ] Before/after diffs shown inline for `*_updated` and `*_status_changed` items (e.g., "Status: not_started → in_progress")
- [ ] Feed shows items from the authenticated user AND their mutual friends
- [ ] Pagination: 20 items per page with "Load More" or page navigation
- [ ] Empty state: "No activity yet. Complete tasks or add friends to see activity here."
- [ ] Feed respects feed visibility preferences (STORY-006 integrates here — use a no-op stub until STORY-006 lands)

**Technical Notes:**
- May need a new `GET /api/feed` endpoint that queries `ActivityLog` with `userId IN [self, ...friendIds]`
- RTK Query `feedApi` slice needs to be updated or created
- Activity icons: map each activity type to an icon (use lucide-react icons already in the project)

**Dependencies:** STORY-001, STORY-002, STORY-003

---

### STORY-005: Feed Filtering UI

**Epic:** EPIC-006 — Social Feed & Activity Tracking
**Priority:** Should Have
**Points:** 3

**User Story:**
As a user, I want to filter my activity feed by category so that I can focus on the type of activity I care about (e.g., only streak events).

**Acceptance Criteria:**
- [ ] Filter tabs/chips displayed at top of feed: All Activity | Goals | Tasks | Status Changes | Streaks | Social
- [ ] Selecting a category shows only matching `ActivityLog` types
- [ ] "All Activity" shows unfiltered feed
- [ ] Active filter is visually highlighted
- [ ] Filter state persists within the session (Redux local state)
- [ ] Filter is client-side (on already-loaded items) for UX speed

**Technical Notes:**
- Add `activeFilter` to the feed Redux slice local state
- Map activity types to filter categories in a constant: `FILTER_CATEGORY_TYPES`

**Dependencies:** STORY-004

---

### STORY-006: Feed Visibility Preferences Backend

**Epic:** EPIC-010 — Feed Visibility & Privacy Controls
**Priority:** Should Have
**Points:** 5

**User Story:**
As a developer, I want a `FeedVisibilityPreferences` model and API so that users can control which activity categories create `FeedItem` entries visible to friends.

**Acceptance Criteria:**
- [ ] `FeedVisibilityPreferences` model in `prisma/schema.prisma`: `id`, `userId` (unique), `goalEvents`, `taskEvents`, `substepEvents`, `costBudget`, `notes`, `profileChanges`, `socialActivity`, `streakMilestones` — all boolean, all default `true`
- [ ] Auto-created for new users on first `getCurrentUser()` call (or lazy-create on first access)
- [ ] `GET /api/profile/feed-visibility` returns current preferences
- [ ] `PATCH /api/profile/feed-visibility` updates one or more toggles
- [ ] `checkFeedVisibility(userId, activityType): Promise<boolean>` utility exported from `src/lib/activity/feedVisibility.ts`
- [ ] `FeedItem` creation in activity tracking is gated by `checkFeedVisibility()` (ActivityLog is ALWAYS created)
- [ ] Unit tests for `checkFeedVisibility()` covering all 8 categories

**Technical Notes:**
- New Prisma model; run `npx prisma generate`
- Category-to-FR mapping: `goalEvents` covers `goal_*`, `taskEvents` covers `task_*`, etc.
- ActivityLog entry is created regardless; only `FeedItem` creation is conditional

**Dependencies:** STORY-001

---

### STORY-007: Feed Visibility Preferences UI

**Epic:** EPIC-010 — Feed Visibility & Privacy Controls
**Priority:** Should Have
**Points:** 3

**User Story:**
As a user, I want a settings panel on my Profile page where I can toggle which activity categories appear in my friends' feeds so that I control my privacy.

**Acceptance Criteria:**
- [ ] `FeedVisibilityPanel` component on `/profile` page, below the existing `EmailPreferencesPanel`
- [ ] 8 toggle rows, one per category: Goal Events, Task Events, Substep Events, Cost/Budget, Notes, Profile Changes, Social Activity, Streak Milestones
- [ ] Each toggle has a label and a short description of what it controls
- [ ] Toggle state synced with `PATCH /api/profile/feed-visibility` on change (debounced 500ms)
- [ ] RTK Query cache invalidated after successful PATCH
- [ ] Saving shows a brief "Saved" indicator

**Technical Notes:**
- Mirror the pattern of `EmailPreferencesPanel` for consistency
- Use existing `Switch` or `Toggle` component from the UI library

**Dependencies:** STORY-006

---

### STORY-008: Feed Item Grouping

**Epic:** EPIC-006 — Social Feed & Activity Tracking
**Priority:** Could Have
**Points:** 5

**User Story:**
As a user, I want rapid successive changes of the same type to be grouped into a single feed item so that my feed is readable and not cluttered when someone makes many quick edits.

**Acceptance Criteria:**
- [ ] Items are grouped when: same `userId` + same activity type prefix (e.g., `task_*`) + same `goalId` + within 60 seconds of each other
- [ ] Grouped item renders as: "Made N updates to goal 'X'" with an expand/collapse toggle
- [ ] Expanded view shows each individual change with its diff
- [ ] Non-grouped items (> 60s apart) render normally
- [ ] Grouping is applied at query time or render time (no schema change needed)

**Technical Notes:**
- Grouping can be done client-side on the fetched feed items array
- Sort by `createdAt` desc first, then group adjacent matching items

**Dependencies:** STORY-004

---

### STORY-009: Kanban Drill-Down Navigation

**Epic:** EPIC-003 — Task Status & Kanban Board
**Priority:** Must Have
**Points:** 8

**User Story:**
As a power user, I want to click into a goal on the Kanban board to see its tasks, and click into a task to see its substeps, with a breadcrumb showing my position, so that I can manage all levels of my work visually.

**Acceptance Criteria:**
- [ ] Board default shows goal-level cards in 3 columns (existing behavior preserved)
- [ ] Clicking a goal card transitions to task view for that goal; breadcrumb shows: Board > [Goal Name]
- [ ] Clicking a task card transitions to substep view; breadcrumb shows: Board > [Goal Name] > [Task Name]
- [ ] Each breadcrumb segment is clickable to navigate back
- [ ] **Task cards** display: title, priority badge, due date (if set), substep progress (X/Y complete), parent goal name
- [ ] **Substep cards** display: title, due date (if set), cost (if set), status badge, parent task name
- [ ] Drill-down state is tracked in URL query params (`?goalId=...&taskId=...`) for shareability
- [ ] Empty states per column at each level

**Technical Notes:**
- Use `useSearchParams()` from Next.js for URL state
- Task view queries tasks from the selected goal's `Goal.tasks` JSON field
- Substep view queries substeps from the selected task

**Dependencies:** STORY-016, STORY-017 (priority and due dates needed for card display; can stub as "not set" if STORY-016/017 not yet done)

---

### STORY-010: Kanban Filters

**Epic:** EPIC-003 — Task Status & Kanban Board
**Priority:** Should Have
**Points:** 5

**User Story:**
As a power user, I want to filter the Kanban board by due date range, priority, and search text so that I can find the tasks I need to work on today.

**Acceptance Criteria:**
- [ ] Filter bar visible above the Kanban columns
- [ ] **Date range filter**: `dueDate` between start and end date; date pickers use existing UI library
- [ ] **Priority filter**: chip buttons (Low / Medium / High / Critical) for task/substep view; multi-select
- [ ] **Search**: text input that filters cards by title (client-side, immediate)
- [ ] **Goal filter**: dropdown (in task view) to show tasks from a specific goal only
- [ ] Filters persist within session (Redux local state)
- [ ] Active filter count badge on filter button
- [ ] "Clear Filters" button resets all filters

**Technical Notes:**
- Filtering is entirely client-side on the already-loaded data for instant feedback
- Date range picker: use an existing date picker component or a minimal custom one
- Add `kanbanFilters` slice to Redux local state

**Dependencies:** STORY-009

---

### STORY-011: Public Landing Page

**Epic:** EPIC-011 — Landing Page & Mobile Experience
**Priority:** Must Have
**Points:** 8

**User Story:**
As a potential user visiting Journey Tracker's homepage, I want to see a clear, compelling landing page that explains the product and gives me a strong reason to sign up, so that I can make an informed decision.

**Acceptance Criteria:**
- [ ] `/` route: authenticated users see the dashboard (existing behavior); unauthenticated users see the landing page
- [ ] Landing page is **server-rendered** (Next.js RSC, no client-only content)
- [ ] **Sections in order:**
  1. Hero: headline, subheadline, primary CTA ("Start Free"), secondary CTA ("Browse Templates")
  2. "How It Works": 4-step process (Set a Goal → Break It Down → Track Daily → See Progress)
  3. Features grid: 6 feature cards (Goal Hierarchy, AI Assistant, Streaks, Social Feed, Kanban, Templates)
  4. Social proof: "Start achieving your goals today" + CTA
- [ ] Links to `/sign-up`, `/sign-in`, `/marketplace`
- [ ] Fully responsive at 375px viewport width
- [ ] Meta tags: `<title>`, `<meta name="description">`, `<meta property="og:image">`
- [ ] `npm run build` succeeds with no TypeScript errors

**Technical Notes:**
- New file: `src/app/page.tsx` — check current middleware behavior to ensure unauthenticated access is allowed at `/`
- Middleware (`src/middleware.ts`) must add `/` to the public routes list
- Keep the landing page as a Server Component (no `'use client'`)

**Dependencies:** None

---

### STORY-012: Mobile Stats FAB & Bottom Sheet

**Epic:** EPIC-011 — Landing Page & Mobile Experience
**Priority:** Should Have
**Points:** 5

**User Story:**
As a mobile user, I want a floating action button that opens a stats panel with my streak, progress, and activity calendar so that I have the same information available on mobile as on the desktop sidebar.

**Acceptance Criteria:**
- [ ] FAB rendered only on mobile (hidden at `lg:` breakpoint and above), visible on all main app pages
- [ ] FAB is a circular button (bottom-right, z-50) with a chart/stats icon
- [ ] Tapping FAB opens a bottom sheet sliding up from the bottom of the screen
- [ ] **Bottom sheet contains:** StreakCounter component, active goals progress bar, quick stats (goals count, tasks completed today), ActivityCalendar heatmap
- [ ] Bottom sheet has an X close button and closes on overlay tap
- [ ] Slide-up animation: CSS keyframe `slideUp` defined in Tailwind config or `globals.css`
- [ ] Body scroll is locked while the sheet is open

**Technical Notes:**
- New component: `src/components/mobile/StatsFAB.tsx`
- New component: `src/components/mobile/MobileStatsSheet.tsx`
- Add FAB to `AppShell` conditionally (client-side viewport check)
- Reuse existing `StreakCounter` component from the desktop sidebar

**Dependencies:** STORY-013 (activity calendar needed for bottom sheet content)

---

### STORY-013: Activity Calendar Heatmap

**Epic:** EPIC-004 — Streak Tracking & Momentum Engine
**Priority:** Should Have
**Points:** 5

**User Story:**
As a user, I want to see a calendar heatmap of my streak activity on my profile page so that I can visualize my consistency and feel proud of my progress over time.

**Acceptance Criteria:**
- [ ] `ActivityCalendar` component renders a 52-week grid (last 12 months) of day cells
- [ ] Days with streak activity are filled in green; intensity increases with number of completions (1 level is fine for MVP)
- [ ] Days without activity are light gray
- [ ] Today's cell has a ring/border indicator
- [ ] Hover tooltip: "Feb 20, 2026 — 3 completions" (requires `title` attribute at minimum)
- [ ] Component rendered on `/profile` page, below the existing stats section
- [ ] Data sourced from `GET /api/streaks` (already returns `streakHistory`); completion count per day from `ActivityLog`
- [ ] Fully responsive: scrollable horizontally on mobile

**Technical Notes:**
- New component: `src/components/ActivityCalendar.tsx`
- `streakHistory` provides the active day list; for completion counts, query `ActivityLog` grouped by day
- Alternatively: count entries in `ActivityLog` per date for the heatmap intensity
- Consider a simple library like `react-activity-calendar` or implement from scratch with a flex grid

**Dependencies:** None (data already available via streakHistory)

---

### STORY-014: Template Detail Page

**Epic:** EPIC-008 — Template Marketplace
**Priority:** Should Have
**Points:** 5

**User Story:**
As a user browsing the marketplace, I want to click on a template and see its full details — including the task structure, creator info, and a fork button — so that I can evaluate the template before using it.

**Acceptance Criteria:**
- [ ] Route: `/marketplace/[templateId]` (new dynamic route)
- [ ] Displays: template title, description, difficulty badge, category, tags, fork count, created date
- [ ] Creator section: creator name (Clerk-synced via `getCurrentUser()`) and profile image
- [ ] Task/substep structure: collapsible tree showing all phases → tasks → substeps (collapsed by default for templates with 20+ tasks)
- [ ] "Use Template" button (authenticated users) forks the template immediately
- [ ] For unauthenticated users: "Use Template" redirects to `/sign-up?redirect=/marketplace/[templateId]`
- [ ] Back button/breadcrumb: "← Marketplace"
- [ ] Server-rendered with proper `<title>` and `<meta>` tags for SEO

**Technical Notes:**
- May already have a partial route; check `src/app/marketplace/[templateId]/` first
- Fork action uses existing `POST /api/templates/[id]/fork` endpoint
- Creator name sourced from `template.creator.name` (Prisma relation to User)

**Dependencies:** None

---

### STORY-015: Template Visibility Control

**Epic:** EPIC-008 — Template Marketplace
**Priority:** Should Have
**Points:** 3

**User Story:**
As a template creator, I want to choose whether my template is public or friends-only when publishing, and be able to change visibility later, so that I control who sees my templates.

**Acceptance Criteria:**
- [ ] `visibility` field on `GoalTemplate` model: `public` | `friends` (default `public`)
- [ ] Publish form includes a visibility toggle/radio: "Public" (visible to all) vs "Friends Only" (visible only to mutual friends)
- [ ] Published template page shows the current visibility setting with an edit option
- [ ] Marketplace query filters out `friends` templates for users who are not mutual friends with the creator
- [ ] Authenticated user can PATCH `/api/templates/[id]` to change visibility
- [ ] Friends-only templates are still counted in fork metrics but hidden from non-friends

**Technical Notes:**
- Check if `visibility` field already exists in the Prisma schema; if so, just wire up the UI
- The `GET /api/marketplace` query needs a `WHERE` clause: `(visibility = 'public') OR (visibility = 'friends' AND creator is mutual friend of requestor)`

**Dependencies:** None

---

### STORY-016: Task Priority Badges

**Epic:** EPIC-003 — Task Status & Kanban Board
**Priority:** Should Have
**Points:** 3

**User Story:**
As a user, I want to assign a priority level (low, medium, high, critical) to my tasks so that I know which tasks to focus on, and see priority badges on task cards.

**Acceptance Criteria:**
- [ ] `priority` field added to Task type in `src/types/index.ts`: `'low' | 'medium' | 'high' | 'critical'`
- [ ] Default priority: `'medium'`
- [ ] Task creation and edit forms include a priority selector
- [ ] Priority badge component: low = gray, medium = blue, high = orange, critical = red
- [ ] Badge displayed on task card in goal detail view and Kanban board
- [ ] AI agent `update-task` MCP tool accepts `priority` field
- [ ] Unit tests for priority badge rendering

**Technical Notes:**
- `priority` is stored in the `Goal.tasks` JSON field (no schema migration needed — just add to TypeScript types and update the read-modify-write pattern)
- Existing tasks without `priority` default to `'medium'` at read time

**Dependencies:** None

---

### STORY-017: Task and Substep Due Dates

**Epic:** EPIC-003 — Task Status & Kanban Board
**Priority:** Should Have
**Points:** 3

**User Story:**
As a user, I want to set due dates on my tasks and substeps and see overdue items highlighted so that I stay on track with deadlines.

**Acceptance Criteria:**
- [ ] `dueDate` field on Task and Substep types (optional, ISO date string)
- [ ] Task creation and edit forms include a date picker for `dueDate`
- [ ] Due date displayed on task/substep cards (formatted as "Feb 28" or "Mar 1, 2026")
- [ ] Overdue indicator: items with `dueDate < today` display a red badge "Overdue"
- [ ] AI agent create/update tools accept `dueDate` field
- [ ] Due date visible in Kanban drill-down task and substep cards

**Technical Notes:**
- Stored in `Goal.tasks` JSON field; no schema migration needed
- Check for `dueDate` in the existing Task/Substep TypeScript types — may already exist but not be displayed
- Use `Intl.DateTimeFormat` for display to respect user's locale

**Dependencies:** None

---

### STORY-018: Task Notes Field

**Epic:** EPIC-002 — Goal & Task Hierarchy Management
**Priority:** Should Have
**Points:** 3

**User Story:**
As a user, I want to add freeform notes to a task for context, links, or reminders, so that all information about the task is in one place.

**Acceptance Criteria:**
- [ ] `notes` field on Task type (optional string, multi-line)
- [ ] Notes field rendered as a `<textarea>` in task detail/edit view with a "Notes" label
- [ ] Auto-save on blur (debounced 500ms); shows "Saved" indicator briefly
- [ ] Notes visible (read-only) on the task card in collapsed view (first 100 chars, truncated)
- [ ] Saving new notes value creates an `ActivityLog` entry with type `note_updated` and `before`/`after` values
- [ ] AI agent `update-task` MCP tool accepts `notes` field

**Technical Notes:**
- Stored in `Goal.tasks` JSON field; no schema change
- `note_updated` tracking requires STORY-002 (MCP tools) or STORY-003 (REST) to be complete first

**Dependencies:** STORY-001 (for activity logging)

---

### STORY-019: Streak-at-Risk Email Notification

**Epic:** EPIC-004 — Streak Tracking & Momentum Engine
**Priority:** Could Have
**Points:** 5

**User Story:**
As a user with an active streak, I want to receive an email reminder in the evening if I haven't yet logged any activity today so that I don't lose my streak by forgetting.

**Acceptance Criteria:**
- [ ] A scheduled job (Vercel Cron at `/api/cron/streak-reminder`) runs daily at a configurable hour (default 8pm UTC; users' actual local time requires per-user scheduling — V1 uses a fixed UTC time)
- [ ] Job queries all users with `streakHistory` length > 0 where today's date (UTC) is NOT in `streakHistory`
- [ ] Sends a streak-at-risk reminder email via `notify()` function
- [ ] Email respects the master email toggle and a new `streakReminder` per-type toggle
- [ ] Job logs count of emails sent and is idempotent (safe to run multiple times)
- [ ] Protected by a secret header (`CRON_SECRET` env var) to prevent unauthorized triggering

**Technical Notes:**
- Vercel Cron: add `vercel.json` with cron configuration, or use the Vercel dashboard
- New email type `streakReminder` added to `EmailPreferences` model
- V1 limitation: sends at fixed UTC time (8pm UTC ≈ 4pm ET); per-user timezone scheduling is a V2 enhancement

**Dependencies:** STORY-001 (for activity tracking integration)

---

### STORY-020: AI-Assisted Goal Creation Onboarding

**Epic:** EPIC-005 — AI Agent & Chat Interface
**Priority:** Could Have
**Points:** 3

**User Story:**
As a new user with no goals, I want the AI chat to proactively welcome me and suggest creating my first goal so that I don't face a blank slate and can start immediately.

**Acceptance Criteria:**
- [ ] When a user with 0 goals opens the chat widget, the initial system prompt includes a hint to welcome them and suggest common goal types
- [ ] AI proactively sends a welcome message on chat open for 0-goal users (client-side check)
- [ ] Suggested categories in the welcome: fitness, learning, career, financial, creative
- [ ] Welcome message shown only once per user session (stored in `sessionStorage`)
- [ ] After the user creates their first goal (via AI or UI), the welcome message trigger is cleared
- [ ] The AI can immediately create the goal via `create-goal` MCP tool without navigation

**Technical Notes:**
- Client-side: check `goals.length === 0` from RTK Query cache before opening chat
- Pass a `isNewUser: true` flag in the initial message context, handled by the system prompt
- No database change needed — use `sessionStorage` to track whether welcome was shown

**Dependencies:** None

---

### STORY-021: Health Check API Endpoint

**Epic:** Infrastructure
**Priority:** Must Have
**Points:** 2

**User Story:**
As an operator, I want a `/api/health` endpoint that confirms the API and database are reachable, so that monitoring tools can detect outages before users do.

**Acceptance Criteria:**
- [ ] `GET /api/health` returns HTTP 200 with `{ status: 'ok', db: 'connected', timestamp: '...' }`
- [ ] Response within 500ms under normal conditions
- [ ] If the database is unreachable, returns HTTP 503 with `{ status: 'error', db: 'disconnected' }`
- [ ] Endpoint is publicly accessible (no Clerk auth required)
- [ ] Middleware must allow `/api/health` as a public route

**Technical Notes:**
- New route: `src/app/api/health/route.ts`
- Use `prisma.$queryRaw\`SELECT 1\`` as the DB ping
- Add `/api/health` to the public routes list in `src/middleware.ts`

**Dependencies:** None

---

### STORY-022: Test Coverage for New Features

**Epic:** Quality Assurance
**Priority:** Must Have
**Points:** 5

**User Story:**
As a developer, I want ≥80% test coverage on all newly added business logic from this sprint plan so that the codebase remains maintainable and regressions are caught automatically.

**Acceptance Criteria:**
- [ ] `trackActivity()` utility: 100% coverage (STORY-001)
- [ ] `checkFeedVisibility()` utility: 100% coverage (STORY-006)
- [ ] `ActivityCalendar` component: renders correct day cells for given `streakHistory` (STORY-013)
- [ ] Feed filtering logic: tests for each category filter (STORY-005)
- [ ] Health check endpoint: tests for 200 and 503 responses (STORY-021)
- [ ] `npm run test:coverage` shows ≥80% for `src/lib/` and `src/app/api/`
- [ ] All existing 309+ tests continue to pass (no regressions)

**Technical Notes:**
- Run this story last in the sprint as a cleanup/sweep
- Focus on utility functions and API routes (highest ROI for coverage)
- Component tests for `ActivityCalendar` and `FeedVisibilityPanel`

**Dependencies:** STORY-001, STORY-004, STORY-005, STORY-006, STORY-013, STORY-021

---

## Sprint Allocation

---

### Sprint 1 (Feb 21 – Mar 6) — 26/30 Points
**Goal:** "Deliver comprehensive activity logging across all mutation paths and an enhanced social feed"

| Story | Title | Points | Priority |
|-------|-------|--------|----------|
| STORY-001 | ActivityLog Model & trackActivity() | 5 | Must Have |
| STORY-002 | Wire Activity Tracking into MCP Tools | 5 | Must Have |
| STORY-003 | Wire Activity Tracking into REST API Routes | 5 | Must Have |
| STORY-004 | Enhanced Social Feed Display | 8 | Must Have |
| STORY-005 | Feed Filtering UI | 3 | Should Have |

**Total:** 26 / 30 capacity (87% utilization)

**Sprint 1 Risks:**
- STORY-001 schema change requires `prisma generate` and careful migration — run against a dev DB copy first
- STORY-002 touches 23 MCP tool files — high surface area; consider batching by category (goal tools day 1, task tools day 2, etc.)
- STORY-004 may surface gaps in the existing `FeedItem` model — allow 1 day buffer

**Dependencies:** None (fresh start)

---

### Sprint 2 (Mar 7 – Mar 20) — 26/30 Points
**Goal:** "Ship feed visibility controls and a fully functional Kanban board with drill-down and filters"

| Story | Title | Points | Priority |
|-------|-------|--------|----------|
| STORY-006 | Feed Visibility Preferences Backend | 5 | Should Have |
| STORY-007 | Feed Visibility Preferences UI | 3 | Should Have |
| STORY-009 | Kanban Drill-Down Navigation | 8 | Must Have |
| STORY-010 | Kanban Filters | 5 | Should Have |
| STORY-008 | Feed Item Grouping | 5 | Could Have |

**Total:** 26 / 30 capacity (87% utilization)

**Sprint 2 Risks:**
- STORY-009 (Kanban Drill-Down) is the largest story in the plan — scope well before starting; break into subtasks
- STORY-008 (Feed Grouping) is Could Have — drop it from the sprint if STORY-009 takes longer than expected
- New Prisma model in STORY-006 requires `prisma generate`

**Dependencies:** STORY-001 (Sprint 1)

---

### Sprint 3 (Mar 21 – Apr 3) — 26/30 Points
**Goal:** "Launch the public landing page, mobile stats FAB, and complete the template marketplace"

| Story | Title | Points | Priority |
|-------|-------|--------|----------|
| STORY-011 | Public Landing Page | 8 | Must Have |
| STORY-013 | Activity Calendar Heatmap | 5 | Should Have |
| STORY-012 | Mobile Stats FAB & Bottom Sheet | 5 | Should Have |
| STORY-014 | Template Detail Page | 5 | Should Have |
| STORY-015 | Template Visibility Control | 3 | Should Have |

**Total:** 26 / 30 capacity (87% utilization)

**Sprint 3 Risks:**
- STORY-011 requires middleware changes (`/` route must be public) — test unauthenticated routing carefully
- STORY-012 depends on STORY-013 (calendar in bottom sheet) — schedule STORY-013 first in the sprint
- STORY-011 design quality matters (it's the public face) — allow extra time for visual polish

**Dependencies:** STORY-013 before STORY-012 (within sprint)

---

### Sprint 4 (Apr 4 – Apr 17) — 24/30 Points
**Goal:** "Add task enhancements, AI onboarding, and ensure quality for private beta launch"

| Story | Title | Points | Priority |
|-------|-------|--------|----------|
| STORY-016 | Task Priority Badges | 3 | Should Have |
| STORY-017 | Task & Substep Due Dates | 3 | Should Have |
| STORY-018 | Task Notes Field | 3 | Should Have |
| STORY-021 | Health Check API Endpoint | 2 | Must Have |
| STORY-022 | Test Coverage for New Features | 5 | Must Have |
| STORY-019 | Streak-at-Risk Email | 5 | Could Have |
| STORY-020 | AI-Assisted Onboarding | 3 | Could Have |

**Total:** 24 / 30 capacity (80% utilization — buffer for pre-launch polish)

**Sprint 4 Risks:**
- STORY-019 (Vercel Cron) requires `vercel.json` config and an additional env var — test in a staging deployment
- STORY-022 (test coverage) is intentionally last to sweep all new code from Sprints 1-4
- 6-point buffer available for any pre-launch bug fixes discovered during final QA

**Dependencies:** STORY-001 (for STORY-018), STORY-016+017 (for STORY-009 to use priority/due date display)

---

## Epic Traceability

| Epic ID | Epic Name | Stories | Total Points | Sprints |
|---------|-----------|---------|--------------|---------|
| EPIC-002 | Goal & Task Hierarchy | STORY-018 | 3 | Sprint 4 |
| EPIC-003 | Task Status & Kanban | STORY-009, STORY-010, STORY-016, STORY-017 | 19 | Sprint 2, 4 |
| EPIC-004 | Streak Tracking | STORY-013, STORY-019 | 10 | Sprint 3, 4 |
| EPIC-005 | AI Agent & Chat | STORY-020 | 3 | Sprint 4 |
| EPIC-006 | Social Feed & Tracking | STORY-001, STORY-002, STORY-003, STORY-004, STORY-005, STORY-008 | 31 | Sprint 1, 2 |
| EPIC-008 | Template Marketplace | STORY-014, STORY-015 | 8 | Sprint 3 |
| EPIC-010 | Feed Visibility | STORY-006, STORY-007 | 8 | Sprint 2 |
| EPIC-011 | Landing Page & Mobile | STORY-011, STORY-012 | 13 | Sprint 3 |
| Infrastructure | Health & Quality | STORY-021, STORY-022 | 7 | Sprint 4 |
| **TOTAL** | | **22 stories** | **102 points** | **4 sprints** |

---

## Requirements Coverage

### Unimplemented FRs → Stories

| FR ID | FR Name | Story | Sprint |
|-------|---------|-------|--------|
| FR-016 | Task Priority | STORY-016 | 4 |
| FR-017 | Task/Substep Due Dates | STORY-017 | 4 |
| FR-018 | Task Notes | STORY-018 | 4 |
| FR-024 | Activity Calendar Heatmap | STORY-013 | 3 |
| FR-025 | Streak-at-Risk Notification | STORY-019 | 4 |
| FR-031 | Comprehensive Activity Logging | STORY-001, 002, 003 | 1 |
| FR-032 | Social Activity Feed | STORY-004 | 1 |
| FR-033 | Feed Item Grouping | STORY-008 | 2 |
| FR-034 | Feed Visibility Preferences | STORY-006, 007 | 2 |
| FR-035 | Feed Filtering | STORY-005 | 1 |
| FR-039 | Template Detail Page | STORY-014 | 3 |
| FR-040 | Template Visibility Control | STORY-015 | 3 |
| FR-042 | Kanban Drill-Down | STORY-009 | 2 |
| FR-044 | Kanban Filters | STORY-010 | 2 |
| FR-048 | Public Landing Page | STORY-011 | 3 |
| FR-049 | Mobile Stats FAB | STORY-012 | 3 |
| FR-050 | AI-Assisted Onboarding | STORY-020 | 4 |

### Already-Implemented FRs (confirmed stable)

FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-019, FR-020, FR-021, FR-022, FR-023, FR-026, FR-027, FR-028, FR-029, FR-030, FR-036, FR-037, FR-038, FR-041, FR-043, FR-045, FR-046, FR-047

**Coverage:** All 50 FRs accounted for — either implemented or in this sprint plan.

---

## Risks and Mitigation

**High:**
- **STORY-009 scope creep (Kanban Drill-Down):** Complex UI with URL state, multiple card types, and breadcrumb navigation. Mitigation: Time-box to 3 days; drop substep-level drill-down to v2 if needed.
- **ActivityLog retroactive data:** Existing activity has no `ActivityLog` entries. Mitigation: Feed only shows activity logged after STORY-001 is deployed; document this limitation.

**Medium:**
- **Schema migrations in MongoDB:** Adding new models (`ActivityLog`, `FeedVisibilityPreferences`) is safe (additive), but ensure `prisma generate` is re-run after each. Mitigation: CI runs `prisma generate` as part of build.
- **Public landing page SEO:** SSR for `/` requires middleware changes to allow unauthenticated access. Mitigation: Test unauthenticated routing in staging before merging.
- **STORY-019 Vercel Cron availability:** Cron jobs require a paid Vercel plan. Mitigation: Implement the endpoint; skip Vercel Cron config until confirming plan tier. Fallback: manual trigger via admin endpoint.

**Low:**
- **Test coverage regression:** New code from 22 stories could drop coverage. Mitigation: STORY-022 is dedicated to coverage; run `test:coverage` at end of each sprint.
- **UI consistency:** New components (FAB, bottom sheet, calendar heatmap) must match existing design system. Mitigation: Reuse existing Tailwind classes, color palette, and component patterns.

---

## Dependencies

### External Dependencies
- **Clerk:** Auth routes must remain stable; `/` route must be added to public list in middleware
- **MongoDB Atlas:** `ActivityLog` collection will grow rapidly with comprehensive tracking; ensure Atlas tier can handle write volume (M0 dev tier is fine for MVP; M10 before beta launch)
- **Anthropic Claude API:** No changes needed for STORY-020 (onboarding); uses existing agent infrastructure
- **Vercel Cron** (STORY-019): Requires Pro plan or above; verify before implementing

### Internal Dependencies
- STORY-001 must ship before: STORY-002, STORY-003, STORY-004, STORY-018
- STORY-013 must ship before: STORY-012 (FAB uses calendar)
- STORY-016+017 ideally ship before: STORY-009 (for priority/due date in drill-down cards)

---

## Team Capacity

```
Team size:           1 developer (Alonsooteroseminario)
Experience level:    Senior
Sprint length:       2 weeks (10 workdays)
Productive hours:    6 hours/day
Total hours/sprint:  60 hours
Story point rate:    2 hours/point (senior)
Capacity/sprint:     30 story points
Buffer:              10-20% (sprints are 80-87% loaded)
```

---

## Definition of Done

For a story to be considered complete:

- [ ] Code implemented and committed to main (or feature branch merged via PR)
- [ ] All acceptance criteria validated manually or via automated test
- [ ] Unit tests written for all new utility functions and API routes
- [ ] `npm run test` passes with no new failures
- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] No new `console.log` statements (only `console.warn` / `console.error`)
- [ ] No `any` types without inline justification comment
- [ ] If schema changed: `npx prisma generate` run and committed
- [ ] RTK Query cache invalidation verified for all write operations

---

## Sprint Cadence

- Sprint length: 2 weeks
- Sprint start: Monday Week 1
- Sprint review/demo: Friday Week 2
- Sprint retrospective: Friday Week 2 (brief, solo — journal key learnings)
- Sprint planning for next sprint: Monday Week 3

---

## Next Steps

**Immediate:** Begin Sprint 1 — STORY-001 (ActivityLog Model)

Run `/bmad:dev-story STORY-001` to generate a detailed story document and begin implementation.

Or start coding directly with the STORY-001 acceptance criteria above.

**Recommended order within Sprint 1:**
1. STORY-001 (schema + utility) — Day 1-2
2. STORY-002 (MCP tools wiring) — Day 3-4
3. STORY-003 (REST API wiring) — Day 5-6
4. STORY-004 (Enhanced feed display) — Day 7-9
5. STORY-005 (Feed filtering UI) — Day 10

---

**This plan was created using BMAD Method v6 - Phase 4 (Sprint Planning)**

*Generated: 2026-02-20*
*Next: Run `/bmad:dev-story STORY-001` to begin implementation*
