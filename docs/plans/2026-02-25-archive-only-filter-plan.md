# Archived-Only Filter Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Change the "Show Archived" toggle to show ONLY archived items when active (instead of mixing with non-archived).

**Architecture:** Single logic change in KanbanBoard.tsx filteredData useMemo. When showArchived is true, filter to only archived items. When false, filter them out (current behavior).

**Tech Stack:** React useMemo, existing KanbanBoard state

---

### Task 1: Change Archive Filter Logic

**Files:**
- Modify: `src/components/kanban/KanbanBoard.tsx:128-130`

**Step 1:** Find the archive filter in the `filteredData` useMemo. Current code:

```tsx
if (!showArchived) {
  data = data.filter((item: any) => !item.isArchived);
}
```

**Step 2:** Replace with archived-only logic:

```tsx
if (showArchived) {
  data = data.filter((item: any) => item.isArchived);
} else {
  data = data.filter((item: any) => !item.isArchived);
}
```

**Step 3:** Run `npx tsc --noEmit 2>&1 | grep KanbanBoard` — verify clean.

**Step 4:** Commit: `git commit -m "feat: show only archived items when archive filter is active"`

---

### Task 2: Update Filter Button Label

**Files:**
- Modify: `src/components/kanban/KanbanFilters.tsx`

**Step 1:** Find the "Show Archived" toggle button. Update its text to be more descriptive:

Change the button text from the current emoji/text to indicate the mode:

```tsx
<button
  onClick={() => onShowArchivedChange?.(!showArchived)}
  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
    showArchived
      ? "bg-amber-100 text-amber-700 border border-amber-300"
      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
  }`}
  title={showArchived ? "Showing archived only" : "Show archived items"}
>
  📦 {showArchived ? "Archived Only" : "Archived"}
</button>
```

**Step 2:** Commit: `git commit -m "feat: update archive filter label to indicate archived-only mode"`
