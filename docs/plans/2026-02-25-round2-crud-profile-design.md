# Round 2: CRUD, Profile, Archive & UX Improvements — Design

> **Date**: 2026-02-25
> **Status**: Approved

## Features

### 1. Inline Goal Editing in GoalCard
- Click-to-edit for title, description, and icon/emoji
- Pencil icon toggles edit mode in GoalCard header
- Title → `<input>`, Description → `<textarea>`, Icon → emoji picker grid
- Save/Cancel buttons; ESC cancels, Enter saves
- Uses existing `updateGoal(goalId, { title, description, icon })` from useGoalsCRUD
- No new API needed

### 2. Archived-Only Filter Mode (Board)
- Toggle "Show Archived" now shows ONLY archived items (not mixed)
- Default off = hide all archived; on = show only archived
- Single line change in KanbanBoard filteredData useMemo

### 3. Visible Drag Handle on GoalCards (Home Page)
- Move drag handle from hidden top-right to always-visible left edge
- 6-dot grip pattern matching kanban cards
- Remove opacity-0 hover:opacity-100, use subtle gray always visible

### 4. Profile Page — Timezone Field
- Add timezone dropdown using Intl.supportedValuesOf('timeZone')
- Wire to existing PATCH /api/profile endpoint (already accepts timezone)
- Add save feedback indicator

### 5. Auto-Hide Completed Tasks After N Days
- New field: User.hideCompletedAfterDays (Int?, default null = never)
- Profile UI: dropdown "Never / 1 / 3 / 7 / 14 / 30 days"
- GoalCard filters tasks where completed + completedAt older than N days
- Tasks remain in DB, just visually hidden
- Add to PATCH /api/profile schema + Prisma User model
- Fetch preference via existing profile query, pass down to GoalCard

## Decisions
- Edit Goal: Title + Description + Icon (inline click-to-edit)
- Completed tasks: Auto-hide after configurable N days
- Drag handle: Always visible, left side
- Archive: Archived-only filter (not mixed)
- Done Today: Already implemented, skip
