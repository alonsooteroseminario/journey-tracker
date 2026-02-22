# Product Requirements Document: Journey Tracker

**Date:** 2026-02-20
**Author:** Alonsooteroseminario
**Version:** 1.0
**Project Type:** web-app
**Project Level:** 4 (Enterprise — 40+ stories)
**Status:** Draft

---

## Document Overview

This PRD defines the functional and non-functional requirements for Journey Tracker. It serves as the source of truth for what will be built and provides traceability from requirements through implementation.

**Related Documents:**
- Product Brief: `_bmad-output/planning-artifacts/product-brief-journey-tracker-2026-02-20.md`

---

## Executive Summary

Journey Tracker is a personal goal achievement platform that helps individuals break down ambitious long-term goals into structured, daily-actionable tasks and substeps. By combining hierarchical goal management, daily streak tracking, a social accountability layer, a template marketplace, and an embedded AI assistant (Claude-powered, 23+ MCP tools), it uniquely closes the gap between goal-setting and goal-achieving. The platform is built on Next.js 15 App Router, Clerk auth, Prisma + MongoDB, and Redux Toolkit.

---

## Product Goals

### Business Objectives

- Grow to 1,000 active users within 12 months of public launch (≥1 goal + activity in past 30 days)
- Achieve 40% D30 retention among users who create at least one goal in their first session
- Build a template marketplace with 100+ published templates within 6 months of public launch
- Reach average 7-day streak length of 5+ days among active users
- Establish AI agent engagement: 50% of active users initiate ≥1 AI conversation per week

### Success Metrics

- DAU/MAU ratio ≥ 30%
- Streak continuation rate ≥ 60% (users with active streak who log activity next day)
- Goal completion rate ≥ 20% over 90 days
- Template fork rate ≥ 30% within 7 days of publishing
- D7 retention ≥ 50%, D30 retention ≥ 40%
- AI agent weekly engagement ≥ 50% of active users

---

## Functional Requirements

### Authentication & User Management

---

### FR-001: User Registration and Authentication

**Priority:** Must Have

**Description:**
The system shall support user registration, sign-in, and session management via Clerk authentication. Users must authenticate before accessing any protected page or API endpoint.

**Acceptance Criteria:**
- [ ] Unauthenticated users are redirected to `/sign-in` when accessing protected routes
- [ ] Clerk sign-up flow creates a corresponding Prisma `User` record on first login
- [ ] Session tokens are validated on every API request via Clerk middleware
- [ ] Sign-out clears the session and redirects to landing page

**Dependencies:** None

---

### FR-002: User Profile Management

**Priority:** Must Have

**Description:**
Users shall be able to view and edit their profile, including name, bio, location, and timezone. Profile image is sourced from Clerk and synced automatically.

**Acceptance Criteria:**
- [ ] Profile page displays name, bio, location, timezone, profile image, and member-since date
- [ ] User can edit bio, location, and timezone via inline form
- [ ] Changes are persisted to the database immediately
- [ ] Profile image reflects the Clerk account image (no separate upload required)

**Dependencies:** FR-001

---

### FR-003: Automatic Clerk Data Synchronization

**Priority:** Must Have

**Description:**
On every authenticated request, `getCurrentUser()` shall fetch the latest name, email, and profile image from Clerk and update the Prisma `User` record if data has changed.

**Acceptance Criteria:**
- [ ] Template creator names always reflect the user's current Clerk display name
- [ ] Database update only occurs when data has changed (no unnecessary writes)
- [ ] Race conditions on first-login user creation are handled gracefully (P2002 conflict)

**Dependencies:** FR-001

---

### FR-004: Timezone Configuration

**Priority:** Must Have

**Description:**
Users shall be able to set their timezone in their profile. All streak date calculations must use this timezone to determine "today".

**Acceptance Criteria:**
- [ ] Timezone dropdown lists all IANA timezone identifiers
- [ ] Streak dates are calculated using `Intl.DateTimeFormat('en-CA', { timeZone })` — never raw UTC
- [ ] Changing timezone takes effect immediately for all future streak calculations

**Dependencies:** FR-002

---

### Goal Management

---

### FR-005: Goal Creation

**Priority:** Must Have

**Description:**
Users shall be able to create goals with a title, description, icon (emoji), target date, and budget. A goal is the top-level entity in the hierarchy.

**Acceptance Criteria:**
- [ ] Goal creation form accepts: title (required), description, icon, target date, budget
- [ ] New goal appears immediately in the goal list
- [ ] Goal is associated with the authenticated user's ID
- [ ] AI agent can create goals via `create-goal` MCP tool

**Dependencies:** FR-001

---

### FR-006: Goal Edit and Delete

**Priority:** Must Have

**Description:**
Users shall be able to edit all goal fields and delete goals. Deleting a goal permanently removes it and all associated tasks/substeps.

**Acceptance Criteria:**
- [ ] Edit form pre-populates with current goal values
- [ ] Delete requires confirmation before removing the goal
- [ ] Deleted goal is immediately removed from all UI views
- [ ] AI agent can update and delete goals via MCP tools

**Dependencies:** FR-005

---

### FR-007: Goal Detail View

**Priority:** Must Have

**Description:**
Users shall be able to view a full goal detail page showing all tasks, progress, notes, budget, and activity history.

**Acceptance Criteria:**
- [ ] Goal detail shows: title, description, icon, progress bar, tasks list, notes, budget, target date
- [ ] Progress bar reflects percentage of completed tasks/substeps
- [ ] Tasks are displayed in collapsible sections (phases)
- [ ] Navigation breadcrumb shows current location

**Dependencies:** FR-005

---

### FR-008: Goal Progress Tracking

**Priority:** Must Have

**Description:**
Goal progress shall be automatically calculated as the percentage of completed tasks and substeps relative to total.

**Acceptance Criteria:**
- [ ] Progress = (completed tasks + completed substeps) / (total tasks + total substeps) × 100
- [ ] Progress updates in real-time as tasks/substeps are completed
- [ ] Zero-task goals show 0% progress
- [ ] 100% progress triggers a "goal complete" visual state

**Dependencies:** FR-005, FR-013, FR-015

---

### FR-009: Goal Phases

**Priority:** Should Have

**Description:**
Tasks within a goal may be grouped into named phases (e.g., "Phase 1: Research", "Phase 2: Build"). Phases appear as collapsible sections in the goal detail view.

**Acceptance Criteria:**
- [ ] Tasks can optionally be assigned to a phase
- [ ] Phases display as collapsible sections ordered by phase number
- [ ] Phase progress shows (completed/total) count
- [ ] Tasks without a phase appear in an "Other" or default section

**Dependencies:** FR-007

---

### FR-010: Goal Publishing as Template

**Priority:** Should Have

**Description:**
Users shall be able to publish any of their goals as a template, making it available in the marketplace with a chosen visibility (public or friends-only).

**Acceptance Criteria:**
- [ ] "Publish as Template" action available on goal detail page
- [ ] User specifies title, description, difficulty, category, and visibility
- [ ] Published template appears in the marketplace within the same session
- [ ] Template preserves task/substep structure (but not user-specific data like notes)

**Dependencies:** FR-005, FR-037

---

### FR-011: Template Fork to Goal

**Priority:** Should Have

**Description:**
Users shall be able to fork any visible template to create a new goal with the template's task structure pre-populated.

**Acceptance Criteria:**
- [ ] "Use Template" / "Fork" button on template detail page
- [ ] Forking creates a new goal in the user's account with all tasks/substeps
- [ ] Template fork count increments on the source template
- [ ] Forked goal is editable like any other user-created goal

**Dependencies:** FR-005, FR-037

---

### FR-012: Cost Tracking

**Priority:** Should Have

**Description:**
Users shall be able to add cost entries to substeps and view a rolled-up total cost per goal.

**Acceptance Criteria:**
- [ ] Substep has an optional cost field (numeric, currency)
- [ ] Goal detail page shows total cost as sum of all substep costs
- [ ] AI agent can add and update cost via `add-cost` MCP tool
- [ ] Cost history is tracked in the activity log

**Dependencies:** FR-014

---

### Task & Substep Management

---

### FR-013: Task CRUD

**Priority:** Must Have

**Description:**
Users shall be able to create, read, update, and delete tasks within a goal. Tasks are stored as a JSON array on the Goal document.

**Acceptance Criteria:**
- [ ] Task creation accepts: title (required), description, priority, due date, phase
- [ ] Tasks display in the goal detail in their creation order
- [ ] Editing a task updates its fields immediately
- [ ] Deleting a task removes it and all its substeps
- [ ] AI agent can manage tasks via `create-task`, `update-task`, `delete-task` MCP tools

**Dependencies:** FR-005

---

### FR-014: Substep CRUD

**Priority:** Must Have

**Description:**
Users shall be able to create, read, update, and delete substeps within a task. Substeps are nested within tasks in the same JSON array.

**Acceptance Criteria:**
- [ ] Substep creation accepts: title (required), due date, cost
- [ ] Substeps display as an indented list under their parent task
- [ ] Editing and deleting substeps behaves consistently with task CRUD
- [ ] AI agent can manage substeps via `add-substep`, `update-substep`, `delete-substep` MCP tools

**Dependencies:** FR-013

---

### FR-015: Three-State Task/Substep Status

**Priority:** Must Have

**Description:**
Tasks and substeps shall have a three-state status: `not_started`, `in_progress`, or `completed`. Status transitions update timestamps (`startedAt`, `completedAt`).

**Acceptance Criteria:**
- [ ] Status can be updated via UI (cycle button or drag-and-drop in kanban)
- [ ] `completedAt` is set when transitioning to `completed`; cleared on revert
- [ ] `startedAt` is set when transitioning to `in_progress`
- [ ] Completing a task/substep triggers a streak activity record
- [ ] AI agent can update status via `complete-task`, `complete-substep` MCP tools

**Dependencies:** FR-013, FR-014

---

### FR-016: Task Priority

**Priority:** Should Have

**Description:**
Tasks shall support a priority field with values: `low`, `medium`, `high`, `critical`. Priority is displayed as a badge and used for filtering.

**Acceptance Criteria:**
- [ ] Priority badge renders in appropriate color per level
- [ ] Tasks can be filtered by priority in the Kanban board
- [ ] Default priority is `medium` if not specified

**Dependencies:** FR-013

---

### FR-017: Task and Substep Due Dates

**Priority:** Should Have

**Description:**
Tasks and substeps shall support optional due dates. Overdue items are highlighted visually.

**Acceptance Criteria:**
- [ ] Due date displayed on task/substep card
- [ ] Items past their due date display a red/warning indicator
- [ ] Due date filter available in the Kanban board

**Dependencies:** FR-013, FR-014

---

### FR-018: Task Notes

**Priority:** Should Have

**Description:**
Tasks shall support a freeform notes field for additional context, links, or commentary.

**Acceptance Criteria:**
- [ ] Notes field is editable inline in the task detail
- [ ] Notes are persisted immediately on save
- [ ] Notes changes create an activity log entry of type `note_updated`

**Dependencies:** FR-013

---

### FR-019: Task Reordering

**Priority:** Should Have

**Description:**
Users shall be able to reorder tasks within a goal via drag-and-drop, using the existing `@dnd-kit` library.

**Acceptance Criteria:**
- [ ] Drag handle visible on each task card
- [ ] Dropping reorders the task in the goal's task array
- [ ] Order is persisted to the database immediately
- [ ] Reordering does not affect task status or other fields

**Dependencies:** FR-013

---

### FR-020: Boolean-to-Status Data Migration

**Priority:** Must Have

**Description:**
The system shall provide a migration script to convert existing tasks/substeps from the legacy `completed: boolean` field to `status: TaskStatus`. The migration must be idempotent.

**Acceptance Criteria:**
- [ ] Script runs via `npx tsx src/scripts/migrate-task-status.ts`
- [ ] `completed: true` → `status: 'completed'`; `completed: false` → `status: 'not_started'`
- [ ] Migration is idempotent (safe to run multiple times)
- [ ] Script logs count of migrated goals, tasks, and substeps

**Dependencies:** FR-015

---

### Streak Tracking

---

### FR-021: Streak Activity Recording

**Priority:** Must Have

**Description:**
Completing any task or substep shall record a streak activity for the current day in the user's timezone. The operation is idempotent — multiple completions in one day count as a single activity.

**Acceptance Criteria:**
- [ ] `recordStreakActivity(userId, timezone)` is called from all completion paths: MCP tools, REST API, Kanban board
- [ ] Today's date (user-local) is added to `streakHistory` if not already present
- [ ] No database write occurs if today is already in `streakHistory`
- [ ] Streak history uses YYYY-MM-DD strings, not UTC DateTime objects

**Dependencies:** FR-015, FR-004

---

### FR-022: Streak Display

**Priority:** Must Have

**Description:**
The UI shall display the user's current streak and longest streak on the home dashboard and in the mobile stats panel.

**Acceptance Criteria:**
- [ ] Current streak shows count of consecutive days including today (0 if today not yet logged)
- [ ] Longest streak shows all-time maximum consecutive days
- [ ] `calculateStreakFromHistory(history, today)` is the single calculation function used everywhere
- [ ] Streak counter shows motivational messages (e.g., "🎉 Unstoppable! 30 days!")

**Dependencies:** FR-021

---

### FR-023: Streak Milestones

**Priority:** Should Have

**Description:**
When a user reaches a milestone streak (7, 14, 30, 60, 100 days), the system shall send an email notification and create a feed item.

**Acceptance Criteria:**
- [ ] Milestones checked on every `recordStreakActivity` call
- [ ] Email notification sent via `notify()` on milestone (if user has streak emails enabled)
- [ ] Feed item created with type `streak_milestone`
- [ ] Each milestone only triggers once (not repeatedly)

**Dependencies:** FR-021, FR-045

---

### FR-024: Activity Calendar Heatmap

**Priority:** Should Have

**Description:**
The profile page and mobile stats panel shall display a calendar heatmap showing days with logged streak activity.

**Acceptance Criteria:**
- [ ] Calendar renders a grid of the past 12 months
- [ ] Days with streak activity are highlighted in green (darker = more completions)
- [ ] Today's cell is visually distinct
- [ ] Tooltip on hover shows date and completion count

**Dependencies:** FR-021

---

### FR-025: Streak-at-Risk Notification

**Priority:** Could Have

**Description:**
If a user has an active streak and has not yet logged any activity for today, a push/email notification shall be sent in the evening (e.g., 8pm user-local time) as a reminder.

**Acceptance Criteria:**
- [ ] Notification sent only if streak > 0 and today not yet in `streakHistory`
- [ ] Sent at a configurable time (default 8pm user-local)
- [ ] User can opt out via notification preferences

**Dependencies:** FR-021, FR-045

---

### AI Agent

---

### FR-026: Embedded Chat Interface

**Priority:** Must Have

**Description:**
The application shall include an embedded AI chat widget accessible from all pages, powered by Claude. Responses stream in real-time via Server-Sent Events (SSE).

**Acceptance Criteria:**
- [ ] Chat widget accessible from every page via a persistent UI element
- [ ] Messages stream token-by-token to the UI
- [ ] Tool invocations display as a compact tool-log in the chat
- [ ] Chat state persists within a session (not across page refreshes)

**Dependencies:** FR-001

---

### FR-027: AI Goal and Task Read Access

**Priority:** Must Have

**Description:**
The AI agent shall be able to read all of the authenticated user's goals, tasks, substeps, streaks, and friends via MCP tools.

**Acceptance Criteria:**
- [ ] `get-goals`, `get-goal`, `get-streaks`, `get-friends`, `get-profile` tools return data for the authenticated user only
- [ ] Agent cannot access another user's data
- [ ] Read operations do not require UI cache invalidation

**Dependencies:** FR-026

---

### FR-028: AI Full CRUD via MCP Tools

**Priority:** Must Have

**Description:**
The AI agent shall be able to create, update, and delete goals, tasks, and substeps on behalf of the authenticated user. After write operations, the RTK Query cache is invalidated so the UI reflects changes.

**Acceptance Criteria:**
- [ ] All 23 MCP tools are registered and functional
- [ ] Write tools verify user ownership before modifying any data
- [ ] Cache invalidation occurs via `invalidatesTags` after successful writes
- [ ] Agent loop runs max 40 iterations before stopping to prevent infinite loops

**Dependencies:** FR-027

---

### FR-029: AI Profile and Friends Management

**Priority:** Should Have

**Description:**
The AI agent shall be able to update user profile fields and manage friend connections (add, remove, list) via MCP tools.

**Acceptance Criteria:**
- [ ] `update-profile` tool modifies bio, timezone, location
- [ ] `add-friend`, `remove-friend`, `get-friends` tools manage the social graph
- [ ] All changes respect ownership — agent cannot modify another user's profile

**Dependencies:** FR-028

---

### FR-030: AI Agent Security and Rate Limiting

**Priority:** Must Have

**Description:**
The AI agent endpoint shall enforce rate limiting (30 requests/minute per user), input sanitization to prevent prompt injection, and ownership verification on all tool calls.

**Acceptance Criteria:**
- [ ] Requests exceeding 30/min receive a 429 response
- [ ] User inputs are sanitized before being passed to the model
- [ ] Every tool call verifies the target resource belongs to the authenticated user
- [ ] Vercel timeout (120s) is respected via a max-iterations guard

**Dependencies:** FR-026

---

### Social Feed & Activity Tracking

---

### FR-031: Comprehensive Activity Logging

**Priority:** Must Have

**Description:**
Every mutation in the system (goal, task, substep create/update/delete/status-change, cost, notes, profile, friends, templates) shall create an `ActivityLog` entry with before/after diff metadata.

**Acceptance Criteria:**
- [ ] `trackActivity()` utility is called from all mutation paths (MCP tools + API routes)
- [ ] `ActivityLog` entry always created, regardless of feed preferences
- [ ] Metadata includes before/after diffs for update operations
- [ ] Activity types match the full enum: `goal_created`, `task_status_changed`, etc.

**Dependencies:** FR-006, FR-013, FR-015

---

### FR-032: Social Activity Feed

**Priority:** Must Have

**Description:**
Users shall see a chronological feed of activity from themselves and their friends. Each feed item displays the activity type, description, diff details, and timestamp.

**Acceptance Criteria:**
- [ ] Feed at `/feed` shows items from the user and their friends
- [ ] Feed items display: icon, actor name, action description, timestamp
- [ ] Before/after diffs are shown inline for update events
- [ ] Feed is paginated (20 items per page)

**Dependencies:** FR-031, FR-035

---

### FR-033: Feed Item Grouping

**Priority:** Could Have

**Description:**
Rapid successive changes of the same type by the same user (within 60 seconds) shall be grouped into a single feed item to reduce noise.

**Acceptance Criteria:**
- [ ] Items matching (userId + type prefix + within 60s) are grouped
- [ ] Grouped items render as "Made N updates to goal 'X'" with expand/collapse
- [ ] Non-grouped items render normally

**Dependencies:** FR-032

---

### FR-034: Feed Visibility Preferences

**Priority:** Should Have

**Description:**
Users shall be able to configure which activity categories appear in their friends' feed. ActivityLog entries are always created; only `FeedItem` creation is gated by preferences.

**Acceptance Criteria:**
- [ ] 8 toggle categories: goal events, task events, substep events, cost/budget, notes, profile changes, social activity, streak milestones
- [ ] Settings panel on Profile page (`/profile`)
- [ ] All categories default to ON
- [ ] Changes take effect immediately for future activities (not retroactive)

**Dependencies:** FR-031

---

### FR-035: Feed Filtering

**Priority:** Should Have

**Description:**
Users shall be able to filter the feed by activity category (Goals, Tasks, Status Changes, Streaks, Social, All).

**Acceptance Criteria:**
- [ ] Filter tabs/chips displayed at top of feed
- [ ] Selecting a category shows only matching feed items
- [ ] "All Activity" shows unfiltered feed
- [ ] Filter state persists within the session

**Dependencies:** FR-032

---

### Friends System

---

### FR-036: Friend Connections

**Priority:** Must Have

**Description:**
Users shall be able to search for other users, send friend requests, accept/decline incoming requests, and remove friends.

**Acceptance Criteria:**
- [ ] Friend search by username or email
- [ ] Pending requests visible in a notifications or friends section
- [ ] Accept/decline buttons on pending requests
- [ ] Removing a friend removes them from both users' friend lists
- [ ] AI agent can manage friends via `add-friend`, `remove-friend` tools

**Dependencies:** FR-001

---

### Template Marketplace

---

### FR-037: Template Marketplace Browsing

**Priority:** Must Have

**Description:**
An unauthenticated-accessible marketplace at `/marketplace` shall display all publicly available goal templates with search and filter capabilities.

**Acceptance Criteria:**
- [ ] Marketplace accessible without authentication
- [ ] Templates displayed as cards with: icon, title, author, difficulty badge, category, fork count
- [ ] Paginated or infinite-scroll list (20 items per page)
- [ ] Empty state shown when no templates match filters

**Dependencies:** FR-001

---

### FR-038: Template Search and Filter

**Priority:** Must Have

**Description:**
Users shall be able to search templates by title/description and filter by category, difficulty, and tags.

**Acceptance Criteria:**
- [ ] Text search filters by title and description (client-side or server-side)
- [ ] Difficulty filter: beginner / intermediate / advanced
- [ ] Category filter: multi-select dropdown
- [ ] Tag filter: clickable tag chips
- [ ] Filters can be combined; results update immediately

**Dependencies:** FR-037

---

### FR-039: Template Detail Page

**Priority:** Should Have

**Description:**
Each template shall have a detail page showing full description, creator info, task structure preview, and fork button.

**Acceptance Criteria:**
- [ ] Detail page at `/marketplace/:templateId`
- [ ] Shows creator's name, profile image (from Clerk sync), and "Template Author" label
- [ ] Task/substep structure listed as a preview (collapsed by default)
- [ ] Fork count, difficulty, category, tags displayed
- [ ] "Use Template" button forks the template for authenticated users

**Dependencies:** FR-037, FR-011

---

### FR-040: Template Visibility Control

**Priority:** Should Have

**Description:**
Template creators shall choose visibility: `public` (visible to all) or `friends` (visible only to mutual friends).

**Acceptance Criteria:**
- [ ] Visibility selected at publish time; editable afterwards
- [ ] Friends-only templates appear in marketplace only for users who are mutual friends with the creator
- [ ] Fork count is visible regardless of visibility

**Dependencies:** FR-010

---

### Kanban Board

---

### FR-041: Kanban Board View

**Priority:** Must Have

**Description:**
A Kanban board at `/board` shall display all user items in three columns: Not Started, In Progress, and Done. The default view shows goals.

**Acceptance Criteria:**
- [ ] Board accessible via main navigation
- [ ] Three columns with color-coded headers (gray / blue / green)
- [ ] Goal-level cards show: icon, title, progress %, task count per status, target date
- [ ] Empty state shown per column when no items

**Dependencies:** FR-015

---

### FR-042: Kanban Drill-Down Navigation

**Priority:** Must Have

**Description:**
Clicking a goal card navigates to a tasks view for that goal; clicking a task card navigates to a substeps view. A breadcrumb shows the current drill-down path.

**Acceptance Criteria:**
- [ ] Breadcrumb: Board > [Goal Name] > [Task Name]
- [ ] Each breadcrumb segment is clickable to navigate back
- [ ] Task cards show: title, priority badge, due date, substep progress, parent goal
- [ ] Substep cards show: title, due date, cost, parent task

**Dependencies:** FR-041

---

### FR-043: Drag-and-Drop Status Change

**Priority:** Should Have

**Description:**
Users shall be able to drag cards between columns to change item status, using the existing `@dnd-kit` library.

**Acceptance Criteria:**
- [ ] Dragging a card to a column updates its status via API
- [ ] Optimistic update occurs immediately; reverts on API error
- [ ] Toast notification shown on success or failure
- [ ] Drag handle visible on each card

**Dependencies:** FR-041, FR-015

---

### FR-044: Kanban Filters

**Priority:** Should Have

**Description:**
The Kanban board shall support filtering by date range (due date), priority, goal (when in task view), and text search.

**Acceptance Criteria:**
- [ ] Date range picker for filtering by `dueDate`
- [ ] Priority filter (low/medium/high/critical) — tasks/substeps only
- [ ] Goal filter dropdown — when viewing tasks across goals
- [ ] Search by title (client-side, immediate)
- [ ] Filters can be combined

**Dependencies:** FR-041, FR-016, FR-017

---

### Email Notifications

---

### FR-045: Email Notification Delivery

**Priority:** Should Have

**Description:**
The system shall send transactional email notifications for key events: welcome, goal created, streak milestone. Emails respect user preferences.

**Acceptance Criteria:**
- [ ] `notify(userId, type, data)` checks preferences before sending
- [ ] Supported types: `welcomeEmail`, `goalCreated`, `streakMilestone`
- [ ] Emails contain relevant content (goal title, streak count, etc.)
- [ ] Failed sends are logged as errors but do not throw (non-blocking)

**Dependencies:** FR-046

---

### FR-046: Per-Type Email Notification Preferences

**Priority:** Should Have

**Description:**
Users shall be able to enable/disable individual email notification types from their profile settings.

**Acceptance Criteria:**
- [ ] `EmailPreferences` model stores per-type toggles
- [ ] `EmailPreferencesPanel` on Profile page shows each type with a toggle
- [ ] Changes saved immediately via PATCH request
- [ ] Page reload reflects saved preferences

**Dependencies:** FR-002

---

### FR-047: Master Email Toggle

**Priority:** Should Have

**Description:**
Users shall have a master toggle that disables all email notifications regardless of individual type settings.

**Acceptance Criteria:**
- [ ] Master toggle at top of `EmailPreferencesPanel`
- [ ] When master toggle is OFF, no emails sent for any event type
- [ ] Individual toggles remain visible but effectively inactive
- [ ] `notify()` checks `preferences.enabled` before checking individual types

**Dependencies:** FR-046

---

### Landing Page & Mobile Experience

---

### FR-048: Public Landing Page

**Priority:** Must Have

**Description:**
An unauthenticated landing page at `/` shall explain the product, showcase features, and provide clear CTAs to sign up or browse the marketplace.

**Acceptance Criteria:**
- [ ] Landing page accessible without authentication
- [ ] Authenticated users see the dashboard, not the landing page
- [ ] Sections: hero, "How It Works" (4 steps), features grid (6 features), CTA
- [ ] Links to `/sign-up`, `/sign-in`, and `/marketplace`
- [ ] Fully responsive at 375px

**Dependencies:** FR-001

---

### FR-049: Mobile Stats Panel (FAB)

**Priority:** Should Have

**Description:**
On mobile devices (< 1024px width), a floating action button (FAB) shall open a bottom sheet with the user's streak, progress stats, and activity calendar — matching the desktop sidebar.

**Acceptance Criteria:**
- [ ] FAB visible only on mobile (hidden on `lg:` and above)
- [ ] FAB opens a bottom sheet sliding up from the screen bottom
- [ ] Bottom sheet contains: StreakCounter, progress bar, quick stats, activity calendar
- [ ] Tapping the overlay or X button closes the sheet
- [ ] Slide-up animation (custom Tailwind keyframe)

**Dependencies:** FR-022, FR-024

---

### FR-050: AI-Assisted Goal Creation (Onboarding)

**Priority:** Could Have

**Description:**
During onboarding, the AI agent shall proactively suggest goal structures to new users who have no goals, reducing the "blank slate" problem.

**Acceptance Criteria:**
- [ ] AI chat shows a welcome message for users with 0 goals
- [ ] Suggested goals are relevant to common use cases (fitness, learning, career)
- [ ] User can ask the AI to create a goal and it does so immediately via MCP tools
- [ ] Onboarding suggestions only shown once per user

**Dependencies:** FR-026, FR-028

---

## Non-Functional Requirements

---

### NFR-001: Performance — API Response Time

**Priority:** Must Have

**Description:**
All REST API endpoints shall respond within 300ms at the 95th percentile under normal load.

**Acceptance Criteria:**
- [ ] P95 response time ≤ 300ms for CRUD operations
- [ ] Goal list endpoint (with up to 50 goals) responds ≤ 300ms

**Rationale:** Slow API responses degrade the feel of real-time updates and streak recording, directly impacting user trust.

---

### NFR-002: Security — Authentication and Authorization

**Priority:** Must Have

**Description:**
Every API route except `/api/webhooks/*` and public marketplace/landing pages must verify user authentication via Clerk. Every write operation must verify the target resource belongs to the authenticated user.

**Acceptance Criteria:**
- [ ] Unauthenticated requests to protected routes return 401
- [ ] Requests to modify another user's data return 403
- [ ] AI agent `securityGuard.verifyOwnership()` called on every MCP tool write
- [ ] No secrets committed to the repository

**Rationale:** Personal goal data is sensitive; unauthorized access would be a critical trust failure.

---

### NFR-003: Scalability — Concurrent Users

**Priority:** Should Have

**Description:**
The system shall support 10,000 concurrent users without architectural changes.

**Acceptance Criteria:**
- [ ] MongoDB Atlas M10+ tier or equivalent handles concurrent connections
- [ ] Vercel serverless functions scale horizontally automatically
- [ ] RTK Query caching reduces redundant API calls per session

**Rationale:** Growth to 1,000+ users requires infrastructure capable of 10× headroom.

---

### NFR-004: Availability — Uptime

**Priority:** Must Have

**Description:**
The system shall maintain 99.5% uptime (≤ 3.6 hours downtime/month), leveraging Vercel and MongoDB Atlas managed infrastructure.

**Acceptance Criteria:**
- [ ] Vercel deployment does not cause downtime (zero-downtime deployments)
- [ ] MongoDB Atlas has automatic failover configured
- [ ] Health check endpoint at `/api/health` returns 200 within 500ms

**Rationale:** Users rely on the system daily for streak logging; downtime breaks streaks and destroys trust.

---

### NFR-005: Usability — Mobile Responsiveness

**Priority:** Must Have

**Description:**
All core user flows shall be fully functional on mobile devices with a minimum viewport width of 375px.

**Acceptance Criteria:**
- [ ] All pages render without horizontal scroll at 375px
- [ ] Touch targets minimum 44×44px
- [ ] Kanban board, goal list, chat widget all usable on mobile
- [ ] Mobile navigation (bottom bar) provides access to all main sections

**Rationale:** A significant portion of users access productivity apps on mobile; mobile-only users must not be disadvantaged.

---

### NFR-006: Accessibility — WCAG 2.1 AA

**Priority:** Should Have

**Description:**
Core user flows (sign-in, create goal, complete task, view feed) shall meet WCAG 2.1 Level AA standards.

**Acceptance Criteria:**
- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] All interactive elements are keyboard-navigable
- [ ] All images have meaningful alt text
- [ ] Screen reader announces dynamic content updates

**Rationale:** Accessibility expands reach and is increasingly a legal requirement in target markets.

---

### NFR-007: AI Agent — Rate Limiting and Timeout

**Priority:** Must Have

**Description:**
The AI agent endpoint shall enforce 30 requests/minute per user and a hard cap of 40 tool iterations per conversation turn. The endpoint must complete within Vercel's 120-second function timeout.

**Acceptance Criteria:**
- [ ] Requests exceeding 30/min receive HTTP 429
- [ ] Agent loop exits after 40 iterations with a graceful message
- [ ] Full end-to-end request including streaming completes within 115 seconds
- [ ] Context trimming (first message + last 12) prevents token limit errors on long conversations

**Rationale:** Unbounded AI usage would incur unacceptable API costs; timeouts prevent hanging requests.

---

### NFR-008: Maintainability — Test Coverage

**Priority:** Must Have

**Description:**
All business logic in MCP tools, streak utilities, and API route handlers shall have ≥ 80% unit test coverage. All MCP tools must have associated test files.

**Acceptance Criteria:**
- [ ] `npm run test:coverage` reports ≥ 80% for `src/lib/` and `src/app/api/`
- [ ] Every MCP tool in `src/lib/mcp/tools/` has a corresponding `__tests__/*.test.ts`
- [ ] All tests pass in CI (`npm run test`)
- [ ] No `console.log` in production code (only `console.warn` / `console.error`)

**Rationale:** A single developer codebase without tests becomes unmaintainable quickly.

---

### NFR-009: Code Quality — TypeScript Strict Mode

**Priority:** Must Have

**Description:**
The codebase shall compile without TypeScript errors in strict mode. Explicit `any` types are prohibited except where unavoidable with documented justification.

**Acceptance Criteria:**
- [ ] `npx tsc --noEmit` produces zero errors (excluding known pre-existing test file errors)
- [ ] ESLint passes with zero errors (`npm run lint`)
- [ ] No unused variables or imports (ESLint rule enforced)

**Rationale:** Type safety prevents a class of runtime errors that are especially costly in a single-developer project.

---

### NFR-010: SEO — Server-Side Rendering for Public Pages

**Priority:** Should Have

**Description:**
The landing page and marketplace pages shall be server-rendered to enable search engine indexing.

**Acceptance Criteria:**
- [ ] `/` (landing) and `/marketplace` render meaningful HTML on first request
- [ ] Meta tags (title, description, og:image) are set per page
- [ ] Google PageSpeed Insights score ≥ 70 for mobile

**Rationale:** Organic search traffic from "goal tracker" and "habit tracking" queries is a key acquisition channel.

---

## Epics

---

### EPIC-001: User Authentication & Profile Management

**Description:**
Deliver secure user registration, authentication, profile editing, and automatic Clerk data synchronization so every user has a persistent, up-to-date identity in the system.

**Functional Requirements:**
- FR-001, FR-002, FR-003, FR-004

**Story Count Estimate:** 4–6 stories

**Priority:** Must Have

**Business Value:**
Foundation for all other features. Without reliable auth and profiles, no personalized data can be trusted.

---

### EPIC-002: Goal & Task Hierarchy Management

**Description:**
Deliver the full goal-task-substep CRUD workflow including phases, notes, and cost tracking, enabling users to structure any personal goal at any level of granularity.

**Functional Requirements:**
- FR-005, FR-006, FR-007, FR-008, FR-009, FR-012, FR-013, FR-014, FR-018, FR-019

**Story Count Estimate:** 8–12 stories

**Priority:** Must Have

**Business Value:**
Core value proposition of the product. Users cannot track goals without this epic.

---

### EPIC-003: Task Status & Kanban Board

**Description:**
Replace the boolean completion model with a three-state status system and deliver a full Kanban board with drill-down, drag-and-drop, and filters, enabling visual task management.

**Functional Requirements:**
- FR-015, FR-016, FR-017, FR-019, FR-020, FR-041, FR-042, FR-043, FR-044

**Story Count Estimate:** 8–10 stories

**Priority:** Must Have

**Business Value:**
The Kanban board is the primary power-user interface. The status system underpins streaks and analytics.

---

### EPIC-004: Streak Tracking & Momentum Engine

**Description:**
Deliver a reliable, timezone-aware streak engine that records activity across all completion paths, calculates streaks correctly, and celebrates milestones.

**Functional Requirements:**
- FR-021, FR-022, FR-023, FR-024, FR-025

**Story Count Estimate:** 4–6 stories

**Priority:** Must Have

**Business Value:**
Streaks are the primary retention mechanic. Inaccurate streaks destroy trust and motivation.

---

### EPIC-005: AI Agent & Chat Interface

**Description:**
Deliver the embedded Claude-powered chat interface with full CRUD access to the user's goal graph via 23+ MCP tools, with streaming responses, rate limiting, and ownership verification.

**Functional Requirements:**
- FR-026, FR-027, FR-028, FR-029, FR-030, FR-050

**Story Count Estimate:** 6–8 stories

**Priority:** Must Have

**Business Value:**
The AI agent is the primary differentiator. It lowers the barrier to creating and managing complex goal structures.

---

### EPIC-006: Social Activity Feed & Tracking

**Description:**
Deliver comprehensive activity logging across all system mutations with before/after diffs, and a social feed that surfaces friend activity in a readable, filterable timeline.

**Functional Requirements:**
- FR-031, FR-032, FR-033, FR-035

**Story Count Estimate:** 6–8 stories

**Priority:** Must Have

**Business Value:**
Social features drive retention through accountability and network effects.

---

### EPIC-007: Friends & Social Graph

**Description:**
Deliver the friend connection system including search, request, accept/decline, and remove — the social graph that powers the feed.

**Functional Requirements:**
- FR-036

**Story Count Estimate:** 3–5 stories

**Priority:** Must Have

**Business Value:**
Without friends, the social feed has no content and no accountability benefit.

---

### EPIC-008: Template Marketplace

**Description:**
Deliver the template marketplace where users can browse, search, fork, and publish goal templates, with creator attribution and visibility control.

**Functional Requirements:**
- FR-010, FR-011, FR-037, FR-038, FR-039, FR-040

**Story Count Estimate:** 5–7 stories

**Priority:** Should Have

**Business Value:**
Templates lower the onboarding barrier and create a community flywheel. A thriving marketplace drives organic acquisition.

---

### EPIC-009: Email Notifications

**Description:**
Deliver transactional email notifications for key events (welcome, goal creation, streak milestones) with per-type and master toggle preferences.

**Functional Requirements:**
- FR-045, FR-046, FR-047

**Story Count Estimate:** 3–4 stories

**Priority:** Should Have

**Business Value:**
Email notifications re-engage churned users and celebrate milestones, directly improving retention.

---

### EPIC-010: Feed Visibility & Privacy Controls

**Description:**
Deliver per-category feed visibility preferences so users control which activity categories appear in their friends' feed, with a settings panel on the profile page.

**Functional Requirements:**
- FR-034

**Story Count Estimate:** 2–4 stories

**Priority:** Should Have

**Business Value:**
Privacy controls build trust and ensure users feel safe sharing progress without oversharing.

---

### EPIC-011: Landing Page & Mobile Experience

**Description:**
Deliver the public landing page for unauthenticated users and the mobile stats FAB with bottom sheet, ensuring the product is presentable publicly and fully functional on mobile.

**Functional Requirements:**
- FR-048, FR-049

**Story Count Estimate:** 3–4 stories

**Priority:** Must Have (landing) / Should Have (FAB)

**Business Value:**
The landing page is the top-of-funnel. Without it, the product cannot be shared publicly or acquire organic users.

---

## User Stories (High-Level)

Detailed user stories will be created during sprint planning (Phase 4). Below are representative examples per epic.

**EPIC-001:** As a new user, I want to sign up with my Google account so that I can start tracking goals immediately without a separate password.

**EPIC-002:** As a goal-setter, I want to break my goal into phases and tasks so that I can see exactly what to do each day.

**EPIC-003:** As a power user, I want to see all my tasks in a Kanban board and drag them between status columns so that I can manage my workload visually.

**EPIC-004:** As a motivated user, I want to see my streak count every day so that I'm motivated to keep my momentum going.

**EPIC-005:** As a user, I want to ask the AI to create a "Learn Spanish in 6 months" goal with tasks so that I can start immediately without planning from scratch.

**EPIC-006:** As a user, I want to see when my friends complete tasks so that I feel accountable and inspired by their progress.

**EPIC-007:** As a user, I want to add friends by username so that I can share my progress with the people I care about.

**EPIC-008:** As a new user, I want to browse and fork a "Build a Startup in 90 Days" template so that I don't have to plan everything from scratch.

**EPIC-009:** As a user, I want to receive an email when I hit a 7-day streak so that my achievement is celebrated.

**EPIC-010:** As a private user, I want to hide my cost tracking from my friends' feed so that my financial details stay private.

**EPIC-011:** As a potential user, I want to see a clear landing page explaining how Journey Tracker works so that I understand the value before signing up.

---

## User Personas

**Persona 1: The Motivated Professional (Primary)**
- Age: 28–40, knowledge worker
- Goals: Career advancement, side projects, fitness, skill-building
- Tech comfort: High
- Pain: Sets goals enthusiastically, loses momentum after 2–3 weeks
- Motivation: Streaks, visible progress, peer accountability

**Persona 2: The Template Creator (Secondary)**
- Age: 25–45, experienced goal achiever
- Goals: Help others by sharing proven goal structures
- Motivation: Community recognition, altruism

**Persona 3: The Accountability Partner (Secondary)**
- Age: Any, friend of a primary user
- Goals: Support a friend; may become a primary user
- Entry: Invited via friend system

---

## User Flows

**Flow 1: First Goal Creation (Critical)**
Sign up → Land on empty dashboard → AI suggests creating first goal → User asks AI to create goal → Goal appears with tasks → User completes first task → Streak starts

**Flow 2: Daily Check-in (Retention)**
Open app → See dashboard with active goals → Navigate to goal → Mark 1–2 tasks as `in_progress` or `completed` → Streak increments → See feed with friend activity → Close app

**Flow 3: Template Discovery (Acquisition)**
Visit `/marketplace` (unauthenticated) → Browse templates → Click "Use Template" → Prompted to sign up → After sign-up, template forked to their account → Goal ready with pre-built task structure

---

## Dependencies

### Internal Dependencies
- `Goal.tasks` JSON field: All task/substep mutations are read-modify-write on a single BSON field; complex queries on tasks require fetching the full goal
- RTK Query cache: UI freshness depends on `invalidatesTags` being called after every write operation
- Shared streak utility (`src/lib/streaks/updateStreak.ts`): All completion paths must import this function; do not inline streak logic anywhere

### External Dependencies
- **Clerk** (auth): SLA changes would directly impact availability; no self-hosted fallback
- **MongoDB Atlas** (database): Must be M10+ for production; free tier not suitable for concurrent users
- **Vercel** (hosting): 120-second function timeout constrains AI agent conversation length
- **Anthropic Claude API** (AI): Rate limits and pricing directly affect agent usability and cost
- **Resend / SMTP** (email): Transactional email provider for notification delivery

---

## Assumptions

- Users have access to a modern browser (Chrome, Firefox, Safari, Edge — last 2 major versions)
- Users provide an accurate timezone; incorrect timezone results in incorrect streak dates
- MongoDB Atlas free/shared tier for development; M10+ required before public launch
- Clerk SDK caches user data server-side, so per-request Clerk sync adds < 50ms overhead
- The `Goal.tasks` JSON field is sufficient for current scale; migration to normalized tables deferred to post-launch

---

## Out of Scope

- Native mobile app (iOS / Android)
- Real-time collaborative goal editing (multi-user on same goal simultaneously)
- Third-party integrations (Google Calendar, Notion, Strava, Zapier)
- Public goal profile URLs (shareable links to individual user goals)
- Paid subscription / billing system
- Advanced AI features (proactive push suggestions, personalized goal recommendations based on ML)
- Offline mode / Progressive Web App (PWA)

---

## Open Questions

1. **Streak-at-risk timing**: What exact time (user-local) should the streak reminder be sent? (Default: 8pm — needs confirmation)
2. **Template moderation**: What happens when a public template contains inappropriate content? Is there a reporting/moderation flow?
3. **Friend discovery**: Should users be able to find friends by email, username, or both? What privacy controls govern discoverability?
4. **AI model selection**: Is Claude Sonnet 4.6 the intended model for all users, or should power users get access to Opus?
5. **Data retention**: How long are `ActivityLog` entries retained? Is there a pruning policy?

---

## Approval & Sign-off

### Stakeholders

- **Alonsooteroseminario (Owner)** — High influence. Product vision and engineering lead.
- **Beta Users** — Medium influence. Feedback shapes feature priority.

### Approval Status

- [ ] Product Owner
- [ ] Engineering Lead
- [ ] QA Lead

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-20 | Alonsooteroseminario | Initial PRD |

---

## Next Steps

### Phase 3: Architecture

Run `/bmad:architecture` to create system architecture based on these requirements.

The architecture will address:
- All functional requirements (FRs)
- All non-functional requirements (NFRs)
- Technical stack decisions
- Data models and APIs
- System components

### Phase 4: Sprint Planning

After architecture is complete, run `/bmad:sprint-planning` to:
- Break epics into detailed user stories
- Estimate story complexity
- Plan sprint iterations
- Begin implementation

---

**This document was created using BMAD Method v6 - Phase 2 (Planning)**

*To continue: Run `/bmad:workflow-status` to see your progress and next recommended workflow.*

---

## Appendix A: Requirements Traceability Matrix

| Epic ID | Epic Name | Functional Requirements | Story Count (Est.) |
|---------|-----------|-------------------------|-------------------|
| EPIC-001 | User Auth & Profile | FR-001, FR-002, FR-003, FR-004 | 4–6 |
| EPIC-002 | Goal & Task Hierarchy | FR-005, FR-006, FR-007, FR-008, FR-009, FR-012, FR-013, FR-014, FR-018, FR-019 | 8–12 |
| EPIC-003 | Task Status & Kanban | FR-015, FR-016, FR-017, FR-019, FR-020, FR-041, FR-042, FR-043, FR-044 | 8–10 |
| EPIC-004 | Streak Tracking | FR-021, FR-022, FR-023, FR-024, FR-025 | 4–6 |
| EPIC-005 | AI Agent & Chat | FR-026, FR-027, FR-028, FR-029, FR-030, FR-050 | 6–8 |
| EPIC-006 | Social Feed & Tracking | FR-031, FR-032, FR-033, FR-035 | 6–8 |
| EPIC-007 | Friends & Social Graph | FR-036 | 3–5 |
| EPIC-008 | Template Marketplace | FR-010, FR-011, FR-037, FR-038, FR-039, FR-040 | 5–7 |
| EPIC-009 | Email Notifications | FR-045, FR-046, FR-047 | 3–4 |
| EPIC-010 | Feed Visibility Controls | FR-034 | 2–4 |
| EPIC-011 | Landing Page & Mobile | FR-048, FR-049 | 3–4 |
| **TOTAL** | | **50 FRs** | **52–74 stories** |

---

## Appendix B: Prioritization Details

### Functional Requirements

| Priority | Count | FRs |
|----------|-------|-----|
| Must Have | 24 | FR-001–008, FR-013–015, FR-020–022, FR-026–028, FR-030–032, FR-036–038, FR-041–042, FR-048 |
| Should Have | 21 | FR-009–012, FR-016–019, FR-023–024, FR-029, FR-034–035, FR-039–040, FR-043–047, FR-049 |
| Could Have | 5 | FR-025, FR-033, FR-050 |

### Non-Functional Requirements

| Priority | Count | NFRs |
|----------|-------|------|
| Must Have | 7 | NFR-001, NFR-002, NFR-004, NFR-005, NFR-007, NFR-008, NFR-009 |
| Should Have | 3 | NFR-003, NFR-006, NFR-010 |
