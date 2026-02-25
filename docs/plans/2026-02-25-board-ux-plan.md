# Board UX Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the Kanban board UX: filter substeps in In Progress column, show parent breadcrumbs, move drag icon, hide tabs when collapsed, add Done Today filter.

**Architecture:** All changes are UI-only modifications to existing Kanban components (`KanbanCard`, `KanbanBoard`, `KanbanColumn`, `KanbanFilters`) and `GoalCard`. No schema or API changes needed.

**Tech Stack:** React, TypeScript, Tailwind CSS, @dnd-kit

---

## Task 1: Pass column status to KanbanCard

**Files:**
- Modify: `src/components/kanban/KanbanColumn.tsx:76-82`
- Modify: `src/components/kanban/KanbanCard.tsx:7-13`

### Step 1: Add `columnStatus` prop to KanbanCard interface

In `src/components/kanban/KanbanCard.tsx`, change the interface (lines 7-11):

**Old:**
```typescript
interface KanbanCardProps {
  item: Goal | Task | Substep;
  level: "goals" | "tasks" | "substeps";
  onDrillDown: () => void;
}
```

**New:**
```typescript
interface KanbanCardProps {
  item: Goal | Task | Substep;
  level: "goals" | "tasks" | "substeps";
  columnStatus: "not_started" | "in_progress" | "completed";
  onDrillDown: () => void;
}
```

Update the destructure at line 13:

**Old:**
```typescript
export function KanbanCard({ item, level, onDrillDown }: KanbanCardProps) {
```

**New:**
```typescript
export function KanbanCard({ item, level, columnStatus, onDrillDown }: KanbanCardProps) {
```

### Step 2: Pass columnStatus from KanbanColumn

In `src/components/kanban/KanbanColumn.tsx`, update KanbanCard render (lines 76-82):

**Old:**
```typescript
{items.map((item) => (
  <KanbanCard
    key={item.id}
    item={item}
    level={level}
    onDrillDown={() => onDrillDown(item.id)}
  />
))}
```

**New:**
```typescript
{items.map((item) => (
  <KanbanCard
    key={item.id}
    item={item}
    level={level}
    columnStatus={status}
    onDrillDown={() => onDrillDown(item.id)}
  />
))}
```

### Step 3: Verify build compiles

Run: `cd /home/alonsooteroseminario/source/repos/journey-tracker && npx tsc --noEmit`
Expected: No errors

### Step 4: Commit

```bash
git add src/components/kanban/KanbanColumn.tsx src/components/kanban/KanbanCard.tsx
git commit -m "refactor: pass columnStatus prop from KanbanColumn to KanbanCard"
```

---

## Task 2: Filter substeps in In Progress column (Goals tab)

**Files:**
- Modify: `src/components/kanban/KanbanCard.tsx:70-89`

### Step 1: Filter tasks shown in goal cards when in In Progress column

In `src/components/kanban/KanbanCard.tsx`, replace lines 70-89 (the goal-level task list):

**Old:**
```typescript
{level === "goals" && goal.tasks && goal.tasks.length > 0 && (
  <ul className="mb-2 space-y-0.5">
    {goal.tasks.slice(0, 5).map((t) => {
      const statusIcon = t.status === "completed" ? "✓" : t.status === "in_progress" ? "◐" : "○";
      const statusColor = t.status === "completed" ? "text-green-600" : t.status === "in_progress" ? "text-orange-500" : "text-gray-400";
      return (
        <li key={t.id} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
          <span className={`flex-shrink-0 ${statusColor}`}>{statusIcon}</span>
          <span className={`truncate ${t.status === "completed" ? "text-gray-400 line-through" : "text-gray-700"}`}>
            {t.title}
          </span>
        </li>
      );
    })}
    {goal.tasks.length > 5 && (
      <li className="text-[10px] sm:text-xs text-gray-400 pl-4">
        +{goal.tasks.length - 5} more
      </li>
    )}
  </ul>
)}
```

**New:**
```typescript
{level === "goals" && goal.tasks && goal.tasks.length > 0 && (() => {
  const visibleTasks = columnStatus === "in_progress"
    ? goal.tasks.filter((t) => t.status !== "completed")
    : goal.tasks;
  if (visibleTasks.length === 0) return null;
  return (
    <ul className="mb-2 space-y-0.5">
      {visibleTasks.slice(0, 5).map((t) => {
        const statusIcon = t.status === "completed" ? "✓" : t.status === "in_progress" ? "◐" : "○";
        const statusColor = t.status === "completed" ? "text-green-600" : t.status === "in_progress" ? "text-orange-500" : "text-gray-400";
        return (
          <li key={t.id} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
            <span className={`flex-shrink-0 ${statusColor}`}>{statusIcon}</span>
            <span className={`truncate ${t.status === "completed" ? "text-gray-400 line-through" : "text-gray-700"}`}>
              {t.title}
            </span>
          </li>
        );
      })}
      {visibleTasks.length > 5 && (
        <li className="text-[10px] sm:text-xs text-gray-400 pl-4">
          +{visibleTasks.length - 5} more
        </li>
      )}
    </ul>
  );
})()}
```

### Step 2: Verify build compiles

Run: `npx tsc --noEmit`
Expected: No errors

### Step 3: Commit

```bash
git add src/components/kanban/KanbanCard.tsx
git commit -m "feat: filter completed tasks in In Progress column goal cards"
```

---

## Task 3: Filter substeps in In Progress column (Tasks tab)

**Files:**
- Modify: `src/components/kanban/KanbanCard.tsx:114-134`

### Step 1: Filter substeps shown in task cards when in In Progress column

Replace lines 114-134 (task-level substep list):

**Old:**
```typescript
{level === "tasks" && task.substeps && task.substeps.length > 0 && (
  <ul className="mb-2 space-y-0.5">
    {task.substeps.slice(0, 4).map((s) => {
```

**New:**
```typescript
{level === "tasks" && task.substeps && task.substeps.length > 0 && (() => {
  const visibleSubsteps = columnStatus === "in_progress"
    ? task.substeps.filter((s) => s.status !== "completed")
    : task.substeps;
  if (visibleSubsteps.length === 0) return null;
  return (
    <ul className="mb-2 space-y-0.5">
      {visibleSubsteps.slice(0, 4).map((s) => {
        const statusIcon = s.status === "completed" ? "✓" : s.status === "in_progress" ? "◐" : "○";
        const statusColor = s.status === "completed" ? "text-green-600" : s.status === "in_progress" ? "text-orange-500" : "text-gray-400";
        return (
          <li key={s.id} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
            <span className={`flex-shrink-0 ${statusColor}`}>{statusIcon}</span>
            <span className={`truncate ${s.status === "completed" ? "text-gray-400 line-through" : "text-gray-700"}`}>
              {s.title}
            </span>
          </li>
        );
      })}
      {visibleSubsteps.length > 4 && (
        <li className="text-[10px] sm:text-xs text-gray-400 pl-4">
          +{visibleSubsteps.length - 4} more
        </li>
      )}
    </ul>
  );
})()}
```

### Step 2: Verify build compiles

Run: `npx tsc --noEmit`

### Step 3: Commit

```bash
git add src/components/kanban/KanbanCard.tsx
git commit -m "feat: filter completed substeps in In Progress column task cards"
```

---

## Task 4: Add parent metadata to flat views

**Files:**
- Modify: `src/components/kanban/KanbanBoard.tsx:65-80`

### Step 1: Add _goalTitle, _goalIcon, _taskTitle to flatMap

In `src/components/kanban/KanbanBoard.tsx`, update the flat task view (lines 67-70):

**Old:**
```typescript
if (viewLevel === "tasks") {
  return goals.flatMap((g) =>
    (g.tasks || []).map((t) => ({ ...t, _goalId: g.id } as FlatItem))
  );
}
```

**New:**
```typescript
if (viewLevel === "tasks") {
  return goals.flatMap((g) =>
    (g.tasks || []).map((t) => ({ ...t, _goalId: g.id, _goalTitle: g.title, _goalIcon: g.icon } as FlatItem))
  );
}
```

Update the flat substep view (lines 74-79):

**Old:**
```typescript
if (viewLevel === "substeps") {
  return goals.flatMap((g) =>
    (g.tasks || []).flatMap((t) =>
      (t.substeps || []).map((s) => ({ ...s, _goalId: g.id, _taskId: t.id } as FlatItem))
    )
  );
}
```

**New:**
```typescript
if (viewLevel === "substeps") {
  return goals.flatMap((g) =>
    (g.tasks || []).flatMap((t) =>
      (t.substeps || []).map((s) => ({ ...s, _goalId: g.id, _goalTitle: g.title, _goalIcon: g.icon, _taskId: t.id, _taskTitle: t.title } as FlatItem))
    )
  );
}
```

Also update the drill-down task view (line 97):

**Old:**
```typescript
return ((goal?.tasks || []) as FlatItem[]).map((t) => ({ ...t, _goalId: drillDown.goalId } as FlatItem));
```

**New:**
```typescript
return ((goal?.tasks || []) as FlatItem[]).map((t) => ({ ...t, _goalId: drillDown.goalId, _goalTitle: goal?.title, _goalIcon: goal?.icon } as FlatItem));
```

And drill-down substep view (line 101):

**Old:**
```typescript
return ((task?.substeps || []) as FlatItem[]).map((s) => ({ ...s, _goalId: drillDown.goalId, _taskId: drillDown.taskId } as FlatItem));
```

**New:**
```typescript
return ((task?.substeps || []) as FlatItem[]).map((s) => ({ ...s, _goalId: drillDown.goalId, _goalTitle: goal?.title, _goalIcon: goal?.icon, _taskId: drillDown.taskId, _taskTitle: task?.title } as FlatItem));
```

### Step 2: Verify build compiles

Run: `npx tsc --noEmit`

### Step 3: Commit

```bash
git add src/components/kanban/KanbanBoard.tsx
git commit -m "feat: include parent title/icon metadata in flat task/substep views"
```

---

## Task 5: Show goal parent name in Tasks tab cards

**Files:**
- Modify: `src/components/kanban/KanbanCard.tsx:42-60`

### Step 1: Add parent breadcrumb above task title

In `src/components/kanban/KanbanCard.tsx`, add breadcrumb before the title section. Insert above line 42 (`{/* Title */}`):

**Old (lines 41-44):**
```typescript
    >
      {/* Title */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-gray-900 text-xs sm:text-sm flex-1">
```

**New:**
```typescript
    >
      {/* Parent breadcrumb for flat views */}
      {level === "tasks" && (item as any)._goalTitle && (
        <div className="text-[9px] sm:text-[10px] text-gray-400 truncate mb-0.5 flex items-center gap-1">
          <span>{(item as any)._goalIcon || "🎯"}</span>
          <span className="truncate">{(item as any)._goalTitle}</span>
        </div>
      )}
      {level === "substeps" && (item as any)._goalTitle && (
        <div className="text-[9px] sm:text-[10px] text-gray-400 truncate mb-0.5 flex items-center gap-1">
          <span>{(item as any)._goalIcon || "🎯"}</span>
          <span className="truncate">{(item as any)._goalTitle}</span>
          <span className="text-gray-300">›</span>
          <span className="truncate">{(item as any)._taskTitle}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-gray-900 text-xs sm:text-sm flex-1">
```

### Step 2: Verify build compiles

Run: `npx tsc --noEmit`

### Step 3: Commit

```bash
git add src/components/kanban/KanbanCard.tsx
git commit -m "feat: show parent goal/task breadcrumb in flat view kanban cards"
```

---

## Task 6: Move drag icon to top-left corner

**Files:**
- Modify: `src/components/kanban/KanbanCard.tsx:33-39,262-274`

### Step 1: Make the card container relative and add padding

Update the card container (line 39):

**Old:**
```typescript
className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
```

**New:**
```typescript
className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 pl-5 sm:pl-6 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
```

### Step 2: Replace bottom drag indicator with top-left positioned one

Replace lines 262-274 (the drag indicator at the bottom of the card):

**Old:**
```typescript
      {/* Drag indicator */}
      <div className="mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-center gap-1 text-gray-400">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
          </svg>
        </div>
      </div>
```

**New:**
```typescript
      {/* Drag indicator — top-left corner */}
      <div className="absolute top-1.5 left-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="5" r="1.5" />
          <circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" />
          <circle cx="15" cy="19" r="1.5" />
        </svg>
      </div>
```

### Step 3: Verify build compiles

Run: `npx tsc --noEmit`

### Step 4: Commit

```bash
git add src/components/kanban/KanbanCard.tsx
git commit -m "feat: move drag handle icon to top-left corner of kanban cards"
```

---

## Task 7: Hide tabs when GoalCard is collapsed

**Files:**
- Modify: `src/components/GoalCard.tsx:190-248`

### Step 1: Wrap the tab bar inside the isExpanded conditional

In `src/components/GoalCard.tsx`, the tab bar is at lines 190-247 and is currently outside the `isExpanded` conditional. Move it inside.

**Old (lines 189-251):**
```typescript
        </div>

        {/* View Mode Tabs - Responsive Grid on Mobile */}
        <div role="tablist" className="mt-2 sm:mt-4 grid grid-cols-5 md:flex gap-0.5 sm:gap-2">
          ...5 tab buttons...
        </div>
      </div>

      {/* Content Section */}
      {isExpanded && (
```

**New:**
```typescript
        </div>

        {/* View Mode Tabs — only visible when expanded */}
        {isExpanded && (
          <div role="tablist" className="mt-2 sm:mt-4 grid grid-cols-5 md:flex gap-0.5 sm:gap-2">
            ...5 tab buttons (unchanged)...
          </div>
        )}
      </div>

      {/* Content Section */}
      {isExpanded && (
```

Specifically, add `{isExpanded && (` before line 191, and `)}` after line 247 (before the closing `</div>`).

### Step 2: Verify build compiles

Run: `npx tsc --noEmit`

### Step 3: Commit

```bash
git add src/components/GoalCard.tsx
git commit -m "feat: hide GoalCard tabs when collapsed, show only header"
```

---

## Task 8: Add "Done Today" quick filter

**Files:**
- Modify: `src/components/kanban/KanbanFilters.tsx`
- Modify: `src/components/kanban/KanbanBoard.tsx`

### Step 1: Add doneToday state to KanbanBoard

In `src/components/kanban/KanbanBoard.tsx`, add state after the existing filter states (around line 27):

```typescript
const [doneToday, setDoneToday] = useState(false);
```

### Step 2: Add doneToday filter to filteredData useMemo

In KanbanBoard, inside the `filteredData` useMemo (after the existing date filter block, around line 139):

Add before `return data;`:

```typescript
    // Done Today filter
    if (doneToday) {
      const todayStr = new Date().toISOString().split("T")[0];
      data = data.filter((item: any) => {
        if (!item.completedAt) return false;
        return item.completedAt.split("T")[0] === todayStr;
      });
    }
```

### Step 3: Add doneToday props to KanbanFilters

In `src/components/kanban/KanbanFilters.tsx`, extend the props interface (around line 5):

Add to the interface:
```typescript
doneToday: boolean;
onDoneTodayChange: (val: boolean) => void;
```

### Step 4: Add "Done Today" chip button to KanbanFilters UI

In `src/components/kanban/KanbanFilters.tsx`, add after the search input (around line 79), before the date filter:

```tsx
{/* Done Today chip */}
<button
  onClick={() => onDoneTodayChange(!doneToday)}
  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
    doneToday
      ? "bg-green-100 text-green-700 border-green-300"
      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
  }`}
>
  <span className="sm:hidden">Today</span>
  <span className="hidden sm:inline">Done Today</span>
</button>
```

### Step 5: Pass doneToday props from KanbanBoard to KanbanFilters

In the KanbanBoard render section where KanbanFilters is rendered, add:

```typescript
doneToday={doneToday}
onDoneTodayChange={setDoneToday}
```

### Step 6: Include doneToday in the clear-filters check

Update the clear button condition in KanbanFilters to also check `doneToday`, and reset it in the clear handler.

### Step 7: Verify build compiles

Run: `npx tsc --noEmit`

### Step 8: Commit

```bash
git add src/components/kanban/KanbanBoard.tsx src/components/kanban/KanbanFilters.tsx
git commit -m "feat: add Done Today quick filter to board page"
```

---

## Task 9: Run full test suite

### Step 1: Run tests

Run: `npx vitest run`
Expected: All existing tests pass

### Step 2: Run lint

Run: `npm run lint`
Expected: No errors

### Step 3: Final commit (if any lint fixes needed)

```bash
git add -A && git commit -m "chore: fix lint issues from board UX changes"
```
