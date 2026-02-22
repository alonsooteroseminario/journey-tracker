# Remaining Stories Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the 3 remaining BMAD stories: STORY-021 (health check API), STORY-008 (feed item 60s deduplication), and STORY-022 (test coverage ≥80%).

**Architecture:**
- STORY-021: New Next.js route handler at `src/app/api/health/route.ts` — no auth required, returns JSON with status/timestamp/version.
- STORY-008: Modify `src/lib/activity/trackActivity.ts` to check for an existing FeedItem of the same `userId+type` within the last 60 seconds; if found, update it instead of creating a new one.
- STORY-022: Add unit tests for the 6 zero-coverage MCP tools (updateTask, updateProfile, removeFriend, getProfile, getInvitations, updateGoalIcon) — each test file follows the pattern in `getFeed.test.ts` and `addFeedComment.test.ts`.

**Tech Stack:** Next.js 15 App Router, Vitest, Prisma mock via `vi.mock('@/lib/prisma')`, `resolveUser` via `vi.mock('@/lib/agent/resolveUser')`

---

## Task 1: Health Check API (STORY-021)

**Files:**
- Create: `src/app/api/health/route.ts`
- Create: `src/app/api/health/route.test.ts`

### Step 1: Write the failing test

Create `src/app/api/health/route.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.1.0');
    expect(typeof body.timestamp).toBe('string');
    // Timestamp should be a valid ISO string
    expect(() => new Date(body.timestamp)).not.toThrow();
  });

  it('returns a fresh timestamp on each call', async () => {
    const r1 = await GET();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const r2 = await GET();

    const b1 = await r1.json();
    const b2 = await r2.json();
    // Both valid ISO strings (may be equal in same ms — just check type)
    expect(typeof b1.timestamp).toBe('string');
    expect(typeof b2.timestamp).toBe('string');
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/alonsooteroseminario/source/repos/journey-tracker
npx vitest run src/app/api/health/route.test.ts
```

Expected: FAIL — "Cannot find module './route'"

### Step 3: Write the implementation

Create `src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
}
```

### Step 4: Run test to verify it passes

```bash
npx vitest run src/app/api/health/route.test.ts
```

Expected: 2 tests pass

### Step 5: Commit

```bash
git add src/app/api/health/route.ts src/app/api/health/route.test.ts
git commit -m "feat: add GET /api/health endpoint (STORY-021)"
```

---

## Task 2: Feed Item 60s Deduplication (STORY-008)

**Files:**
- Modify: `src/lib/activity/trackActivity.ts` (step 3 — the `// 3. Create FeedItem` block)
- Create: `src/lib/activity/trackActivity.test.ts`

The dedup logic: before creating a FeedItem, query for an existing one where `userId = userId AND type = type AND createdAt >= now - 60s`. If found, skip creation (the existing item already represents this activity burst). This prevents feed spam when users make rapid sequential edits.

### Step 1: Write the failing test

Create `src/lib/activity/trackActivity.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackActivity } from './trackActivity';
import { prisma } from '@/lib/prisma';

// prisma is globally mocked in src/test/setup.ts
const mockActivityLogCreate = prisma.activityLog.create as ReturnType<typeof vi.fn>;
const mockFeedItemFindFirst = prisma.feedItem.findFirst as ReturnType<typeof vi.fn>;
const mockFeedItemCreate = prisma.feedItem.create as ReturnType<typeof vi.fn>;
const mockFeedPrefsFind = prisma.feedPreferences.findUnique as ReturnType<typeof vi.fn>;

describe('trackActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActivityLogCreate.mockResolvedValue({});
    mockFeedPrefsFind.mockResolvedValue(null); // no prefs → all ON
  });

  it('always creates an ActivityLog entry', async () => {
    mockFeedItemFindFirst.mockResolvedValue(null);
    mockFeedItemCreate.mockResolvedValue({});

    await trackActivity({
      userId: 'user-1',
      type: 'goal_updated',
      action: 'Updated goal title',
      goalId: 'goal-1',
    });

    expect(mockActivityLogCreate).toHaveBeenCalledOnce();
    expect(mockActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'goal_updated',
          action: 'Updated goal title',
          goalId: 'goal-1',
        }),
      })
    );
  });

  it('creates a FeedItem when no recent duplicate exists', async () => {
    mockFeedItemFindFirst.mockResolvedValue(null); // no recent duplicate
    mockFeedItemCreate.mockResolvedValue({});

    await trackActivity({
      userId: 'user-1',
      type: 'goal_updated',
      action: 'Updated goal title',
    });

    expect(mockFeedItemCreate).toHaveBeenCalledOnce();
  });

  it('skips FeedItem creation when duplicate exists within 60s', async () => {
    // Simulate an existing recent feed item
    mockFeedItemFindFirst.mockResolvedValue({
      id: 'existing-feed-item',
      userId: 'user-1',
      type: 'goal_updated',
      createdAt: new Date(),
    });

    await trackActivity({
      userId: 'user-1',
      type: 'goal_updated',
      action: 'Updated goal title again',
    });

    expect(mockFeedItemCreate).not.toHaveBeenCalled();
  });

  it('creates FeedItem when forceCreateFeed is true, even if duplicate exists', async () => {
    mockFeedItemFindFirst.mockResolvedValue({
      id: 'existing',
      userId: 'user-1',
      type: 'streak_milestone',
      createdAt: new Date(),
    });
    mockFeedItemCreate.mockResolvedValue({});

    await trackActivity({
      userId: 'user-1',
      type: 'streak_milestone',
      action: '7-day streak!',
      createFeedItem: true,
    });

    expect(mockFeedItemCreate).toHaveBeenCalledOnce();
  });

  it('skips FeedItem when user feed prefs disable the category', async () => {
    mockFeedPrefsFind.mockResolvedValue({
      userId: 'user-1',
      goalEvents: false,
      taskEvents: true,
      substepEvents: true,
      costEvents: true,
      noteEvents: true,
      profileEvents: true,
      socialEvents: true,
      streakEvents: true,
    });
    mockFeedItemFindFirst.mockResolvedValue(null);

    await trackActivity({
      userId: 'user-1',
      type: 'goal_updated',
      action: 'Updated',
    });

    expect(mockFeedItemCreate).not.toHaveBeenCalled();
  });

  it('does not create FeedItem for unknown activity types', async () => {
    await trackActivity({
      userId: 'user-1',
      type: 'unknown_type_xyz',
      action: 'Something happened',
    });

    expect(mockFeedItemCreate).not.toHaveBeenCalled();
    expect(mockActivityLogCreate).toHaveBeenCalledOnce();
  });
});
```

### Step 2: Run test to verify it fails

```bash
npx vitest run src/lib/activity/trackActivity.test.ts
```

Expected: "skips FeedItem creation when duplicate exists within 60s" should FAIL (dedup not yet implemented).

### Step 3: Add deduplication to trackActivity

Modify `src/lib/activity/trackActivity.ts`. Replace the `// 3. Create FeedItem` block (lines 96–105) with dedup-aware logic:

**Old code (lines 96–106):**
```typescript
  // 3. Create FeedItem
  await prisma.feedItem.create({
    data: {
      userId,
      type,
      content: feedContent ?? action,
      metadata: (metadata ?? undefined) as any,
      visibility: feedVisibility,
    },
  });
```

**New code:**
```typescript
  // 3. Deduplication: skip if same user+type FeedItem exists within 60 seconds
  const sixtySecondsAgo = new Date(Date.now() - 60_000);
  const recentItem = await prisma.feedItem.findFirst({
    where: {
      userId,
      type,
      createdAt: { gte: sixtySecondsAgo },
    },
  });

  if (recentItem) return; // absorb into the existing feed item

  // 4. Create FeedItem
  await prisma.feedItem.create({
    data: {
      userId,
      type,
      content: feedContent ?? action,
      metadata: (metadata ?? undefined) as any,
      visibility: feedVisibility,
    },
  });
```

### Step 4: Run tests to verify they pass

```bash
npx vitest run src/lib/activity/trackActivity.test.ts
```

Expected: All 6 tests pass.

### Step 5: Run full test suite to check no regressions

```bash
npx vitest run
```

Expected: All existing tests still pass.

### Step 6: Commit

```bash
git add src/lib/activity/trackActivity.ts src/lib/activity/trackActivity.test.ts
git commit -m "feat: deduplicate FeedItems within 60s window (STORY-008)"
```

---

## Task 3: Test Coverage — MCP Tools (STORY-022, Part 1/3)

**Files:**
- Create: `src/lib/mcp/tools/getProfile.test.ts`
- Create: `src/lib/mcp/tools/getInvitations.test.ts`

These two tools are simple (no ownership check, just resolveUser + prisma query). Mock pattern: `vi.mock('@/lib/agent/resolveUser')` + global prisma mock from setup.ts.

### Step 1: Write getProfile tests

Create `src/lib/mcp/tools/getProfile.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetProfile } from './getProfile';
import { resolveUser } from '@/lib/agent/resolveUser';

vi.mock('@/lib/agent/resolveUser');
const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;

describe('executeGetProfile', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns profile for authenticated user', async () => {
    mockResolveUser.mockResolvedValue({
      id: 'mongo-1',
      name: 'Alice',
      email: 'alice@example.com',
      bio: 'Test bio',
      location: 'Vancouver',
      timezone: 'America/Vancouver',
      joinedDate: new Date('2024-01-01'),
    });

    const result = await executeGetProfile({}, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: 'mongo-1',
      name: 'Alice',
      email: 'alice@example.com',
      bio: 'Test bio',
      location: 'Vancouver',
      timezone: 'America/Vancouver',
    });
    expect(typeof result.data.joinedDate).toBe('string');
  });

  it('returns error when userId missing', async () => {
    const result = await executeGetProfile({}, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeGetProfile({}, 'clerk-missing');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns null for optional fields when not set', async () => {
    mockResolveUser.mockResolvedValue({
      id: 'mongo-2',
      name: 'Bob',
      email: 'bob@example.com',
      bio: null,
      location: null,
      timezone: null,
      joinedDate: null,
    });

    const result = await executeGetProfile({}, 'clerk-2');
    expect(result.success).toBe(true);
    expect(result.data.bio).toBeNull();
    expect(result.data.location).toBeNull();
    expect(result.data.timezone).toBeNull();
    expect(result.data.joinedDate).toBeNull();
  });
});
```

### Step 2: Write getInvitations tests

Create `src/lib/mcp/tools/getInvitations.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetInvitations } from './getInvitations';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockInvitationFindMany = prisma.invitation.findMany as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };

describe('executeGetInvitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
  });

  it('returns list of invitations with computed status', async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const past = new Date(now.getTime() - 1000);

    mockInvitationFindMany.mockResolvedValue([
      { id: 'inv-1', code: 'CODE1', used: false, expiresAt: future, createdAt: now, usedBy: null, usedAt: null },
      { id: 'inv-2', code: 'CODE2', used: true, expiresAt: future, createdAt: now, usedBy: 'user-x', usedAt: now },
      { id: 'inv-3', code: 'CODE3', used: false, expiresAt: past, createdAt: now, usedBy: null, usedAt: null },
    ]);

    const result = await executeGetInvitations({}, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.data[0].status).toBe('active');
    expect(result.data[1].status).toBe('used');
    expect(result.data[2].status).toBe('expired');
  });

  it('returns error when userId missing', async () => {
    const result = await executeGetInvitations({}, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeGetInvitations({}, 'clerk-missing');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns empty array when no invitations', async () => {
    mockInvitationFindMany.mockResolvedValue([]);
    const result = await executeGetInvitations({}, 'clerk-1');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
    expect(result.message).toContain('0 invitation');
  });
});
```

### Step 3: Run tests

```bash
npx vitest run src/lib/mcp/tools/getProfile.test.ts src/lib/mcp/tools/getInvitations.test.ts
```

Expected: All 8 tests pass.

### Step 4: Commit

```bash
git add src/lib/mcp/tools/getProfile.test.ts src/lib/mcp/tools/getInvitations.test.ts
git commit -m "test: add unit tests for getProfile and getInvitations MCP tools (STORY-022)"
```

---

## Task 4: Test Coverage — removeFriend + updateProfile (STORY-022, Part 2/3)

**Files:**
- Create: `src/lib/mcp/tools/removeFriend.test.ts`
- Create: `src/lib/mcp/tools/updateProfile.test.ts`

Both tools use `resolveUser` + `trackActivity`. Mock `trackActivity` to avoid Prisma calls inside it.

### Step 1: Write removeFriend tests

Create `src/lib/mcp/tools/removeFriend.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeRemoveFriend } from './removeFriend';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/activity', () => ({ trackActivity: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/agent/auditLog', () => ({
  auditLogger: { logFriendRemoved: vi.fn() },
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockFriendshipFindFirst = prisma.friendship.findFirst as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockFriendshipDeleteMany = prisma.friendship.deleteMany as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };
const FRIEND = { id: 'mongo-2', name: 'Bob' };

describe('executeRemoveFriend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockFriendshipFindFirst.mockResolvedValue({ id: 'fs-1', userId: USER.id, friendId: FRIEND.id });
    mockUserFindUnique.mockResolvedValue(FRIEND);
    mockFriendshipDeleteMany.mockResolvedValue({ count: 2 });
  });

  it('removes friend successfully', async () => {
    const result = await executeRemoveFriend({ friendId: FRIEND.id }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.friendId).toBe(FRIEND.id);
    expect(result.data.friendName).toBe('Bob');
    expect(mockFriendshipDeleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { userId: USER.id, friendId: FRIEND.id },
          { userId: FRIEND.id, friendId: USER.id },
        ],
      },
    });
  });

  it('returns error when userId missing', async () => {
    const result = await executeRemoveFriend({ friendId: FRIEND.id }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when friendId missing', async () => {
    const result = await executeRemoveFriend({ friendId: '' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when friendship does not exist', async () => {
    mockFriendshipFindFirst.mockResolvedValue(null);
    const result = await executeRemoveFriend({ friendId: FRIEND.id }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('strips ID prefix before lookup', async () => {
    await executeRemoveFriend({ friendId: 'user_mongo-2' }, 'clerk-1');
    expect(mockFriendshipFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER.id, friendId: 'mongo-2' } })
    );
  });
});
```

### Step 2: Write updateProfile tests

Create `src/lib/mcp/tools/updateProfile.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeUpdateProfile } from './updateProfile';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/activity', () => ({
  trackActivity: vi.fn().mockResolvedValue(undefined),
  diffFields: vi.fn().mockReturnValue([]),
  formatDiffAction: vi.fn().mockReturnValue('Updated profile'),
}));
vi.mock('@/lib/agent/auditLog', () => ({
  auditLogger: { logProfileUpdated: vi.fn() },
}));
vi.mock('@/lib/email/notifications', () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockUserUpdate = prisma.user.update as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice', bio: 'Old bio', location: 'NYC', timezone: 'UTC' };

describe('executeUpdateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockUserUpdate.mockResolvedValue({ ...USER, name: 'Alice Updated', bio: 'New bio', location: 'NYC', timezone: 'UTC' });
  });

  it('updates profile fields successfully', async () => {
    const result = await executeUpdateProfile({ name: 'Alice Updated', bio: 'New bio' }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Alice Updated');
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER.id },
        data: expect.objectContaining({ name: 'Alice Updated', bio: 'New bio' }),
      })
    );
  });

  it('returns error when userId missing', async () => {
    const result = await executeUpdateProfile({ name: 'X' }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when no fields provided', async () => {
    const result = await executeUpdateProfile({}, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeUpdateProfile({ name: 'X' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('trims whitespace from string fields', async () => {
    mockUserUpdate.mockResolvedValue({ ...USER, name: 'Alice', bio: 'Clean bio', location: 'NYC', timezone: 'UTC' });
    await executeUpdateProfile({ name: '  Alice  ', bio: '  Clean bio  ' }, 'clerk-1');
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Alice', bio: 'Clean bio' }),
      })
    );
  });
});
```

### Step 3: Run tests

```bash
npx vitest run src/lib/mcp/tools/removeFriend.test.ts src/lib/mcp/tools/updateProfile.test.ts
```

Expected: All 10 tests pass.

### Step 4: Commit

```bash
git add src/lib/mcp/tools/removeFriend.test.ts src/lib/mcp/tools/updateProfile.test.ts
git commit -m "test: add unit tests for removeFriend and updateProfile MCP tools (STORY-022)"
```

---

## Task 5: Test Coverage — updateTask + updateGoalIcon (STORY-022, Part 3/3)

**Files:**
- Create: `src/lib/mcp/tools/updateTask.test.ts`
- Create: `src/lib/mcp/tools/updateGoalIcon.test.ts`

`updateTask` has the most logic: ownership check, task index lookup, validation, diff. `updateGoalIcon` requires mocking `pickGoalIcon`.

### Step 1: Write updateTask tests

Create `src/lib/mcp/tools/updateTask.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeUpdateTask } from './updateTask';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/activity', () => ({
  trackActivity: vi.fn().mockResolvedValue(undefined),
  diffFields: vi.fn().mockReturnValue([{ field: 'title', from: 'Old', to: 'New' }]),
  formatDiffAction: vi.fn().mockReturnValue('Updated task "New"'),
}));
vi.mock('@/lib/agent/security', () => ({
  securityGuard: { verifyOwnership: vi.fn().mockResolvedValue(true) },
}));
vi.mock('@/lib/agent/auditLog', () => ({
  auditLogger: {
    logUnauthorizedAccess: vi.fn(),
    logTaskUpdated: vi.fn(),
  },
}));
vi.mock('@/lib/agent/conversationStore', () => ({
  conversationStore: { setLastTask: vi.fn() },
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;
const mockGoalUpdate = prisma.goal.update as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };
const TASK = { id: 'task-1', title: 'Old Title', status: 'todo', substeps: [] };
const GOAL = { id: 'goal-1', userId: USER.id, title: 'My Goal', tasks: [TASK] };

describe('executeUpdateTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockGoalFindUnique.mockResolvedValue(GOAL);
    mockGoalUpdate.mockResolvedValue({ ...GOAL });
  });

  it('updates task title successfully', async () => {
    const result = await executeUpdateTask(
      { goalId: 'goal-1', taskId: 'task-1', title: 'New Title' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(result.data.title).toBe('New Title');
    expect(mockGoalUpdate).toHaveBeenCalledOnce();
  });

  it('returns error when userId missing', async () => {
    const result = await executeUpdateTask({ goalId: 'goal-1', taskId: 'task-1' }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when goalId or taskId missing', async () => {
    const result = await executeUpdateTask({ goalId: '', taskId: 'task-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when goal not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    const result = await executeUpdateTask({ goalId: 'goal-1', taskId: 'task-1', title: 'X' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
    expect(result.message).toContain('Goal not found');
  });

  it('returns error when task not found in goal', async () => {
    const result = await executeUpdateTask(
      { goalId: 'goal-1', taskId: 'nonexistent-task', title: 'X' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
    expect(result.message).toContain('Task not found');
  });

  it('strips ID prefix from goalId', async () => {
    await executeUpdateTask({ goalId: 'goal_goal-1', taskId: 'task-1', title: 'X' }, 'clerk-1');
    expect(mockGoalFindUnique).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
  });
});
```

### Step 2: Write updateGoalIcon tests

Create `src/lib/mcp/tools/updateGoalIcon.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeUpdateGoalIcon } from './updateGoalIcon';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/agent/security', () => ({
  securityGuard: { verifyOwnership: vi.fn().mockResolvedValue(true) },
}));
vi.mock('@/lib/agent/auditLog', () => ({
  auditLogger: {
    logUnauthorizedAccess: vi.fn(),
    logGoalUpdated: vi.fn(),
  },
}));
vi.mock('@/lib/agent/pickGoalIcon', () => ({
  pickGoalIcon: vi.fn().mockResolvedValue('🎯'),
  EMOJI_SET: ['🎯', '💪', '📚', '🏃', '✅'],
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;
const mockGoalUpdate = prisma.goal.update as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };
const GOAL = { id: 'goal-1', userId: USER.id, title: 'Fitness Goal', description: 'Get fit', icon: '💪' };

describe('executeUpdateGoalIcon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockGoalFindUnique.mockResolvedValue(GOAL);
    mockGoalUpdate.mockResolvedValue({ ...GOAL, icon: '🎯' });
  });

  it('uses explicit icon when provided and valid', async () => {
    const result = await executeUpdateGoalIcon({ goalId: 'goal-1', icon: '💪' }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.icon).toBe('💪');
    expect(mockGoalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { icon: '💪' } })
    );
  });

  it('uses AI-picked icon when no explicit icon provided', async () => {
    const result = await executeUpdateGoalIcon({ goalId: 'goal-1', hint: 'running' }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.icon).toBe('🎯'); // from mock pickGoalIcon
  });

  it('returns error when userId missing', async () => {
    const result = await executeUpdateGoalIcon({ goalId: 'goal-1' }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when goalId missing', async () => {
    const result = await executeUpdateGoalIcon({ goalId: '' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when goal not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    const result = await executeUpdateGoalIcon({ goalId: 'goal-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });
});
```

### Step 3: Run tests

```bash
npx vitest run src/lib/mcp/tools/updateTask.test.ts src/lib/mcp/tools/updateGoalIcon.test.ts
```

Expected: All 11 tests pass.

### Step 4: Run full test suite + check coverage

```bash
npx vitest run --coverage 2>&1 | tail -20
```

Expected: Statements coverage ≥ 80%.

### Step 5: Commit

```bash
git add src/lib/mcp/tools/updateTask.test.ts src/lib/mcp/tools/updateGoalIcon.test.ts
git commit -m "test: add unit tests for updateTask and updateGoalIcon MCP tools (STORY-022)"
```

---

## Final Verification

```bash
# Run all tests
npx vitest run

# Check health endpoint compiles
npx tsc --noEmit

# Confirm coverage target met
npx vitest run --coverage 2>&1 | grep "All files"
```

Expected:
- All tests pass (309 original + ~35 new = ~344 total)
- No TypeScript errors
- Statement coverage ≥ 80%
