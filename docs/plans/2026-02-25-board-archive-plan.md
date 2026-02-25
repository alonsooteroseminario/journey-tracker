# Board Archive Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add manual archiving for completed board items — archive button on Done column cards, toggle to show/hide archived items.

**Architecture:** Add `isArchived` and `archivedAt` optional fields to Task and Substep types. Archive/unarchive via existing update mutations. Filter archived items from board by default. Toggle in KanbanFilters to reveal archived items with muted styling.

**Tech Stack:** TypeScript types, React, Tailwind CSS, existing RTK Query mutations

---

## Task 1: Add archive fields to Task and Substep types

**Files:**
- Modify: `src/types/index.ts`

### Step 1: Add fields to Substep interface

In `src/types/index.ts`, add to the Substep interface (around line 29):

```typescript
  isArchived?: boolean;
  archivedAt?: string;
```

### Step 2: Add fields to Task interface

In the Task interface (around line 51), add:

```typescript
  isArchived?: boolean;
  archivedAt?: string;
```

### Step 3: Verify build

Run: `npx tsc --noEmit`

### Step 4: Commit

```bash
git add src/types/index.ts
git commit -m "feat: add isArchived and archivedAt fields to Task and Substep types"
```

---

## Task 2: Add archive button to KanbanCard

**Files:**
- Modify: `src/components/kanban/KanbanCard.tsx`

### Step 1: Add archive/unarchive button to completed items

In KanbanCard, add an archive button after the timestamps section (around line 260). The button shows only when `columnStatus === "completed"`:

```tsx
{/* Archive button — only in Done column */}
{columnStatus === "completed" && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onArchive?.();
    }}
    className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400 hover:text-amber-600 transition-colors"
    title={(item as any).isArchived ? "Unarchive" : "Archive"}
  >
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
    <span>{(item as any).isArchived ? "Unarchive" : "Archive"}</span>
  </button>
)}
```

### Step 2: Add onArchive prop to KanbanCardProps

Update the interface:

```typescript
interface KanbanCardProps {
  item: Goal | Task | Substep;
  level: "goals" | "tasks" | "substeps";
  columnStatus: "not_started" | "in_progress" | "completed";
  onDrillDown: () => void;
  onArchive?: () => void;
}
```

### Step 3: Add visual styling for archived items

At the card container div, add conditional muted styling:

```typescript
className={`bg-white rounded-lg border border-gray-200 p-2 sm:p-3 pl-5 sm:pl-6 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative ${
  (item as any).isArchived ? "opacity-60 bg-gray-50" : ""
}`}
```

Add an archive badge after the title when archived:

```tsx
{(item as any).isArchived && (
  <span className="ml-1 px-1 py-0.5 text-[8px] bg-amber-100 text-amber-600 rounded font-medium">
    ARCHIVED
  </span>
)}
```

### Step 4: Verify build

Run: `npx tsc --noEmit`

### Step 5: Commit

```bash
git add src/components/kanban/KanbanCard.tsx
git commit -m "feat: add archive button and archived styling to KanbanCard"
```

---

## Task 3: Pass onArchive from KanbanColumn

**Files:**
- Modify: `src/components/kanban/KanbanColumn.tsx`

### Step 1: Add onArchive prop to KanbanColumn

Extend the KanbanColumnProps interface:

```typescript
interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  items: any[];
  level: "goals" | "tasks" | "substeps";
  onDrillDown: (itemId: string) => void;
  onArchive?: (itemId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (status: string) => void;
}
```

### Step 2: Pass onArchive to KanbanCard

In the KanbanCard render (line 77):

```typescript
<KanbanCard
  key={item.id}
  item={item}
  level={level}
  columnStatus={status}
  onDrillDown={() => onDrillDown(item.id)}
  onArchive={() => onArchive?.(item.id)}
/>
```

### Step 3: Verify build

Run: `npx tsc --noEmit`

### Step 4: Commit

```bash
git add src/components/kanban/KanbanColumn.tsx
git commit -m "feat: pass onArchive callback through KanbanColumn to cards"
```

---

## Task 4: Implement archive logic in KanbanBoard

**Files:**
- Modify: `src/components/kanban/KanbanBoard.tsx`

### Step 1: Add showArchived state

```typescript
const [showArchived, setShowArchived] = useState(false);
```

### Step 2: Filter archived items from filteredData

In the filteredData useMemo, add at the beginning (before search filter):

```typescript
// Hide archived items unless toggle is on
if (!showArchived) {
  data = data.filter((item: any) => !item.isArchived);
}
```

### Step 3: Add handleArchive function

```typescript
const handleArchive = useCallback((itemId: string) => {
  const item = filteredData.find((d: any) => d.id === itemId);
  if (!item) return;

  const isArchived = !(item as any).isArchived;
  const archiveUpdates = {
    isArchived,
    archivedAt: isArchived ? new Date().toISOString() : undefined,
  };

  if (effectiveLevel === "tasks" || (effectiveLevel === "goals" && drillDown.level === "tasks")) {
    const goalId = (item as any)._goalId || drillDown.goalId;
    if (goalId) updateTask(goalId, itemId, archiveUpdates);
  } else if (effectiveLevel === "substeps" || (effectiveLevel === "goals" && drillDown.level === "substeps")) {
    const goalId = (item as any)._goalId || drillDown.goalId;
    const taskId = (item as any)._taskId || drillDown.taskId;
    if (goalId && taskId) updateSubstep(goalId, taskId, itemId, archiveUpdates);
  }
}, [filteredData, effectiveLevel, drillDown, updateTask, updateSubstep]);
```

### Step 4: Pass archive props to KanbanColumns

For the completed column, add `onArchive={handleArchive}`:

```typescript
<KanbanColumn
  title="Done"
  status="completed"
  items={columns.completed}
  level={effectiveLevel}
  onDrillDown={handleDrillDown}
  onArchive={handleArchive}
  isCollapsed={collapsedColumns["completed"]}
  onToggleCollapse={toggleColumnCollapse}
/>
```

### Step 5: Pass showArchived to KanbanFilters

```typescript
showArchived={showArchived}
onShowArchivedChange={setShowArchived}
```

### Step 6: Verify build

Run: `npx tsc --noEmit`

### Step 7: Commit

```bash
git add src/components/kanban/KanbanBoard.tsx
git commit -m "feat: implement archive/unarchive logic in KanbanBoard"
```

---

## Task 5: Add "Show Archived" toggle to KanbanFilters

**Files:**
- Modify: `src/components/kanban/KanbanFilters.tsx`

### Step 1: Add showArchived props

Extend the props interface:

```typescript
showArchived?: boolean;
onShowArchivedChange?: (val: boolean) => void;
```

### Step 2: Add toggle button

After the "Done Today" chip (or after the clear button), add:

```tsx
{/* Show Archived toggle */}
<button
  onClick={() => onShowArchivedChange?.(!showArchived)}
  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
    showArchived
      ? "bg-amber-100 text-amber-700 border-amber-300"
      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
  }`}
>
  <span className="sm:hidden">📦</span>
  <span className="hidden sm:inline">📦 Archived</span>
</button>
```

### Step 3: Verify build

Run: `npx tsc --noEmit`

### Step 4: Commit

```bash
git add src/components/kanban/KanbanFilters.tsx
git commit -m "feat: add Show Archived toggle to board filters"
```

---

## Task 6: Run full test suite and lint

### Step 1: Run tests

Run: `npx vitest run`
Expected: All tests pass

### Step 2: Run lint

Run: `npm run lint`

### Step 3: Commit fixes if needed

```bash
git add -A && git commit -m "chore: fix lint from board archive feature"
```
