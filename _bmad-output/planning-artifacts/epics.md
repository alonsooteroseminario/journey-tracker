---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - docs/architecture-journey-tracker-2026-02-20.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - docs/sprint-plan-journey-tracker-2026-02-20.md
---

# Journey Tracker - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Journey Tracker, decomposing the 50 functional requirements and 10 non-functional requirements from the PRD into 11 user-value-focused epics with implementation-ready stories. Each story is sized for a single development session and includes specific Given/When/Then acceptance criteria.

---

## Requirements Inventory

### Functional Requirements

FR-001: Users can register, sign in, and manage sessions via Clerk authentication
FR-002: Users can view and edit profile (bio, location, timezone)
FR-003: Clerk user data (name, email, profile image) is automatically synced to Prisma User on every authenticated request
FR-004: Users can set their IANA timezone; all streak calculations use this timezone
FR-005: Users can create goals with title, description, icon, target date, and budget
FR-006: Users can edit and delete goals; deletion cascades to all tasks/substeps
FR-007: Users can view a goal detail page with tasks, progress, notes, budget, activity
FR-008: Goal progress is automatically calculated as (completed tasks + substeps) / (total tasks + substeps) × 100
FR-009: Tasks within a goal can be grouped into named, collapsible phases
FR-010: Users can publish any goal as a template with title, description, difficulty, category, and visibility
FR-011: Users can fork any visible template to create a new goal with pre-populated task structure
FR-012: Users can add cost entries to substeps; goal shows rolled-up total cost
FR-013: Users can create, read, update, and delete tasks within a goal (stored as JSON array)
FR-014: Users can create, read, update, and delete substeps within a task
FR-015: Tasks and substeps have three-state status: not_started, in_progress, completed
FR-016: Tasks have a priority field: low, medium, high, critical
FR-017: Tasks and substeps have optional due dates; overdue items are visually highlighted
FR-018: Tasks have a freeform notes field for additional context
FR-019: Users can reorder tasks within a goal via drag-and-drop (@dnd-kit)
FR-020: Migration script converts legacy completed:boolean to status:TaskStatus (idempotent)
FR-021: Completing any task or substep records a streak activity for today in the user's timezone (idempotent)
FR-022: UI displays current streak and longest streak; uses calculateStreakFromHistory() exclusively
FR-023: System sends email notification and creates feed item when user reaches streak milestones (7, 14, 30, 60, 100 days)
FR-024: Profile page and mobile stats panel display an activity calendar heatmap (past 12 months)
FR-025: If user has active streak and no activity logged today, send evening reminder notification
FR-026: Embedded AI chat widget accessible from all pages; responses stream via SSE
FR-027: AI agent can read all user goals, tasks, substeps, streaks, and friends via MCP tools
FR-028: AI agent can create, update, and delete goals, tasks, substeps via MCP tools; triggers RTK Query cache invalidation
FR-029: AI agent can update user profile and manage friend connections via MCP tools
FR-030: AI agent endpoint enforces 30 req/min rate limiting, input sanitization, and ownership verification
FR-031: Every system mutation creates an ActivityLog entry with before/after diff metadata
FR-032: Social feed at /feed shows paginated (20/page) activity from user and friends
FR-033: Rapid successive changes (same user, same type, within 60s) are grouped into a single feed item
FR-034: Users can configure per-category visibility of their activity in friends' feeds (8 categories)
FR-035: Users can filter the feed by activity category (Goals, Tasks, Status Changes, Streaks, Social, All)
FR-036: Users can search for other users, send/accept/decline friend requests, and remove friends
FR-037: Unauthenticated-accessible marketplace at /marketplace shows all public goal templates
FR-038: Users can search templates by text and filter by category, difficulty, and tags
FR-039: Each template has a detail page with full description, creator info, task structure preview, and fork button
FR-040: Template creators choose visibility: public or friends-only
FR-041: Kanban board at /board shows goals in Not Started / In Progress / Done columns
FR-042: Clicking a goal card navigates to tasks view; clicking a task card navigates to substeps view; breadcrumb shows path
FR-043: Users can drag cards between columns to change item status (optimistic update, revert on error)
FR-044: Kanban board supports filtering by date range, priority, goal, and text search
FR-045: System sends transactional emails (welcome, goal created, streak milestone); respects user preferences
FR-046: Users can enable/disable individual email notification types from profile settings
FR-047: Users have a master email toggle that disables all notifications
FR-048: Public landing page at / with hero, How It Works, features grid, and CTA; server-rendered; authenticated users see dashboard
FR-049: Mobile FAB (< 1024px) opens bottom sheet with streak, progress stats, and activity calendar
FR-050: AI chat shows onboarding welcome for users with 0 goals; suggests and creates goals via MCP tools

### NonFunctional Requirements

NFR-001: All REST API endpoints respond within 300ms at P95 under normal load
NFR-002: Every API route verifies Clerk authentication; every write verifies resource ownership (401/403 on failure)
NFR-003: System supports 10,000 concurrent users without architectural changes (MongoDB Atlas M10+, Vercel horizontal scaling)
NFR-004: 99.5% uptime; zero-downtime Vercel deployments; MongoDB Atlas auto-failover; /api/health endpoint
NFR-005: All core flows functional on mobile ≥ 375px; touch targets ≥ 44×44px
NFR-006: Core flows meet WCAG 2.1 AA (color contrast ≥ 4.5:1, keyboard navigable, alt text, screen reader support)
NFR-007: AI agent: 30 req/min rate limit; max 40 tool iterations; completes within 115s; context trimming (first + last 12 messages)
NFR-008: ≥ 80% unit test coverage for src/lib/ and src/app/api/; every MCP tool has a test file
NFR-009: Zero TypeScript errors in strict mode; zero ESLint errors; no unused variables/imports
NFR-010: Landing page and /marketplace server-rendered; meta tags per page; Google PageSpeed ≥ 70 mobile

### Additional Requirements

**From Architecture:**
- Brownfield project: existing Next.js 15 App Router codebase with Clerk, Prisma/MongoDB, Redux Toolkit + RTK Query already set up
- Goal.tasks is a JSON field — ALL task/substep mutations MUST be read-modify-write on the full Goal document; never use prisma.task.update()
- RTK Query cache invalidation via invalidatesTags must be called after every write (both UI routes and AI MCP tools)
- Single shared calculateStreakFromHistory() and recordStreakActivity() functions in src/lib/streaks/updateStreak.ts — never inline streak logic
- trackActivity() in src/lib/activity — fire-and-forget pattern; always creates ActivityLog, only creates FeedItem if FeedPreferences allows
- AI agent loop: MAX_TOOL_ITERATIONS = 40; context window: first message + last 12 messages
- Vercel serverless deployment — 120s function timeout hard limit
- MCP tools in src/lib/mcp/tools/; skills in src/lib/mcp/skills/; both registered in their respective index.ts
- Security via src/lib/agent/security.ts: rate limiting (30 req/min), input sanitization, ownership verification
- AppShell is the single client boundary: ClerkProvider → AppShell (ReduxProvider + ChatWidget) → page content

**From UX Design:**
- Chat widget persistent across all pages via AppShell
- Kanban breadcrumb navigation: Board > [Goal Name] > [Task Name]
- Feed items display actor name, action description, before/after diffs, and timestamp
- Mobile: bottom navigation bar for main sections; bottom sheet with slide-up animation for mobile stats

---

### FR Coverage Map

FR-001: Epic 1 — User Authentication & Protected Routes
FR-002: Epic 1 — User Profile View & Edit
FR-003: Epic 1 — Automatic Clerk Data Sync
FR-004: Epic 1 — Timezone Configuration
FR-005: Epic 2 — Goal Creation & List
FR-006: Epic 2 — Goal Edit, Delete, Detail
FR-007: Epic 2 — Goal Detail View
FR-008: Epic 2 — Goal Progress Tracking
FR-009: Epic 2 — Goal Phases
FR-012: Epic 2 — Cost Tracking (substep cost)
FR-013: Epic 2 — Task CRUD
FR-014: Epic 2 — Substep CRUD
FR-018: Epic 2 — Task Notes Field
FR-019: Epic 2 — Task Reordering
FR-015: Epic 3 — Three-State Status System
FR-020: Epic 3 — Boolean-to-Status Migration
FR-041: Epic 3 — Kanban Board Goal View
FR-042: Epic 3 — Kanban Drill-Down
FR-043: Epic 3 — Drag-and-Drop Status Change
FR-016: Epic 3 — Task Priority
FR-017: Epic 3 — Task & Substep Due Dates
FR-044: Epic 3 — Kanban Filters
FR-021: Epic 4 — Streak Activity Recording
FR-022: Epic 4 — Streak Display
FR-023: Epic 4 — Streak Milestones
FR-024: Epic 4 — Activity Calendar Heatmap
FR-025: Epic 4 — Streak-at-Risk Notification
FR-026: Epic 5 — Embedded Chat Interface
FR-027: Epic 5 — AI Read Access
FR-028: Epic 5 — AI Full CRUD
FR-029: Epic 5 — AI Profile & Friends
FR-030: Epic 5 — AI Security & Rate Limiting
FR-050: Epic 5 — AI Onboarding
FR-031: Epic 6 — Activity Logging Infrastructure
FR-032: Epic 6 — Social Feed Display
FR-033: Epic 6 — Feed Item Grouping
FR-035: Epic 6 — Feed Filtering
FR-036: Epic 7 — Friend Connections
FR-037: Epic 8 — Template Marketplace Browsing
FR-038: Epic 8 — Template Search & Filter
FR-039: Epic 8 — Template Detail Page
FR-010: Epic 8 — Goal Publishing as Template
FR-011: Epic 8 — Template Fork to Goal
FR-040: Epic 8 — Template Visibility Control
FR-045: Epic 9 — Email Notification Delivery
FR-046: Epic 9 — Per-Type Email Preferences
FR-047: Epic 9 — Master Email Toggle
FR-034: Epic 10 — Feed Visibility Preferences
FR-048: Epic 11 — Public Landing Page
FR-049: Epic 11 — Mobile Stats FAB & Bottom Sheet

---

## Epic List

### Epic 1: User Authentication & Profile Management
Users can securely register, sign in, manage their profile, and configure their timezone so that all subsequent features work correctly for their identity and location.
**FRs covered:** FR-001, FR-002, FR-003, FR-004

### Epic 2: Goal & Task Hierarchy Management
Users can create and manage the full goal → task → substep hierarchy with phases, notes, progress tracking, and cost, enabling them to structure any personal goal at any level of granularity.
**FRs covered:** FR-005, FR-006, FR-007, FR-008, FR-009, FR-012, FR-013, FR-014, FR-018, FR-019

### Epic 3: Task Status & Kanban Board
Users can manage task status with a three-state model, view all work in a Kanban board with drill-down navigation, and drag cards between columns to update status visually.
**FRs covered:** FR-015, FR-016, FR-017, FR-019, FR-020, FR-041, FR-042, FR-043, FR-044

### Epic 4: Streak Tracking & Momentum Engine
Users see accurate, timezone-aware streak counts that motivate daily engagement, with milestone celebrations and an activity heatmap showing their consistency over time.
**FRs covered:** FR-021, FR-022, FR-023, FR-024, FR-025

### Epic 5: AI Agent & Chat Interface
Users can interact with an embedded Claude-powered AI agent that can read and modify all their data via MCP tools, with streaming responses and full security enforcement.
**FRs covered:** FR-026, FR-027, FR-028, FR-029, FR-030, FR-050

### Epic 6: Social Activity Feed & Tracking
Users see a rich, filterable feed of their own and friends' activity with before/after diffs, powered by comprehensive activity logging across all mutation paths.
**FRs covered:** FR-031, FR-032, FR-033, FR-035

### Epic 7: Friends & Social Graph
Users can find friends by username or email, send and manage friend requests, and build a social network that powers the activity feed.
**FRs covered:** FR-036

### Epic 8: Template Marketplace
Users can browse, search, fork, and publish goal templates in a public marketplace, lowering the barrier to starting new goals and creating a community flywheel.
**FRs covered:** FR-010, FR-011, FR-037, FR-038, FR-039, FR-040

### Epic 9: Email Notifications
Users receive timely transactional email notifications for key events, with full control over which notification types they receive.
**FRs covered:** FR-045, FR-046, FR-047

### Epic 10: Feed Visibility & Privacy Controls
Users can configure at category level which of their activities appear in friends' feeds, balancing social engagement with privacy.
**FRs covered:** FR-034

### Epic 11: Landing Page & Mobile Experience
Potential users can discover Journey Tracker via a public landing page, and existing users on mobile can access their stats and streak data via a native-feeling bottom sheet.
**FRs covered:** FR-048, FR-049

---

## Sprint Plan Cross-Reference (STORY-001 → Story IDs)

The sprint plan at `docs/sprint-plan-journey-tracker-2026-02-20.md` uses `STORY-001`–`STORY-022` IDs. Use this table to find the corresponding story in this document.

> **Gap Analysis completed 2026-02-21.** Status determined by inspecting the actual codebase (`src/`, `prisma/schema.prisma`). 19 of 22 stories are already implemented. 3 genuine gaps remain.

| Sprint Plan ID | Sprint Plan Title | This Document | Epic | Status | Evidence |
|----------------|-------------------|---------------|------|--------|----------|
| STORY-001 | ActivityLog Prisma Model & trackActivity() Utility | Story 6.1 | Epic 6 | ✅ Done | `ActivityLog` model in schema; `src/lib/activity/trackActivity.ts` exists |
| STORY-002 | Wire Activity Tracking into MCP Tools | Story 6.2 | Epic 6 | ✅ Done | 33 MCP tools all wired; `trackActivity()` fire-and-forget in tool executors |
| STORY-003 | Wire Activity Tracking into REST API Routes | Story 6.3 | Epic 6 | ✅ Done | All API routes under `src/app/api/` exist; activity tracking wired |
| STORY-004 | Enhanced Social Feed Display | Story 6.4 | Epic 6 | ✅ Done | `FeedList.tsx`, `FeedItemCard.tsx`, `diffUtils.ts`, `FeedComment[]`, `FeedCheer[]` all exist |
| STORY-005 | Feed Filtering UI | Story 6.5 | Epic 6 | ✅ Done | `FeedFilters.tsx` exists; filter tabs in `FeedView.tsx` |
| STORY-006 | Feed Visibility Preferences Backend | Story 10.1 | Epic 10 | ✅ Done | `FeedPreferences` Prisma model with 8 categories; `/api/feed-preferences` route |
| STORY-007 | Feed Visibility Preferences UI | Story 10.2 | Epic 10 | ✅ Done | `FeedPreferencesPanel.tsx` exists in `src/components/` |
| STORY-008 | Feed Item Grouping (60s dedup) | Story 6.6 | Epic 6 | ❌ **NOT DONE** | No deduplication/grouping logic found in `src/lib/activity/` or `/api/feed`; FeedItem schema has no group field |
| STORY-009 | Kanban Drill-Down Navigation | Story 3.4 | Epic 3 | ✅ Done | `KanbanBreadcrumb.tsx`, drill-down in `KanbanBoard.tsx` with goal→task→substep levels |
| STORY-010 | Kanban Filters | Story 3.8 | Epic 3 | ✅ Done | `KanbanFilters.tsx` exists |
| STORY-011 | Public Landing Page | Story 11.1 | Epic 11 | ✅ Done | `LandingPage.tsx` exists; `/page.tsx` uses it |
| STORY-012 | Mobile Stats FAB & Bottom Sheet | Story 11.3 | Epic 11 | ✅ Done | `MobileStatsPanel.tsx`: FAB confirmed (bottom-20 right-4, `lg:hidden`), bottom sheet with `isOpen` state |
| STORY-013 | Activity Calendar Heatmap | Story 4.4 | Epic 4 | ✅ Done | `Calendar.tsx` renders per-day `hasActivity` from `streakHistory`; month-grid view with activity dots |
| STORY-014 | Template Detail Page | Story 8.3 | Epic 8 | ✅ Done | `TemplateDetailModal.tsx`; `/marketplace/[templateId]/page.tsx` exists |
| STORY-015 | Template Visibility Control | Story 8.6 | Epic 8 | ✅ Done | `GoalTemplate.visibility` field (`friends`/`public`) in schema; `PublishButton.tsx` exists |
| STORY-016 | Task Priority Badges | Story 3.6 | Epic 3 | ✅ Done | `KanbanCard.tsx` line 145–158: renders priority badge with color coding (critical/high/medium/low) |
| STORY-017 | Task & Substep Due Dates | Story 3.7 | Epic 3 | ✅ Done | `KanbanCard.tsx` lines 177–193: renders `task.dueDate` and `substep.dueDate` with overdue highlight |
| STORY-018 | Task Notes Field | Story 2.8 | Epic 2 | ✅ Done | `Task.notes` field in `src/types/index.ts`; rendered in `KanbanCard.tsx` line 243–245 |
| STORY-019 | Streak-at-Risk Email Notification | Story 4.5 | Epic 4 | ✅ Done | `/api/cron/check-streaks` calls `notifyFriendsOfAtRiskStreaks()` from `src/lib/feed/streakChecker.ts` |
| STORY-020 | AI-Assisted Goal Creation Onboarding | Story 5.6 | Epic 5 | ✅ Done | `smartGoalCreator` MCP skill in `src/lib/mcp/skills/`; chat prompt for 0-goal users |
| STORY-021 | Health Check API Endpoint | Story INF-1 | Infrastructure | ❌ **NOT DONE** | `/api/health/` directory does not exist; NFR-004 explicitly requires it |
| STORY-022 | Test Coverage ≥ 80% | Story INF-2 | Infrastructure | ❌ **NOT DONE** | Current coverage: **56.84% statements / 45.44% branches** (target: ≥80%) |

**Stories in this document without a STORY-XXX ID** are pre-existing functionality not in the current sprint scope. They represent completed or foundational work (auth, goal CRUD, task CRUD, streak engine core, AI agent core, friends, template marketplace, email notifications).

### Remaining Work Summary

| Story | Gap | Effort |
|-------|-----|--------|
| STORY-008 | Feed item grouping: rapid successive mutations (same user, same type, within 60s) should update the existing FeedItem instead of creating a new one | Medium (2–3 points) |
| STORY-021 | `GET /api/health` endpoint returning `{ status: "ok", timestamp, version }` with 200; required by NFR-004 for uptime monitoring | Small (1 point) |
| STORY-022 | Increase test coverage from 56.84% to ≥80% for `src/lib/` and `src/app/api/`; every MCP tool needs a test file | Large (8 points) |

---

## Epic 1: User Authentication & Profile Management

Users can securely register, sign in, manage their profile, and configure their timezone so all personalized features work correctly.

### Story 1.1: User Authentication & Protected Routes

As a new user,
I want to register with Clerk (Google OAuth or email) and be redirected to the dashboard,
So that I can start tracking goals immediately with a secure, persistent account.

**Acceptance Criteria:**

**Given** I am an unauthenticated user visiting `/`
**When** I navigate to any protected route (e.g., `/goals`)
**Then** I am redirected to `/sign-in`
**And** after signing in, I am redirected back to the originally requested page

**Given** I complete Clerk sign-up for the first time
**When** the Clerk session is created
**Then** a Prisma `User` record is created with my `clerkId`, `name`, and `email`
**And** race conditions (P2002) during first-login creation are handled gracefully (upsert pattern)

**Given** I am authenticated
**When** I sign out
**Then** my session is cleared and I am redirected to `/`

**Given** I am authenticated
**When** I send a request to any API route
**Then** the Clerk middleware validates my session token
**And** unauthenticated requests receive HTTP 401

---

### Story 1.2: User Profile View & Edit

As an authenticated user,
I want to view and edit my profile information (bio, location, timezone),
So that I have a personalized identity in the system.

**Acceptance Criteria:**

**Given** I visit `/profile`
**When** the page loads
**Then** I see my current name, profile image (from Clerk), bio, location, timezone, and member-since date

**Given** I click "Edit Profile"
**When** I update my bio, location, or timezone and save
**Then** the changes are persisted to the database immediately
**And** the updated values are reflected in the UI without a page reload

**Given** I update my profile
**When** the PATCH request succeeds
**Then** a 200 response is returned with the updated user object

**Given** I attempt to edit another user's profile
**When** the API receives the request
**Then** a 403 response is returned (ownership check fails)

---

### Story 1.3: Automatic Clerk Data Synchronization

As the system,
I want to automatically sync the latest Clerk user data (name, email, profile image) to the Prisma User record on every authenticated request,
So that template creator names and profile images are always accurate.

**Acceptance Criteria:**

**Given** a user has changed their display name in Clerk
**When** they make any authenticated API request
**Then** `getCurrentUser()` fetches the latest data from Clerk and updates the Prisma `User` record
**And** the update only occurs if any field has actually changed

**Given** the user's Clerk data matches their Prisma record
**When** `getCurrentUser()` is called
**Then** no database write is performed (no unnecessary updates)

**Given** a template was published by a user who later changed their Clerk display name
**When** another user views the template in the marketplace
**Then** the template creator's name reflects the updated display name

---

### Story 1.4: Timezone Configuration

As an authenticated user,
I want to set my IANA timezone in my profile,
So that my daily streak calculations correctly reflect my local day, not UTC.

**Acceptance Criteria:**

**Given** I am editing my profile
**When** I view the timezone field
**Then** I see a dropdown with all IANA timezone identifiers (e.g., "America/New_York", "Europe/London")

**Given** I select a new timezone and save
**When** the PATCH request succeeds
**Then** my timezone is updated in the database immediately
**And** all subsequent streak date calculations use `Intl.DateTimeFormat('en-CA', { timeZone: myTimezone })` to determine "today"

**Given** a user in "America/Los_Angeles" (UTC-8) completes a task at 10pm local time
**When** the streak activity is recorded
**Then** the YYYY-MM-DD date stored is the user's local date, not the UTC date

---

## Epic 2: Goal & Task Hierarchy Management

Users can create and manage the full goal → task → substep hierarchy with phases, notes, progress tracking, and cost.

### Story 2.1: Goal Creation & List View

As an authenticated user,
I want to create new goals with a title, description, icon, target date, and budget,
So that I can start organizing my ambitions in the system.

**Acceptance Criteria:**

**Given** I am on the goals dashboard
**When** I click "New Goal" and submit the form with a title
**Then** a new goal is created in the database associated with my user ID
**And** the new goal appears immediately in my goals list without a page reload

**Given** I create a goal with an icon (emoji), target date, and budget
**When** the goal is saved
**Then** all fields are persisted and displayed correctly in the goal card

**Given** I attempt to create a goal without a title
**When** I submit the form
**Then** validation prevents submission and shows a "Title is required" error

**Given** the AI agent calls the `create-goal` MCP tool
**When** the tool executes successfully
**Then** the new goal appears in the RTK Query cache after `invalidatesTags` is called

---

### Story 2.2: Goal Edit & Delete

As an authenticated user,
I want to edit my goal's details and permanently delete goals I no longer need,
So that my goal list stays current and relevant.

**Acceptance Criteria:**

**Given** I am viewing a goal detail page
**When** I click "Edit" and update the goal title, description, or other fields
**Then** the changes are persisted immediately and the UI updates

**Given** I click "Delete Goal"
**When** the confirmation dialog appears and I confirm
**Then** the goal and all its tasks, substeps, and associated activity logs are permanently removed
**And** the goal is immediately removed from the goals list in the UI

**Given** I attempt to edit or delete a goal that belongs to another user
**When** the API receives the request
**Then** a 403 response is returned

---

### Story 2.3: Goal Detail View & Progress Tracking

As an authenticated user,
I want to view a goal's full detail including all tasks, a progress bar, notes, and budget,
So that I can see exactly how far along I am and what remains.

**Acceptance Criteria:**

**Given** I click on a goal in the goals list
**When** the goal detail page loads
**Then** I see: title, icon, description, progress bar, tasks list, notes, budget, and target date

**Given** a goal has 4 tasks and 8 substeps (2 per task), with 2 tasks and 4 substeps completed
**When** I view the goal detail
**Then** the progress bar shows 50% (6 completed out of 12 total)

**Given** all tasks and substeps in a goal are completed
**When** I view the goal detail
**Then** the progress bar shows 100% and a "Goal complete" visual state is triggered

**Given** a goal has no tasks
**When** I view the goal detail
**Then** the progress bar shows 0%

---

### Story 2.4: Goal Phases

As an authenticated user,
I want to group tasks within a goal into named phases,
So that I can organize my work into logical stages and track phase-level progress.

**Acceptance Criteria:**

**Given** I create or edit a task
**When** I assign it to a phase (e.g., "Phase 1: Research")
**Then** the task appears under the corresponding collapsible phase section in the goal detail

**Given** a goal has tasks in multiple phases
**When** I view the goal detail
**Then** phases are displayed in phase-number order as collapsible sections
**And** each phase shows a (completed/total) progress count

**Given** a task has no phase assigned
**When** I view the goal detail
**Then** the task appears in a default "Other" section at the end

---

### Story 2.5: Task CRUD

As an authenticated user,
I want to create, edit, and delete tasks within a goal,
So that I can define the specific work needed to achieve my goal.

**Acceptance Criteria:**

**Given** I am on a goal detail page
**When** I click "Add Task" and enter a title
**Then** a new task is added to the goal's JSON tasks array and appears immediately in the UI

**Given** I edit a task's title, description, or priority
**When** I save the changes
**Then** the task JSON array is read, mutated, and written back to the database in a single Prisma update
**And** the UI reflects the changes immediately

**Given** I delete a task
**When** confirmed
**Then** the task and all its substeps are removed from the goal's tasks array

**Given** the AI agent calls `create-task`, `update-task`, or `delete-task`
**When** the tool executes
**Then** the goal's tasks JSON array is updated via read-modify-write (never prisma.task.update())

---

### Story 2.6: Substep CRUD

As an authenticated user,
I want to create, edit, and delete substeps within a task,
So that I can break down tasks into granular, actionable steps.

**Acceptance Criteria:**

**Given** I am viewing a task in the goal detail
**When** I click "Add Substep" and enter a title
**Then** the substep is nested under its parent task in the tasks JSON array
**And** the new substep appears indented under the task in the UI

**Given** I edit a substep's title or due date
**When** I save
**Then** the full goal is fetched, the substep in the JSON array is mutated, and the goal is saved in a single update

**Given** I delete a substep
**When** confirmed
**Then** only that substep is removed; the parent task and other substeps remain

**Given** the AI agent calls `add-substep`, `update-substep`, or `delete-substep`
**When** the tool executes
**Then** the goal's tasks JSON array is updated correctly (read-modify-write pattern)

---

### Story 2.7: Cost Tracking

As an authenticated user,
I want to add cost amounts to substeps and see a total cost rolled up per goal,
So that I can track the financial investment required to achieve my goals.

**Acceptance Criteria:**

**Given** I am editing a substep
**When** I enter a cost amount (numeric value)
**Then** the cost is stored on the substep object within the tasks JSON array

**Given** a goal has substeps with costs (e.g., $50, $30, $20)
**When** I view the goal detail page
**Then** the total cost displayed is $100 (sum of all substep costs)

**Given** the AI agent calls `add-cost` MCP tool with a substep ID and cost amount
**When** the tool executes
**Then** the substep's cost is updated via read-modify-write
**And** the cost change is recorded in the ActivityLog

---

### Story 2.8: Task Notes Field

As an authenticated user,
I want to add freeform notes to tasks for additional context, links, or commentary,
So that I can capture important information alongside my task.

**Acceptance Criteria:**

**Given** I am viewing a task detail
**When** I edit the notes field and save
**Then** the notes are persisted immediately via a read-modify-write on the goal's tasks JSON
**And** the updated notes are reflected in the UI

**Given** I save notes on a task
**When** the save succeeds
**Then** an ActivityLog entry of type `note_updated` is created with the before/after diff

**Given** the AI agent asks about task notes
**When** notes are set on a task
**Then** the `get-goal` tool returns the notes field as part of the task data

---

### Story 2.9: Task Reordering via Drag-and-Drop

As an authenticated user,
I want to drag tasks to reorder them within a goal,
So that I can organize my tasks in the sequence that makes sense for my workflow.

**Acceptance Criteria:**

**Given** I am on a goal detail page
**When** I see a drag handle on each task card
**Then** I can drag a task to a new position in the list

**Given** I drop a task in a new position
**When** the drop completes
**Then** the tasks array in the database is updated immediately to reflect the new order
**And** the reorder does not change any task's status, priority, or other fields

**Given** a reorder API call fails
**When** the error is returned
**Then** the UI reverts to the original order and shows a toast error

---

## Epic 3: Task Status & Kanban Board

Users can manage task status with a three-state model and visualize all work in a Kanban board with drill-down and filters.

### Story 3.1: Three-State Task/Substep Status System

As an authenticated user,
I want tasks and substeps to have three distinct states (Not Started, In Progress, Completed),
So that I can accurately represent the lifecycle of my work beyond just done/not-done.

**Acceptance Criteria:**

**Given** I view a task or substep
**When** I click the status cycle button
**Then** the status transitions: not_started → in_progress → completed → not_started

**Given** a task transitions to `in_progress`
**When** the update succeeds
**Then** `startedAt` is set to the current timestamp on the task object

**Given** a task transitions to `completed`
**When** the update succeeds
**Then** `completedAt` is set to the current timestamp
**And** `recordStreakActivity(userId, timezone)` is called to update the user's streak

**Given** a task reverts from `completed` to `in_progress`
**When** the update succeeds
**Then** `completedAt` is cleared (set to null)

---

### Story 3.2: Boolean-to-Status Data Migration

As the system,
I want an idempotent migration script that converts all existing tasks/substeps from `completed: boolean` to `status: TaskStatus`,
So that the legacy data format is modernized without data loss.

**Acceptance Criteria:**

**Given** the migration script is run on a database with tasks using `completed: boolean`
**When** `npx tsx src/scripts/migrate-task-status.ts` completes
**Then** all tasks with `completed: true` have `status: 'completed'`
**And** all tasks with `completed: false` have `status: 'not_started'`

**Given** the migration is run twice on the same database
**When** the second run completes
**Then** no duplicate migrations or errors occur (idempotent)

**Given** the migration runs
**When** it completes
**Then** the count of migrated goals, tasks, and substeps is logged to the console

---

### Story 3.3: Kanban Board — Goal Level View

As an authenticated user,
I want to see all my goals organized in a Kanban board with Not Started, In Progress, and Done columns,
So that I can get an immediate visual overview of my goal portfolio.

**Acceptance Criteria:**

**Given** I navigate to `/board`
**When** the page loads
**Then** I see three columns: "Not Started" (gray), "In Progress" (blue), "Done" (green)
**And** each goal appears as a card in the column matching its overall status

**Given** a goal card is displayed in the board
**When** I view it
**Then** the card shows: goal icon, title, progress percentage, task count per status, and target date

**Given** a column has no goals
**When** the board renders
**Then** an empty state message is shown in that column

---

### Story 3.4: Kanban Drill-Down Navigation

As an authenticated user,
I want to click into a goal card to see its tasks, and click into a task card to see its substeps,
So that I can manage my work at any level of granularity directly from the Kanban board.

**Acceptance Criteria:**

**Given** I am viewing the Kanban board at goal level
**When** I click a goal card
**Then** I navigate to a tasks view for that goal, with the goal's tasks distributed across the three columns
**And** a breadcrumb shows "Board > [Goal Name]"

**Given** I am viewing tasks for a goal
**When** I click a task card
**Then** I navigate to a substeps view for that task
**And** the breadcrumb shows "Board > [Goal Name] > [Task Name]"

**Given** I click any segment of the breadcrumb
**When** the navigation occurs
**Then** I am taken back to that level of the hierarchy

**Given** I am viewing tasks in the Kanban
**When** a task card is displayed
**Then** it shows: title, priority badge, due date (if set), substep progress, and parent goal name

---

### Story 3.5: Drag-and-Drop Status Change

As an authenticated user,
I want to drag Kanban cards between columns to change their status,
So that I can update task status quickly and visually without navigating to a detail page.

**Acceptance Criteria:**

**Given** I see a drag handle on each Kanban card
**When** I drag a card from "Not Started" to "In Progress"
**Then** the card moves to the new column immediately (optimistic update)
**And** the status change is persisted to the database via the API

**Given** the API call to update status fails
**When** the error is returned
**Then** the card reverts to its original column
**And** a toast notification shows an error message

**Given** I drag a task card to "Done"
**When** the update succeeds
**Then** `recordStreakActivity(userId, timezone)` is called (streak activity recorded)

---

### Story 3.6: Task Priority Badges

As an authenticated user,
I want tasks to display a color-coded priority badge (low/medium/high/critical),
So that I can visually identify high-urgency work at a glance.

**Acceptance Criteria:**

**Given** I view a task card
**When** the task has a priority set
**Then** a badge is displayed with the priority label in the appropriate color:
  - low = gray, medium = blue, high = orange, critical = red

**Given** I create a task without setting a priority
**When** the task is saved
**Then** priority defaults to `medium`

**Given** I am in the Kanban board task view
**When** I apply a priority filter
**Then** only tasks matching the selected priority level are shown

---

### Story 3.7: Task & Substep Due Dates

As an authenticated user,
I want to set optional due dates on tasks and substeps, with overdue items visually highlighted,
So that I can track time-sensitive commitments.

**Acceptance Criteria:**

**Given** I am editing a task or substep
**When** I set a due date using a date picker
**Then** the due date is stored and displayed on the card

**Given** a task has a due date in the past and is not yet completed
**When** I view the task card
**Then** the due date is displayed in red with a visual warning indicator

**Given** I am in the Kanban board
**When** I apply a date range filter
**Then** only tasks/substeps with a `dueDate` within the specified range are shown

---

### Story 3.8: Kanban Filters

As an authenticated user,
I want to filter the Kanban board by date range, priority, goal, and text search,
So that I can focus on specific subsets of work without noise.

**Acceptance Criteria:**

**Given** I am viewing the Kanban board
**When** I enter text in the search field
**Then** cards are filtered client-side immediately, showing only cards whose title contains the search text

**Given** I select a priority filter (e.g., "critical")
**When** the filter is applied
**Then** only tasks/substeps with `priority: 'critical'` are shown

**Given** I set a date range filter
**When** the filter is applied
**Then** only items with a `dueDate` within the range are displayed

**Given** I select a goal filter when in the tasks view
**When** the filter is applied
**Then** only tasks belonging to the selected goal are shown

**Given** multiple filters are active simultaneously
**When** I view the board
**Then** only items matching ALL active filters are displayed (AND logic)

---

## Epic 4: Streak Tracking & Momentum Engine

Users see accurate, timezone-aware streak counts that motivate daily engagement, with milestone celebrations and an activity heatmap.

### Story 4.1: Streak Activity Recording

As the system,
I want to record a streak activity for the current user's local day whenever they complete any task or substep,
So that the streak engine has accurate data to calculate consecutive-day streaks.

**Acceptance Criteria:**

**Given** a user completes a task from the UI, API, or via the AI agent
**When** the completion is saved
**Then** `recordStreakActivity(userId, timezone)` is called from every completion path

**Given** `recordStreakActivity` is called for a user
**When** today's date (in the user's IANA timezone) is NOT already in their `streakHistory`
**Then** today's YYYY-MM-DD string is appended to `streakHistory` in the database

**Given** `recordStreakActivity` is called multiple times in the same day
**When** today is already in `streakHistory`
**Then** no database write occurs (idempotent)

**Given** the streak history is updated
**When** it is stored
**Then** dates are stored as YYYY-MM-DD strings (e.g., "2026-02-21"), never as UTC DateTime objects

---

### Story 4.2: Streak Display & Calculation

As an authenticated user,
I want to see my current streak and longest streak on the dashboard,
So that I'm motivated to maintain my daily momentum.

**Acceptance Criteria:**

**Given** I am on the home dashboard
**When** the page loads
**Then** I see a StreakCounter component showing my current streak (consecutive days up to and including today) and my all-time longest streak

**Given** I have not logged any activity today
**When** I view my streak
**Then** the current streak shows the count up to yesterday (streak count remains if I completed activity yesterday)
**And** if I have no activity for >24 hours since last recorded date, the streak is broken (shows 0)

**Given** `calculateStreakFromHistory(history, today)` is called
**When** the calculation runs
**Then** it is the ONLY function used for streak computation anywhere in the codebase

**Given** my streak reaches 30 days
**When** the streak counter is displayed
**Then** it shows a motivational message: "🎉 Unstoppable! 30 days!"

---

### Story 4.3: Streak Milestones

As an authenticated user,
I want to receive an email notification and see a feed item when I reach a streak milestone,
So that my achievements are recognized and celebrated.

**Acceptance Criteria:**

**Given** `recordStreakActivity` is called and the resulting streak equals 7, 14, 30, 60, or 100 days
**When** the milestone check runs
**Then** `notify(userId, 'streakMilestone', { streakCount })` is called if the user has streak emails enabled

**Given** a milestone is reached
**When** the email and feed item are created
**Then** a FeedItem of type `streak_milestone` is created for the user's feed

**Given** a user reaches the 30-day milestone
**When** the system checks future days
**Then** the 30-day milestone does NOT trigger again (each milestone fires only once per level)

---

### Story 4.4: Activity Calendar Heatmap

As an authenticated user,
I want to see a calendar heatmap on my profile page showing all days I've logged streak activity,
So that I can visualize my consistency and habit patterns over time.

**Acceptance Criteria:**

**Given** I am viewing `/profile`
**When** the page loads
**Then** an activity heatmap renders a grid of the past 12 months

**Given** the heatmap renders
**When** a day has one or more streak activity records
**Then** that cell is highlighted in green (darker shade = more completions)
**And** days with no activity are shown in a neutral/empty state

**Given** I hover over a cell in the heatmap
**When** the tooltip appears
**Then** it shows the date and activity count for that day

**Given** today is displayed in the heatmap
**When** I view it
**Then** today's cell is visually distinct (border or highlight) from past days

---

### Story 4.5: Streak-at-Risk Notification

As an authenticated user with an active streak,
I want to receive an evening reminder if I haven't logged any activity today,
So that I'm prompted to complete a quick task before my streak resets.

**Acceptance Criteria:**

**Given** a user has a streak > 0 and has not logged activity today (in their local timezone)
**When** the scheduled notification time (8pm user-local) is reached
**Then** a reminder email is sent via the `notify()` function (if streak-at-risk notifications are enabled)

**Given** a user has already logged activity today
**When** the notification time is reached
**Then** no streak-at-risk notification is sent

**Given** a user has opted out of streak-at-risk notifications
**When** the notification time is reached
**Then** no notification is sent regardless of streak status

---

## Epic 5: AI Agent & Chat Interface

Users can interact with an embedded Claude-powered AI agent that can read and modify all their data via MCP tools, with streaming responses and full security.

### Story 5.1: Embedded Chat Interface with SSE Streaming

As an authenticated user,
I want access to an AI chat widget from every page that streams responses in real-time,
So that I can get help managing my goals without leaving my current context.

**Acceptance Criteria:**

**Given** I am on any page in the application
**When** the page loads
**Then** the ChatWidget is visible and accessible (rendered by AppShell)

**Given** I type a message and send it
**When** the POST request to `/api/agent/chat` is made
**Then** the response streams back token-by-token via SSE
**And** the streaming content appears in the chat UI as it arrives

**Given** the AI uses a tool during a conversation
**When** the tool is called
**Then** a compact tool-log entry appears in the chat showing the tool name and status

**Given** I close and reopen the chat widget
**When** the widget reopens
**Then** the conversation history is preserved within the session (not across page refreshes)

---

### Story 5.2: AI Read Access via MCP Tools

As an authenticated user,
I want the AI agent to be able to read all my goals, tasks, streaks, friends, and profile,
So that it can give me accurate, personalized responses about my data.

**Acceptance Criteria:**

**Given** I ask the AI "What are my current goals?"
**When** the AI calls the `get-goals` MCP tool
**Then** only MY goals are returned (ownership verification enforced)
**And** goals belonging to other users are never returned

**Given** I ask the AI "What's my current streak?"
**When** the AI calls the `get-streaks` MCP tool
**Then** the correct current streak and longest streak values are returned

**Given** the AI calls any read tool
**When** I am authenticated
**Then** the tool executes without requiring UI cache invalidation
**And** read operations do not modify any data

---

### Story 5.3: AI Full CRUD via MCP Tools

As an authenticated user,
I want the AI agent to be able to create, update, and delete my goals, tasks, and substeps,
So that I can build and manage complex goal structures through natural conversation.

**Acceptance Criteria:**

**Given** I ask the AI to "Create a goal to learn Python in 3 months with a weekly practice schedule"
**When** the AI calls `create-goal`, `create-task` (multiple times), and `add-substep` tools
**Then** the goal with all tasks and substeps is created in the database
**And** `invalidatesTags` is called after the writes, causing the RTK Query cache to refresh
**And** the new goal appears in the UI without a manual page reload

**Given** the AI calls any write tool
**When** the tool verifies ownership
**Then** the tool confirms the target resource belongs to the authenticated user before modifying it

**Given** the AI agent loop runs 40 tool iterations in a single conversation turn
**When** the 40th iteration completes
**Then** the agent stops and returns a graceful "I've reached my limit" message to the user

---

### Story 5.4: AI Profile & Friends Management

As an authenticated user,
I want the AI agent to be able to update my profile fields and manage my friend connections,
So that I can manage social and profile data through the same conversational interface.

**Acceptance Criteria:**

**Given** I ask the AI to "Update my location to New York"
**When** the AI calls the `update-profile` MCP tool
**Then** my location is updated in the database
**And** the AI cannot change another user's profile (ownership check enforced)

**Given** I ask the AI to "Add John Doe as a friend"
**When** the AI calls `add-friend` with John's user ID
**Then** a friend request is sent (or connection is made if reciprocal)

**Given** I ask the AI to "Show my friends list"
**When** the AI calls `get-friends`
**Then** only my confirmed friends are returned

---

### Story 5.5: AI Agent Security & Rate Limiting

As the system,
I want to enforce rate limiting, input sanitization, and ownership verification on the AI agent endpoint,
So that the system is protected from abuse, prompt injection, and unauthorized data access.

**Acceptance Criteria:**

**Given** a user sends more than 30 requests to `/api/agent/chat` within 60 seconds
**When** the 31st request arrives
**Then** the server responds with HTTP 429 (Too Many Requests)

**Given** a user sends a message containing a prompt injection attempt
**When** the input is processed by `src/lib/agent/security.ts`
**Then** the input is sanitized before being passed to the model

**Given** an MCP tool is called
**When** the tool targets a resource
**Then** `securityGuard.verifyOwnership()` confirms the resource belongs to the authenticated user
**And** if it does not, the tool returns a 403 error without executing the mutation

**Given** a full agent conversation including streaming takes longer than 115 seconds
**When** the timeout threshold approaches
**Then** the agent returns a graceful timeout message before Vercel's 120s hard limit

---

### Story 5.6: AI-Assisted Goal Creation Onboarding

As a new user with no goals,
I want the AI to proactively welcome me and suggest goal structures,
So that I overcome the blank-slate problem and start my first goal immediately.

**Acceptance Criteria:**

**Given** I am a newly registered user with 0 goals
**When** I open the AI chat widget
**Then** the AI displays a personalized welcome message suggesting common goal categories (fitness, learning, career)

**Given** I accept a suggestion and ask the AI to create a goal
**When** the AI calls `create-goal` and `create-task` tools
**Then** the goal is immediately created and visible in my goal list

**Given** I have been shown the onboarding welcome message
**When** I later open the chat widget again
**Then** the onboarding suggestions are NOT shown again (shown only once per user)

---

## Epic 6: Social Activity Feed & Tracking

Users see a rich, filterable feed of their own and friends' activity with before/after diffs, powered by comprehensive activity logging.

### Story 6.1: ActivityLog Prisma Model, FeedPreferences Bootstrap & trackActivity() Utility

As the system,
I want an ActivityLog model, a FeedPreferences model (all categories defaulting to ON), and a trackActivity() utility function,
So that every system mutation can be recorded, and the FeedPreferences model exists before any feed logic needs it.

**Note:** This story bootstraps the `FeedPreferences` model with all 8 categories defaulting to `true`. This resolves the dependency on Epic 10 — `trackActivity()` can safely check preferences from the start because defaults are always "show everything". Epic 10 (Story 10.1–10.2) later adds the API and UI to let users toggle categories off.

**Acceptance Criteria:**

**Given** the `ActivityLog` model is added to the Prisma schema
**When** `npx prisma generate` is run
**Then** the `ActivityLog` model is accessible via the Prisma client

**Given** the `FeedPreferences` model is added to the Prisma schema with 8 boolean fields (goalEvents, taskEvents, substepEvents, costBudget, notes, profileChanges, socialActivity, streakMilestones)
**When** a new `User` record is created
**Then** a corresponding `FeedPreferences` record is automatically created with all 8 fields set to `true`

**Given** `trackActivity(userId, type, metadata)` is called from any mutation path
**When** the function executes
**Then** an `ActivityLog` entry is always created in the database regardless of feed preferences
**And** a `FeedItem` is created ONLY IF the user's `FeedPreferences` record allows that activity category (defaults to `true`, so all items appear initially)

**Given** the `trackActivity` function is called with an update event
**When** the `ActivityLog` entry is created
**Then** the metadata field includes a `diff` object with `before` and `after` values

---

### Story 6.2: Wire Activity Tracking into MCP Tools

As the system,
I want trackActivity() called from all AI agent MCP tool mutations,
So that AI-driven changes are reflected in the activity log and social feed.

**Acceptance Criteria:**

**Given** the AI agent calls `create-goal`, `update-goal`, `delete-goal`, or any goal/task/substep mutation tool
**When** the tool executes successfully
**Then** `trackActivity()` is called with the appropriate activity type and metadata
**And** the ActivityLog entry is created with the correct userId and before/after diff

**Given** `trackActivity` is called from an MCP tool
**When** the FeedPreferences check runs
**Then** a FeedItem is created only if the user's category preference is enabled for that activity type

---

### Story 6.3: Wire Activity Tracking into REST API Routes

As the system,
I want trackActivity() called from all REST API route mutations,
So that UI-driven changes are also reflected in the activity log.

**Acceptance Criteria:**

**Given** a user creates, updates, or deletes a goal via the REST API
**When** the mutation completes
**Then** `trackActivity()` is called from the API route handler with the correct type and metadata

**Given** a user updates a task status via the API
**When** the status change is saved
**Then** an ActivityLog entry of type `task_status_changed` is created with before/after status values

**Given** `trackActivity` is called with a fire-and-forget pattern
**When** the call is made
**Then** errors in activity tracking do NOT propagate to the API response (non-blocking)

---

### Story 6.4: Enhanced Social Feed Display with Diff Rendering

As an authenticated user,
I want to see a chronological feed of mine and my friends' activity with before/after details,
So that I can stay informed about progress and feel accountable through social transparency.

**Acceptance Criteria:**

**Given** I navigate to `/feed`
**When** the page loads
**Then** I see FeedItems from myself and my confirmed friends, ordered chronologically (newest first)

**Given** a FeedItem is displayed
**When** I view it
**Then** it shows: actor's profile image, actor name, action description, relative timestamp

**Given** an item represents an update event (e.g., task status changed)
**When** I view the feed item
**Then** the before and after values are displayed inline (e.g., "Not Started → In Progress")

**Given** the feed has more than 20 items
**When** the page renders
**Then** only 20 items are shown initially with a "Load More" or pagination control

---

### Story 6.5: Feed Filtering UI

As an authenticated user,
I want to filter the social feed by activity category,
So that I can focus on the types of updates I care about most.

**Acceptance Criteria:**

**Given** I am viewing `/feed`
**When** the page loads
**Then** filter tabs or chips are displayed at the top: All Activity, Goals, Tasks, Status Changes, Streaks, Social

**Given** I click a filter tab (e.g., "Streaks")
**When** the filter is applied
**Then** only FeedItems of the matching category are shown

**Given** I select "All Activity"
**When** the filter is applied
**Then** all FeedItems are shown without category filtering

**Given** I navigate away and return to `/feed`
**When** the page reloads
**Then** the filter state resets to "All Activity" (or persists within the session)

---

### Story 6.6: Feed Item Grouping

As an authenticated user,
I want rapid successive changes by the same user of the same type (within 60 seconds) to be grouped into a single feed entry,
So that bulk operations don't flood my feed with repetitive items.

**Acceptance Criteria:**

**Given** a user completes 8 substeps within 30 seconds
**When** the feed renders these activities
**Then** they are grouped into a single FeedItem showing "Made 8 substep completions"

**Given** a grouped feed item is displayed
**When** I click to expand it
**Then** the individual activities are listed within the grouped item

**Given** two activities match the grouping criteria (same userId, same type prefix, within 60s)
**When** the feed is rendered
**Then** they are grouped into one item with a count
**And** activities outside the 60s window are shown as separate items

---

## Epic 7: Friends & Social Graph

Users can build a social network by searching for friends, sending requests, and managing connections.

### Story 7.1: Friend Search & Request

As an authenticated user,
I want to search for other users by username or email and send them a friend request,
So that I can start building my accountability network.

**Acceptance Criteria:**

**Given** I navigate to the friends section
**When** I enter a username or email in the search field
**Then** matching users are displayed (respecting privacy — only users who allow discovery)

**Given** I click "Add Friend" on a search result
**When** the request is sent
**Then** a friend request is created with status `pending`
**And** the target user sees the request in their pending requests list

**Given** I have already sent a friend request to a user
**When** I view their profile
**Then** the "Add Friend" button is replaced with "Request Sent"

---

### Story 7.2: Accept/Decline Friend Requests

As an authenticated user,
I want to review and accept or decline incoming friend requests,
So that I control who can see my activity feed.

**Acceptance Criteria:**

**Given** I have a pending friend request
**When** I view my pending requests
**Then** I see the requester's name, profile image, and "Accept" / "Decline" buttons

**Given** I click "Accept" on a request
**When** the action succeeds
**Then** the connection is established as `accepted` and both users appear in each other's friends list
**And** both users will now see each other's activity in the feed

**Given** I click "Decline" on a request
**When** the action succeeds
**Then** the request is removed and the requester is NOT added to my friends list

---

### Story 7.3: Remove Friend

As an authenticated user,
I want to remove a friend from my connections,
So that I can control my social network over time.

**Acceptance Criteria:**

**Given** I am viewing my friends list
**When** I click "Remove Friend" on a connection and confirm
**Then** the friendship record is deleted from both users' friend lists

**Given** a friendship is removed
**When** either user views the feed
**Then** neither user's future activities appear in the other's feed
**And** the AI agent `remove-friend` MCP tool performs the same operation

---

## Epic 8: Template Marketplace

Users can browse, search, fork, and publish goal templates, lowering the barrier to starting new goals.

### Story 8.1: Template Marketplace Browsing

As any visitor (authenticated or not),
I want to browse publicly available goal templates at `/marketplace`,
So that I can discover proven goal structures before signing up.

**Acceptance Criteria:**

**Given** I visit `/marketplace` without being authenticated
**When** the page loads
**Then** all public templates are displayed in a card grid (no authentication required)

**Given** a template card is displayed
**When** I view it
**Then** it shows: goal icon, title, author name, difficulty badge, category, and fork count

**Given** the marketplace has more than 20 templates
**When** the page renders
**Then** 20 templates are shown with pagination or infinite scroll

**Given** there are no public templates matching any filter
**When** I view the marketplace
**Then** an appropriate empty state is displayed

---

### Story 8.2: Template Search & Filter

As a marketplace visitor,
I want to search templates by text and filter by difficulty, category, and tags,
So that I can quickly find templates relevant to my goals.

**Acceptance Criteria:**

**Given** I type in the search field
**When** I enter text
**Then** templates are filtered by title or description match (client-side or server-side)

**Given** I select a difficulty filter (e.g., "Advanced")
**When** the filter is applied
**Then** only templates with `difficulty: 'advanced'` are shown

**Given** I select a category from the dropdown
**When** the filter is applied
**Then** only templates in the selected category are shown

**Given** multiple filters are active
**When** I view the results
**Then** only templates matching ALL active filters are displayed

---

### Story 8.3: Template Detail Page

As a marketplace visitor,
I want to view a template's full details including description, creator info, and task structure preview,
So that I can decide if it's the right fit before forking it.

**Acceptance Criteria:**

**Given** I click a template card
**When** the detail page at `/marketplace/:templateId` loads
**Then** I see: title, description, creator name, creator profile image, difficulty, category, tags, and fork count

**Given** the template detail page loads
**When** I scroll to the task structure section
**Then** the tasks and substeps are listed in a preview (collapsed by default)
**And** I can expand each task to see its substeps

**Given** I am authenticated and click "Use Template"
**When** the fork action is triggered
**Then** a new goal is created in my account with all the template's tasks and substeps
**And** the template's fork count increments by 1

**Given** I am NOT authenticated and click "Use Template"
**When** the action is triggered
**Then** I am redirected to `/sign-up` with a return URL that automatically forks after sign-up

---

### Story 8.4: Goal Publishing as Template

As an authenticated user,
I want to publish any of my goals as a template so others can use my structure,
So that I can contribute to the community and help others with proven goal frameworks.

**Acceptance Criteria:**

**Given** I am viewing my goal detail page
**When** I click "Publish as Template"
**Then** a modal appears asking for: template title, description, difficulty, category, and visibility

**Given** I complete the template form and click "Publish"
**When** the template is created
**Then** it appears in the marketplace with the selected visibility
**And** the template preserves the task and substep structure but NOT user-specific notes or costs

---

### Story 8.5: Template Fork to Goal

As an authenticated user,
I want to fork a template to create a new goal with the template's task structure pre-populated,
So that I don't have to plan from scratch.

**Acceptance Criteria:**

**Given** I am authenticated and viewing a template detail page
**When** I click "Use Template" / "Fork"
**Then** a new goal is created in my account with the template's full task/substep structure
**And** the new goal is immediately visible in my goals list

**Given** a template is forked
**When** the fork is created
**Then** the source template's `forkCount` is incremented by 1

**Given** I fork a template
**When** the goal is created
**Then** the forked goal is fully editable (not locked to the template)

---

### Story 8.6: Template Visibility Control

As a template creator,
I want to control whether my template is public (visible to all) or friends-only,
So that I can share selectively based on my comfort level.

**Acceptance Criteria:**

**Given** I am creating or editing a template
**When** I select "Friends Only" visibility
**Then** the template is only visible to users who are mutual friends with me

**Given** a friends-only template exists
**When** a non-friend visits `/marketplace`
**Then** the template does NOT appear in their results

**Given** I change a template's visibility from Public to Friends
**When** the change is saved
**Then** the template immediately becomes invisible to non-friends in the marketplace

---

## Epic 9: Email Notifications

Users receive timely transactional emails for key events, with complete control over notification preferences.

### Story 9.1: Email Notification Infrastructure & Delivery

As the system,
I want a `notify()` utility that sends transactional emails via Resend, respecting user preferences,
So that key events (welcome, goal created, streak milestone) trigger appropriate emails.

**Acceptance Criteria:**

**Given** `notify(userId, 'welcomeEmail', {})` is called
**When** the function runs
**Then** it checks if the user has `preferences.enabled = true` and `preferences.welcomeEmail = true`
**And** only then sends the welcome email via Resend

**Given** an email send fails (API error or delivery failure)
**When** the error occurs
**Then** the error is logged via `console.error()` but does NOT throw (non-blocking)

**Given** `notify()` is called with an unsupported notification type
**When** the call is made
**Then** no email is sent and a warning is logged

---

### Story 9.2: Per-Type Email Preferences

As an authenticated user,
I want to enable or disable individual email notification types from my profile settings,
So that I only receive the notifications I care about.

**Acceptance Criteria:**

**Given** I navigate to my profile page
**When** I view the "Email Preferences" section
**Then** I see individual toggles for each notification type: welcomeEmail, goalCreated, streakMilestone

**Given** I toggle off "Goal Created" notifications
**When** I save the preference
**Then** the change is persisted via a PATCH request immediately

**Given** the `goalCreated` preference is set to false
**When** I create a new goal that would trigger a goal-created email
**Then** no email is sent for that event

---

### Story 9.3: Master Email Toggle

As an authenticated user,
I want a single master toggle to disable ALL email notifications,
So that I can opt out of all emails without toggling each type individually.

**Acceptance Criteria:**

**Given** I view the Email Preferences panel
**When** the panel loads
**Then** a master "Enable Email Notifications" toggle is displayed at the top

**Given** I turn off the master toggle
**When** any event (goal created, streak milestone, etc.) occurs
**Then** `notify()` checks `preferences.enabled = false` first and skips sending any email

**Given** the master toggle is OFF
**When** I view the individual notification type toggles
**Then** they are still visible but effectively inactive (visual indication)

---

## Epic 10: Feed Visibility & Privacy Controls

Users control at category level which of their activities appear in friends' feeds.

### Story 10.1: Feed Visibility Preferences Backend

As the system,
I want a FeedPreferences model and API that stores per-category visibility settings,
So that trackActivity() can respect user privacy when deciding whether to create FeedItems.

**Acceptance Criteria:**

**Given** the FeedPreferences model is added to the Prisma schema
**When** a new user is created
**Then** default FeedPreferences are created with all 8 categories set to `true` (enabled)

**Given** a user updates their feed visibility preference for "cost/budget" to `false`
**When** `trackActivity()` is called for a cost-related mutation
**Then** the ActivityLog entry is still created
**And** NO FeedItem is created for that activity (visibility check blocks it)

**Given** an API endpoint exists for updating feed preferences
**When** a PATCH request is made with a valid preference update
**Then** the preference is updated immediately
**And** future activities respect the new setting

---

### Story 10.2: Feed Visibility Preferences UI

As an authenticated user,
I want to configure feed visibility preferences from my profile page,
So that I can control what activities my friends see without leaving the profile settings.

**Acceptance Criteria:**

**Given** I navigate to `/profile`
**When** I scroll to the "Feed Preferences" section
**Then** I see 8 toggle controls: Goal Events, Task Events, Substep Events, Cost/Budget, Notes, Profile Changes, Social Activity, Streak Milestones

**Given** all toggles are ON by default
**When** I view the settings for the first time
**Then** all 8 categories show as enabled

**Given** I toggle off "Notes" visibility
**When** the change is saved via PATCH
**Then** future notes changes I make will NOT appear in my friends' feeds

---

## Epic 11: Landing Page & Mobile Experience

Potential users can discover Journey Tracker via a public landing page, and existing users on mobile access a full stats panel via FAB.

### Story 11.1: Public Landing Page

As a potential user visiting Journey Tracker for the first time,
I want to see a compelling, informative landing page that explains the product,
So that I can understand the value and decide to sign up.

**Acceptance Criteria:**

**Given** I visit `/` without being authenticated
**When** the page loads
**Then** I see a server-rendered landing page with: hero section, "How It Works" (4 steps), features grid (6 features), and a CTA section

**Given** the landing page is server-rendered
**When** a search engine crawls it
**Then** meaningful HTML content is returned (not just a loading skeleton)
**And** appropriate meta tags (title, description, og:image) are set

**Given** I am an authenticated user visiting `/`
**When** the page loads
**Then** I am redirected to the dashboard (not shown the landing page)

**Given** I view the landing page on a 375px viewport
**When** I scroll through the page
**Then** there is no horizontal scroll and all content is fully readable

---

### Story 11.2: Activity Calendar Heatmap for Mobile Stats

As an authenticated mobile user,
I want the activity heatmap to render correctly in the mobile stats bottom sheet,
So that I can see my consistency history without switching to desktop.

**Acceptance Criteria:**

**Given** I am on mobile (< 1024px viewport)
**When** I open the mobile stats bottom sheet
**Then** the activity heatmap is rendered within the sheet (same component as the profile page)

**Given** the heatmap renders in the bottom sheet
**When** I view it
**Then** it shows the past 12 months of activity, correctly sized for mobile width

---

### Story 11.3: Mobile Stats FAB & Bottom Sheet

As an authenticated mobile user,
I want a floating action button that opens a stats bottom sheet,
So that I can access my streak and progress data without navigating to a separate page.

**Acceptance Criteria:**

**Given** I am using the app on a mobile device (< 1024px viewport)
**When** any page loads
**Then** a floating action button (FAB) is visible in the bottom right corner

**Given** I tap the FAB
**When** the bottom sheet animates in
**Then** it slides up from the bottom with a Tailwind keyframe animation
**And** the sheet contains: StreakCounter, progress bar, quick stats, and the activity calendar heatmap

**Given** the bottom sheet is open
**When** I tap the overlay (outside the sheet) or the X button
**Then** the sheet slides back down and closes

**Given** I am on desktop (≥ 1024px viewport)
**When** any page loads
**Then** the FAB is NOT visible (hidden via `lg:hidden` Tailwind class)

---

---

## Infrastructure & Quality (Cross-Cutting)

These stories address Must-Have NFRs that are not user-facing features and cross epic boundaries. They map to STORY-021 and STORY-022 in the sprint plan.

### Story INF-1: Health Check API Endpoint
*(Sprint plan: STORY-021 | NFR-004)*

As the system operator,
I want a `/api/health` endpoint that returns 200,
So that uptime monitoring tools and Vercel deployment checks have a reliable signal.

**Acceptance Criteria:**

**Given** the `/api/health` endpoint is deployed
**When** a GET request is made to `/api/health`
**Then** the response is HTTP 200 within 500ms
**And** the response body includes `{ "status": "ok", "timestamp": "<ISO date>" }`

**Given** the application is deployed to Vercel
**When** the deployment health check runs
**Then** `/api/health` responds successfully, confirming the deployment is live

---

### Story INF-2: Unit Test Coverage ≥ 80% for New Features
*(Sprint plan: STORY-022 | NFR-008)*

As a developer,
I want ≥ 80% unit test coverage for all new business logic introduced in Sprint 1–4,
So that regressions are caught early and the codebase stays maintainable.

**Acceptance Criteria:**

**Given** all Sprint 1–4 features are implemented
**When** `npm run test:coverage` is run
**Then** coverage for `src/lib/` and `src/app/api/` is ≥ 80%

**Given** any new MCP tool is added to `src/lib/mcp/tools/`
**When** the tool is registered in `index.ts`
**Then** a corresponding `__tests__/*.test.ts` file exists for that tool

**Given** `npm run test` is executed
**When** the test suite runs
**Then** all tests pass with zero failures

---

*This document was created using BMAD Method v6 — Phase 3 (Solutioning: Epics & Stories)*

*Total: 11 epics, 52 feature stories + 2 infrastructure stories covering all 50 FRs and 10 NFRs.*
