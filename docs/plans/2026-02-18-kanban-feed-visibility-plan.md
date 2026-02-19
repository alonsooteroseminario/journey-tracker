# Kanban Board + Comprehensive Feed + Feed Visibility — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a status enum to tasks/substeps, build a kanban board page, track every user action in the feed with before/after diffs, and let users control feed visibility via per-category toggles.

**Architecture:** Replace boolean `completed` with `status: 'not_started' | 'in_progress' | 'completed'` across the entire stack (types, MCP tools, API routes, hooks, components). Build a shared `createActivityAndFeed()` utility that all mutation points call. Add a `FeedPreferences` Prisma model. Build a new `/board` page with 3-column kanban using `@dnd-kit`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma + MongoDB, Redux Toolkit (RTK Query), @dnd-kit, Tailwind CSS, Vitest + happy-dom

---

## Step 1: Data Model Foundation — Types, Prisma Schema, Migration

> **Scope:** Update TypeScript types, Prisma schema, and create a data migration script. This is the foundation everything else depends on.

### Task 1.1: Add `status` field to TypeScript `Task` and `Substep` interfaces

**Files:**
- Modify: `src/types/index.ts` (lines 1-34)

**What to do:**

1. Add a `TaskStatus` type alias:
```typescript
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';
```

2. In the `Substep` interface (line 2-13):
   - Replace `completed: boolean` (line 6) with `status: TaskStatus`
   - Keep `completedAt?: string` (line 7) — set when status → 'completed'
   - Add `startedAt?: string` — set when status → 'in_progress'

3. In the `Task` interface (line 15-34):
   - Replace `completed: boolean` (line 19) with `status: TaskStatus`
   - Keep `completedAt?: string` (line 20) — set when status → 'completed'
   - Add `startedAt?: string` — set when status → 'in_progress' (field `startDate` at line 29 already exists but is semantic "when task was started in real life", so add a new `startedAt` that tracks the status transition timestamp)

4. Add a helper type `TaskStatusInfo`:
```typescript
export interface TaskStatusInfo {
  label: string;
  color: string;  // Tailwind color class
  icon: string;   // Emoji
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, TaskStatusInfo> = {
  not_started: { label: 'Not Started', color: 'gray', icon: '⏳' },
  in_progress: { label: 'In Progress', color: 'blue', icon: '🔄' },
  completed: { label: 'Completed', color: 'green', icon: '✅' },
};
```

### Task 1.2: Expand `ActivityLogEntry` and `FeedItem` types

**Files:**
- Modify: `src/types/index.ts` (lines 130-139, 287-301)

**What to do:**

1. Expand `ActivityLogEntry.type` union (line 133) to include all new types:
```typescript
type:
  | 'goal_created' | 'goal_updated' | 'goal_deleted'
  | 'task_created' | 'task_updated' | 'task_deleted' | 'task_status_changed'
  | 'substep_created' | 'substep_updated' | 'substep_deleted' | 'substep_status_changed'
  | 'cost_updated' | 'note_updated'
  | 'profile_updated' | 'friend_changed' | 'template_action'
  // Legacy types kept for backwards compatibility:
  | 'task_completed' | 'task_uncompleted' | 'task_started'
  | 'substep_completed' | 'substep_uncompleted'
  | 'cost_added' | 'note_added';
```

2. Expand `FeedItem.type` union (line 292) to include all new types:
```typescript
type:
  | 'streak_milestone' | 'streak_at_risk'
  | 'goal_created' | 'goal_updated' | 'goal_deleted'
  | 'task_created' | 'task_updated' | 'task_deleted' | 'task_status_changed'
  | 'substep_created' | 'substep_updated' | 'substep_deleted' | 'substep_status_changed'
  | 'cost_updated' | 'note_updated'
  | 'profile_updated' | 'friend_changed' | 'template_action'
  | 'goal_shared' | 'goal_published' | 'goal_forked';
```

### Task 1.3: Add `FeedPreferences` type

**Files:**
- Modify: `src/types/index.ts`

**What to do:**

Add after `EmailPreferences` (after line 284):
```typescript
export interface FeedPreferences {
  id: string;
  goalEvents: boolean;
  taskEvents: boolean;
  substepEvents: boolean;
  costEvents: boolean;
  noteEvents: boolean;
  profileEvents: boolean;
  socialEvents: boolean;
  streakEvents: boolean;
}

export type FeedPreferenceCategory = keyof Omit<FeedPreferences, 'id'>;
```

### Task 1.4: Add `FeedPreferences` model to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma` (add after EmailPreferences model, line ~199)

**What to do:**

1. Add the `FeedPreferences` model:
```prisma
// ============== Feed Preferences Model ==============
model FeedPreferences {
  id     String @id @default(auto()) @map("_id") @db.ObjectId
  userId String @unique @db.ObjectId
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  goalEvents    Boolean @default(true)
  taskEvents    Boolean @default(true)
  substepEvents Boolean @default(true)
  costEvents    Boolean @default(true)
  noteEvents    Boolean @default(true)
  profileEvents Boolean @default(true)
  socialEvents  Boolean @default(true)
  streakEvents  Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("feed_preferences")
}
```

2. Add relation to `User` model (after line 31 in schema.prisma, near `emailPreferences`):
```prisma
feedPreferences  FeedPreferences?
```

3. Run `npx prisma generate` to regenerate the client.

### Task 1.5: Create data migration script for existing tasks

**Files:**
- Create: `src/scripts/migrate-task-status.ts`

**What to do:**

Write a script that:
1. Fetches all goals from the database
2. For each goal, iterates through `goal.tasks` (JSON array)
3. For each task: if `completed === true` → set `status: 'completed'`, else `status: 'not_started'`
4. For each substep within each task: same logic
5. Remove the `completed` boolean field from tasks and substeps (or keep for backwards compat initially)
6. Write back the updated tasks JSON

```typescript
// src/scripts/migrate-task-status.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateTaskStatus() {
  const goals = await prisma.goal.findMany();
  let migratedGoals = 0;
  let migratedTasks = 0;
  let migratedSubsteps = 0;

  for (const goal of goals) {
    const tasks = (goal.tasks as any[]) || [];
    let changed = false;

    for (const task of tasks) {
      if (!task.status) {
        task.status = task.completed ? 'completed' : 'not_started';
        if (task.completed && !task.completedAt) {
          task.completedAt = goal.updatedAt?.toISOString();
        }
        changed = true;
        migratedTasks++;
      }

      if (task.substeps) {
        for (const substep of task.substeps) {
          if (!substep.status) {
            substep.status = substep.completed ? 'completed' : 'not_started';
            if (substep.completed && !substep.completedAt) {
              substep.completedAt = goal.updatedAt?.toISOString();
            }
            changed = true;
            migratedSubsteps++;
          }
        }
      }
    }

    if (changed) {
      await prisma.goal.update({
        where: { id: goal.id },
        data: { tasks: tasks as any },
      });
      migratedGoals++;
    }
  }

  console.log(`Migrated ${migratedGoals} goals, ${migratedTasks} tasks, ${migratedSubsteps} substeps`);
}

migrateTaskStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with: `npx tsx src/scripts/migrate-task-status.ts`

### Task 1.6: Commit Step 1

```bash
git add src/types/index.ts prisma/schema.prisma src/scripts/migrate-task-status.ts
git commit -m "feat: add TaskStatus enum, FeedPreferences model, and migration script"
```

---

## Step 2: Shared Activity & Feed Tracking Utility

> **Scope:** Create the `createActivityAndFeed()` utility that all mutation points will call. This is the centralized function for logging actions and creating feed items.

### Task 2.1: Create the activity tracking utility

**Files:**
- Create: `src/lib/activity/trackActivity.ts`

**What to do:**

Build a function that:
1. Always creates an `ActivityLog` entry (for personal analytics)
2. Checks the user's `FeedPreferences` to decide if a `FeedItem` should be created
3. Maps activity types to feed preference categories

```typescript
// src/lib/activity/trackActivity.ts
import { prisma } from '@/lib/prisma';

// Map activity types to feed preference categories
const ACTIVITY_TO_FEED_CATEGORY: Record<string, string> = {
  goal_created: 'goalEvents',
  goal_updated: 'goalEvents',
  goal_deleted: 'goalEvents',
  task_created: 'taskEvents',
  task_updated: 'taskEvents',
  task_deleted: 'taskEvents',
  task_status_changed: 'taskEvents',
  substep_created: 'substepEvents',
  substep_updated: 'substepEvents',
  substep_deleted: 'substepEvents',
  substep_status_changed: 'substepEvents',
  cost_updated: 'costEvents',
  note_updated: 'noteEvents',
  profile_updated: 'profileEvents',
  friend_changed: 'socialEvents',
  template_action: 'socialEvents',
  streak_milestone: 'streakEvents',
  streak_at_risk: 'streakEvents',
  goal_shared: 'socialEvents',
  goal_published: 'socialEvents',
  goal_forked: 'socialEvents',
};

interface TrackActivityParams {
  userId: string;
  type: string;
  action: string;            // Human-readable description
  goalId?: string;
  taskId?: string;
  substepId?: string;
  metadata?: Record<string, unknown>;  // Before/after diffs, etc.
  createFeedItem?: boolean;  // Override: force feed item creation (for streak milestones, etc.)
  feedContent?: string;      // Custom feed content (if different from action)
  feedVisibility?: 'friends' | 'public';
}

export async function trackActivity(params: TrackActivityParams): Promise<void> {
  const {
    userId,
    type,
    action,
    goalId,
    taskId,
    substepId,
    metadata,
    createFeedItem: forceCreateFeed,
    feedContent,
    feedVisibility = 'friends',
  } = params;

  // 1. Always create ActivityLog entry
  await prisma.activityLog.create({
    data: {
      userId,
      type,
      action,
      goalId: goalId || undefined,
      taskId: taskId || undefined,
      substepId: substepId || undefined,
      metadata: metadata || undefined,
    },
  });

  // 2. Check FeedPreferences to decide if FeedItem should be created
  const feedCategory = ACTIVITY_TO_FEED_CATEGORY[type];
  if (!feedCategory && !forceCreateFeed) return;

  let shouldCreateFeed = forceCreateFeed ?? true;

  if (feedCategory) {
    const feedPrefs = await prisma.feedPreferences.findUnique({
      where: { userId },
    });
    // If no preferences exist, default is all ON (create feed items)
    if (feedPrefs) {
      shouldCreateFeed = (feedPrefs as any)[feedCategory] ?? true;
    }
  }

  if (!shouldCreateFeed) return;

  // 3. Create FeedItem
  await prisma.feedItem.create({
    data: {
      userId,
      type,
      content: feedContent || action,
      metadata: metadata || undefined,
      visibility: feedVisibility,
    },
  });
}
```

### Task 2.2: Create diff utility for before/after tracking

**Files:**
- Create: `src/lib/activity/diffUtils.ts`

**What to do:**

```typescript
// src/lib/activity/diffUtils.ts

export interface FieldDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Compare two objects and return an array of changed fields.
 * Only compares top-level fields listed in `fields`.
 */
export function diffFields(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  fields: string[]
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  for (const field of fields) {
    const oldVal = oldObj[field];
    const newVal = newObj[field];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({ field, oldValue: oldVal, newValue: newVal });
    }
  }
  return diffs;
}

/**
 * Format diffs into a human-readable action string.
 */
export function formatDiffAction(
  entityType: string,
  entityName: string,
  diffs: FieldDiff[]
): string {
  if (diffs.length === 0) return `Updated ${entityType} "${entityName}"`;
  if (diffs.length === 1) {
    const d = diffs[0];
    return `Changed ${entityType} "${entityName}" ${d.field} from "${d.oldValue ?? '(empty)'}" to "${d.newValue}"`;
  }
  return `Updated ${diffs.length} fields on ${entityType} "${entityName}": ${diffs.map(d => d.field).join(', ')}`;
}
```

### Task 2.3: Create barrel export

**Files:**
- Create: `src/lib/activity/index.ts`

```typescript
export { trackActivity } from './trackActivity';
export { diffFields, formatDiffAction } from './diffUtils';
export type { FieldDiff } from './diffUtils';
```

### Task 2.4: Write tests for trackActivity and diffUtils

**Files:**
- Create: `src/lib/activity/__tests__/trackActivity.test.ts`
- Create: `src/lib/activity/__tests__/diffUtils.test.ts`

**What to test:**
- `diffFields`: correctly identifies changed fields, ignores unchanged fields, handles null/undefined
- `formatDiffAction`: generates correct human-readable strings for single and multiple diffs
- `trackActivity`: creates ActivityLog entry, checks FeedPreferences, creates/skips FeedItem based on prefs

### Task 2.5: Commit Step 2

```bash
git add src/lib/activity/
git commit -m "feat: add shared activity tracking utility with diff support"
```

---

## Step 3: Update MCP Tools for Status Field + Activity Tracking

> **Scope:** Update all MCP tools to use the new `status` field and call `trackActivity()` for comprehensive logging.

### Task 3.1: Update `completeTask.ts` → rename to status-based approach

**Files:**
- Modify: `src/lib/mcp/tools/completeTask.ts` (215 lines)

**What to do:**

1. Rename the tool to `update-task-status` (or keep `complete-task` for backwards compat but update the logic)
2. Change the input schema: accept `status: 'not_started' | 'in_progress' | 'completed'` instead of `completed: boolean`
3. Update the task mutation (lines 108-109):
   - Set `task.status = args.status`
   - Set `task.completedAt` when status → 'completed', clear otherwise
   - Set `task.startedAt` when status → 'in_progress'
4. Replace inline `prisma.activityLog.create()` (lines 118-126) with `trackActivity()` call:
```typescript
await trackActivity({
  userId,
  type: 'task_status_changed',
  action: `Changed task "${task.title}" status to ${args.status}`,
  goalId: args.goalId,
  taskId: args.taskId,
  metadata: {
    oldStatus: oldTask.status,
    newStatus: args.status,
    goalTitle: goal.title,
    taskTitle: task.title,
  },
});
```
5. Keep streak logic (only trigger on status → 'completed')
6. Keep feed item milestone logic (only on status → 'completed')

### Task 3.2: Update `completeSubstep.ts` → status-based

**Files:**
- Modify: `src/lib/mcp/tools/completeSubstep.ts` (166 lines)

**What to do:**
Same pattern as Task 3.1 but for substeps:
1. Accept `status` instead of `completed`
2. Update substep mutation (lines 120-123)
3. Replace inline ActivityLog creation (lines 131-143) with `trackActivity()` call

### Task 3.3: Add activity tracking to `createTask.ts`

**Files:**
- Modify: `src/lib/mcp/tools/createTask.ts` (150 lines)

**What to do:**
1. Change default from `completed: false` to `status: 'not_started'` (line 112)
2. After Prisma update (line 127), add:
```typescript
await trackActivity({
  userId,
  type: 'task_created',
  action: `Created task "${args.title}" in goal "${goal.title}"`,
  goalId: args.goalId,
  taskId: newTask.id,
  metadata: { goalTitle: goal.title, taskTitle: args.title },
});
```

### Task 3.4: Add activity tracking to `updateTask.ts`

**Files:**
- Modify: `src/lib/mcp/tools/updateTask.ts` (166 lines)

**What to do:**
1. Before updating, capture the old task state for diff
2. After update, compute diff and call `trackActivity()`:
```typescript
const diffs = diffFields(oldTask, updatedTask, ['title', 'description', 'priority', 'dueDate', 'notes']);
if (diffs.length > 0) {
  await trackActivity({
    userId,
    type: 'task_updated',
    action: formatDiffAction('task', updatedTask.title, diffs),
    goalId: args.goalId,
    taskId: args.taskId,
    metadata: { diffs, goalTitle: goal.title, taskTitle: updatedTask.title },
  });
}
```

### Task 3.5: Add activity tracking to `createGoal.ts`

**Files:**
- Modify: `src/lib/mcp/tools/createGoal.ts`

**What to do:**
Replace inline feed item creation with `trackActivity()` call. The existing feed item creation for 'goal_created' should move into `trackActivity()`.

### Task 3.6: Add activity tracking to `updateGoal.ts`, `deleteGoal.ts`, `addSubstep.ts`, `deleteSubstep.ts`, `deleteTask.ts`

**Files:**
- Modify: `src/lib/mcp/tools/updateGoal.ts`
- Modify: `src/lib/mcp/tools/deleteGoal.ts`
- Modify: `src/lib/mcp/tools/addSubstep.ts`
- Modify: `src/lib/mcp/tools/deleteSubstep.ts`
- Modify: `src/lib/mcp/tools/deleteTask.ts`

**What to do for each:**
Add `trackActivity()` call with appropriate type, action description, and before/after metadata. Pattern:
- `updateGoal` → type: `'goal_updated'`, diff the changed fields
- `deleteGoal` → type: `'goal_deleted'`, metadata includes goal title
- `addSubstep` → type: `'substep_created'`, metadata includes task/goal context
- `deleteSubstep` → type: `'substep_deleted'`
- `deleteTask` → type: `'task_deleted'`

### Task 3.7: Add activity tracking to `updateProfile.ts` and `removeFriend.ts`

**Files:**
- Modify: `src/lib/mcp/tools/updateProfile.ts`
- Modify: `src/lib/mcp/tools/removeFriend.ts`

**What to do:**
- `updateProfile` → type: `'profile_updated'`, diff changed profile fields
- `removeFriend` → type: `'friend_changed'`, metadata includes friend name

### Task 3.8: Update MCP tool input schemas

**Files:**
- Modify: `src/lib/mcp/tools/completeTask.ts` (toolDefinition.inputSchema)
- Modify: `src/lib/mcp/tools/completeSubstep.ts` (toolDefinition.inputSchema)

**What to do:**
Change the input schema from `completed: { type: 'boolean' }` to:
```typescript
status: {
  type: 'string',
  enum: ['not_started', 'in_progress', 'completed'],
  description: 'The new status for the task/substep',
}
```

### Task 3.9: Write tests for updated MCP tools

**Files:**
- Modify existing test files for each tool
- Verify `trackActivity` is called with correct parameters

### Task 3.10: Commit Step 3

```bash
git add src/lib/mcp/tools/ src/lib/activity/
git commit -m "feat: update all MCP tools for status field and comprehensive activity tracking"
```

---

## Step 4: Update API Routes for Status + Activity Tracking

> **Scope:** Update the REST API routes to use the new status field and add activity tracking to routes that currently have none.

### Task 4.1: Update Goals API routes

**Files:**
- Modify: `src/app/api/goals/route.ts` (117 lines) — POST handler
- Modify: `src/app/api/goals/[goalId]/route.ts` — PATCH and DELETE handlers

**What to do:**
1. In POST (create goal): Call `trackActivity({ type: 'goal_created', ... })` after creation
2. In PATCH (update goal): Capture old goal, compute diff, call `trackActivity({ type: 'goal_updated', ... })`
3. In DELETE: Call `trackActivity({ type: 'goal_deleted', ... })` before deletion (need goal data for metadata)

### Task 4.2: Update Task mutation in Goals API

**Files:**
- Modify: `src/app/api/goals/[goalId]/tasks/[taskId]/route.ts` (or wherever task PATCH lives)

**What to do:**
1. When task fields are updated via API, capture old values, compute diff
2. Call `trackActivity()` with appropriate type
3. Handle status changes specifically — if `status` field is being changed, use type `'task_status_changed'`

### Task 4.3: Update Feed API route

**Files:**
- Modify: `src/app/api/feed/route.ts` (172 lines)

**What to do:**
1. Expand the `createFeedItemSchema` validation (line 7-15) to accept all new feed item types
2. In GET handler: ensure the query handles all new types correctly
3. Add type-specific filtering support

### Task 4.4: Create FeedPreferences API route

**Files:**
- Create: `src/app/api/feed-preferences/route.ts`

**What to do:**
1. GET — Fetch user's FeedPreferences (create default if none exists)
2. PATCH — Update specific preference fields
3. Both endpoints require auth via `getCurrentUser()`

```typescript
// GET /api/feed-preferences
export async function GET() {
  const user = await getCurrentUser();
  let prefs = await prisma.feedPreferences.findUnique({ where: { userId: user.id } });
  if (!prefs) {
    prefs = await prisma.feedPreferences.create({ data: { userId: user.id } });
  }
  return NextResponse.json(prefs);
}

// PATCH /api/feed-preferences
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();
  const prefs = await prisma.feedPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...body },
    update: body,
  });
  return NextResponse.json(prefs);
}
```

### Task 4.5: Add activity tracking to remaining API routes

**Files:**
- Modify: `src/app/api/profile/route.ts` — PATCH handler
- Modify: `src/app/api/friends/route.ts` — POST handler (friend accept)
- Modify: `src/app/api/friends/[friendId]/route.ts` — DELETE handler
- Modify: `src/app/api/templates/route.ts` — POST handler
- Modify: `src/app/api/templates/[templateId]/fork/route.ts` — POST handler

**What to do:**
Add `trackActivity()` calls with appropriate types and metadata in each route.

### Task 4.6: Commit Step 4

```bash
git add src/app/api/ src/lib/activity/
git commit -m "feat: add activity tracking to all API routes, create feed-preferences endpoint"
```

---

## Step 5: Update Client-Side Hooks and Redux for Status Field

> **Scope:** Update the `useGoalsCRUD` hook, Redux slices, and any client-side logic that uses the boolean `completed` field.

### Task 5.1: Update `useGoalsCRUD` hook

**Files:**
- Modify: `src/hooks/useGoalsCRUD.ts` (533 lines)

**What to do:**

1. Replace `toggleTask` function (lines 181-216) with `updateTaskStatus`:
```typescript
const updateTaskStatus = useCallback((goalId: string, taskId: string, newStatus: TaskStatus) => {
  // ... update task.status instead of task.completed
  // Set completedAt when status → 'completed'
  // Set startedAt when status → 'in_progress'
  // Clear completedAt when status moves away from 'completed'
}, []);
```

2. Replace `toggleSubstep` function (lines 287-325) with `updateSubstepStatus`:
   Same pattern for substeps.

3. Update `getProgress` (lines 462-484):
   - Change `task.completed` checks to `task.status === 'completed'`
   - Change `substep.completed` checks to `substep.status === 'completed'`

4. Update `getTotalProgress` (lines 486-505): same changes.

5. Keep backward-compat: if any callers still use `toggleTask(goalId, taskId)`, create a wrapper that maps toggle → status change.

### Task 5.2: Update Redux goal slice

**Files:**
- Modify: `src/store/slices/goalsSlice.ts`

**What to do:**
1. Update any reducers that reference `task.completed` to use `task.status`
2. Update RTK Query tag invalidation if needed

### Task 5.3: Update Feed Redux slice

**Files:**
- Modify: `src/store/slices/feedSlice.ts` (119 lines)

**What to do:**
1. Add `feedPreferencesApi` endpoints:
   - `getFeedPreferences` — GET `/api/feed-preferences`
   - `updateFeedPreferences` — PATCH `/api/feed-preferences`
2. Update filter types to include all new feed item types
3. Update `FeedUIState.filters.type` to support new types

### Task 5.4: Update analytics hooks

**Files:**
- Modify: `src/hooks/useGoalAnalytics.ts` (or wherever analytics are computed)

**What to do:**
Update any completion calculations from `task.completed` to `task.status === 'completed'`. Also add new analytics:
- Count of tasks by status (not_started, in_progress, completed)
- In-progress percentage

### Task 5.5: Commit Step 5

```bash
git add src/hooks/ src/store/
git commit -m "feat: update client hooks and Redux for status-based task tracking"
```

---

## Step 6: Update Existing UI Components for Status Field

> **Scope:** Update all components that display or interact with task/substep completion to use the new `status` field.

### Task 6.1: Update `TaskMiniCard` component

**Files:**
- Modify: `src/components/TaskMiniCard.tsx` (448 lines)

**What to do:**

1. Replace the checkbox button (lines 166-183) with a status selector:
   - Instead of a single checkbox that toggles completed/not-completed, show a status dropdown or cycle button
   - Option A (recommended): Click cycles through: not_started → in_progress → completed → not_started
   - Show the status icon/color from `TASK_STATUS_CONFIG`
   - The `onToggle` prop becomes `onStatusChange: (taskId: string, newStatus: TaskStatus) => void`

2. Update visual styling:
   - `not_started`: gray border, no icon
   - `in_progress`: blue border, blue dot/spinner icon
   - `completed`: green border, green checkmark (existing style)

3. Update substep rendering within the card to also use status

### Task 6.2: Update `TaskList` component

**Files:**
- Modify: `src/components/TaskList.tsx` (300 lines)

**What to do:**

1. Replace two-section filter (lines 52-53) with three-section filter:
```typescript
const notStartedTasks = tasks.filter(t => t.status === 'not_started');
const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
const completedTasks = tasks.filter(t => t.status === 'completed');
```

2. Render three collapsible sections:
   - "Not Started ({count})" — default expanded
   - "In Progress ({count})" — default expanded
   - "Completed ({count})" — default collapsed (same as current behavior)

3. Update progress counter: `{completedTasks.length}/{tasks.length} complete`

4. Update the `onToggle` callbacks to use `onStatusChange`

### Task 6.3: Update `GoalCard` and `GoalDetail`

**Files:**
- Modify: `src/components/goals/GoalCard.tsx` (or wherever GoalCard lives)
- Modify: `src/components/goals/GoalDetail.tsx`

**What to do:**
1. Update progress bar calculations: `completed` → `status === 'completed'`
2. Add in-progress indicator to the progress bar (show blue section for in-progress tasks)
3. Update any tooltip/label text

### Task 6.4: Update `PhaseProgress` component

**Files:**
- Modify: `src/components/goals/PhaseProgress.tsx`

**What to do:**
Update phase completion calculations from `task.completed` to `task.status === 'completed'`.

### Task 6.5: Update all remaining components that reference `task.completed`

**Files:** Search with: `grep -r "\.completed" src/components/ --include="*.tsx" --include="*.ts"`

**What to do:**
For each match, update `task.completed` → `task.status === 'completed'` (or appropriate status check).

### Task 6.6: Write/update component tests

**Files:**
- Update existing test files for TaskMiniCard, TaskList, GoalCard
- Test all three status states render correctly
- Test status cycling behavior

### Task 6.7: Commit Step 6

```bash
git add src/components/
git commit -m "feat: update all UI components for three-state task status"
```

---

## Step 7: Build the Kanban Board Page

> **Scope:** Create the new `/board` route with a 3-column kanban board, drill-down navigation, and drag-and-drop.

### Task 7.1: Create the Board page route

**Files:**
- Create: `src/app/board/page.tsx`

**What to do:**

Server component that renders the `KanbanBoard` client component:
```typescript
export default function BoardPage() {
  return <KanbanBoard />;
}

export const metadata = { title: 'Board - Journey Tracker' };
```

### Task 7.2: Create `KanbanBoard` client component

**Files:**
- Create: `src/components/board/KanbanBoard.tsx`

**What to do:**

Main component with:
1. **Breadcrumb navigation**: "Board" > "Goal Name" > "Task Name"
2. **View level state**: `'goals' | 'tasks' | 'substeps'`
3. **Selected context**: `{ goalId?: string; taskId?: string }`
4. Fetches data from Redux (goals already in store from RTK Query)
5. Filters items into 3 columns based on `status`
6. For goal-level: derive goal status from task statuses:
   - All tasks not_started → goal is not_started
   - Any task in_progress (or mix of completed + not_started) → goal is in_progress
   - All tasks completed → goal is completed

```typescript
'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanFilters } from './KanbanFilters';
import { KanbanBreadcrumb } from './KanbanBreadcrumb';

type ViewLevel = 'goals' | 'tasks' | 'substeps';

export function KanbanBoard() {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('goals');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  // ... filter state, data fetching, drag handling
}
```

### Task 7.3: Create `KanbanColumn` component

**Files:**
- Create: `src/components/board/KanbanColumn.tsx`

**What to do:**

A droppable column with:
1. Header showing status name, count, and color accent
2. `@dnd-kit` `useDroppable` for drop target
3. Renders list of `KanbanCard` components
4. Empty state message when no items

### Task 7.4: Create `KanbanCard` component

**Files:**
- Create: `src/components/board/KanbanCard.tsx`

**What to do:**

A draggable card using `@dnd-kit` `useDraggable`:
1. **Goal card**: Shows icon, title, progress bar, task counts per status, target date
2. **Task card**: Shows title, priority badge, due date, substep progress, parent goal name
3. **Substep card**: Shows title, due date, cost, parent task name
4. Click handler for drill-down (goal → tasks, task → substeps)
5. Visual drag handle

### Task 7.5: Create `KanbanBreadcrumb` component

**Files:**
- Create: `src/components/board/KanbanBreadcrumb.tsx`

**What to do:**

Breadcrumb trail: Board > [Goal Title] > [Task Title]
- Each segment is clickable to navigate back to that level
- Uses the selected goal/task context from parent state

### Task 7.6: Create `KanbanFilters` component

**Files:**
- Create: `src/components/board/KanbanFilters.tsx`

**What to do:**

Filter bar with:
1. **Date range filter**: date pickers for start/end, filter by `dueDate`
2. **Priority filter**: dropdown/chips for low/medium/high/critical (only for tasks/substeps)
3. **Goal filter**: dropdown to select a specific goal (only for tasks view)
4. **Search**: text input to filter by title

### Task 7.7: Implement drag-and-drop status change

**Files:**
- Modify: `src/components/board/KanbanBoard.tsx`

**What to do:**

Handle `DragEndEvent`:
1. Determine which column (status) the item was dropped on
2. Call the appropriate API to update the item's status:
   - Goal level: update all tasks in the goal (or skip, since goals derive status)
   - Task level: `PATCH /api/goals/:goalId/tasks/:taskId` with new status
   - Substep level: same pattern for substeps
3. Optimistic update in Redux
4. Show toast on success/failure

### Task 7.8: Create barrel export

**Files:**
- Create: `src/components/board/index.ts`

### Task 7.9: Write tests for Kanban components

**Files:**
- Create: `src/components/board/__tests__/KanbanBoard.test.tsx`
- Create: `src/components/board/__tests__/KanbanCard.test.tsx`
- Create: `src/components/board/__tests__/KanbanFilters.test.tsx`

**What to test:**
- Items render in correct columns based on status
- Breadcrumb navigation works (click goal → shows tasks)
- Filter by date/priority/search works
- Drag-and-drop updates status (may need to mock @dnd-kit)

### Task 7.10: Commit Step 7

```bash
git add src/app/board/ src/components/board/
git commit -m "feat: add Kanban board page with 3 columns, drill-down, and drag-and-drop"
```

---

## Step 8: Update Navigation

> **Scope:** Add the Board tab to both desktop header and mobile bottom navigation.

### Task 8.1: Update Header navigation

**Files:**
- Modify: `src/components/Header.tsx` (191 lines)

**What to do:**

Add Board to `navItems` array (line 14-19), between Home and Feed:
```typescript
const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/board", label: "Board", icon: "📊" },  // NEW
  { href: "/feed", label: "Feed", icon: "📰" },
  { href: "/templates", label: "Templates", icon: "📋" },
  { href: "/marketplace", label: "Marketplace", icon: "🏪" },
];
```

### Task 8.2: Update mobile Navigation

**Files:**
- Modify: `src/components/Navigation.tsx`

**What to do:**

Add Board to the mobile bottom nav `navItems` array (line 15-23):
```typescript
const navItems = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/goals", label: "My Goals", icon: "🎯" },
  { href: "/board", label: "Board", icon: "📊" },  // NEW
  { href: "/feed", label: "Feed", icon: "📰" },
  { href: "/templates", label: "Templates", icon: "📋" },
  { href: "/marketplace", label: "Marketplace", icon: "🏪" },
  { href: "/friends", label: "Friends", icon: "👥" },
  { href: "/profile", label: "Profile", icon: "👤" },
];
```

### Task 8.3: Commit Step 8

```bash
git add src/components/Header.tsx src/components/Navigation.tsx
git commit -m "feat: add Board tab to desktop and mobile navigation"
```

---

## Step 9: Feed UI Enhancements

> **Scope:** Update the Feed page to display all new activity types with before/after diffs and improved filtering.

### Task 9.1: Update `FeedItemCard` to handle new types

**Files:**
- Modify: `src/components/feed/FeedItemCard.tsx` (149 lines)

**What to do:**

1. Expand `FEED_TYPE_ICONS` mapping (lines 16-24) to include all new types:
```typescript
const FEED_TYPE_ICONS: Record<string, string> = {
  streak_milestone: '🔥',
  streak_at_risk: '⚠️',
  goal_created: '🎯',
  goal_updated: '✏️',
  goal_deleted: '🗑️',
  task_created: '➕',
  task_updated: '📝',
  task_deleted: '🗑️',
  task_status_changed: '🔄',
  substep_created: '➕',
  substep_updated: '📝',
  substep_deleted: '🗑️',
  substep_status_changed: '🔄',
  cost_updated: '💰',
  note_updated: '📒',
  profile_updated: '👤',
  friend_changed: '👥',
  template_action: '📋',
  goal_shared: '🤝',
  goal_published: '🌟',
  goal_forked: '🔱',
};
```

2. Expand `FEED_TYPE_COLORS` similarly.

3. Add a **diff display section** for items that have `metadata.diffs`:
```tsx
{item.metadata?.diffs && (
  <div className="mt-2 text-sm bg-gray-50 rounded p-2 space-y-1">
    {(item.metadata.diffs as FieldDiff[]).map((diff, i) => (
      <div key={i}>
        <span className="font-medium">{diff.field}:</span>{' '}
        <span className="line-through text-red-500">{String(diff.oldValue ?? '(empty)')}</span>
        {' → '}
        <span className="text-green-600">{String(diff.newValue)}</span>
      </div>
    ))}
  </div>
)}
```

### Task 9.2: Update `FeedFilters` with new filter categories

**Files:**
- Modify: `src/components/feed/FeedFilters.tsx`

**What to do:**

Expand filter options to group by category:
```typescript
const filterOptions = [
  { value: 'all', label: 'All Activity' },
  { value: 'goals', label: 'Goals' },        // goal_created, goal_updated, goal_deleted
  { value: 'tasks', label: 'Tasks' },         // task_*, substep_*
  { value: 'status', label: 'Status Changes' }, // task_status_changed, substep_status_changed
  { value: 'streaks', label: 'Streaks' },     // streak_milestone, streak_at_risk
  { value: 'social', label: 'Social' },       // goal_shared, goal_published, goal_forked, friend_changed, template_action
];
```

Update the filter logic to map filter values to arrays of feed item types.

### Task 9.3: Update `FeedList` to handle grouping

**Files:**
- Modify: `src/components/feed/FeedList.tsx` (138 lines)

**What to do:**

Add optional grouping of rapid successive changes:
1. After fetching feed items, group items that match ALL of:
   - Same `userId`
   - Same `type` prefix (e.g., all `task_*` types)
   - Within 60 seconds of each other
2. Render grouped items as: "Made 3 updates to goal 'Build House'" with expand/collapse
3. Keep ungrouped items as-is

### Task 9.4: Update Feed Redux slice for new filter types

**Files:**
- Modify: `src/store/slices/feedSlice.ts` (119 lines)

**What to do:**
1. Update filter type options
2. Add `feedPreferencesApi` endpoints if not done in Step 5

### Task 9.5: Write tests for updated Feed components

**Files:**
- Update tests for FeedItemCard, FeedFilters, FeedList

### Task 9.6: Commit Step 9

```bash
git add src/components/feed/ src/store/slices/feedSlice.ts
git commit -m "feat: enhance feed UI with diff display, new types, and activity grouping"
```

---

## Step 10: Feed Visibility Configuration UI

> **Scope:** Build the settings panel on the Profile page where users can toggle feed visibility per category.

### Task 10.1: Create `FeedPreferencesPanel` component

**Files:**
- Create: `src/components/profile/FeedPreferencesPanel.tsx`

**What to do:**

A settings panel with toggle switches for each category:
```typescript
const FEED_CATEGORIES = [
  { key: 'goalEvents', label: 'Goal Events', description: 'Goal creation, updates, and deletion' },
  { key: 'taskEvents', label: 'Task Events', description: 'Task creation, updates, deletion, and status changes' },
  { key: 'substepEvents', label: 'Substep Events', description: 'Substep creation, updates, deletion, and status changes' },
  { key: 'costEvents', label: 'Cost & Budget', description: 'Cost additions and budget changes' },
  { key: 'noteEvents', label: 'Notes', description: 'Note additions and updates' },
  { key: 'profileEvents', label: 'Profile Changes', description: 'Bio, location, and other profile updates' },
  { key: 'socialEvents', label: 'Social Activity', description: 'Friends, templates shared and forked' },
  { key: 'streakEvents', label: 'Streak Milestones', description: 'Streak achievement milestones' },
];
```

Each row shows:
- Category label + description
- Toggle switch (on/off)
- Uses the `feedPreferencesApi` from Redux to fetch/update preferences

### Task 10.2: Add FeedPreferencesPanel to Profile page

**Files:**
- Modify: `src/app/profile/page.tsx` (or the profile page component)

**What to do:**
Add the `FeedPreferencesPanel` component to the profile page, after the existing `EmailPreferencesPanel`:
```tsx
<FeedPreferencesPanel />
```

### Task 10.3: Write tests for FeedPreferencesPanel

**Files:**
- Create: `src/components/profile/__tests__/FeedPreferencesPanel.test.tsx`

**What to test:**
- Renders all 8 category toggles
- Toggle on/off calls the correct API
- Shows correct initial state from fetched preferences
- Loading state while fetching

### Task 10.4: Commit Step 10

```bash
git add src/components/profile/ src/app/profile/
git commit -m "feat: add feed visibility configuration panel to profile page"
```

---

## Step 11: Integration Testing & Cleanup

> **Scope:** Run the full test suite, fix any broken tests, verify the migration script, and clean up dead code.

### Task 11.1: Run the migration script on dev database

```bash
npx tsx src/scripts/migrate-task-status.ts
```

Verify: Check a few goals in Prisma Studio (`npx prisma studio`) to confirm tasks have `status` field.

### Task 11.2: Run full test suite

```bash
npm run test
```

Fix any failing tests from the `completed` → `status` migration. Key areas to check:
- TaskMiniCard tests
- TaskList tests
- GoalCard tests
- MCP tool tests (completeTask, completeSubstep)
- useGoalsCRUD hook tests
- Analytics hook tests

### Task 11.3: Search for any remaining `completed` boolean references

```bash
grep -r "\.completed" src/ --include="*.ts" --include="*.tsx" | grep -v "completedAt" | grep -v "completedTasks" | grep -v node_modules
```

Update any remaining references to use `status === 'completed'`.

### Task 11.4: Remove the console-only `auditLogger` references

**Files:**
- Modify: `src/lib/agent/auditLog.ts` — Can be kept but documented as deprecated, since `trackActivity()` replaces it

**What to do:**
- Either remove `auditLogger` calls from MCP tools (replaced by `trackActivity()`) or make `auditLogger` a thin wrapper around `trackActivity()`

### Task 11.5: Update Feed API validation schema

**Files:**
- Modify: `src/app/api/feed/route.ts`

**What to do:**
Ensure the `createFeedItemSchema` (line 7) accepts all new feed item types.

### Task 11.6: Run lint

```bash
npm run lint
```

Fix any lint errors.

### Task 11.7: Run build

```bash
npm run build
```

Fix any TypeScript compilation errors.

### Task 11.8: Final commit

```bash
git add -A
git commit -m "feat: complete kanban board, comprehensive feed, and feed visibility features"
```

---

## Summary of Steps

| Step | Description | Key Files | Est. Complexity |
|------|------------|-----------|----------------|
| **1** | Data Model Foundation | `types/index.ts`, `schema.prisma`, migration script | Medium |
| **2** | Activity Tracking Utility | `src/lib/activity/*` | Medium |
| **3** | Update MCP Tools | `src/lib/mcp/tools/*.ts` | High (many files) |
| **4** | Update API Routes | `src/app/api/**/*.ts` | High (many files) |
| **5** | Update Client Hooks & Redux | `src/hooks/*`, `src/store/*` | Medium |
| **6** | Update Existing UI Components | `TaskMiniCard`, `TaskList`, `GoalCard` | Medium |
| **7** | Build Kanban Board Page | `src/components/board/*`, `src/app/board/*` | High (new feature) |
| **8** | Update Navigation | `Header.tsx`, `Navigation.tsx` | Low |
| **9** | Feed UI Enhancements | `src/components/feed/*` | Medium |
| **10** | Feed Visibility Config UI | `FeedPreferencesPanel`, profile page | Medium |
| **11** | Integration Testing & Cleanup | All test files, lint, build | Medium |

**Dependency order:** 1 → 2 → 3/4 (parallel) → 5 → 6 → 7/8/9/10 (parallel) → 11
