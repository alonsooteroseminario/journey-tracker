# Visible Drag Handle on GoalCards Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the drag handle on GoalCards (home page) always visible on the left side.

**Architecture:** Modify the SortableGoalCard wrapper in page.tsx. Move the grip dots SVG from top-right hidden to left-side always visible. Add left padding to the GoalCard container to accommodate the handle.

**Tech Stack:** @dnd-kit/sortable, React, Tailwind CSS

---

### Task 1: Move Drag Handle to Left Side

**Files:**
- Modify: `src/app/page.tsx`

**Step 1:** Find the `SortableGoalCard` component in page.tsx. It wraps each GoalCard with `useSortable()` and renders a drag handle.

**Step 2:** Find the drag handle SVG (the grip dots). It currently has positioning like `absolute top-2 right-28` and `opacity-0 hover:opacity-100`. Change it to:

```tsx
{/* Drag handle — always visible on left edge */}
<div
  className="absolute top-0 left-0 bottom-0 w-6 flex items-center justify-center text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors"
  {...attributes}
  {...listeners}
>
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="9" cy="5" r="1.5" />
    <circle cx="15" cy="5" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="19" r="1.5" />
    <circle cx="15" cy="19" r="1.5" />
  </svg>
</div>
```

**Step 3:** Move `{...attributes}` and `{...listeners}` from the outer wrapper div to the drag handle div (so only the handle triggers drag, not the whole card). Make sure to REMOVE them from the outer wrapper.

**Step 4:** Add left padding to the outer wrapper: add `pl-6` so the card content doesn't overlap with the handle. The wrapper should have `relative` in its className.

**Step 5:** Run `npx tsc --noEmit 2>&1 | grep page` — verify clean.

**Step 6:** Commit: `git commit -m "feat: move GoalCard drag handle to always-visible left edge"`
