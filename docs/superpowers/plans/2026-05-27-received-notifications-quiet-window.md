# Received-Notifications Quiet Window Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Skip `friendStreakReminder` emails when the receiving friend is in their configured quiet window (`reminderStopTime`), reusing the existing field with no schema changes.

**Architecture:** In `notifyFriendsOfAtRiskStreaks`, batch-fetch all unique friend users' `timezone` and `emailPreferences.reminderStopTime` before the notification loop. For each friend, compute their current local hour and skip the `notify()` call if their current hour is at or past their `reminderStopTime`. A new `notificationsSkipped` counter is added to the return stats.

**Tech Stack:** Prisma (MongoDB), `getCurrentHourInTimezone` from `@/lib/dateUtils`, Vitest

---

### Task 1: Quiet-window skip in `notifyFriendsOfAtRiskStreaks`

**Files:**
- Modify: `src/lib/feed/streakChecker.ts`
- Modify: `src/lib/feed/streakChecker.test.ts`

- [ ] **Step 1: Extend the prisma mock and add dateUtils mock in the test file**

In `src/lib/feed/streakChecker.test.ts`, replace the existing `vi.mock('@/lib/prisma', ...)` block and add a new `vi.mock('@/lib/dateUtils', ...)` block:

```ts
vi.mock("@/lib/prisma", () => ({
  prisma: {
    streakData: {
      findMany: vi.fn(),
    },
    friendship: {
      findMany: vi.fn(),
    },
    feedItem: {
      create: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email/notifications", () => ({
  notify: vi.fn(),
}));

vi.mock("@/lib/dateUtils", () => ({
  getTodayInTimezone: vi.fn().mockReturnValue("2024-01-01"),
  getCurrentHourInTimezone: vi.fn().mockReturnValue(14), // default: 2 PM
}));
```

- [ ] **Step 2: Add mock variable declarations for the new mocks**

After the existing mock variable declarations, add:

```ts
import * as dateUtils from "@/lib/dateUtils";

const mockFindManyUser = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockGetCurrentHour = dateUtils.getCurrentHourInTimezone as ReturnType<typeof vi.fn>;
```

- [ ] **Step 3: Update `beforeEach` to set default return values for new mocks**

Replace the existing `beforeEach` block:

```ts
beforeEach(() => {
  vi.clearAllMocks();
  // Default: friends have no stop time configured
  mockFindManyUser.mockResolvedValue([]);
  // Default: current hour is 2 PM (inside any reasonable quiet window)
  mockGetCurrentHour.mockReturnValue(14);
});
```

- [ ] **Step 4: Add three new tests for quiet-window behavior**

Add these inside `describe("notifyFriendsOfAtRiskStreaks", ...)` after the existing two tests:

```ts
it("skips notification for a friend who is past their stop time", async () => {
  mockFindManyStreakData.mockResolvedValue([
    {
      userId: "user-1",
      currentStreak: 7,
      streakHistory: [],
      user: { id: "user-1", name: "Alice", timezone: "UTC" },
    },
  ]);

  mockFindManyFriendship.mockImplementation(async (query) => {
    if (query.where.userId === "user-1") return [{ friendId: "friend-1" }];
    return [];
  });

  // friend-1 has stop time 22:00 and it is currently 22:00 in their TZ
  mockFindManyUser.mockResolvedValue([
    {
      id: "friend-1",
      timezone: "America/New_York",
      emailPreferences: { reminderStopTime: "22:00" },
    },
  ]);
  mockGetCurrentHour.mockReturnValue(22);

  mockCreateFeedItem.mockResolvedValue({});
  mockNotify.mockResolvedValue({ success: true });

  const results = await notifyFriendsOfAtRiskStreaks();

  expect(results.notificationsSent).toBe(0);
  expect(results.notificationsSkipped).toBe(1);
  expect(mockNotify).not.toHaveBeenCalled();
});

it("sends notification for a friend before their stop time", async () => {
  mockFindManyStreakData.mockResolvedValue([
    {
      userId: "user-1",
      currentStreak: 5,
      streakHistory: [],
      user: { id: "user-1", name: "Alice", timezone: "UTC" },
    },
  ]);

  mockFindManyFriendship.mockImplementation(async (query) => {
    if (query.where.userId === "user-1") return [{ friendId: "friend-1" }];
    return [];
  });

  // friend-1 has stop time 23:00 and it is currently 20:00 — still within window
  mockFindManyUser.mockResolvedValue([
    {
      id: "friend-1",
      timezone: "Europe/Berlin",
      emailPreferences: { reminderStopTime: "23:00" },
    },
  ]);
  mockGetCurrentHour.mockReturnValue(20);

  mockCreateFeedItem.mockResolvedValue({});
  mockNotify.mockResolvedValue({ success: true });

  const results = await notifyFriendsOfAtRiskStreaks();

  expect(results.notificationsSent).toBe(1);
  expect(results.notificationsSkipped).toBe(0);
  expect(mockNotify).toHaveBeenCalledOnce();
});

it("sends notification for a friend with no stop time configured", async () => {
  mockFindManyStreakData.mockResolvedValue([
    {
      userId: "user-1",
      currentStreak: 3,
      streakHistory: [],
      user: { id: "user-1", name: "Alice", timezone: "UTC" },
    },
  ]);

  mockFindManyFriendship.mockImplementation(async (query) => {
    if (query.where.userId === "user-1") return [{ friendId: "friend-1" }];
    return [];
  });

  mockFindManyUser.mockResolvedValue([
    {
      id: "friend-1",
      timezone: "Asia/Tokyo",
      emailPreferences: null, // no prefs at all
    },
  ]);
  mockGetCurrentHour.mockReturnValue(23); // late night but no stop time

  mockCreateFeedItem.mockResolvedValue({});
  mockNotify.mockResolvedValue({ success: true });

  const results = await notifyFriendsOfAtRiskStreaks();

  expect(results.notificationsSent).toBe(1);
  expect(results.notificationsSkipped).toBe(0);
});
```

- [ ] **Step 5: Run the new tests to confirm they fail**

```bash
npm run test -- --run src/lib/feed/streakChecker.test.ts
```

Expected: the 3 new tests fail (function doesn't exist yet / return type missing `notificationsSkipped`), existing tests still pass.

- [ ] **Step 6: Implement quiet-window skip in `streakChecker.ts`**

Replace the full contents of `src/lib/feed/streakChecker.ts`:

```ts
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/email/notifications";
import { getTodayInTimezone, getCurrentHourInTimezone } from "@/lib/dateUtils";

interface AtRiskUser {
  userId: string;
  userName: string;
  currentStreak: number;
  friendIds: string[];
}

/**
 * Finds users whose streaks are at risk (active streak but no activity today)
 */
export async function findAtRiskUsers(): Promise<AtRiskUser[]> {
  const streakData = await prisma.streakData.findMany({
    where: { currentStreak: { gte: 1 } },
    include: {
      user: {
        select: { id: true, name: true, timezone: true },
      },
    },
  });

  const atRiskUsers: AtRiskUser[] = [];

  for (const data of streakData) {
    const today = getTodayInTimezone(data.user.timezone);
    const streakHistory = data.streakHistory || [];
    const hasActivityToday = streakHistory.includes(today);

    if (!hasActivityToday && data.currentStreak > 0) {
      const friendships = await prisma.friendship.findMany({
        where: { userId: data.userId },
        select: { friendId: true },
      });

      const reverseFriendships = await prisma.friendship.findMany({
        where: { friendId: data.userId },
        select: { userId: true },
      });

      const friendIds = [
        ...friendships.map((f) => f.friendId),
        ...reverseFriendships.map((f) => f.userId),
      ];

      const uniqueFriendIds = Array.from(new Set(friendIds));

      if (uniqueFriendIds.length > 0) {
        atRiskUsers.push({
          userId: data.userId,
          userName: data.user.name,
          currentStreak: data.currentStreak,
          friendIds: uniqueFriendIds,
        });
      }
    }
  }

  return atRiskUsers;
}

/**
 * Creates feed items and sends notifications for at-risk users.
 * Skips friends who are currently past their configured reminderStopTime.
 */
export async function notifyFriendsOfAtRiskStreaks(): Promise<{
  usersChecked: number;
  atRiskUsers: number;
  feedItemsCreated: number;
  notificationsSent: number;
  notificationsSkipped: number;
  errors: number;
}> {
  const atRiskUsers = await findAtRiskUsers();
  let feedItemsCreated = 0;
  let notificationsSent = 0;
  let notificationsSkipped = 0;
  let errors = 0;

  // Batch-fetch timezone + stop time for all friends involved
  const allFriendIds = Array.from(new Set(atRiskUsers.flatMap((u) => u.friendIds)));
  const nowUtc = new Date();

  const friendUsers = await prisma.user.findMany({
    where: { id: { in: allFriendIds } },
    select: {
      id: true,
      timezone: true,
      emailPreferences: { select: { reminderStopTime: true } },
    },
  });

  const friendInfoMap = new Map(
    friendUsers.map((u) => [
      u.id,
      {
        timezone: u.timezone,
        reminderStopTime: u.emailPreferences?.reminderStopTime ?? null,
      },
    ])
  );

  for (const user of atRiskUsers) {
    try {
      await prisma.feedItem.create({
        data: {
          userId: user.userId,
          type: "streak_at_risk",
          content: `${user.userName}'s ${user.currentStreak}-day streak is at risk! Send them some encouragement 💪`,
          metadata: { streakCount: user.currentStreak },
          visibility: "friends",
        },
      });
      feedItemsCreated++;

      for (const friendId of user.friendIds) {
        // Skip friend if they are past their configured quiet-window stop time
        const friendInfo = friendInfoMap.get(friendId);
        if (friendInfo?.reminderStopTime) {
          const stopHour = parseInt(friendInfo.reminderStopTime.split(":")[0], 10);
          const friendHour = getCurrentHourInTimezone(friendInfo.timezone, nowUtc);
          if (!isNaN(stopHour) && friendHour >= stopHour) {
            notificationsSkipped++;
            continue;
          }
        }

        try {
          await notify(friendId, "friendStreakReminder", {
            userName: user.userName,
            friendStreak: user.currentStreak,
          });
          notificationsSent++;
        } catch (error) {
          console.error(`Failed to send notification to friend ${friendId}:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error(`Failed to create feed item for user ${user.userId}:`, error);
      errors++;
    }
  }

  return {
    usersChecked: atRiskUsers.length,
    atRiskUsers: atRiskUsers.length,
    feedItemsCreated,
    notificationsSent,
    notificationsSkipped,
    errors,
  };
}
```

- [ ] **Step 7: Run all tests to verify everything passes**

```bash
npm run test -- --run src/lib/feed/streakChecker.test.ts
```

Expected: all 7 tests pass (3 existing + 3 new quiet-window + 1 error-handling).

Also run the check-streaks route test (it mocks `notifyFriendsOfAtRiskStreaks` so it should be unaffected):

```bash
npm run test -- --run src/app/api/cron/check-streaks/route.test.ts
```

Expected: 4/4 pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/feed/streakChecker.ts src/lib/feed/streakChecker.test.ts
git commit -m "feat(bell): skip friend streak alert when receiver is past their quiet-window stop time

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Run full suite and push

- [ ] **Step 1: Run full test suite**

```bash
npm run test -- --run 2>&1 | tail -10
```

Expected: same pass/fail counts as before this branch (1502 pass, 9 pre-existing failures).

- [ ] **Step 2: Run production build**

```bash
npm run build 2>&1 | grep -E "✓ Compiled|error"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Push and clean up TODOS.md**

Remove the "Received-notifications stop time" section from `TODOS.md` (it's done), then:

```bash
git add TODOS.md
git commit -m "docs: mark received-notifications quiet-window as complete"
git push origin main
```
