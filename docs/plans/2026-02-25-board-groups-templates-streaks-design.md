# Design: Board UX, Goal Groups, Template CRUD, Streak Tiers

**Date:** 2026-02-25
**Status:** Approved

## Overview

11 features organized into 5 parallel work streams:

1. **Board UX Improvements** — Filter substeps, parent breadcrumbs, drag icon, collapse tabs, done-today filter
2. **Goal Groups** — User-created groups with single-group-per-goal model
3. **Template & Marketplace Full CRUD** — Add/edit/remove tasks, phases, substeps within templates
4. **Board Archive** — Manual archiving of completed items with toggle visibility
5. **Gold/Silver/Bronze Streak Tiers** — Per-goal streaks with tiered badges

---

## Feature Group A: Board UX Improvements

### A1: Filter substeps in In Progress column

**Files:** `src/components/kanban/KanbanCard.tsx`

When a card is in the "In Progress" column, the substep list inside task cards only shows substeps where `status !== 'completed'`. This applies to both Goal-level cards (showing tasks) and Task-level cards (showing substeps).

**Logic:**
```typescript
// In KanbanCard, when rendering substep/task lists:
const visibleItems = columnStatus === 'in_progress'
  ? items.filter(item => item.status !== 'completed')
  : items;
```

The column status must be passed as a prop from KanbanColumn to KanbanCard.

### A2: Show goal parent name in Tasks tab cards

**Files:** `src/components/kanban/KanbanCard.tsx`

When `level === "tasks"`, each card already carries `_goalId` and `_goalTitle` metadata (from the flatMap in KanbanBoard). Display a breadcrumb badge above the task title:

```
📎 Goal Name
Task Title
```

Style: `text-[10px] text-gray-400 truncate` with goal icon if available.

### A3: Show parent names in Substeps tab cards

**Files:** `src/components/kanban/KanbanCard.tsx`

When `level === "substeps"`, each card carries `_goalId`, `_goalTitle`, `_taskId`, `_taskTitle`. Display:

```
📎 Goal Name > Task Name
Substep Title
```

### A4: Move drag icon to top-left corner

**Files:** `src/components/kanban/KanbanCard.tsx`

Reposition the 6-dot drag handle from its current position to the top-left corner of the card. Use absolute positioning:

```css
position: absolute; top: 4px; left: 4px;
```

Add `pl-6` padding to the card content to avoid overlap.

### A5: Hide tabs when GoalCard is collapsed

**Files:** `src/components/GoalCard.tsx`

Wrap the tab bar and tab content in a conditional render:

```tsx
{isExpanded && (
  <>
    {/* Tab bar */}
    {/* Tab content */}
  </>
)}
```

Only the header (icon, title, progress, expand/share/delete buttons) shows when collapsed.

### A6: "Done Today" quick filter

**Files:** `src/components/kanban/KanbanFilters.tsx`, `src/components/kanban/KanbanBoard.tsx`

Add a "Done Today" toggle chip to the filter bar. When active:
- Filter to items where `completedAt` date matches today (YYYY-MM-DD comparison)
- Works across all view levels
- Mutually exclusive with date filter (activating Done Today clears date filter)

### A7: _goalTitle and _taskTitle metadata

**Files:** `src/components/kanban/KanbanBoard.tsx`

Ensure the flatMap transformations include parent names:
- Tasks view: `{ ...task, _goalId: goal.id, _goalTitle: goal.title, _goalIcon: goal.icon }`
- Substeps view: `{ ...substep, _goalId, _goalTitle, _goalIcon, _taskId, _taskTitle }`

---

## Feature Group B: Goal Groups

### Data Model

```prisma
model GoalGroup {
  id     String @id @default(auto()) @map("_id") @db.ObjectId
  userId String @db.ObjectId
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  name  String
  color String  @default("#6366f1") // indigo-500
  icon  String? // optional emoji
  order Int     @default(0)

  goals Goal[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("goal_groups")
}
```

**Goal model addition:**
```prisma
groupId String? @db.ObjectId
group   GoalGroup? @relation(fields: [groupId], references: [id])
```

### API Routes

- `GET /api/groups` — list user's groups
- `POST /api/groups` — create group (name, color, icon)
- `PATCH /api/groups/[id]` — update group
- `DELETE /api/groups/[id]` — delete group (sets goals' groupId to null)
- `PATCH /api/goals/[id]` — assign groupId to goal (extend existing endpoint)

### UI Components

- `GoalGroupManager` — modal/dropdown for CRUD on groups (color picker, name, icon)
- `GoalGroupFilter` — filter chips on Home page and Board page
- `GoalGroupSelector` — dropdown on GoalCard header to assign group
- Groups appear as colored dots/chips next to goal titles

### RTK Query

- New slice or extend `goalsSlice` with group endpoints
- `useGetGroupsQuery()`, `useCreateGroupMutation()`, `useUpdateGroupMutation()`, `useDeleteGroupMutation()`

---

## Feature Group C: Template & Marketplace Full CRUD

### API Changes

Extend `PATCH /api/templates/[templateId]` to accept structural changes:

```typescript
// New accepted fields in PATCH body:
{
  tasks?: TaskUpdate[];      // Full replacement of tasks array
  phases?: PhaseUpdate[];    // Full replacement of phases array
  resources?: ResourceUpdate[]; // Full replacement
  timeline?: TimelineUpdate;
}

// Individual operations via action field:
{
  action: 'addTask' | 'updateTask' | 'removeTask' |
          'addPhase' | 'updatePhase' | 'removePhase' |
          'addSubstep' | 'updateSubstep' | 'removeSubstep',
  payload: { ... }
}
```

### UI Components

- `TemplateEditor` — Main editing interface for template structure
  - Task list with inline editing (title, description, priority)
  - "Add Task" button at bottom
  - Delete button per task
  - Substep list per task with same CRUD
  - Phase management section
  - Resource management section
- `TemplateTaskEditor` — Inline task editor component
- `TemplateSubstepEditor` — Inline substep editor component

### RTK Query

Extend `useUpdateTemplateMutation()` to send action-based updates.

---

## Feature Group D: Board Archive

### Data Model Change

Add to Task and Substep types (in `src/types/index.ts`):

```typescript
isArchived?: boolean; // default false
archivedAt?: string;  // ISO date when archived
```

### Board Integration

- **KanbanCard**: Add "Archive" button (📦 icon) on completed items
- **KanbanBoard**: Filter out `isArchived === true` by default
- **KanbanFilters**: Add "Show Archived" toggle
- **Visual**: Archived items shown with `opacity-60` and archive badge

### API

Archive/unarchive is a status update via existing `updateTask`/`updateSubstep` mutations (setting `isArchived` field).

---

## Feature Group E: Gold/Silver/Bronze Streak Tiers

### Data Model

```prisma
model GoalStreak {
  id     String @id @default(auto()) @map("_id") @db.ObjectId
  goalId String @db.ObjectId
  userId String @db.ObjectId
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  currentStreak    Int       @default(0)
  longestStreak    Int       @default(0)
  lastCompletionDate DateTime?
  streakHistory    String[]  // YYYY-MM-DD dates with completions

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([goalId, userId])
  @@map("goal_streaks")
}
```

### Tier Computation (only completions count)

- **Bronze** 🥉: `currentStreak >= 1` on any single goal (completed something today on that goal)
- **Silver** 🥈: `currentStreak >= 7` on a single goal (7+ consecutive days of completions)
- **Gold** 🥇: ALL goals have `currentStreak >= 1` today (daily activity across every goal)

Tier is computed, not stored. Calculated from GoalStreak records at read time.

### Streak Update Logic

When a task/substep status changes to `'completed'`:
1. Find or create `GoalStreak` for that goal+user
2. If `lastCompletionDate` is yesterday → increment `currentStreak`
3. If `lastCompletionDate` is today → no change (already counted today)
4. If `lastCompletionDate` is older → reset `currentStreak` to 1
5. Update `longestStreak` if current > longest
6. Set `lastCompletionDate` to today
7. Push today's date to `streakHistory`

### API Routes

- `GET /api/streaks/goals` — get all per-goal streaks for current user
- `GET /api/streaks/goals/[goalId]` — get streak for specific goal
- `GET /api/streaks/tiers` — get computed tier status (bronze/silver/gold counts)

### UI

- **GoalCard**: Show streak badge (🥉/🥈/🥇) next to title when active
- **KanbanCard**: Show streak badge on goal-level cards
- **Streak Dashboard**: Widget showing per-goal streaks with tier badges
- **Feed**: Milestone feed items when achieving silver/gold tiers

---

## Parallel Development Strategy

| Branch | Features | Key Files |
|--------|----------|-----------|
| `feat/board-ux` | A1-A7 | KanbanCard, KanbanBoard, KanbanFilters, GoalCard |
| `feat/goal-groups` | B | schema, GoalGroup API, GoalGroupManager, GoalGroupFilter |
| `feat/template-crud` | C | templates API, TemplateEditor, templatesSlice |
| `feat/board-archive` | D | types, KanbanCard, KanbanBoard, KanbanFilters |
| `feat/streak-tiers` | E | schema, GoalStreak API, streak logic, GoalCard badges |

Branches are independent and can be developed in parallel. Merge order: board-ux first (lowest risk), then archive, groups, template-crud, streak-tiers.
