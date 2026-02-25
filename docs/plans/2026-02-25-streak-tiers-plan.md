# Gold/Silver/Bronze Streak Tiers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement per-goal streak tracking with Bronze/Silver/Gold tier badges. Only completions count. Bronze = 1 day on a goal, Silver = 7+ days on a goal, Gold = all goals active today.

**Architecture:** New `GoalStreak` Prisma model tracking per-goal completion streaks. Streak update logic triggered when tasks/substeps are completed. Tier computed at read time from GoalStreak records. API endpoints for fetching per-goal streaks and tier summaries. Badges on GoalCard and KanbanCard.

**Tech Stack:** Prisma + MongoDB, Next.js API routes, RTK Query, React, Tailwind CSS

---

## Task 1: Add GoalStreak model to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

### Step 1: Add GoalStreak model

In `prisma/schema.prisma`, add after the StreakData model (after line 102):

```prisma
model GoalStreak {
  id     String @id @default(auto()) @map("_id") @db.ObjectId
  goalId String @db.ObjectId
  userId String @db.ObjectId
  user   User   @relation("UserGoalStreaks", fields: [userId], references: [id], onDelete: Cascade)

  currentStreak      Int       @default(0)
  longestStreak      Int       @default(0)
  lastCompletionDate DateTime?
  streakHistory      String[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([goalId, userId])
  @@map("goal_streaks")
}
```

### Step 2: Add relation to User model

In the User model, add:

```prisma
  goalStreaks GoalStreak[] @relation("UserGoalStreaks")
```

### Step 3: Regenerate Prisma client

Run: `npx prisma generate`

### Step 4: Commit

```bash
git add prisma/schema.prisma
git commit -m "feat: add GoalStreak model for per-goal completion streaks"
```

---

## Task 2: Add GoalStreak TypeScript types

**Files:**
- Modify: `src/types/index.ts`

### Step 1: Add GoalStreak interface and StreakTier type

After the StreakData interface (around line 86):

```typescript
export interface GoalStreak {
  id: string;
  goalId: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate?: string;
  streakHistory: string[];
  createdAt: string;
  updatedAt: string;
}

export type StreakTier = "bronze" | "silver" | "gold" | null;

export interface StreakTierSummary {
  goalStreaks: Array<GoalStreak & { goalTitle: string; goalIcon?: string; tier: StreakTier }>;
  hasGold: boolean;
  silverCount: number;
  bronzeCount: number;
}
```

### Step 2: Verify build

Run: `npx tsc --noEmit`

### Step 3: Commit

```bash
git add src/types/index.ts
git commit -m "feat: add GoalStreak and StreakTier TypeScript types"
```

---

## Task 3: Create streak update utility

**Files:**
- Create: `src/lib/streaks/goalStreakUpdater.ts`

### Step 1: Write the failing test

Create `src/lib/streaks/goalStreakUpdater.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateGoalStreak } from "./goalStreakUpdater";
import { prisma } from "@/lib/prisma";

const mockGoalStreakUpsert = prisma.goalStreak.upsert as ReturnType<typeof vi.fn>;

describe("updateGoalStreak", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates new streak record when none exists", async () => {
    mockGoalStreakUpsert.mockResolvedValue({
      id: "streak-1",
      goalId: "goal-1",
      userId: "user-1",
      currentStreak: 1,
      longestStreak: 1,
    });

    await updateGoalStreak("goal-1", "user-1");

    expect(mockGoalStreakUpsert).toHaveBeenCalledOnce();
    const call = mockGoalStreakUpsert.mock.calls[0][0];
    expect(call.where).toEqual({ goalId_userId: { goalId: "goal-1", userId: "user-1" } });
  });

  it("increments streak when last completion was yesterday", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    mockGoalStreakUpsert.mockResolvedValue({});

    // We need to mock findUnique to return existing streak
    (prisma.goalStreak.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      currentStreak: 5,
      longestStreak: 10,
      lastCompletionDate: yesterday,
      streakHistory: [],
    });

    await updateGoalStreak("goal-1", "user-1");
    expect(mockGoalStreakUpsert).toHaveBeenCalledOnce();
  });
});
```

### Step 2: Run test to verify it fails

Run: `npx vitest run src/lib/streaks/goalStreakUpdater.test.ts`
Expected: FAIL (module not found)

### Step 3: Write the implementation

Create `src/lib/streaks/goalStreakUpdater.ts`:

```typescript
import { prisma } from "@/lib/prisma";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function updateGoalStreak(goalId: string, userId: string): Promise<void> {
  const todayStr = toDateStr(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const existing = await prisma.goalStreak.findUnique({
    where: { goalId_userId: { goalId, userId } },
  });

  let newStreak = 1;
  let longestStreak = 1;

  if (existing) {
    const lastDate = existing.lastCompletionDate
      ? new Date(existing.lastCompletionDate)
      : null;

    if (lastDate) {
      lastDate.setHours(0, 0, 0, 0);
      const lastDateStr = toDateStr(lastDate);

      if (lastDateStr === todayStr) {
        // Already completed today — no change needed
        return;
      } else if (lastDate.getTime() === yesterday.getTime()) {
        // Consecutive day — increment
        newStreak = existing.currentStreak + 1;
      }
      // else: gap — reset to 1
    }

    longestStreak = Math.max(existing.longestStreak, newStreak);
  }

  await prisma.goalStreak.upsert({
    where: { goalId_userId: { goalId, userId } },
    create: {
      goalId,
      userId,
      currentStreak: newStreak,
      longestStreak,
      lastCompletionDate: new Date(),
      streakHistory: [todayStr],
    },
    update: {
      currentStreak: newStreak,
      longestStreak,
      lastCompletionDate: new Date(),
      streakHistory: { push: todayStr },
    },
  });
}
```

### Step 4: Run tests

Run: `npx vitest run src/lib/streaks/goalStreakUpdater.test.ts`
Expected: Tests pass

### Step 5: Commit

```bash
git add src/lib/streaks/goalStreakUpdater.ts src/lib/streaks/goalStreakUpdater.test.ts
git commit -m "feat: add goalStreakUpdater utility for per-goal completion streaks"
```

---

## Task 4: Create tier computation utility

**Files:**
- Create: `src/lib/streaks/computeTier.ts`

### Step 1: Write the failing test

Create `src/lib/streaks/computeTier.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computeGoalTier, computeGoldStatus } from "./computeTier";

describe("computeGoalTier", () => {
  it("returns null when streak is 0", () => {
    expect(computeGoalTier(0)).toBeNull();
  });

  it("returns bronze for streak 1-6", () => {
    expect(computeGoalTier(1)).toBe("bronze");
    expect(computeGoalTier(6)).toBe("bronze");
  });

  it("returns silver for streak 7+", () => {
    expect(computeGoalTier(7)).toBe("silver");
    expect(computeGoalTier(30)).toBe("silver");
  });
});

describe("computeGoldStatus", () => {
  it("returns true when all goals have bronze+ streaks", () => {
    const streaks = [
      { currentStreak: 1, goalId: "g1" },
      { currentStreak: 3, goalId: "g2" },
    ];
    expect(computeGoldStatus(streaks as any[], 2)).toBe(true);
  });

  it("returns false when any goal has 0 streak", () => {
    const streaks = [
      { currentStreak: 1, goalId: "g1" },
      { currentStreak: 0, goalId: "g2" },
    ];
    expect(computeGoldStatus(streaks as any[], 2)).toBe(false);
  });

  it("returns false when not all goals have streaks", () => {
    const streaks = [{ currentStreak: 1, goalId: "g1" }];
    expect(computeGoldStatus(streaks as any[], 3)).toBe(false);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npx vitest run src/lib/streaks/computeTier.test.ts`

### Step 3: Write implementation

Create `src/lib/streaks/computeTier.ts`:

```typescript
import { StreakTier, GoalStreak } from "@/types";

export function computeGoalTier(currentStreak: number): StreakTier {
  if (currentStreak >= 7) return "silver";
  if (currentStreak >= 1) return "bronze";
  return null;
}

export function computeGoldStatus(goalStreaks: GoalStreak[], totalGoalCount: number): boolean {
  if (totalGoalCount === 0) return false;
  if (goalStreaks.length < totalGoalCount) return false;
  return goalStreaks.every((s) => s.currentStreak >= 1);
}
```

### Step 4: Run tests

Run: `npx vitest run src/lib/streaks/computeTier.test.ts`
Expected: All pass

### Step 5: Commit

```bash
git add src/lib/streaks/computeTier.ts src/lib/streaks/computeTier.test.ts
git commit -m "feat: add tier computation utility (bronze/silver/gold)"
```

---

## Task 5: Create GoalStreak API routes

**Files:**
- Create: `src/app/api/streaks/goals/route.ts`
- Create: `src/app/api/streaks/tiers/route.ts`

### Step 1: Create GET /api/streaks/goals

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const goalStreaks = await prisma.goalStreak.findMany({
    where: { userId: user.id },
  });

  return NextResponse.json(goalStreaks);
}
```

### Step 2: Create GET /api/streaks/tiers

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { computeGoalTier, computeGoldStatus } from "@/lib/streaks/computeTier";

export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [goalStreaks, goals] = await Promise.all([
    prisma.goalStreak.findMany({ where: { userId: user.id } }),
    prisma.goal.findMany({ where: { userId: user.id }, select: { id: true, title: true, icon: true } }),
  ]);

  const enriched = goalStreaks.map((s) => {
    const goal = goals.find((g) => g.id === s.goalId);
    return {
      ...s,
      goalTitle: goal?.title || "Unknown",
      goalIcon: goal?.icon,
      tier: computeGoalTier(s.currentStreak),
    };
  });

  const hasGold = computeGoldStatus(goalStreaks as any[], goals.length);

  return NextResponse.json({
    goalStreaks: enriched,
    hasGold,
    silverCount: enriched.filter((s) => s.tier === "silver").length,
    bronzeCount: enriched.filter((s) => s.tier === "bronze").length,
  });
}
```

### Step 3: Verify build

Run: `npx tsc --noEmit`

### Step 4: Commit

```bash
git add src/app/api/streaks/goals/route.ts src/app/api/streaks/tiers/route.ts
git commit -m "feat: add GoalStreak and tier summary API endpoints"
```

---

## Task 6: Trigger streak update on task/substep completion

**Files:**
- Modify: `src/hooks/useGoalsCRUD.ts`

### Step 1: Import updateGoalStreak

At the top of `useGoalsCRUD.ts`, add:

```typescript
import { updateGoalStreak } from "@/lib/streaks/goalStreakUpdater";
```

Note: `updateGoalStreak` calls Prisma directly, but `useGoalsCRUD` runs on the client. We need a different approach — call a server action or API endpoint.

**Alternative approach:** Create a lightweight API route `POST /api/streaks/goals/update` that calls `updateGoalStreak`. Then call it from the client after a completion mutation.

### Step 2: Create POST /api/streaks/goals/update

Create `src/app/api/streaks/goals/update/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/auth";
import { updateGoalStreak } from "@/lib/streaks/goalStreakUpdater";

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { goalId } = await req.json();
  if (!goalId) return NextResponse.json({ error: "goalId required" }, { status: 400 });

  await updateGoalStreak(goalId, user.id);
  return NextResponse.json({ success: true });
}
```

### Step 3: Add RTK Query mutation for streak update

In `src/store/slices/streaksSlice.ts`, add endpoint:

```typescript
updateGoalStreak: builder.mutation<void, string>({
  query: (goalId) => ({
    url: "/streaks/goals/update",
    method: "POST",
    body: { goalId },
  }),
}),
```

### Step 4: Call streak update in useGoalsCRUD on completion

In `useGoalsCRUD.ts`, after `toggleTask` and `toggleSubstep` mark an item as completed:
- If new status is 'completed', call the streak update mutation with the goalId

### Step 5: Verify build

Run: `npx tsc --noEmit`

### Step 6: Commit

```bash
git add src/app/api/streaks/goals/update/route.ts src/store/slices/streaksSlice.ts src/hooks/useGoalsCRUD.ts
git commit -m "feat: trigger per-goal streak update on task/substep completion"
```

---

## Task 7: Add streak badges to GoalCard and KanbanCard

**Files:**
- Modify: `src/components/GoalCard.tsx`
- Modify: `src/components/kanban/KanbanCard.tsx`

### Step 1: Create StreakBadge component

Create `src/components/StreakBadge.tsx`:

```typescript
import { StreakTier } from "@/types";

const tierConfig = {
  bronze: { icon: "🥉", label: "Bronze Streak", color: "bg-amber-100 text-amber-700" },
  silver: { icon: "🥈", label: "Silver Streak", color: "bg-gray-100 text-gray-700" },
  gold: { icon: "🥇", label: "Gold Streak", color: "bg-yellow-100 text-yellow-700" },
};

export function StreakBadge({ tier, streak }: { tier: StreakTier; streak?: number }) {
  if (!tier) return null;
  const config = tierConfig[tier];
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${config.color}`}
      title={`${config.label}${streak ? ` (${streak} days)` : ""}`}
    >
      {config.icon}
      {streak && <span>{streak}d</span>}
    </span>
  );
}
```

### Step 2: Add StreakBadge to GoalCard header

In GoalCard, next to the title (around line 127), add the badge:

```tsx
<StreakBadge tier={goalTier} streak={goalStreak?.currentStreak} />
```

This requires fetching the goal streak — use `useGetGoalStreaksQuery` or pass streak data as a prop.

### Step 3: Add StreakBadge to KanbanCard

In KanbanCard, when `level === "goals"`, show the badge next to the title.

### Step 4: Verify build

Run: `npx tsc --noEmit`

### Step 5: Commit

```bash
git add src/components/StreakBadge.tsx src/components/GoalCard.tsx src/components/kanban/KanbanCard.tsx
git commit -m "feat: add streak tier badges to GoalCard and KanbanCard"
```

---

## Task 8: Run full test suite and lint

### Step 1: Run tests

Run: `npx vitest run`
Expected: All tests pass

### Step 2: Run lint

Run: `npm run lint`

### Step 3: Commit fixes if needed

```bash
git add -A && git commit -m "chore: fix lint from streak tiers feature"
```
