---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
inputDocuments:
  - docs/prd-journey-tracker-2026-02-20.md
  - docs/architecture-journey-tracker-2026-02-20.md
  - docs/sprint-plan-journey-tracker-2026-02-20.md
  - _bmad-output/planning-artifacts/product-brief-journey-tracker-2026-02-20.md
  - _bmad-output/project-context.md
workflowType: 'prd'
projectType: 'web-app'
domain: 'personal-productivity-saas'
complexity: 'high'
projectLevel: 4
brownfield: true
date: 2026-02-21
author: Alonsooteroseminario
---

# Product Requirements Document — Journey Tracker

**Author:** Alonsooteroseminario
**Date:** 2026-02-21
**Version:** 2.0 (BMAD Method v6 — Phase 2 Canonical)
**Status:** Approved

---

## Executive Summary

Journey Tracker is a personal goal achievement platform that closes the gap between ambitious goals and daily execution. Users break down long-term goals into structured phases, tasks, and substeps. A streak engine records daily activity and motivates users to keep their momentum. A social feed surfaces friend activity for peer accountability. A template marketplace lets experienced achievers share proven goal structures, and an embedded Claude-powered AI agent can build, manage, and analyze the entire goal graph through natural conversation.

The platform is production-ready: Next.js 15 App Router + Clerk + Prisma/MongoDB + Redux Toolkit, deployed to Vercel. The AI agent exposes 23 MCP tools covering every data mutation, ensuring the chat interface is a first-class creation path alongside the traditional UI.

### What Makes This Special

**1. AI-Native Architecture** — The AI agent is not an afterthought. Every data mutation exposed in the UI is mirrored as an MCP tool, so Claude can create a fully structured goal with phases, tasks, substeps, and priorities in a single conversation turn. No other personal goal tracker offers this depth of AI integration.

**2. Streak Engine Built for Trust** — Streaks are timezone-aware (IANA identifiers, `Intl.DateTimeFormat`), calculated from a simple YYYY-MM-DD history array, and recorded from every completion path simultaneously: MCP tools, REST API, and Kanban drag-and-drop. A single shared `calculateStreakFromHistory()` function eliminates calculation drift.

**3. Social Accountability with Granular Privacy** — Every system mutation creates an `ActivityLog` entry with before/after diffs. Users control, at category level, which activities appear in their friends' feed. Social without being invasive.

**4. Template Marketplace as Growth Flywheel** — Experienced users publish goal templates; new users fork them into their own accounts. Fork counts drive organic visibility. The marketplace is the acquisition layer.

---

## Project Classification

| Attribute | Value |
|-----------|-------|
| **Type** | Web Application (SaaS, Consumer) |
| **Domain** | Personal Productivity / Goal Achievement |
| **Complexity** | High (Level 4 — 40+ stories) |
| **Context** | Brownfield (active codebase, existing implementation) |
| **Deployment Target** | Vercel (serverless) |
| **Primary Users** | Knowledge workers, goal-setters, accountability seekers |
| **Team** | 1 senior developer |

---

## Success Criteria

### User Success

- User creates their first goal within 5 minutes of signing up
- User completes a task or substep every day for 7 consecutive days (first milestone)
- User adds at least one friend within their first 14 days
- User uses the AI agent to create or modify a goal within their first week

### Business Success

- 1,000 active users within 12 months of public launch (≥1 goal + activity in past 30 days)
- 40% D30 retention among users who create at least one goal in their first session
- 100+ published templates in the marketplace within 6 months of public launch
- Average 7-day streak length of 5+ days among active users
- 50% of active users initiate ≥1 AI conversation per week

### Technical Success

- All REST API endpoints respond within 300ms at P95 under normal load
- 99.5% uptime (Vercel + MongoDB Atlas managed infrastructure)
- ≥80% unit test coverage for all business logic (`src/lib/`, `src/app/api/`)
- Zero TypeScript errors in strict mode; ESLint clean

### Measurable KPIs

| Metric | Target |
|--------|--------|
| DAU/MAU ratio | ≥ 30% |
| Streak continuation rate | ≥ 60% |
| Goal completion rate (90 days) | ≥ 20% |
| Template fork rate (7 days post-publish) | ≥ 30% |
| D7 retention | ≥ 50% |
| D30 retention | ≥ 40% |
| AI agent weekly engagement | ≥ 50% of active users |

---

## Product Scope

### MVP (Current Sprint — Must Have)

Everything required for a private beta launch with a small cohort of early adopters:

- Clerk authentication + profile with timezone
- Goal/task/substep CRUD with three-state status
- Streak engine (timezone-aware, all completion paths wired)
- AI agent with 23 MCP tools (full CRUD access)
- Social feed with activity logging and before/after diffs
- Friends system
- Kanban board (goal view + task drill-down)
- Template marketplace (browse, search, fork, publish)
- Public landing page
- Email notifications (welcome, goal created, streak milestone)

### Growth (Post-Beta)

Extensions that increase engagement and retention depth:

- Feed item grouping (reduce noise from rapid mutations)
- Feed visibility preferences (category-level privacy control)
- Activity calendar heatmap
- Mobile stats FAB + bottom sheet
- Kanban filters (priority, date range, goal)
- Task priority badges and due date highlights
- Streak-at-risk evening notifications
- Template detail page with full task structure preview

### Vision (Roadmap)

Features that differentiate at scale:

- AI-assisted goal creation onboarding (blank-slate elimination)
- Advanced analytics and progress reports via AI agent skills
- Template versioning and collaborative templates
- Public goal profile pages (shareable URL)
- Third-party integrations (Google Calendar, Strava, Notion)
- Native mobile apps (iOS / Android)
- Paid subscription tier with advanced AI model selection

### Out of Scope (Explicitly)

- Real-time collaborative goal editing (multi-user on same goal simultaneously)
- Offline mode / PWA
- Paid subscription / billing system
- Native mobile apps
- Third-party integrations
- Public goal profile URLs

---

## User Journeys

### Persona 1: The Motivated Professional (Primary)

Alex, 32, product manager. Sets big goals (get promoted, run a half-marathon, build a side project) but loses momentum after 2–3 weeks without visible progress.

**Journey: First Goal Creation**

> Alex hears about Journey Tracker from a friend and visits the landing page. The "AI-powered goal tracking" headline resonates. Alex signs up with Google (Clerk), lands on an empty dashboard. The AI chat widget shows: *"Welcome! What's a goal you've been putting off? Tell me and I'll break it down into a plan."* Alex types: *"I want to build a portfolio website in 2 months."* The AI creates a goal with 4 phases, 18 tasks, and substeps. Alex completes the first task: "Register a domain." The streak starts at 1. Alex shares the goal with a colleague via friend invite.

**Journey: Daily Check-in (Retention)**

> Alex opens the app every morning. The streak counter (🔥 12 days) is the first thing they see. They navigate to the active goal, move 2 tasks from "In Progress" to "Completed." The streak increments. In the feed, Alex sees that their colleague completed a task on their goal too — a small note of accountability. The session takes 3 minutes.

**Journey: Streak Recovery After a Miss**

> Alex misses a day (travel). Streak resets to 0. The AI proactively says: *"You missed yesterday — no worries. Want to knock out a quick task now to start a fresh streak?"* Alex completes a 5-minute substep. New streak: 1. The recovery path is frictionless.

---

### Persona 2: The Template Creator (Secondary)

Jordan, 38, has successfully completed several ambitious goals using a personal system. Wants to give back.

**Journey: Publishing a Template**

> Jordan has a goal "Launch a SaaS in 90 Days" with 6 phases and 40 tasks, all battle-tested. On the goal detail page: *"Publish as Template."* Jordan fills in title, description, category (Entrepreneurship), difficulty (Advanced), and sets visibility to Public. The template appears in the marketplace immediately. Within a week, 12 people have forked it. Jordan sees the fork count on their template.

---

### Persona 3: The Accountability Partner (Secondary)

Sam is invited by Alex via friend link. Sam's entry into Journey Tracker is through social connection, not a goal first.

**Journey: Joining via Friend Invite**

> Sam receives a link from Alex to the marketplace. Sam browses templates — no login required. Sam forks a "Learn to Cook 20 Dishes" template and is prompted to sign up. After sign-up, the forked goal is immediately in their account. Sam accepts Alex's friend request. Both now see each other's activity in the feed.

---

### Journey Requirements Summary

| Journey | Key Requirements |
|---------|-----------------|
| First Goal Creation | FR-001, FR-005, FR-026, FR-028, FR-050 |
| Daily Check-in | FR-015, FR-021, FR-022, FR-032 |
| Template Discovery & Fork | FR-037, FR-038, FR-011, FR-036 |
| Streak Recovery | FR-021, FR-022, FR-026 |
| Template Publishing | FR-010, FR-040 |

---

## Innovation & Novel Patterns

### AI-Native Goal Management (Novel)

**Pattern:** Every data mutation in the system is exposed as an MCP tool callable by Claude. Users can create a structured 6-phase goal with 30 tasks in one conversational turn.

**Market Context:** Existing goal trackers (Notion, Asana, Todoist) have AI features for text generation but not for structured data manipulation with tool-use verification. This depth of AI integration — ownership-checked, rate-limited, with cache invalidation after writes — is genuinely novel in the personal productivity space.

**Validation Required:**
- Users actually prefer AI-driven goal creation over the form UI
- The 23 MCP tools cover enough mutations to be "complete" (no gaps that force UI fallback)
- Tool descriptions are clear enough for Claude to select the right tool reliably

**Risks:**
- LLM hallucination creating incorrect task structures
- Tool description drift as schema evolves
- Token costs per conversation turn (mitigated by context trimming)

### Timezone-Aware Streak Engine with Shared Calculation (Novel)

**Pattern:** A single `calculateStreakFromHistory(history, today)` pure function is the sole source of streak computation. Date entries are YYYY-MM-DD strings (not UTC). Activity recording uses `Intl.DateTimeFormat` with the user's IANA timezone.

**Why Novel:** Most streak implementations use UTC server time, creating midnight boundary bugs for users in non-UTC timezones. This implementation is timezone-correct by design, not by accident.

### Feed with Before/After Diff Metadata

**Pattern:** Every `ActivityLog` entry carries a metadata blob with before/after diffs for update events. The feed renders these diffs inline ("Changed title from 'X' to 'Y'").

**Why Novel:** Most activity feeds show what happened but not what changed. The diff model enables meaningful accountability ("Friend reduced their goal target from 90 days to 60 days").

---

## Web Application Specific Requirements

### Navigation & URL Structure

- All core pages accessible via persistent top nav (desktop) and bottom nav (mobile)
- Deep-linkable URLs: `/goals/:id`, `/board`, `/feed`, `/marketplace`, `/marketplace/:templateId`, `/profile`
- Breadcrumb navigation in Kanban drill-down: Board > [Goal] > [Task]
- Browser back/forward navigation works correctly for all drill-down states

### Authentication & Session

- Clerk handles all auth flows (sign-up, sign-in, OAuth via Google)
- Middleware protects all routes except `/`, `/sign-in`, `/sign-up`, `/marketplace*`, `/api/webhooks/*`
- Session tokens validated on every API request
- `getCurrentUser()` auto-creates the Prisma User record on first Clerk login and syncs name/email/image on every subsequent request

### Real-Time Updates

- AI agent responses stream token-by-token via SSE (Server-Sent Events)
- RTK Query cache invalidated via `invalidatesTags` after every write (both UI mutations and AI tool writes)
- No WebSocket infrastructure required — SSE is sufficient for the agent stream use case

### State Management

- Redux Toolkit + RTK Query as the client state layer
- Server state lives in RTK Query cache; local UI state (selected items, filters, open panels) lives in plain Redux slices
- AppShell is the single client boundary wrapping all pages with ReduxProvider

### Progressive Enhancement

- Marketplace browsable without authentication (server-rendered for SEO)
- Landing page server-rendered with full meta tags and OpenGraph
- Core functionality degrades gracefully if JavaScript is slow (Next.js 15 SSR/RSC)

### Error Handling & UX

- Toast notifications on success and failure for all async operations
- Optimistic updates for status changes (Kanban drag-and-drop, task completion)
- Revert on API error with clear error message
- Empty states for all list views (goals, feed, marketplace, friends)

---

## Project Scoping & Phased Development

### Phase 1: Private Beta Foundation (Sprint 1–2, Weeks 1–4)

**Goal:** Comprehensive activity logging, enhanced social feed, Kanban drill-down and filters.

**Must Have:**
- ActivityLog Prisma model + `trackActivity()` utility wired into all mutation paths
- Feed display with diff rendering and filtering tabs
- Kanban drill-down (goal → task → substep) with breadcrumb
- Feed visibility preferences backend + UI

**Stories:** STORY-001 through STORY-010 (26 points allocated)

### Phase 2: Public Launch Readiness (Sprint 3, Weeks 5–6)

**Goal:** Public landing page, mobile stats FAB, template marketplace detail pages.

**Should Have:**
- Landing page with hero, "How It Works", features grid, CTA
- Activity calendar heatmap
- Mobile stats FAB + bottom sheet
- Template detail page with task structure preview
- Template visibility control

**Stories:** STORY-011 through STORY-015 (26 points allocated)

### Phase 3: Quality & Enhancement (Sprint 4, Weeks 7–8)

**Goal:** Task enhancements, AI onboarding, quality gates for launch.

**Should / Could Have:**
- Task priority badges
- Task and substep due dates
- Task notes field
- Health check API endpoint
- Test coverage ≥ 80%
- Streak-at-risk email notification
- AI-assisted goal creation onboarding

**Stories:** STORY-016 through STORY-022 (24 points allocated)

---

## Functional Requirements

### FR-001 — FR-004: Authentication & User Management

#### FR-001: User Registration and Authentication
**Priority:** Must Have | **Epic:** EPIC-001

The system shall support user registration, sign-in, and session management via Clerk. Users must authenticate before accessing any protected page or API endpoint.

- Unauthenticated users are redirected to `/sign-in` when accessing protected routes
- Clerk sign-up flow creates a corresponding Prisma `User` record on first login
- Session tokens are validated on every API request via Clerk middleware
- Sign-out clears the session and redirects to landing page

#### FR-002: User Profile Management
**Priority:** Must Have | **Epic:** EPIC-001

Users shall be able to view and edit their profile, including name, bio, location, and timezone. Profile image is sourced from Clerk and synced automatically.

- Profile page displays name, bio, location, timezone, profile image, and member-since date
- User can edit bio, location, and timezone via inline form
- Changes are persisted to the database immediately
- Profile image reflects the Clerk account image (no separate upload required)

#### FR-003: Automatic Clerk Data Synchronization
**Priority:** Must Have | **Epic:** EPIC-001

On every authenticated request, `getCurrentUser()` shall fetch the latest name, email, and profile image from Clerk and update the Prisma `User` record if data has changed.

- Template creator names always reflect the user's current Clerk display name
- Database update only occurs when data has changed (no unnecessary writes)
- Race conditions on first-login user creation are handled gracefully (P2002 conflict)

#### FR-004: Timezone Configuration
**Priority:** Must Have | **Epic:** EPIC-001

Users shall be able to set their timezone in their profile. All streak date calculations must use this timezone to determine "today".

- Timezone dropdown lists all IANA timezone identifiers
- Streak dates are calculated using `Intl.DateTimeFormat('en-CA', { timeZone })` — never raw UTC
- Changing timezone takes effect immediately for all future streak calculations

---

### FR-005 — FR-012: Goal Management

#### FR-005: Goal Creation
**Priority:** Must Have | **Epic:** EPIC-002

Users shall be able to create goals with a title, description, icon (emoji), target date, and budget.

- Goal creation form accepts: title (required), description, icon, target date, budget
- New goal appears immediately in the goal list
- Goal is associated with the authenticated user's ID
- AI agent can create goals via `create-goal` MCP tool

#### FR-006: Goal Edit and Delete
**Priority:** Must Have | **Epic:** EPIC-002

Users shall be able to edit all goal fields and delete goals. Deleting a goal permanently removes it and all associated tasks/substeps.

- Edit form pre-populates with current goal values
- Delete requires confirmation before removing the goal
- Deleted goal is immediately removed from all UI views
- AI agent can update and delete goals via MCP tools

#### FR-007: Goal Detail View
**Priority:** Must Have | **Epic:** EPIC-002

Users shall be able to view a full goal detail page showing all tasks, progress, notes, budget, and activity history.

- Goal detail shows: title, description, icon, progress bar, tasks list, notes, budget, target date
- Progress bar reflects percentage of completed tasks/substeps
- Tasks are displayed in collapsible sections (phases)
- Navigation breadcrumb shows current location

#### FR-008: Goal Progress Tracking
**Priority:** Must Have | **Epic:** EPIC-002

Goal progress shall be automatically calculated as the percentage of completed tasks and substeps relative to total.

- Progress = (completed tasks + completed substeps) / (total tasks + total substeps) × 100
- Progress updates in real-time as tasks/substeps are completed
- Zero-task goals show 0% progress
- 100% progress triggers a "goal complete" visual state

#### FR-009: Goal Phases
**Priority:** Should Have | **Epic:** EPIC-002

Tasks within a goal may be grouped into named phases. Phases appear as collapsible sections in the goal detail view.

- Tasks can optionally be assigned to a phase
- Phases display as collapsible sections ordered by phase number
- Phase progress shows (completed/total) count
- Tasks without a phase appear in a default section

#### FR-010: Goal Publishing as Template
**Priority:** Should Have | **Epic:** EPIC-008

Users shall be able to publish any of their goals as a template, making it available in the marketplace.

- "Publish as Template" action available on goal detail page
- User specifies title, description, difficulty, category, and visibility
- Published template appears in the marketplace within the same session
- Template preserves task/substep structure (not user-specific notes)

#### FR-011: Template Fork to Goal
**Priority:** Should Have | **Epic:** EPIC-008

Users shall be able to fork any visible template to create a new goal with the template's task structure pre-populated.

- "Use Template" / "Fork" button on template detail page
- Forking creates a new goal with all tasks/substeps
- Template fork count increments on the source template
- Forked goal is editable like any other user-created goal

#### FR-012: Cost Tracking
**Priority:** Should Have | **Epic:** EPIC-002

Users shall be able to add cost entries to substeps and view a rolled-up total cost per goal.

- Substep has an optional cost field (numeric, currency)
- Goal detail page shows total cost as sum of all substep costs
- AI agent can add and update cost via `add-cost` MCP tool

---

### FR-013 — FR-020: Task & Substep Management

#### FR-013: Task CRUD
**Priority:** Must Have | **Epic:** EPIC-002

Users shall be able to create, read, update, and delete tasks within a goal. Tasks are stored as a JSON array on the Goal document.

- Task creation accepts: title (required), description, priority, due date, phase
- Tasks display in creation order
- Editing a task updates its fields immediately
- Deleting a task removes it and all its substeps
- AI agent can manage tasks via `create-task`, `update-task`, `delete-task` MCP tools

#### FR-014: Substep CRUD
**Priority:** Must Have | **Epic:** EPIC-002

Users shall be able to create, read, update, and delete substeps within a task.

- Substep creation accepts: title (required), due date, cost
- Substeps display as an indented list under their parent task
- AI agent can manage substeps via `add-substep`, `update-substep`, `delete-substep` MCP tools

#### FR-015: Three-State Task/Substep Status
**Priority:** Must Have | **Epic:** EPIC-003

Tasks and substeps shall have a three-state status: `not_started`, `in_progress`, or `completed`.

- Status can be updated via UI (cycle button or drag-and-drop in Kanban)
- `completedAt` is set when transitioning to `completed`; cleared on revert
- `startedAt` is set when transitioning to `in_progress`
- Completing a task/substep triggers a streak activity record
- AI agent can update status via `complete-task`, `complete-substep` MCP tools

#### FR-016: Task Priority
**Priority:** Should Have | **Epic:** EPIC-003

Tasks shall support a priority field: `low`, `medium`, `high`, `critical`.

- Priority badge renders in appropriate color per level
- Tasks can be filtered by priority in the Kanban board
- Default priority is `medium` if not specified

#### FR-017: Task and Substep Due Dates
**Priority:** Should Have | **Epic:** EPIC-003

Tasks and substeps shall support optional due dates. Overdue items are highlighted visually.

- Due date displayed on task/substep card
- Items past their due date display a red/warning indicator
- Due date filter available in the Kanban board

#### FR-018: Task Notes
**Priority:** Should Have | **Epic:** EPIC-002

Tasks shall support a freeform notes field.

- Notes field is editable inline in the task detail
- Notes are persisted immediately on save
- Notes changes create an activity log entry of type `note_updated`

#### FR-019: Task Reordering
**Priority:** Should Have | **Epic:** EPIC-002

Users shall be able to reorder tasks within a goal via drag-and-drop (using `@dnd-kit`).

- Drag handle visible on each task card
- Dropping reorders the task in the goal's task array
- Order is persisted to the database immediately

#### FR-020: Boolean-to-Status Data Migration
**Priority:** Must Have | **Epic:** EPIC-003

The system shall provide a migration script to convert existing tasks/substeps from the legacy `completed: boolean` field to `status: TaskStatus`. Must be idempotent.

- Script runs via `npx tsx src/scripts/migrate-task-status.ts`
- `completed: true` → `status: 'completed'`; `completed: false` → `status: 'not_started'`
- Migration is idempotent (safe to run multiple times)

---

### FR-021 — FR-025: Streak Tracking

#### FR-021: Streak Activity Recording
**Priority:** Must Have | **Epic:** EPIC-004

Completing any task or substep shall record a streak activity for the current day in the user's timezone. The operation is idempotent.

- `recordStreakActivity(userId, timezone)` is called from all completion paths: MCP tools, REST API, Kanban board
- Today's date (user-local) is added to `streakHistory` if not already present
- Streak history uses YYYY-MM-DD strings, not UTC DateTime objects

#### FR-022: Streak Display
**Priority:** Must Have | **Epic:** EPIC-004

The UI shall display the user's current streak and longest streak on the home dashboard and mobile stats panel.

- Current streak shows count of consecutive days including today
- Longest streak shows all-time maximum consecutive days
- `calculateStreakFromHistory(history, today)` is the single calculation function used everywhere
- Streak counter shows motivational messages (e.g., "🎉 Unstoppable! 30 days!")

#### FR-023: Streak Milestones
**Priority:** Should Have | **Epic:** EPIC-004

When a user reaches a milestone streak (7, 14, 30, 60, 100 days), the system shall send an email notification and create a feed item.

- Milestones checked on every `recordStreakActivity` call
- Email notification sent via `notify()` on milestone (if user has streak emails enabled)
- Feed item created with type `streak_milestone`
- Each milestone only triggers once

#### FR-024: Activity Calendar Heatmap
**Priority:** Should Have | **Epic:** EPIC-004

The profile page and mobile stats panel shall display a calendar heatmap showing days with logged streak activity.

- Calendar renders a grid of the past 12 months
- Days with streak activity highlighted in green (darker = more completions)
- Today's cell is visually distinct

#### FR-025: Streak-at-Risk Notification
**Priority:** Could Have | **Epic:** EPIC-004

If a user has an active streak and has not yet logged any activity for today, an evening notification shall be sent.

- Notification sent only if streak > 0 and today not yet in `streakHistory`
- Default send time: 8pm user-local
- User can opt out via notification preferences

---

### FR-026 — FR-030: AI Agent

#### FR-026: Embedded Chat Interface
**Priority:** Must Have | **Epic:** EPIC-005

The application shall include an embedded AI chat widget accessible from all pages, powered by Claude. Responses stream via SSE.

- Chat widget accessible from every page via a persistent UI element
- Messages stream token-by-token to the UI
- Tool invocations display as a compact tool-log in the chat
- Chat state persists within a session

#### FR-027: AI Goal and Task Read Access
**Priority:** Must Have | **Epic:** EPIC-005

The AI agent shall be able to read all authenticated user data via MCP tools.

- `get-goals`, `get-goal`, `get-streaks`, `get-friends`, `get-profile` tools return data for the authenticated user only
- Agent cannot access another user's data

#### FR-028: AI Full CRUD via MCP Tools
**Priority:** Must Have | **Epic:** EPIC-005

The AI agent shall be able to create, update, and delete goals, tasks, and substeps. After write operations, RTK Query cache is invalidated.

- All 23 MCP tools are registered and functional
- Write tools verify user ownership before modifying any data
- Cache invalidation occurs via `invalidatesTags` after successful writes
- Agent loop runs max 40 iterations before stopping

#### FR-029: AI Profile and Friends Management
**Priority:** Should Have | **Epic:** EPIC-005

The AI agent shall be able to update user profile fields and manage friend connections.

- `update-profile` tool modifies bio, timezone, location
- `add-friend`, `remove-friend`, `get-friends` tools manage the social graph

#### FR-030: AI Agent Security and Rate Limiting
**Priority:** Must Have | **Epic:** EPIC-005

The AI agent endpoint shall enforce rate limiting (30 requests/minute per user), input sanitization, and ownership verification on all tool calls.

- Requests exceeding 30/min receive HTTP 429
- User inputs are sanitized before being passed to the model
- Every tool call verifies the target resource belongs to the authenticated user
- Vercel 120s timeout respected via max-iterations guard

---

### FR-031 — FR-035: Social Feed & Activity Tracking

#### FR-031: Comprehensive Activity Logging
**Priority:** Must Have | **Epic:** EPIC-006

Every mutation in the system shall create an `ActivityLog` entry with before/after diff metadata.

- `trackActivity()` utility is called from all mutation paths (MCP tools + API routes)
- `ActivityLog` entry always created, regardless of feed preferences
- Metadata includes before/after diffs for update operations

#### FR-032: Social Activity Feed
**Priority:** Must Have | **Epic:** EPIC-006

Users shall see a chronological feed of activity from themselves and their friends.

- Feed at `/feed` shows items from the user and their friends
- Feed items display: icon, actor name, action description, timestamp
- Before/after diffs shown inline for update events
- Feed is paginated (20 items per page)

#### FR-033: Feed Item Grouping
**Priority:** Could Have | **Epic:** EPIC-006

Rapid successive changes of the same type by the same user (within 60 seconds) shall be grouped into a single feed item.

- Items matching (userId + type prefix + within 60s) are grouped
- Grouped items render as "Made N updates to goal 'X'" with expand/collapse

#### FR-034: Feed Visibility Preferences
**Priority:** Should Have | **Epic:** EPIC-010

Users shall be able to configure which activity categories appear in their friends' feed.

- 8 toggle categories: goal events, task events, substep events, cost/budget, notes, profile changes, social activity, streak milestones
- Settings panel on Profile page
- All categories default to ON

#### FR-035: Feed Filtering
**Priority:** Should Have | **Epic:** EPIC-006

Users shall be able to filter the feed by activity category.

- Filter tabs/chips displayed at top of feed
- Selecting a category shows only matching feed items
- "All Activity" shows unfiltered feed

---

### FR-036: Friends & Social Graph

#### FR-036: Friend Connections
**Priority:** Must Have | **Epic:** EPIC-007

Users shall be able to search for other users, send friend requests, accept/decline, and remove friends.

- Friend search by username or email
- Pending requests visible in a notifications or friends section
- Accept/decline buttons on pending requests
- Removing a friend removes them from both users' friend lists
- AI agent can manage friends via `add-friend`, `remove-friend` tools

---

### FR-037 — FR-040: Template Marketplace

#### FR-037: Template Marketplace Browsing
**Priority:** Must Have | **Epic:** EPIC-008

An unauthenticated-accessible marketplace at `/marketplace` shall display all publicly available goal templates.

- Marketplace accessible without authentication
- Templates displayed as cards with: icon, title, author, difficulty badge, category, fork count
- Paginated list (20 items per page)

#### FR-038: Template Search and Filter
**Priority:** Must Have | **Epic:** EPIC-008

Users shall be able to search templates by title/description and filter by category, difficulty, and tags.

- Text search filters by title and description
- Difficulty filter: beginner / intermediate / advanced
- Category filter: multi-select dropdown
- Filters can be combined; results update immediately

#### FR-039: Template Detail Page
**Priority:** Should Have | **Epic:** EPIC-008

Each template shall have a detail page showing full description, creator info, task structure preview, and fork button.

- Detail page at `/marketplace/:templateId`
- Shows creator's name, profile image (from Clerk sync), and "Template Author" label
- Task/substep structure listed as a preview (collapsed by default)
- "Use Template" button forks the template for authenticated users

#### FR-040: Template Visibility Control
**Priority:** Should Have | **Epic:** EPIC-008

Template creators shall choose visibility: `public` or `friends`.

- Visibility selected at publish time; editable afterwards
- Friends-only templates appear only for users who are mutual friends with the creator

---

### FR-041 — FR-044: Kanban Board

#### FR-041: Kanban Board View
**Priority:** Must Have | **Epic:** EPIC-003

A Kanban board at `/board` shall display all user items in three columns: Not Started, In Progress, and Done.

- Board accessible via main navigation
- Three columns with color-coded headers (gray / blue / green)
- Goal-level cards show: icon, title, progress %, task count per status, target date
- Empty state shown per column when no items

#### FR-042: Kanban Drill-Down Navigation
**Priority:** Must Have | **Epic:** EPIC-003

Clicking a goal card navigates to a tasks view; clicking a task card navigates to a substeps view. Breadcrumb shows the current drill-down path.

- Breadcrumb: Board > [Goal Name] > [Task Name]
- Each breadcrumb segment is clickable to navigate back
- Task cards show: title, priority badge, due date, substep progress, parent goal

#### FR-043: Drag-and-Drop Status Change
**Priority:** Should Have | **Epic:** EPIC-003

Users shall be able to drag cards between columns to change item status (using `@dnd-kit`).

- Dragging a card to a column updates its status via API
- Optimistic update occurs immediately; reverts on API error
- Toast notification shown on success or failure

#### FR-044: Kanban Filters
**Priority:** Should Have | **Epic:** EPIC-003

The Kanban board shall support filtering by date range, priority, goal, and text search.

- Date range picker for filtering by `dueDate`
- Priority filter (low/medium/high/critical) — tasks/substeps only
- Goal filter dropdown — when viewing tasks across goals
- Search by title (client-side, immediate)

---

### FR-045 — FR-047: Email Notifications

#### FR-045: Email Notification Delivery
**Priority:** Should Have | **Epic:** EPIC-009

The system shall send transactional email notifications for key events. Emails respect user preferences.

- `notify(userId, type, data)` checks preferences before sending
- Supported types: `welcomeEmail`, `goalCreated`, `streakMilestone`
- Failed sends are logged as errors but do not throw (non-blocking)

#### FR-046: Per-Type Email Notification Preferences
**Priority:** Should Have | **Epic:** EPIC-009

Users shall be able to enable/disable individual email notification types from their profile settings.

- `EmailPreferences` model stores per-type toggles
- `EmailPreferencesPanel` on Profile page shows each type with a toggle
- Changes saved immediately via PATCH request

#### FR-047: Master Email Toggle
**Priority:** Should Have | **Epic:** EPIC-009

Users shall have a master toggle that disables all email notifications.

- Master toggle at top of `EmailPreferencesPanel`
- When master toggle is OFF, no emails sent for any event type
- `notify()` checks `preferences.enabled` before checking individual types

---

### FR-048 — FR-050: Landing Page & Mobile Experience

#### FR-048: Public Landing Page
**Priority:** Must Have | **Epic:** EPIC-011

An unauthenticated landing page at `/` shall explain the product and provide clear CTAs to sign up.

- Landing page accessible without authentication
- Authenticated users see the dashboard, not the landing page
- Sections: hero, "How It Works" (4 steps), features grid (6 features), CTA
- Links to `/sign-up`, `/sign-in`, and `/marketplace`
- Fully responsive at 375px

#### FR-049: Mobile Stats Panel (FAB)
**Priority:** Should Have | **Epic:** EPIC-011

On mobile (< 1024px), a floating action button shall open a bottom sheet with streak, progress stats, and activity calendar.

- FAB visible only on mobile (hidden on `lg:` and above)
- FAB opens a bottom sheet sliding up from the screen bottom
- Bottom sheet contains: StreakCounter, progress bar, quick stats, activity calendar
- Slide-up animation (custom Tailwind keyframe)

#### FR-050: AI-Assisted Goal Creation (Onboarding)
**Priority:** Could Have | **Epic:** EPIC-005

During onboarding, the AI agent shall proactively suggest goal structures to new users with no goals.

- AI chat shows a welcome message for users with 0 goals
- Suggested goals are relevant to common use cases (fitness, learning, career)
- User can ask the AI to create a goal and it does so immediately via MCP tools
- Onboarding suggestions only shown once per user

---

## Non-Functional Requirements

### NFR-001: Performance — API Response Time
**Priority:** Must Have

All REST API endpoints shall respond within 300ms at P95 under normal load.

- P95 response time ≤ 300ms for CRUD operations
- Goal list endpoint (up to 50 goals) responds ≤ 300ms

**Architecture Solution:** MongoDB indexed queries, RTK Query client-side caching, Vercel Edge Network.

---

### NFR-002: Security — Authentication and Authorization
**Priority:** Must Have

Every API route (except public pages and webhooks) must verify authentication. Every write operation must verify resource ownership.

- Unauthenticated requests to protected routes return 401
- Requests to modify another user's data return 403
- AI agent `securityGuard.verifyOwnership()` called on every MCP tool write
- No secrets committed to the repository

---

### NFR-003: Scalability — Concurrent Users
**Priority:** Should Have

The system shall support 10,000 concurrent users without architectural changes.

- MongoDB Atlas M10+ tier handles concurrent connections
- Vercel serverless functions scale horizontally automatically
- RTK Query caching reduces redundant API calls per session

---

### NFR-004: Availability — Uptime
**Priority:** Must Have

The system shall maintain 99.5% uptime (≤ 3.6 hours downtime/month).

- Vercel deployment uses zero-downtime deployments
- MongoDB Atlas has automatic failover configured
- Health check endpoint at `/api/health` returns 200 within 500ms

---

### NFR-005: Usability — Mobile Responsiveness
**Priority:** Must Have

All core user flows shall be fully functional on mobile devices (minimum 375px viewport width).

- All pages render without horizontal scroll at 375px
- Touch targets minimum 44×44px
- Kanban board, goal list, chat widget all usable on mobile
- Mobile navigation (bottom bar) provides access to all main sections

---

### NFR-006: Accessibility — WCAG 2.1 AA
**Priority:** Should Have

Core user flows shall meet WCAG 2.1 Level AA standards.

- Color contrast ratio ≥ 4.5:1 for normal text
- All interactive elements are keyboard-navigable
- All images have meaningful alt text
- Screen reader announces dynamic content updates

---

### NFR-007: AI Agent — Rate Limiting and Timeout
**Priority:** Must Have

The AI agent endpoint shall enforce 30 requests/minute per user and a hard cap of 40 tool iterations per conversation turn.

- Requests exceeding 30/min receive HTTP 429
- Agent loop exits after 40 iterations with a graceful message
- Full end-to-end request completes within 115 seconds (Vercel 120s limit)
- Context trimming (first message + last 12) prevents token limit errors

---

### NFR-008: Maintainability — Test Coverage
**Priority:** Must Have

All business logic shall have ≥ 80% unit test coverage. All MCP tools must have associated test files.

- `npm run test:coverage` reports ≥ 80% for `src/lib/` and `src/app/api/`
- Every MCP tool in `src/lib/mcp/tools/` has a corresponding `__tests__/*.test.ts`
- All tests pass in CI
- No `console.log` in production code

---

### NFR-009: Code Quality — TypeScript Strict Mode
**Priority:** Must Have

The codebase shall compile without TypeScript errors in strict mode.

- `npx tsc --noEmit` produces zero errors
- ESLint passes with zero errors (`npm run lint`)
- No unused variables or imports

---

### NFR-010: SEO — Server-Side Rendering for Public Pages
**Priority:** Should Have

The landing page and marketplace pages shall be server-rendered for search engine indexing.

- `/` (landing) and `/marketplace` render meaningful HTML on first request
- Meta tags (title, description, og:image) are set per page
- Google PageSpeed Insights score ≥ 70 for mobile

---

## Epics Summary

| Epic ID | Epic Name | FRs | Priority | Story Count (Est.) |
|---------|-----------|-----|----------|-------------------|
| EPIC-001 | User Auth & Profile | FR-001–004 | Must Have | 4–6 |
| EPIC-002 | Goal & Task Hierarchy | FR-005–009, FR-012–014, FR-018–019 | Must Have | 8–12 |
| EPIC-003 | Task Status & Kanban | FR-015–017, FR-019–020, FR-041–044 | Must Have | 8–10 |
| EPIC-004 | Streak Tracking | FR-021–025 | Must Have | 4–6 |
| EPIC-005 | AI Agent & Chat | FR-026–030, FR-050 | Must Have | 6–8 |
| EPIC-006 | Social Feed & Tracking | FR-031–033, FR-035 | Must Have | 6–8 |
| EPIC-007 | Friends & Social Graph | FR-036 | Must Have | 3–5 |
| EPIC-008 | Template Marketplace | FR-010–011, FR-037–040 | Should Have | 5–7 |
| EPIC-009 | Email Notifications | FR-045–047 | Should Have | 3–4 |
| EPIC-010 | Feed Visibility Controls | FR-034 | Should Have | 2–4 |
| EPIC-011 | Landing Page & Mobile | FR-048–049 | Must Have / Should Have | 3–4 |
| **TOTAL** | | **50 FRs** | | **52–74 stories** |

---

## Dependencies

### Internal Dependencies

| Dependency | Impact | Notes |
|------------|--------|-------|
| `Goal.tasks` JSON field | All task/substep mutations are read-modify-write | Never use `prisma.task.update()` — always fetch goal, mutate array, write back |
| RTK Query cache | UI freshness | `invalidatesTags` must be called after every write from both UI and AI tools |
| `calculateStreakFromHistory()` at `src/lib/streaks/updateStreak.ts` | Streak correctness | All completion paths must import this; never inline streak logic |
| `trackActivity()` at `src/lib/activity` | Activity log completeness | Call from every mutation path; fire-and-forget pattern |

### External Dependencies

| Service | Purpose | Risk |
|---------|---------|------|
| Clerk | Authentication, user sync | SLA changes impact availability; no self-hosted fallback |
| MongoDB Atlas | Database | M10+ required for production; free tier insufficient for concurrent users |
| Vercel | Hosting | 120s function timeout constrains AI agent conversation length |
| Anthropic Claude API | AI agent | Rate limits and pricing directly affect agent usability and cost |
| Resend / SMTP | Transactional email | Delivery reliability affects streak milestone notifications |

---

## Assumptions

- Users have access to a modern browser (Chrome, Firefox, Safari, Edge — last 2 major versions)
- Users provide an accurate timezone; incorrect timezone results in incorrect streak dates
- MongoDB Atlas free/shared tier for development; M10+ required before public launch
- Clerk SDK caches user data server-side, so per-request Clerk sync adds < 50ms overhead
- The `Goal.tasks` JSON field is sufficient for current scale; normalization deferred to post-launch

---

## Open Questions

1. **Streak-at-risk timing**: What exact time (user-local) should the streak reminder be sent? Default proposal: 8pm — needs confirmation
2. **Template moderation**: Is there a reporting/moderation flow for inappropriate public templates?
3. **Friend discovery**: Search by email, username, or both? What privacy controls govern discoverability?
4. **AI model selection**: Is Claude Sonnet 4.6 the model for all users, or should power users get Opus access?
5. **Data retention**: How long are `ActivityLog` entries retained? Is there a pruning policy?

---

## Requirements Traceability Matrix

| FR Range | Capability Area | Epic | Priority |
|----------|----------------|------|----------|
| FR-001–004 | Auth & Profile | EPIC-001 | Must Have |
| FR-005–012 | Goal Management | EPIC-002, EPIC-008 | Must/Should Have |
| FR-013–020 | Task & Substep | EPIC-002, EPIC-003 | Must/Should Have |
| FR-021–025 | Streak Engine | EPIC-004 | Must/Should/Could Have |
| FR-026–030 | AI Agent | EPIC-005 | Must/Should Have |
| FR-031–035 | Social Feed | EPIC-006, EPIC-010 | Must/Should/Could Have |
| FR-036 | Friends | EPIC-007 | Must Have |
| FR-037–040 | Templates | EPIC-008 | Must/Should Have |
| FR-041–044 | Kanban Board | EPIC-003 | Must/Should Have |
| FR-045–047 | Email Notifications | EPIC-009 | Should Have |
| FR-048–050 | Landing/Mobile/AI UX | EPIC-011, EPIC-005 | Must/Should/Could Have |

---

**This document was created using BMAD Method v6 — Phase 2 (Planning) — Canonical PRD**

*Next: Run `/bmad-bmm-create-epics-and-stories` to generate detailed epic and story breakdowns, or `/bmad-bmm-check-implementation-readiness` to validate readiness.*
