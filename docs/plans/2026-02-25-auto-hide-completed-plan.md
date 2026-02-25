# Auto-Hide Completed Tasks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to configure auto-hiding of completed tasks after N days.

**Architecture:** Add `hideCompletedAfterDays` to User Prisma model and PATCH profile API. Add a dropdown in profile settings. GoalCard reads the preference and filters completed tasks older than N days from the visible task list. Tasks remain in DB.

**Tech Stack:** Prisma, Next.js API, React, existing profile/goals RTK Query

---

### Task 1: Add Prisma Field and API Support

**Files:**
- Modify: `prisma/schema.prisma` (User model)
- Modify: `src/lib/validations.ts` (UpdateProfileSchema)

**Step 1:** Add to the User model after existing fields:

```prisma
hideCompletedAfterDays Int?
```

**Step 2:** Run `npx prisma generate` to regenerate the client.

**Step 3:** In `src/lib/validations.ts`, find `UpdateProfileSchema` and add:

```tsx
hideCompletedAfterDays: z.number().int().min(1).max(365).nullable().optional(),
```

**Step 4:** Verify the PATCH `/api/profile/route.ts` already passes validated fields through to prisma.user.update — it should work automatically since it spreads the validated data.

**Step 5:** Run `npx tsc --noEmit` — verify clean.

**Step 6:** Commit: `git commit -m "feat: add hideCompletedAfterDays to User model and profile API"`

---

### Task 2: Add Profile UI Dropdown

**Files:**
- Modify: `src/app/profile/page.tsx`

**Step 1:** Add state for the preference:

```tsx
const [hideCompletedAfterDays, setHideCompletedAfterDays] = useState<number | null>(
  profile?.hideCompletedAfterDays ?? null
);
```

**Step 2:** Add a new section in the profile settings area (near the EmailPreferencesPanel), with a heading "Task Display":

```tsx
<div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Display</h3>
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Auto-hide completed tasks after
    </label>
    <select
      value={hideCompletedAfterDays ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        const newVal = val === "" ? null : parseInt(val);
        setHideCompletedAfterDays(newVal);
        updateProfile({ hideCompletedAfterDays: newVal });
      }}
      className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Never (show all)</option>
      <option value="1">1 day</option>
      <option value="3">3 days</option>
      <option value="7">7 days</option>
      <option value="14">14 days</option>
      <option value="30">30 days</option>
    </select>
    <p className="text-xs text-gray-500 mt-1">
      Completed tasks older than this will be hidden from goal cards. They still exist and can be seen by disabling this setting.
    </p>
  </div>
</div>
```

**Step 3:** Include `hideCompletedAfterDays` in the save payload if you're using a save button (or it auto-saves on change as shown above).

**Step 4:** Commit: `git commit -m "feat: add auto-hide completed tasks dropdown to profile"`

---

### Task 3: Filter Completed Tasks in GoalCard

**Files:**
- Modify: `src/components/GoalCard.tsx`
- Modify: `src/app/page.tsx` (pass preference prop)

**Step 1:** Add `hideCompletedAfterDays` to GoalCardProps:

```tsx
hideCompletedAfterDays?: number | null;
```

**Step 2:** Inside GoalCard, add a filtered tasks computation after the goal destructuring:

```tsx
const visibleTasks = useMemo(() => {
  if (!hideCompletedAfterDays) return goal.tasks;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - hideCompletedAfterDays);
  return goal.tasks.filter((t) => {
    if (t.status !== "completed") return true;
    if (!t.completedAt) return true;
    return new Date(t.completedAt) > cutoff;
  });
}, [goal.tasks, hideCompletedAfterDays]);
```

**Step 3:** Replace all references to `goal.tasks` in the GoalCard rendering with `visibleTasks` for:
- Progress calculation (completed count vs total)
- Task list rendering
- Phase task counting

**Important:** Keep `goal.tasks` for operations that write back (addTask, deleteTask etc.) — only use `visibleTasks` for display.

**Step 4:** In `src/app/page.tsx`, fetch the profile and pass `hideCompletedAfterDays` to each GoalCard:

```tsx
const { data: profile } = useGetProfileQuery();
// ... in the GoalCard render:
<GoalCard ... hideCompletedAfterDays={profile?.hideCompletedAfterDays} />
```

**Step 5:** Add a small indicator showing hidden count when tasks are filtered:

```tsx
{goal.tasks.length > visibleTasks.length && (
  <p className="text-xs text-gray-400 mt-1">
    {goal.tasks.length - visibleTasks.length} completed task(s) hidden
  </p>
)}
```

**Step 6:** Run `npx tsc --noEmit` — verify clean.

**Step 7:** Run `npx vitest run src/components/GoalCard.test.tsx` — verify existing tests pass.

**Step 8:** Commit: `git commit -m "feat: filter completed tasks based on hideCompletedAfterDays preference"`
