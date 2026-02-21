# Fix Streak Calculation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix streak calculation so it correctly tracks consecutive days of activity based on goal/task/substep completion dates, with consistent logic across all code paths.

**Architecture:** Extract streak update logic into a single shared utility (`src/lib/streaks/updateStreak.ts`) that is called from all completion paths (MCP tools, REST API, Kanban board). Remove duplicated streak calculation code. Fix timezone handling so `lastActivityDate` comparisons use user-local dates consistently.

**Tech Stack:** TypeScript, Prisma (MongoDB), Vitest, Next.js API routes, RTK Query

---

## Root Cause Analysis

Investigation found **7 bugs** in the current streak system:

### Bug 1: Kanban Board skips streak updates
- **File:** `src/components/kanban/KanbanBoard.tsx:58`
- **Problem:** Passes `() => {}` (no-op) for `triggerStreakUpdate`. Completing tasks/substeps via Kanban drag-and-drop never updates streaks.
- **Evidence:** Line 58: `() => {}  // triggerStreakUpdate`

### Bug 2: MCP `completeSubstep` doesn't update streaks
- **File:** `src/lib/mcp/tools/completeSubstep.ts`
- **Problem:** No streak update logic at all. When the AI agent marks a substep as completed, the streak is never updated. The client-side `useGoalsCRUD.toggleSubstep` DOES call `triggerStreakUpdate()`, creating an inconsistency between MCP and UI paths.

### Bug 3: Dual/inconsistent streak calculation algorithms
- **MCP path** (`completeTask.ts:126-141`): Sorts `streakHistory`, counts backward through consecutive days.
- **REST path** (`PATCH /api/streaks:104-110`): Simple `was yesterday? +1 : reset to 1`.
- **Problem:** Two completely different algorithms that can produce different `currentStreak` values if `streakHistory` is inconsistent.

### Bug 4: `lastActivityDate` timezone mismatch in GET /api/streaks
- **File:** `src/app/api/streaks/route.ts:33-34`
- **Problem:** `lastActivityDate` is stored as UTC `DateTime`. The GET route converts it via `.toISOString().split("T")[0]` which gives the UTC date, then compares with `isTodayInTimezone(lastDate, tz)` which uses the user's timezone.
- **Example:** User in UTC-8 logs activity at 10pm PST Feb 19 -> stored as Feb 20 00:00 UTC -> GET reads back "2026-02-20" -> compared against user's today "2026-02-19" -> false mismatch -> streak wrongly appears broken.

### Bug 5: Same timezone bug in MCP `getStreaks`
- **File:** `src/lib/mcp/tools/getStreaks.ts:63-64`
- **Problem:** Same `.toISOString().split('T')[0]` UTC conversion, then date arithmetic against timezone-aware `today`.

### Bug 6: `lastActivityDate` stored as UTC but represents a local date
- **File:** `src/lib/mcp/tools/completeTask.ts:148`
- **Problem:** `lastActivityDate: new Date(today)` where `today` is "2026-02-19" -> parsed as `2026-02-19T00:00:00.000Z` (UTC midnight). When reading back, `.toISOString().split('T')[0]` happens to return the correct date string, but only because of this lucky coincidence. The PATCH /api/streaks route does the same at line 120. This works but is fragile — any change to how the date is stored or read could break it.

### Bug 7: No streak update on goal-level completion
- **Problem:** Neither MCP tools nor API routes update streaks when a goal is completed (only individual tasks trigger streak updates). The user expects goal completions to count too.
- **Note:** Goals don't have a direct "complete" action in MCP — they're derived from task statuses. This bug is lower priority since completing all tasks in a goal already triggers streak updates. However, if a user completes tasks on different days and the goal transitions to "completed" on the last day, that's already covered.

---

## Fix Strategy

### Core Principle: Single Source of Truth for Streak Logic

Create one shared function `recordStreakActivity(userId, timezone)` that:
1. Gets or creates `StreakData` for the user
2. Adds today (in user's timezone) to `streakHistory` if not already present
3. Recalculates `currentStreak` from the full sorted `streakHistory` array (counting consecutive days backward from today)
4. Updates `longestStreak` if needed
5. Stores `lastActivityDate` as user's today string (YYYY-MM-DD) in the `streakHistory` — stop storing it as a UTC DateTime
6. Returns the updated streak data + whether a milestone was reached

Then call this function from **every completion path**.

---

## Tasks

### Task 1: Create shared streak utility with tests

**Files:**
- Create: `src/lib/streaks/updateStreak.ts`
- Create: `src/lib/streaks/index.ts`
- Create: `src/lib/streaks/__tests__/updateStreak.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/streaks/__tests__/updateStreak.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordStreakActivity, calculateStreakFromHistory } from '../updateStreak';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/dateUtils', () => ({
  getTodayInTimezone: vi.fn(() => '2026-02-20'),
}));

describe('calculateStreakFromHistory', () => {
  it('returns 0 for empty history', () => {
    expect(calculateStreakFromHistory([], '2026-02-20')).toBe(0);
  });

  it('returns 1 when only today is in history', () => {
    expect(calculateStreakFromHistory(['2026-02-20'], '2026-02-20')).toBe(1);
  });

  it('counts consecutive days backward from today', () => {
    const history = ['2026-02-18', '2026-02-19', '2026-02-20'];
    expect(calculateStreakFromHistory(history, '2026-02-20')).toBe(3);
  });

  it('stops counting at gaps', () => {
    const history = ['2026-02-15', '2026-02-18', '2026-02-19', '2026-02-20'];
    expect(calculateStreakFromHistory(history, '2026-02-20')).toBe(3);
  });

  it('returns 0 when today is NOT in history', () => {
    // If user hasn't logged today, streak from yesterday still valid
    // but currentStreak reflects "active streak including today"
    const history = ['2026-02-18', '2026-02-19'];
    expect(calculateStreakFromHistory(history, '2026-02-20')).toBe(0);
  });

  it('handles single gap correctly', () => {
    const history = ['2026-02-17', '2026-02-20'];
    expect(calculateStreakFromHistory(history, '2026-02-20')).toBe(1);
  });

  it('handles unsorted input', () => {
    const history = ['2026-02-20', '2026-02-18', '2026-02-19'];
    expect(calculateStreakFromHistory(history, '2026-02-20')).toBe(3);
  });
});

describe('recordStreakActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates StreakData if none exists', async () => {
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.streakData.create).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: new Date('2026-02-20'),
      streakHistory: ['2026-02-20'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await recordStreakActivity('user-1', 'America/Vancouver');

    expect(prisma.streakData.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        currentStreak: 1,
        streakHistory: ['2026-02-20'],
      }),
    });
    expect(result.currentStreak).toBe(1);
  });

  it('skips update if today already recorded', async () => {
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 5,
      longestStreak: 10,
      lastActivityDate: new Date('2026-02-20'),
      streakHistory: ['2026-02-18', '2026-02-19', '2026-02-20'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await recordStreakActivity('user-1', 'America/Vancouver');

    expect(prisma.streakData.update).not.toHaveBeenCalled();
    expect(result.currentStreak).toBe(5);
    expect(result.isNew).toBe(false);
  });

  it('adds today and recalculates streak', async () => {
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 2,
      longestStreak: 10,
      lastActivityDate: new Date('2026-02-19'),
      streakHistory: ['2026-02-18', '2026-02-19'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.streakData.update).mockResolvedValue({} as any);

    const result = await recordStreakActivity('user-1', 'America/Vancouver');

    expect(prisma.streakData.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: expect.objectContaining({
        currentStreak: 3,
        longestStreak: 10,
        streakHistory: ['2026-02-18', '2026-02-19', '2026-02-20'],
      }),
    });
    expect(result.currentStreak).toBe(3);
    expect(result.milestone).toBeNull();
  });

  it('detects milestone at 7 days', async () => {
    const history = ['2026-02-14', '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19'];
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 6,
      longestStreak: 6,
      lastActivityDate: new Date('2026-02-19'),
      streakHistory: history,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.streakData.update).mockResolvedValue({} as any);

    const result = await recordStreakActivity('user-1', 'America/Vancouver');

    expect(result.currentStreak).toBe(7);
    expect(result.milestone).toBe(7);
    expect(result.longestStreak).toBe(7);
  });

  it('updates longestStreak when surpassed', async () => {
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 10,
      longestStreak: 10,
      lastActivityDate: new Date('2026-02-19'),
      streakHistory: Array.from({ length: 10 }, (_, i) => {
        const d = new Date('2026-02-10');
        d.setDate(d.getDate() + i);
        return d.toISOString().split('T')[0];
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.streakData.update).mockResolvedValue({} as any);

    const result = await recordStreakActivity('user-1', 'America/Vancouver');

    expect(result.currentStreak).toBe(11);
    expect(result.longestStreak).toBe(11);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/streaks/__tests__/updateStreak.test.ts`
Expected: FAIL — module `../updateStreak` does not exist

**Step 3: Write the implementation**

```typescript
// src/lib/streaks/updateStreak.ts
import { prisma } from '@/lib/prisma';
import { getTodayInTimezone } from '@/lib/dateUtils';

const MILESTONES = [7, 14, 30, 60, 100];

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakHistory: string[];
  /** Non-null if a milestone was just reached */
  milestone: number | null;
  /** Whether a new day was actually recorded (false = already logged today) */
  isNew: boolean;
}

/**
 * Calculate current streak from a sorted history of YYYY-MM-DD date strings.
 * Counts consecutive days backward from `today`. Returns 0 if today is not in history.
 */
export function calculateStreakFromHistory(history: string[], today: string): number {
  if (history.length === 0) return 0;

  const sorted = [...history].sort();
  const todayIndex = sorted.indexOf(today);
  if (todayIndex === -1) return 0;

  let streak = 1;
  for (let i = todayIndex; i > 0; i--) {
    const current = new Date(sorted[i] + 'T00:00:00');
    const previous = new Date(sorted[i - 1] + 'T00:00:00');
    const diffMs = current.getTime() - previous.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Record a streak activity for the user. Idempotent per day.
 * Call this from ANY completion path (MCP tools, REST API, Kanban).
 */
export async function recordStreakActivity(
  userId: string,
  timezone?: string | null,
): Promise<StreakUpdateResult> {
  const today = getTodayInTimezone(timezone);

  const existing = await prisma.streakData.findUnique({
    where: { userId },
  });

  // No record yet — create with today as first entry
  if (!existing) {
    const created = await prisma.streakData.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date(today + 'T00:00:00'),
        streakHistory: [today],
      },
    });
    return {
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
      streakHistory: [today],
      milestone: null,
      isNew: true,
    };
  }

  // Already logged today — return current data without writing
  if (existing.streakHistory.includes(today)) {
    return {
      currentStreak: existing.currentStreak,
      longestStreak: existing.longestStreak,
      lastActivityDate: today,
      streakHistory: existing.streakHistory,
      milestone: null,
      isNew: false,
    };
  }

  // New day — add to history and recalculate
  const newHistory = [...existing.streakHistory, today];
  const currentStreak = calculateStreakFromHistory(newHistory, today);
  const longestStreak = Math.max(currentStreak, existing.longestStreak);
  const milestone = MILESTONES.includes(currentStreak) ? currentStreak : null;

  await prisma.streakData.update({
    where: { userId },
    data: {
      currentStreak,
      longestStreak,
      lastActivityDate: new Date(today + 'T00:00:00'),
      streakHistory: newHistory,
    },
  });

  return {
    currentStreak,
    longestStreak,
    lastActivityDate: today,
    streakHistory: newHistory,
    milestone,
    isNew: true,
  };
}
```

```typescript
// src/lib/streaks/index.ts
export { recordStreakActivity, calculateStreakFromHistory } from './updateStreak';
export type { StreakUpdateResult } from './updateStreak';
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/streaks/__tests__/updateStreak.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/streaks/
git commit -m "feat: extract shared streak calculation utility with tests"
```

---

### Task 2: Refactor MCP `completeTask` to use shared utility

**Files:**
- Modify: `src/lib/mcp/tools/completeTask.ts` (lines 120-173)
- Modify: `src/lib/mcp/tools/__tests__/completeTask.test.ts`

**Step 1: Update the existing test to verify streak utility is called**

In `src/lib/mcp/tools/__tests__/completeTask.test.ts`, add:

```typescript
vi.mock('@/lib/streaks', () => ({
  recordStreakActivity: vi.fn().mockResolvedValue({
    currentStreak: 3,
    longestStreak: 10,
    milestone: null,
    isNew: true,
    lastActivityDate: '2026-02-20',
    streakHistory: ['2026-02-18', '2026-02-19', '2026-02-20'],
  }),
}));
```

And update the completion test to assert `recordStreakActivity` was called instead of raw `prisma.streakData` operations.

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/mcp/tools/__tests__/completeTask.test.ts`
Expected: FAIL — `completeTask` still uses inline streak logic, not the mock

**Step 3: Refactor `completeTask.ts`**

Replace lines 120-173 (the inline streak calculation + milestone logic) with:

```typescript
import { recordStreakActivity } from '@/lib/streaks';

// ... inside executeCompleteTask, after tracking activity, replace streak block with:

    // Update streak when completing
    if (args.status === 'completed') {
      const streakResult = await recordStreakActivity(user.id, user.timezone);

      // Send milestone notification if reached
      if (streakResult.milestone) {
        notify(user.id, 'streakMilestone', {
          userName: user.name,
          streakCount: streakResult.milestone,
        }).catch((err) => console.error('Failed to send streak milestone email:', err));

        trackActivity({
          userId: user.id,
          type: 'streak_milestone',
          action: `${user.name} reached a ${streakResult.milestone}-day streak! 🔥`,
          metadata: { streakCount: streakResult.milestone },
          createFeedItem: true,
          feedVisibility: 'friends',
        }).catch((err) => console.error('Failed to track streak milestone:', err));
      }

      auditLogger.logTaskCompleted(userId, args.goalId, args.taskId);
    }
```

Remove the `getTodayInTimezone` import if no longer used elsewhere in the file.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/mcp/tools/__tests__/completeTask.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/mcp/tools/completeTask.ts src/lib/mcp/tools/__tests__/completeTask.test.ts
git commit -m "refactor: use shared streak utility in completeTask MCP tool"
```

---

### Task 3: Add streak updates to MCP `completeSubstep`

**Files:**
- Modify: `src/lib/mcp/tools/completeSubstep.ts` (add streak logic after line 131)
- Create: `src/lib/mcp/tools/__tests__/completeSubstep.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/mcp/tools/__tests__/completeSubstep.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCompleteSubstep } from '../completeSubstep';
import { prisma } from '@/lib/prisma';
import { recordStreakActivity } from '@/lib/streaks';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/agent/security');
vi.mock('@/lib/agent/auditLog');
vi.mock('@/lib/streaks', () => ({
  recordStreakActivity: vi.fn().mockResolvedValue({
    currentStreak: 2,
    longestStreak: 5,
    milestone: null,
    isNew: true,
    lastActivityDate: '2026-02-20',
    streakHistory: ['2026-02-19', '2026-02-20'],
  }),
}));

describe('executeCompleteSubstep', () => {
  const mockUser = { id: 'user-mongo-id', clerkId: 'clerk-123', timezone: 'America/Vancouver' };
  const mockGoal = {
    id: 'goal-1',
    title: 'My Goal',
    tasks: [
      {
        id: 'task-1',
        title: 'Task 1',
        status: 'not_started',
        substeps: [
          { id: 'substep-1', title: 'Substep 1', status: 'not_started' },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update streak when substep is completed', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({} as any);
    vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);

    await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'substep-1', status: 'completed' },
      'clerk-123'
    );

    expect(recordStreakActivity).toHaveBeenCalledWith('user-mongo-id', 'America/Vancouver');
  });

  it('should NOT update streak when substep status is not completed', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue({
      ...mockGoal,
      tasks: [{
        ...mockGoal.tasks[0],
        substeps: [{ id: 'substep-1', title: 'Substep 1', status: 'completed' }],
      }],
    } as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({} as any);
    vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);

    await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'substep-1', status: 'not_started' },
      'clerk-123'
    );

    expect(recordStreakActivity).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/mcp/tools/__tests__/completeSubstep.test.ts`
Expected: FAIL — `recordStreakActivity` is never called

**Step 3: Add streak logic to `completeSubstep.ts`**

Add import at top:
```typescript
import { recordStreakActivity } from '@/lib/streaks';
```

After the existing audit log block (line 131-133), add:

```typescript
    // Update streak when completing
    if (args.status === 'completed') {
      await recordStreakActivity(user.id, user.timezone);
      auditLogger.logSubstepCompleted(userId, args.goalId, args.taskId, args.substepId);
    }
```

Replace the existing `if (args.status === 'completed')` block which only had audit logging.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/mcp/tools/__tests__/completeSubstep.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/mcp/tools/completeSubstep.ts src/lib/mcp/tools/__tests__/completeSubstep.test.ts
git commit -m "feat: add streak updates to completeSubstep MCP tool"
```

---

### Task 4: Fix PATCH /api/streaks to use shared utility

**Files:**
- Modify: `src/app/api/streaks/route.ts` (PATCH handler, lines 64-138)
- Create: `src/app/api/streaks/route.test.ts`

**Step 1: Write the failing test**

```typescript
// src/app/api/streaks/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));
vi.mock('@/lib/streaks', () => ({
  recordStreakActivity: vi.fn(),
}));

describe('PATCH /api/streaks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call recordStreakActivity with user id and timezone', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    const { recordStreakActivity } = await import('@/lib/streaks');
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'user-1',
      timezone: 'America/New_York',
    } as any);
    vi.mocked(recordStreakActivity).mockResolvedValue({
      currentStreak: 3,
      longestStreak: 5,
      lastActivityDate: '2026-02-20',
      streakHistory: ['2026-02-18', '2026-02-19', '2026-02-20'],
      milestone: null,
      isNew: true,
    });

    const { PATCH } = await import('@/app/api/streaks/route');
    const response = await PATCH();
    const json = await response.json();

    expect(recordStreakActivity).toHaveBeenCalledWith('user-1', 'America/New_York');
    expect(json.currentStreak).toBe(3);
    expect(json.longestStreak).toBe(5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/streaks/route.test.ts`
Expected: FAIL — PATCH still uses inline logic, not `recordStreakActivity`

**Step 3: Refactor PATCH handler**

Replace the entire PATCH function in `src/app/api/streaks/route.ts`:

```typescript
import { recordStreakActivity } from '@/lib/streaks';

// PATCH /api/streaks - Record activity and update streak
export async function PATCH() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await recordStreakActivity(user.id, user.timezone);

    return NextResponse.json({
      currentStreak: result.currentStreak,
      longestStreak: result.longestStreak,
      lastActivityDate: result.lastActivityDate,
      streakHistory: result.streakHistory,
    });
  } catch (error) {
    console.error("PATCH /api/streaks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

Remove unused imports (`getTodayInTimezone`, `isTodayInTimezone`, `isYesterdayInTimezone`) if GET handler is also updated (see Task 5).

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/api/streaks/route.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/app/api/streaks/route.ts src/app/api/streaks/route.test.ts
git commit -m "refactor: use shared streak utility in PATCH /api/streaks"
```

---

### Task 5: Fix GET /api/streaks timezone bug

**Files:**
- Modify: `src/app/api/streaks/route.ts` (GET handler, lines 7-61)
- Update: `src/app/api/streaks/route.test.ts`

**Step 1: Write the failing test**

Add to `src/app/api/streaks/route.test.ts`:

```typescript
describe('GET /api/streaks', () => {
  it('should use calculateStreakFromHistory for reset check', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'user-1',
      timezone: 'America/Vancouver',
    } as any);

    // Simulate: lastActivityDate stored as UTC "2026-02-20" but user is in UTC-8
    // where it's still Feb 19. The old code would compare UTC date vs local date = mismatch.
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 5,
      longestStreak: 10,
      lastActivityDate: new Date('2026-02-20T00:00:00Z'),
      streakHistory: ['2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { GET } = await import('@/app/api/streaks/route');
    const response = await GET();
    const json = await response.json();

    // Should use streakHistory (which stores correct user-local dates) for calculation
    // NOT lastActivityDate (which is timezone-ambiguous)
    expect(json.currentStreak).toBeGreaterThan(0);
    expect(json.streakHistory).toContain('2026-02-20');
  });
});
```

**Step 2: Run test to verify behavior**

Run: `npx vitest run src/app/api/streaks/route.test.ts`

**Step 3: Refactor GET handler**

Replace the GET handler to use `calculateStreakFromHistory` from the shared utility instead of comparing `lastActivityDate`:

```typescript
import { calculateStreakFromHistory } from '@/lib/streaks';
import { getTodayInTimezone } from '@/lib/dateUtils';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let streakData = await prisma.streakData.findUnique({
      where: { userId: user.id },
    });

    if (!streakData) {
      streakData = await prisma.streakData.create({
        data: {
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
          streakHistory: [],
        },
      });
    }

    const today = getTodayInTimezone(user.timezone);

    // Recalculate from history — this is the source of truth
    const currentStreak = calculateStreakFromHistory(streakData.streakHistory, today);

    // If streak diverged from stored value, update it
    if (currentStreak !== streakData.currentStreak) {
      await prisma.streakData.update({
        where: { id: streakData.id },
        data: { currentStreak },
      });
    }

    // Determine lastActivityDate from history (last entry)
    const sortedHistory = [...streakData.streakHistory].sort();
    const lastActivityDate = sortedHistory.length > 0
      ? sortedHistory[sortedHistory.length - 1]
      : null;

    return NextResponse.json({
      currentStreak,
      longestStreak: streakData.longestStreak,
      lastActivityDate,
      streakHistory: streakData.streakHistory,
    }, {
      headers: { 'Cache-Control': 'private, no-cache' },
    });
  } catch (error) {
    console.error("GET /api/streaks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/api/streaks/route.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/app/api/streaks/route.ts src/app/api/streaks/route.test.ts
git commit -m "fix: use streakHistory as source of truth in GET /api/streaks"
```

---

### Task 6: Fix MCP `getStreaks` timezone bug

**Files:**
- Modify: `src/lib/mcp/tools/getStreaks.ts` (lines 62-84)
- Update: `src/lib/mcp/tools/__tests__/getStreaks.test.ts`

**Step 1: Write/update the test**

Ensure the existing test verifies `calculateStreakFromHistory` is used instead of raw date arithmetic.

**Step 2: Refactor `getStreaks.ts`**

Replace the streak-reset check (lines 62-84) with:

```typescript
import { calculateStreakFromHistory } from '@/lib/streaks';

// ... inside executeGetStreaks, after fetching streakData:

    const today = getTodayInTimezone(user.timezone);

    // Recalculate from history — single source of truth
    let currentStreak = calculateStreakFromHistory(streakData.streakHistory, today);

    // Also check yesterday to show "active but not yet logged today"
    if (currentStreak === 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getTodayInTimezone(user.timezone); // need isYesterdayInTimezone
      // If last entry in history is yesterday, streak is still "alive" but not yet logged today
      const sorted = [...streakData.streakHistory].sort();
      if (sorted.length > 0 && sorted[sorted.length - 1] === (() => {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: user.timezone || undefined,
          year: 'numeric', month: '2-digit', day: '2-digit',
        }).format(y);
      })()) {
        currentStreak = calculateStreakFromHistory([...streakData.streakHistory, today], today);
        // But don't write today yet — user hasn't completed anything
        currentStreak = currentStreak - 1; // Subtract the fake "today"
      }
    }

    // Update stored value if it diverged
    if (currentStreak !== streakData.currentStreak) {
      await prisma.streakData.update({
        where: { userId: user.id },
        data: { currentStreak },
      });
    }

    const sortedHistory = [...streakData.streakHistory].sort();
    const lastActivityDate = sortedHistory.length > 0
      ? sortedHistory[sortedHistory.length - 1]
      : null;
```

**NOTE:** The "yesterday still alive" logic above is complex. A simpler approach: just report `currentStreak` as the count from `calculateStreakFromHistory`. If today isn't in history, streak shows 0 until the user logs activity. This is actually correct behavior — the streak counter should reflect "how many consecutive days including today". The StreakCounter component already shows "Complete a task to keep your streak!" when `currentStreak === 0`.

**Simpler replacement:**

```typescript
import { calculateStreakFromHistory } from '@/lib/streaks';

// Replace lines 62-84 with:
    const today = getTodayInTimezone(user.timezone);
    const currentStreak = calculateStreakFromHistory(streakData.streakHistory, today);

    if (currentStreak !== streakData.currentStreak) {
      await prisma.streakData.update({
        where: { userId: user.id },
        data: { currentStreak },
      });
    }

    const sortedHistory = [...(streakData.streakHistory || [])].sort();
    const lastActivityDate = sortedHistory.length > 0
      ? sortedHistory[sortedHistory.length - 1]
      : null;
```

**Step 3: Run tests**

Run: `npx vitest run src/lib/mcp/tools/__tests__/getStreaks.test.ts`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/lib/mcp/tools/getStreaks.ts src/lib/mcp/tools/__tests__/getStreaks.test.ts
git commit -m "fix: use shared streak calculation in getStreaks MCP tool"
```

---

### Task 7: Fix Kanban Board streak updates

**Files:**
- Modify: `src/components/kanban/KanbanBoard.tsx` (line 56-59)

**Step 1: Identify the problem**

The Kanban board creates its own `useGoalsCRUD` with no-op callbacks:
```typescript
const { ... } = useGoalsCRUD(
  () => {}, // logActivity
  () => {}  // triggerStreakUpdate
);
```

**Step 2: Fix by wiring up real callbacks**

Import and use the real hooks:

```typescript
import { useStreakData } from '@/hooks/useStreakData';

// Inside the KanbanBoard component, add:
const { triggerStreakUpdate, logActivity } = useStreakData();

// Replace the useGoalsCRUD call:
const {
  goals,
  goalsLoading,
  toggleTask,
  toggleSubstep,
  updateTask,
  updateSubstep,
  updateGoal,
} = useGoalsCRUD(logActivity, triggerStreakUpdate);
```

**Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS (Kanban board tests may need mock updates)

**Step 4: Commit**

```bash
git add src/components/kanban/KanbanBoard.tsx
git commit -m "fix: wire up streak updates in Kanban board"
```

---

### Task 8: Run full test suite + build verification

**Files:** None (verification only)

**Step 1: Run unit tests**

Run: `npx vitest run`
Expected: All tests PASS (300+ tests)

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: cleanup after streak calculation fix"
```

---

## Dependency Graph

```
Task 1 (shared utility)
  ├── Task 2 (refactor completeTask)
  ├── Task 3 (add to completeSubstep)
  ├── Task 4 (refactor PATCH /api/streaks)
  ├── Task 5 (fix GET /api/streaks)
  └── Task 6 (fix getStreaks MCP)
Task 7 (Kanban board) — independent, no dependency on Task 1
Task 8 (verification) — depends on ALL above
```

**Execution order:** Task 1 first, then Tasks 2-7 in any order (can be parallelized), then Task 8 last.

---

## Summary of Changes

| Bug | Fix | Task |
|-----|-----|------|
| Kanban skips streak updates | Wire real `triggerStreakUpdate` callback | 7 |
| `completeSubstep` MCP missing streak | Add `recordStreakActivity` call | 3 |
| Dual calculation algorithms | Single `calculateStreakFromHistory` function | 1, 2, 4 |
| `lastActivityDate` timezone mismatch (GET) | Use `streakHistory` as source of truth | 5 |
| `lastActivityDate` timezone mismatch (MCP) | Use `calculateStreakFromHistory` | 6 |
| Fragile `lastActivityDate` storage | Derive from `streakHistory` instead | 5, 6 |
| No goal-level streak (low priority) | Already covered by task completions | N/A |
