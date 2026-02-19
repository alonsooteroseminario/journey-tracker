# Design: Kanban Board, Comprehensive Feed, Feed Visibility

**Date:** 2026-02-18
**Status:** Approved

## Overview

Three interconnected features for Journey Tracker:

1. **Status Field + Kanban Board** — Replace boolean `completed` with explicit `status` enum; new `/board` page with 3-column kanban and drill-down levels
2. **Comprehensive Feed / Activity Tracking** — Track every user mutation with before/after diffs; create feed items for all actions
3. **Feed Visibility Configuration** — Per-category toggle settings controlling which actions appear in the social feed

---

## Feature 1: Status Field + Kanban Board

### Data Model Changes

Add `status` field to `Task` and `Substep` types:

```typescript
status: 'not_started' | 'in_progress' | 'completed'
```

- Replace the boolean `completed` with this enum throughout the codebase
- Keep `completedAt` — set when status transitions to `'completed'`, cleared otherwise
- Add `startedAt?: string` — set when status transitions to `'in_progress'`
- Existing `dueDate` on Substep already exists in the type definition
- **Migration**: `completed: true` → `'completed'`, `completed: false` → `'not_started'`

### Kanban Board Page (`/board`)

- New top-level route in main navigation (between Home and Feed)
- Three columns: **Not Started** | **In Progress** | **Done**
- Default view: Goal-level cards (title, icon, progress %, task count per status)
- Drill-down: Click goal → Tasks as cards (breadcrumb: Board > Goal Name)
- Drill-down deeper: Click task → Substeps as cards (breadcrumb: Board > Goal > Task)
- Drag-and-drop between columns using `@dnd-kit` (already in project)
- Dragging a card updates its `status` field via API

### Filters

- Date range (by `dueDate`, `startDate`, `createdAt`)
- Priority (low/medium/high/critical) — tasks/substeps only
- Goal filter — when viewing tasks, filter by specific goal
- Search by title

---

## Feature 2: Comprehensive Feed / Activity Tracking

### Problem

Only `goal_created` and `streak_milestone` generate feed items. Most mutations are untracked in the feed.

### Solution: Two-Layer Tracking

1. **ActivityLog** (internal) — Every mutation creates an entry with before/after diff metadata
2. **FeedItem** (social) — Controlled by user's FeedPreferences

### New Activity Types

| Action | ActivityLog Type | FeedItem? |
|--------|-----------------|-----------|
| Goal created | `goal_created` | Yes |
| Goal updated | `goal_updated` | Yes |
| Goal deleted | `goal_deleted` | Yes |
| Task created | `task_created` | Yes |
| Task updated | `task_updated` | Yes |
| Task status changed | `task_status_changed` | Yes |
| Task deleted | `task_deleted` | Yes |
| Substep created | `substep_created` | Yes |
| Substep updated | `substep_updated` | Yes |
| Substep status changed | `substep_status_changed` | Yes |
| Substep deleted | `substep_deleted` | Yes |
| Cost updated | `cost_updated` | Yes |
| Note updated | `note_updated` | Yes |
| Profile updated | `profile_updated` | Configurable |
| Friend changed | `friend_changed` | Configurable |
| Template action | `template_action` | Yes |

### Before/After Diff Metadata

```json
{
  "field": "title",
  "oldValue": "Buy materials",
  "newValue": "Purchase building materials",
  "goalTitle": "Build House",
  "taskTitle": "Phase 1 - Foundation"
}
```

### Implementation

- Shared `createActivityAndFeed()` utility used by both API routes and MCP tools
- Replace console-only `auditLogger` with persistent ActivityLog entries
- Feed UI: new filter tabs, inline diff display, grouping of rapid successive changes

---

## Feature 3: Feed Visibility Configuration

### Data Model

```prisma
model FeedPreferences {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  userId          String   @unique @db.ObjectId
  user            User     @relation(fields: [userId], references: [id])
  goalEvents      Boolean  @default(true)
  taskEvents      Boolean  @default(true)
  substepEvents   Boolean  @default(true)
  costEvents      Boolean  @default(true)
  noteEvents      Boolean  @default(true)
  profileEvents   Boolean  @default(true)
  socialEvents    Boolean  @default(true)
  streakEvents    Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Behavior

- Settings panel on Profile page (`/profile`) with per-category toggles
- All categories ON by default
- When category is OFF: ActivityLog entry still created (personal analytics), but no FeedItem (invisible to friends)
- `createActivityAndFeed()` checks FeedPreferences before creating FeedItem

### Categories

| Category | Controls | Default |
|----------|----------|---------|
| Goal Events | created, updated, deleted | ON |
| Task Events | created, updated, deleted, status changed | ON |
| Substep Events | created, updated, deleted, status changed | ON |
| Cost & Budget | cost additions, budget changes | ON |
| Notes | note additions and updates | ON |
| Profile Changes | bio, location updates | ON |
| Social Activity | friends, templates | ON |
| Streak Milestones | streak milestones | ON |
