# Inline Goal Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to edit goal title, description, and icon inline from the GoalCard header.

**Architecture:** Add click-to-edit state to GoalCard. Pencil icon toggles edit mode. Title becomes `<input>`, description becomes `<textarea>`, icon shows an emoji picker. Save calls existing `updateGoal()` from useGoalsCRUD. No new API needed.

**Tech Stack:** React useState, existing useGoalsCRUD hook, existing useUpdateGoalMutation RTK Query

---

### Task 1: Add Edit Mode State and Toggle Button

**Files:**
- Modify: `src/components/GoalCard.tsx`

**Step 1:** Add state variables after the existing `useState` declarations (~line 68):

```tsx
const [isEditing, setIsEditing] = useState(false);
const [editTitle, setEditTitle] = useState(goal.title);
const [editDescription, setEditDescription] = useState(goal.description || "");
const [editIcon, setEditIcon] = useState(goal.icon || "🎯");
```

**Step 2:** Add a pencil edit button in the header, next to the delete and share buttons. Find the button group area with the delete `<button>` (has `title="Delete goal"`). Add before it:

```tsx
<button
  onClick={() => {
    setIsEditing(!isEditing);
    setEditTitle(goal.title);
    setEditDescription(goal.description || "");
    setEditIcon(goal.icon || "🎯");
  }}
  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
  title={isEditing ? "Cancel editing" : "Edit goal"}
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {isEditing ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    )}
  </svg>
</button>
```

**Step 3:** Run `npx tsc --noEmit 2>&1 | grep GoalCard` to verify no type errors.

**Step 4:** Commit: `git commit -m "feat: add edit mode state and toggle to GoalCard"`

---

### Task 2: Editable Title and Description

**Files:**
- Modify: `src/components/GoalCard.tsx`

**Step 1:** Replace the title `<h3>` rendering. Find the line that renders `goal.title` in an `<h3>` tag. Wrap it in a conditional:

```tsx
{isEditing ? (
  <input
    value={editTitle}
    onChange={(e) => setEditTitle(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") handleSaveEdit();
      if (e.key === "Escape") setIsEditing(false);
    }}
    className="text-base sm:text-lg font-bold bg-transparent border-b-2 border-blue-400 focus:border-blue-600 outline-none w-full text-gray-900"
    autoFocus
  />
) : (
  <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
    {goal.title}
  </h3>
)}
```

**Step 2:** Replace the description `<p>` rendering similarly:

```tsx
{isEditing ? (
  <textarea
    value={editDescription}
    onChange={(e) => setEditDescription(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Escape") setIsEditing(false);
    }}
    rows={2}
    className="text-xs sm:text-sm bg-transparent border border-gray-300 rounded px-2 py-1 focus:border-blue-400 outline-none w-full text-gray-600 resize-none mt-1"
    placeholder="Add a description..."
  />
) : (
  goal.description && (
    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 line-clamp-2">
      {goal.description}
    </p>
  )
)}
```

**Step 3:** Add the save handler after the state declarations:

```tsx
const handleSaveEdit = async () => {
  const updates: Record<string, string> = {};
  if (editTitle !== goal.title) updates.title = editTitle;
  if (editDescription !== (goal.description || "")) updates.description = editDescription;
  if (editIcon !== (goal.icon || "🎯")) updates.icon = editIcon;

  if (Object.keys(updates).length > 0) {
    await updateGoalMutation({ id: goal.id, updates });
  }
  setIsEditing(false);
};
```

**Step 4:** Run `npx tsc --noEmit 2>&1 | grep GoalCard` — verify clean.

**Step 5:** Commit: `git commit -m "feat: add inline title and description editing to GoalCard"`

---

### Task 3: Emoji Icon Picker

**Files:**
- Modify: `src/components/GoalCard.tsx`

**Step 1:** Add a `showEmojiPicker` state:

```tsx
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
```

**Step 2:** Replace the icon `<span>` in the header with a clickable version when editing:

```tsx
{isEditing ? (
  <div className="relative">
    <button
      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      className="text-2xl sm:text-3xl hover:bg-gray-100 rounded-lg p-1 transition-colors"
      title="Change icon"
    >
      {editIcon}
    </button>
    {showEmojiPicker && (
      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 grid grid-cols-6 gap-1">
        {["🎯", "📚", "💪", "🏃", "💻", "🎨", "🎵", "✈️", "💰", "🏠", "❤️", "⭐", "🔥", "🌱", "📈", "🎓", "🧘", "🍎"].map((emoji) => (
          <button
            key={emoji}
            onClick={() => { setEditIcon(emoji); setShowEmojiPicker(false); }}
            className="text-xl p-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    )}
  </div>
) : (
  <span className="text-2xl sm:text-3xl">{goal.icon || "🎯"}</span>
)}
```

**Step 3:** Add Save/Cancel buttons below the description when editing:

```tsx
{isEditing && (
  <div className="flex items-center gap-2 mt-2">
    <button
      onClick={handleSaveEdit}
      className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Save
    </button>
    <button
      onClick={() => setIsEditing(false)}
      className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
    >
      Cancel
    </button>
  </div>
)}
```

**Step 4:** Run `npx tsc --noEmit 2>&1 | grep GoalCard` — verify clean.

**Step 5:** Commit: `git commit -m "feat: add emoji picker and save/cancel for goal editing"`

---

### Task 4: Update GoalCard Tests

**Files:**
- Modify: `src/components/GoalCard.test.tsx`

**Step 1:** Add tests for edit mode:

```tsx
describe('Inline Editing', () => {
  it('should show edit button and toggle edit mode', () => {
    render(
      <GoalCard goal={mockGoal} progress={50} analytics={mockAnalytics}
        activityLog={mockActivityLog} streakHistory={mockStreakHistory} {...mockHandlers} />
    );
    const editBtn = screen.getByTitle('Edit goal');
    fireEvent.click(editBtn);
    // Should show input for title
    expect(screen.getByDisplayValue('Learn Spanish')).toBeInTheDocument();
  });

  it('should cancel editing on ESC', () => {
    render(
      <GoalCard goal={mockGoal} progress={50} analytics={mockAnalytics}
        activityLog={mockActivityLog} streakHistory={mockStreakHistory} {...mockHandlers} />
    );
    fireEvent.click(screen.getByTitle('Edit goal'));
    const input = screen.getByDisplayValue('Learn Spanish');
    fireEvent.keyDown(input, { key: 'Escape' });
    // Should return to non-edit mode
    expect(screen.queryByDisplayValue('Learn Spanish')).not.toBeInTheDocument();
  });

  it('should save changes on Save button click', async () => {
    render(
      <GoalCard goal={mockGoal} progress={50} analytics={mockAnalytics}
        activityLog={mockActivityLog} streakHistory={mockStreakHistory} {...mockHandlers} />
    );
    fireEvent.click(screen.getByTitle('Edit goal'));
    const input = screen.getByDisplayValue('Learn Spanish');
    fireEvent.change(input, { target: { value: 'Learn French' } });
    fireEvent.click(screen.getByText('Save'));
  });
});
```

**Step 2:** Run `npx vitest run src/components/GoalCard.test.tsx` — verify all pass.

**Step 3:** Commit: `git commit -m "test: add GoalCard inline editing tests"`
