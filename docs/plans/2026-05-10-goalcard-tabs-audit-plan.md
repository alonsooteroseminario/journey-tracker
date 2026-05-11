# Goal Card Tabs Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every Goal Card tab (Phases · Tasks · Calendar · Analytics · Resources) is only shown when it has data to display. The Tasks tab is always shown (default). If the user lands on a tab whose data becomes empty, the view auto-switches back to Tasks.

**Architecture:** Add `useMemo` predicates inside `GoalCard.tsx` that compute whether each non-default tab has data. Render the corresponding tab button conditionally. Add a `useEffect` that resets `viewMode` to `"tasks"` if the currently-active tab becomes hidden (e.g. user deletes the last phase). No prop or type changes — the audit reads existing data (`goal.phases`, `streakHistory`, `goalActivityLog`, `analytics`, `goal.budget|timeline|documents|resources`).

**Tech Stack:** React (hooks), Vitest, Tailwind. No new dependencies.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/GoalCard.tsx` | Modify | Predicates + conditional tab rendering + auto-reset effect |
| `src/components/GoalCard.test.tsx` | Modify | Add tests for hide/show behavior + auto-reset |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Modify | Append audit entry |

---

### Task 1: Define predicates and write tests for them

**Files:**
- Test: `src/components/GoalCard.test.tsx`

- [ ] **Step 1: Read current GoalCard.test.tsx imports + setup**

Run: `head -80 src/components/GoalCard.test.tsx`
Expected: existing mocks (`useUpdateGoalMutation`, `useGetGoalStreaksQuery`, `GoalGroupSelector`, `StreakBadge`, `ShareStreakButton`, `ShareGoalStatusButton`, `useUndoToast`). Note the test fixture shape for a goal.

- [ ] **Step 2: Add a new `describe` block at the bottom of the existing test file**

Append to `src/components/GoalCard.test.tsx`:

```tsx
describe('GoalCard tab visibility', () => {
  const baseProps = makeBaseProps(); // helper that returns valid required props — reuse existing helper if present, else inline the fixture used in earlier tests in this file.

  function renderExpandedCard(overrides: Partial<typeof baseProps['goal']> = {}) {
    const goal = { ...baseProps.goal, ...overrides };
    render(<GoalCard {...baseProps} goal={goal} />);
    // Card starts collapsed in some tests — expand it
    const expandBtn = screen.queryByTitle('Expand');
    if (expandBtn) fireEvent.click(expandBtn);
    return goal;
  }

  it('always shows the Tasks tab', () => {
    renderExpandedCard();
    expect(screen.getByRole('tab', { name: /Tasks/ })).toBeInTheDocument();
  });

  it('hides the Phases tab when goal.phases is empty', () => {
    renderExpandedCard({ phases: [] });
    expect(screen.queryByRole('tab', { name: /Phases/ })).not.toBeInTheDocument();
  });

  it('shows the Phases tab when goal.phases has at least one entry', () => {
    renderExpandedCard({ phases: [{ id: 'p1', name: 'Phase 1', description: '', taskIds: [] }] });
    expect(screen.getByRole('tab', { name: /Phases/ })).toBeInTheDocument();
  });

  it('hides the Calendar tab when streakHistory and activityLog are both empty', () => {
    render(
      <GoalCard
        {...baseProps}
        streakHistory={[]}
        activityLog={[]}
      />
    );
    const expandBtn = screen.queryByTitle('Expand');
    if (expandBtn) fireEvent.click(expandBtn);
    expect(screen.queryByRole('tab', { name: /Calendar/ })).not.toBeInTheDocument();
  });

  it('shows the Calendar tab when streakHistory has entries', () => {
    render(
      <GoalCard
        {...baseProps}
        streakHistory={[{ date: '2026-05-01', completed: true }]}
        activityLog={[]}
      />
    );
    const expandBtn = screen.queryByTitle('Expand');
    if (expandBtn) fireEvent.click(expandBtn);
    expect(screen.getByRole('tab', { name: /Calendar/ })).toBeInTheDocument();
  });

  it('hides the Analytics tab when analytics has no signal', () => {
    render(
      <GoalCard
        {...baseProps}
        analytics={{
          totalTasks: 0,
          completedTasks: 0,
          totalSubsteps: 0,
          completedSubsteps: 0,
          totalEstimatedCost: 0,
          totalActualCost: 0,
          averageTasksPerDay: 0,
          projectedCompletionDate: null,
          daysRemaining: null,
          completionRate: 0,
          weeklyProgress: [],
          monthlyProgress: [],
          costByPhase: [],
          velocityTrend: [],
        }}
      />
    );
    const expandBtn = screen.queryByTitle('Expand');
    if (expandBtn) fireEvent.click(expandBtn);
    expect(screen.queryByRole('tab', { name: /Analytics/ })).not.toBeInTheDocument();
  });

  it('shows the Analytics tab when totalTasks > 0', () => {
    render(
      <GoalCard
        {...baseProps}
        analytics={{
          totalTasks: 5,
          completedTasks: 2,
          totalSubsteps: 0,
          completedSubsteps: 0,
          totalEstimatedCost: 0,
          totalActualCost: 0,
          averageTasksPerDay: 0,
          projectedCompletionDate: null,
          daysRemaining: null,
          completionRate: 40,
          weeklyProgress: [],
          monthlyProgress: [],
          costByPhase: [],
          velocityTrend: [],
        }}
      />
    );
    const expandBtn = screen.queryByTitle('Expand');
    if (expandBtn) fireEvent.click(expandBtn);
    expect(screen.getByRole('tab', { name: /Analytics/ })).toBeInTheDocument();
  });

  it('hides the Resources tab when none of budget/timeline/documents/resources are set', () => {
    renderExpandedCard({ budget: undefined, timeline: undefined, documents: undefined, resources: undefined });
    expect(screen.queryByRole('tab', { name: /Resources/ })).not.toBeInTheDocument();
  });

  it('shows the Resources tab when goal.resources is set', () => {
    renderExpandedCard({ resources: { links: [] } as any });
    expect(screen.getByRole('tab', { name: /Resources/ })).toBeInTheDocument();
  });
});
```

Note: if `makeBaseProps()` does not already exist in the file, create one near the top of the test file that returns a full valid `GoalCardProps` object, then reuse in all the new tests. Look at the first `describe` block already in the file for the shape — copy that.

- [ ] **Step 3: Run the new tests — confirm they FAIL**

Run: `npx vitest run src/components/GoalCard.test.tsx -t "GoalCard tab visibility" --reporter=verbose`
Expected: all 9 new tests FAIL (current code renders all 5 tabs unconditionally). TDD red phase.

- [ ] **Step 4: Commit the failing tests**

```bash
git add src/components/GoalCard.test.tsx
git commit -m "test(goalcard): add tab visibility tests (red phase)"
```

---

### Task 2: Add predicates and conditional rendering

**Files:**
- Modify: `src/components/GoalCard.tsx`

- [ ] **Step 1: Read the current tab block + view rendering**

Run: `sed -n '395,460p' src/components/GoalCard.tsx`
Expected: the `<div role="tablist">` block with 5 unconditional `<button role="tab">` children.

- [ ] **Step 2: Add predicates near the top of the component, after existing useMemo calls**

Find the existing `useMemo` for `visibleTasks` (around line 153). Immediately after the existing `useMemo` block, add:

```tsx
  const hasPhasesTab = (goal.phases?.length ?? 0) > 0;
  const hasCalendarTab = (streakHistory?.length ?? 0) > 0 || (goalActivityLog?.length ?? 0) > 0;
  const hasAnalyticsTab =
    (analytics?.totalTasks ?? 0) > 0 ||
    (analytics?.weeklyProgress?.length ?? 0) > 0 ||
    (analytics?.velocityTrend?.length ?? 0) > 0;
  const hasResourcesTab = Boolean(
    goal.budget || goal.timeline || (goal.documents && goal.documents.length > 0) || goal.resources
  );
```

Place these as plain `const` (not `useMemo`) because they are O(1) checks on data already in scope — `useMemo` adds overhead without value.

- [ ] **Step 3: Wrap each conditional tab button in `&&`**

Replace the entire `<div role="tablist">` block (currently lines 399-455) with:

```tsx
          <div role="tablist" className="mt-2 sm:mt-4 grid grid-flow-col auto-cols-fr md:flex gap-0.5 sm:gap-2">
            {hasPhasesTab && (
              <button
                role="tab"
                aria-selected={viewMode === "phases"}
                onClick={() => { setViewMode("phases"); setSelectedPhase(null); }}
                className={`px-1 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[40px] rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                  viewMode === "phases" ? "bg-white text-brand-primary shadow-sm" : "text-gray-600 hover:bg-white/50"
                }`}
              >
                <span className="block sm:hidden">📊</span>
                <span className="hidden sm:inline">📊 Phases</span>
              </button>
            )}
            <button
              role="tab"
              aria-selected={viewMode === "tasks"}
              onClick={() => { setViewMode("tasks"); setSelectedPhase(null); }}
              className={`px-1 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[40px] rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                viewMode === "tasks" ? "bg-white text-brand-primary shadow-sm" : "text-gray-600 hover:bg-white/50"
              }`}
            >
              <span className="block sm:hidden">✅</span>
              <span className="hidden sm:inline">✅ Tasks</span>
            </button>
            {hasCalendarTab && (
              <button
                role="tab"
                aria-selected={viewMode === "calendar"}
                onClick={() => setViewMode("calendar")}
                className={`px-1 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[40px] rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                  viewMode === "calendar" ? "bg-white text-brand-primary shadow-sm" : "text-gray-600 hover:bg-white/50"
                }`}
              >
                <span className="block sm:hidden">📅</span>
                <span className="hidden sm:inline">📅 Calendar</span>
              </button>
            )}
            {hasAnalyticsTab && (
              <button
                role="tab"
                aria-selected={viewMode === "analytics"}
                onClick={() => setViewMode("analytics")}
                className={`px-1 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[40px] rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                  viewMode === "analytics" ? "bg-white text-brand-primary shadow-sm" : "text-gray-600 hover:bg-white/50"
                }`}
              >
                <span className="block sm:hidden">📈</span>
                <span className="hidden sm:inline">📈 Analytics</span>
              </button>
            )}
            {hasResourcesTab && (
              <button
                role="tab"
                aria-selected={viewMode === "info"}
                onClick={() => setViewMode("info")}
                className={`px-1 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[40px] rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                  viewMode === "info" ? "bg-white text-brand-primary shadow-sm" : "text-gray-600 hover:bg-white/50"
                }`}
              >
                <span className="block sm:hidden">ℹ️</span>
                <span className="hidden sm:inline">ℹ️ Resources</span>
              </button>
            )}
          </div>
```

Notes:
- Removed the hard-coded `grid-cols-5` (was assuming exactly 5 children). Switched to `grid-flow-col auto-cols-fr` so the grid auto-sizes by visible-tab count on mobile.
- Tasks tab is always rendered (no conditional wrapper).

- [ ] **Step 4: Add auto-reset effect**

Find the `useState` for `viewMode` (look for `const [viewMode, setViewMode] = useState`). Immediately after the state declarations near the top of the component, add:

```tsx
  useEffect(() => {
    if (viewMode === "phases" && !hasPhasesTab) setViewMode("tasks");
    else if (viewMode === "calendar" && !hasCalendarTab) setViewMode("tasks");
    else if (viewMode === "analytics" && !hasAnalyticsTab) setViewMode("tasks");
    else if (viewMode === "info" && !hasResourcesTab) setViewMode("tasks");
  }, [viewMode, hasPhasesTab, hasCalendarTab, hasAnalyticsTab, hasResourcesTab]);
```

If `useEffect` is not already imported at the top of the file, add it to the React import line: change `import { useState, useMemo } from 'react'` (or similar) to include `useEffect`.

- [ ] **Step 5: Run the failing tests — confirm they PASS**

Run: `npx vitest run src/components/GoalCard.test.tsx -t "GoalCard tab visibility" --reporter=verbose`
Expected: all 9 new tests PASS.

- [ ] **Step 6: Run the FULL GoalCard test file to catch regressions in existing tests**

Run: `npx vitest run src/components/GoalCard.test.tsx --reporter=basic`
Expected: all tests pass. Existing tests may rely on tabs being present — fixture overrides at the top of those tests should already populate the relevant data (phases/streakHistory/etc.), but if any existing test fails with "tab not found", check whether that test's fixture provides the right shape; update the fixture, not the production code.

- [ ] **Step 7: Run all GoalCard-adjacent test files**

Run: `npx vitest run --reporter=basic`
Expected: full suite passes (memory baseline ~1290+ tests).

- [ ] **Step 8: Smoke-test in the browser**

Run `npm run dev`. Open the home page. For each test case:
1. Create a fresh goal with no phases / no activity / no resources. Expand the card. Only the Tasks tab should be visible.
2. Add a phase via the chat agent. Expand the card. Phases tab appears.
3. Complete a task to generate a streak entry. Calendar tab appears.
4. Ask the chat agent to "add a budget of $500" to the goal. Resources tab appears.
5. With the Phases tab open, ask the agent to delete all phases. The card should auto-switch back to Tasks tab.

Stop the dev server when done.

- [ ] **Step 9: Commit**

```bash
git add src/components/GoalCard.tsx
git commit -m "feat(goalcard): hide tabs that have no data

Phases/Calendar/Analytics/Resources tabs only render when they have
data to display. Tasks tab is always shown (default). Auto-resets to
Tasks tab when the active tab becomes hidden (e.g. last phase deleted).

Grid layout switched from fixed grid-cols-5 to auto-cols-fr so the
tab strip auto-sizes by visible-tab count."
```

---

### Task 3: Update BMAD sprint status

**Files:**
- Modify: `_bmad-output/implementation-artifacts/sprint-status.yaml`

- [ ] **Step 1: Append entry**

```yaml
- date: 2026-05-10
  feature: goalcard-tabs-audit
  status: complete
  summary: GoalCard tabs (Phases/Calendar/Analytics/Resources) now only render when they have data. Tasks tab always shown. Auto-resets when active tab becomes empty.
  artifacts:
    - src/components/GoalCard.tsx
    - src/components/GoalCard.test.tsx
```

- [ ] **Step 2: Commit**

```bash
git add _bmad-output/implementation-artifacts/sprint-status.yaml
git commit -m "docs(bmad): record goalcard tabs audit in sprint status"
```

---

## Self-Review Checklist

- ✅ Spec coverage: each of the 5 tabs audited; Tasks always shown, others conditional.
- ✅ TDD order: tests first (red), implementation (green), full suite check.
- ✅ Auto-reset effect prevents the user from being stranded on an empty tab.
- ✅ Grid layout updated for variable tab count.
- ✅ No placeholders — every step has runnable code.
- ✅ Manual smoke test verifies all four conditional paths.

## Risks

- **Existing test fixtures may not populate all data shapes**: e.g. a test that fixtures a goal with no phases but then clicks the Phases tab will fail. The migration plan in Step 6 says "update the fixture, not the production code". If multiple existing tests rely on this, surface that during execution — may need a small fixture refactor.
- **`hasAnalyticsTab` heuristic**: chose `totalTasks > 0 || weeklyProgress.length > 0 || velocityTrend.length > 0` as the "has signal" check. If the project later adds another analytics dimension, update the predicate. Document this in the inline comment in the implementation step.
- **AutoReset effect could thrash**: if a parent re-renders with rapidly toggling data, the effect will keep resetting. In practice data toggles on user mutation only — not a concern, but worth noting if odd render loops appear.
