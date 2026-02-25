# Profile Page Timezone & Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add timezone dropdown to profile page and improve save feedback.

**Architecture:** Add a timezone `<select>` to the existing profile edit form. The PATCH /api/profile already accepts timezone. Add a "Saved" indicator after successful update.

**Tech Stack:** React, existing profileSlice RTK Query, Intl API

---

### Task 1: Add Timezone Dropdown to Profile Form

**Files:**
- Modify: `src/app/profile/page.tsx`

**Step 1:** Find the profile edit form section (it has bio textarea and location input). After the location field, add:

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Timezone
  </label>
  <select
    value={timezone}
    onChange={(e) => setTimezone(e.target.value)}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  >
    <option value="">Auto-detect</option>
    {Intl.supportedValuesOf("timeZone").map((tz) => (
      <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
    ))}
  </select>
</div>
```

**Step 2:** Add timezone to the state declarations. Find where `bio` and `location` state are initialized from profile data. Add:

```tsx
const [timezone, setTimezone] = useState(profile?.timezone || "");
```

**Step 3:** Include timezone in the save handler payload (find the updateProfile mutation call and add `timezone` to the object).

**Step 4:** Run `npx tsc --noEmit 2>&1 | grep profile` — verify clean.

**Step 5:** Commit: `git commit -m "feat: add timezone selector to profile page"`

---

### Task 2: Add Save Feedback Indicator

**Files:**
- Modify: `src/app/profile/page.tsx`

**Step 1:** Add a `saved` state:

```tsx
const [saved, setSaved] = useState(false);
```

**Step 2:** In the save handler, after the mutation resolves successfully, set saved and auto-clear:

```tsx
setSaved(true);
setTimeout(() => setSaved(false), 2000);
```

**Step 3:** Next to the Save button, add a feedback indicator:

```tsx
{saved && (
  <span className="text-sm text-green-600 font-medium">Saved!</span>
)}
```

**Step 4:** Commit: `git commit -m "feat: add save feedback indicator to profile page"`
