# Sync Clerk User Data Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure template creator names always display correctly by syncing Clerk user data (name, email, profileImage) to the Prisma User table on every authenticated request.

**Architecture:** Modify `getCurrentUser()` to fetch the latest user data from Clerk and update the Prisma User record. This ensures the database is always up-to-date with the user's Clerk profile without requiring webhooks or manual syncing.

**Tech Stack:** Next.js 15, Clerk SDK (`@clerk/nextjs`), Prisma, TypeScript, Vitest

---

## Task 1: Add Clerk User Sync to getCurrentUser()

**Files:**
- Modify: `src/lib/auth.ts`
- Test: `src/lib/auth.test.ts` (create if doesn't exist)

**Step 1: Read the current getCurrentUser implementation**

Read `src/lib/auth.ts` to understand the current implementation.

**Step 2: Import clerkClient**

Add the clerkClient import at the top of `src/lib/auth.ts`:

```typescript
import { auth, clerkClient } from "@clerk/nextjs/server";
```

**Step 3: Update getCurrentUser to sync Clerk data**

Replace the `getCurrentUser()` function with this implementation:

```typescript
/**
 * Get the current authenticated user from the database.
 * Creates the user record if it doesn't exist yet (first login).
 * Always syncs the latest name, email, and profileImage from Clerk.
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  // Fetch the latest user data from Clerk
  const clerkUser = await clerkClient.users.getUser(clerkId);

  // Extract user data from Clerk
  const name = clerkUser.fullName || clerkUser.firstName || "User";
  const email = clerkUser.emailAddresses[0]?.emailAddress || `${clerkId}@placeholder.com`;
  const profileImage = clerkUser.imageUrl || null;

  // Use findUnique first for the common case (user already exists)
  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  // Auto-create user on first API call if not found
  if (!user) {
    let isNewUser = false;
    try {
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name,
          profileImage,
          streakData: {
            create: {
              currentStreak: 0,
              longestStreak: 0,
              streakHistory: [],
            },
          },
        },
      });
      isNewUser = true;
    } catch (error) {
      // Handle race condition: another request created the user between our findUnique and create
      if ((error as any).code === "P2002") {
        user = await prisma.user.findUnique({
          where: { clerkId },
        });

        if (!user) {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // Send welcome email for new users (don't await to avoid blocking)
    if (isNewUser && user) {
      notify(user.id, "welcomeEmail", { userName: user.name }).catch((err) => {
        console.error("Failed to send welcome email:", err);
      });
    }
  } else {
    // User exists - sync the latest data from Clerk
    // Only update if data has changed to avoid unnecessary database writes
    if (
      user.name !== name ||
      user.email !== email ||
      user.profileImage !== profileImage
    ) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          email,
          profileImage,
        },
      });
    }
  }

  return user;
}
```

**Step 4: Run the dev server to test**

```bash
npm run dev
```

Expected: Server starts without errors

**Step 5: Manual verification**

1. Navigate to `http://localhost:3000/profile`
2. Check that your name displays correctly
3. Navigate to `http://localhost:3000/marketplace`
4. Check that template creator names show correctly (not "New User")

**Step 6: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: sync Clerk user data to database on every auth request

- Update getCurrentUser() to fetch latest name/email/image from Clerk
- Sync Clerk data to Prisma User table automatically
- Only update database if data has changed (optimization)
- Fixes template creator names showing as 'New User'
"
```

---

## Task 2: Add Unit Tests for User Sync Logic

**Files:**
- Create: `src/lib/auth.test.ts`

**Step 1: Create test file with setup**

Create `src/lib/auth.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentUser } from "./auth";
import { prisma } from "./prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

// Mock Clerk and Prisma
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: {
    users: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock("./prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("./email/notifications", () => ({
  notify: vi.fn(),
}));

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const result = await getCurrentUser();

    expect(result).toBeNull();
  });

  it("should create a new user with Clerk data on first login", async () => {
    const clerkId = "clerk_123";
    const mockClerkUser = {
      id: clerkId,
      fullName: "John Doe",
      firstName: "John",
      emailAddresses: [{ emailAddress: "john@example.com" }],
      imageUrl: "https://example.com/avatar.jpg",
    };
    const mockDbUser = {
      id: "db_123",
      clerkId,
      name: "John Doe",
      email: "john@example.com",
      profileImage: "https://example.com/avatar.jpg",
    };

    vi.mocked(auth).mockResolvedValue({ userId: clerkId } as any);
    vi.mocked(clerkClient.users.getUser).mockResolvedValue(mockClerkUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(mockDbUser as any);

    const result = await getCurrentUser();

    expect(clerkClient.users.getUser).toHaveBeenCalledWith(clerkId);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        clerkId,
        email: "john@example.com",
        name: "John Doe",
        profileImage: "https://example.com/avatar.jpg",
        streakData: {
          create: {
            currentStreak: 0,
            longestStreak: 0,
            streakHistory: [],
          },
        },
      },
    });
    expect(result).toEqual(mockDbUser);
  });

  it("should update existing user when Clerk data has changed", async () => {
    const clerkId = "clerk_123";
    const mockClerkUser = {
      id: clerkId,
      fullName: "Jane Smith",
      emailAddresses: [{ emailAddress: "jane@example.com" }],
      imageUrl: "https://example.com/new-avatar.jpg",
    };
    const existingDbUser = {
      id: "db_123",
      clerkId,
      name: "Old Name",
      email: "old@example.com",
      profileImage: "https://example.com/old-avatar.jpg",
    };
    const updatedDbUser = {
      ...existingDbUser,
      name: "Jane Smith",
      email: "jane@example.com",
      profileImage: "https://example.com/new-avatar.jpg",
    };

    vi.mocked(auth).mockResolvedValue({ userId: clerkId } as any);
    vi.mocked(clerkClient.users.getUser).mockResolvedValue(mockClerkUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(updatedDbUser as any);

    const result = await getCurrentUser();

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "db_123" },
      data: {
        name: "Jane Smith",
        email: "jane@example.com",
        profileImage: "https://example.com/new-avatar.jpg",
      },
    });
    expect(result).toEqual(updatedDbUser);
  });

  it("should NOT update user when Clerk data has NOT changed", async () => {
    const clerkId = "clerk_123";
    const mockClerkUser = {
      id: clerkId,
      fullName: "Jane Smith",
      emailAddresses: [{ emailAddress: "jane@example.com" }],
      imageUrl: "https://example.com/avatar.jpg",
    };
    const existingDbUser = {
      id: "db_123",
      clerkId,
      name: "Jane Smith",
      email: "jane@example.com",
      profileImage: "https://example.com/avatar.jpg",
    };

    vi.mocked(auth).mockResolvedValue({ userId: clerkId } as any);
    vi.mocked(clerkClient.users.getUser).mockResolvedValue(mockClerkUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingDbUser as any);

    const result = await getCurrentUser();

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(result).toEqual(existingDbUser);
  });

  it("should handle missing Clerk email gracefully", async () => {
    const clerkId = "clerk_123";
    const mockClerkUser = {
      id: clerkId,
      fullName: "John Doe",
      emailAddresses: [],
      imageUrl: null,
    };

    vi.mocked(auth).mockResolvedValue({ userId: clerkId } as any);
    vi.mocked(clerkClient.users.getUser).mockResolvedValue(mockClerkUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: "db_123", clerkId } as any);

    await getCurrentUser();

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: `${clerkId}@placeholder.com`,
        }),
      })
    );
  });
});
```

**Step 2: Run tests**

```bash
npm run test src/lib/auth.test.ts
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add src/lib/auth.test.ts
git commit -m "test: add unit tests for Clerk user data sync"
```

---

## Task 3: Verify Template Creator Names Display Correctly

**Files:**
- Test manually: `src/components/templates/TemplateCard.tsx`
- Test manually: `src/app/marketplace/[templateId]/page.tsx`

**Step 1: Clear existing templates (optional, for testing)**

If you want to test with fresh data:
1. Open Prisma Studio: `npx prisma studio`
2. Delete all rows in `GoalTemplate` table
3. Create a new template through the UI

**Step 2: Test template card display**

1. Start dev server: `npm run dev`
2. Create or publish a goal as a template
3. Navigate to `/marketplace`
4. Verify that the template card shows your actual name (not "New User")
5. Verify that the creator's profile image displays correctly

**Step 3: Test template detail page**

1. Click on a template card to open the detail page
2. Verify the "Created by" section shows:
   - Correct profile image
   - Correct name
   - "Template Author" label

**Step 4: Test with multiple users (if available)**

If you have access to multiple accounts:
1. Sign in with a different account
2. Create and publish a template
3. Sign back in with your original account
4. Verify both creators' names display correctly in the marketplace

**Step 5: Document verification**

Create a manual test checklist:

```markdown
## Template Creator Names - Manual Test Checklist

- [ ] Template cards in `/marketplace` show correct creator names
- [ ] Template cards show correct profile images
- [ ] Template detail page shows correct creator name
- [ ] Template detail page shows correct profile image
- [ ] Multiple templates from different authors show distinct names
- [ ] Newly created templates immediately show correct creator info
```

---

## Task 4: Verify Email Toggle Functionality

**Files:**
- Verify: `src/components/EmailPreferencesPanel.tsx`
- Verify: `src/lib/email/notifications.ts`
- Verify: `src/app/profile/page.tsx`

**Step 1: Verify email toggle is visible**

1. Navigate to `/profile`
2. Scroll down to the "Email Notifications" section
3. Verify the panel displays:
   - "Enable email notifications" master toggle
   - Email frequency options (Immediate, Daily digest, Weekly summary)
   - Notification type toggles grouped by category

**Step 2: Test master toggle functionality**

1. Click the master toggle to disable all notifications
2. Verify "Saving..." appears briefly, then "✓ Saved"
3. Verify frequency and individual toggles become hidden/disabled
4. Refresh the page
5. Verify the toggle remains in the disabled state

**Step 3: Test individual notification toggles**

1. Enable the master toggle
2. Toggle individual notification types (e.g., "Goal created", "Streak milestones")
3. Verify each toggle saves successfully
4. Refresh the page
5. Verify all toggle states persist

**Step 4: Verify backend respects preferences**

1. Disable all email notifications via the toggle
2. Trigger a notification event (e.g., create a goal)
3. Check server logs - should see: "User has disabled all notifications"
4. Verify no email is sent (check your inbox and logs)

**Step 5: Review code to confirm behavior**

Review `src/lib/email/notifications.ts` lines 75-83:

```typescript
// Check if notifications are enabled
if (!preferences.enabled) {
  return { success: true }; // User has disabled all notifications
}

// Check if this specific notification type is enabled
if (!preferences[type]) {
  return { success: true }; // User has disabled this notification type
}
```

Confirm this logic correctly prevents emails when:
- Master toggle is off (`preferences.enabled === false`)
- Individual notification type is off (`preferences[type] === false`)

**Step 6: Document verification**

Create a manual test checklist:

```markdown
## Email Toggle - Manual Test Checklist

- [ ] Email preferences panel displays on profile page
- [ ] Master toggle enables/disables all email notifications
- [ ] Toggle states persist after page refresh
- [ ] Individual notification toggles work correctly
- [ ] Frequency selector works (Immediate/Daily/Weekly)
- [ ] Backend respects `enabled: false` preference
- [ ] Backend respects individual notification type preferences
- [ ] No emails sent when master toggle is off
```

---

## Task 5: Add Integration Test for Email Preferences

**Files:**
- Create: `src/lib/email/notifications.integration.test.ts`

**Step 1: Create integration test file**

Create `src/lib/email/notifications.integration.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { notify } from "./notifications";
import { prisma } from "@/lib/prisma";

// Mock sendEmail
vi.mock("./send", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    emailPreferences: {
      create: vi.fn(),
    },
  },
}));

describe("notify - email preferences integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should NOT send email when master toggle is disabled", async () => {
    const mockUser = {
      id: "user_123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: {
        enabled: false,
        goalCreated: true,
      },
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const result = await notify("user_123", "goalCreated", {
      goalTitle: "Test Goal",
    });

    expect(result.success).toBe(true);
    const { sendEmail } = await import("./send");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("should NOT send email when specific notification type is disabled", async () => {
    const mockUser = {
      id: "user_123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: {
        enabled: true,
        goalCreated: false, // This specific type is disabled
      },
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const result = await notify("user_123", "goalCreated", {
      goalTitle: "Test Goal",
    });

    expect(result.success).toBe(true);
    const { sendEmail } = await import("./send");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("should send email when both master and type-specific toggles are enabled", async () => {
    const mockUser = {
      id: "user_123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: {
        enabled: true,
        goalCreated: true,
        frequency: "immediate",
      },
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const result = await notify("user_123", "goalCreated", {
      goalTitle: "Test Goal",
    });

    expect(result.success).toBe(true);
    const { sendEmail } = await import("./send");
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: expect.stringContaining("Test Goal"),
      })
    );
  });

  it("should create default preferences if none exist", async () => {
    const mockUser = {
      id: "user_123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: null,
    };
    const mockDefaultPreferences = {
      enabled: true,
      goalCreated: true,
      frequency: "immediate",
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.emailPreferences.create).mockResolvedValue(
      mockDefaultPreferences as any
    );

    const result = await notify("user_123", "goalCreated", {
      goalTitle: "Test Goal",
    });

    expect(prisma.emailPreferences.create).toHaveBeenCalledWith({
      data: { userId: "user_123" },
    });
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run tests**

```bash
npm run test src/lib/email/notifications.integration.test.ts
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add src/lib/email/notifications.integration.test.ts
git commit -m "test: add integration tests for email preferences"
```

---

## Task 6: Update Documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Document the user sync behavior**

Add a section to `CLAUDE.md` under the "Request & Auth Flow" section:

```markdown
### User Data Synchronization

`getCurrentUser()` automatically syncs the latest user data from Clerk to the Prisma User table on every authenticated request:
- Fetches `name`, `email`, and `profileImage` from Clerk
- Updates the User record only if data has changed (optimization)
- Ensures template creator names and profile information are always up-to-date
- No webhooks required - synchronization happens automatically on each auth check
```

**Step 2: Document email preferences**

Add a section about email preferences:

```markdown
### Email Notifications

Email notifications respect user preferences stored in the `EmailPreferences` model:
- Master toggle: `enabled` field controls all emails globally
- Individual toggles: Each notification type (goalCreated, streakMilestone, etc.) can be disabled
- The `notify()` function automatically checks preferences before sending
- Preferences are managed via `EmailPreferencesPanel` on the profile page
```

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document user sync and email preferences behavior"
```

---

## Task 7: Final Verification and Testing

**Step 1: Run full test suite**

```bash
npm run test:all
```

Expected: All tests pass (unit + e2e)

**Step 2: Build verification**

```bash
npm run build
```

Expected: Build succeeds without errors

**Step 3: Manual smoke test checklist**

Run through this checklist:

- [ ] Sign in with Clerk account
- [ ] Profile page shows correct name/email/image from Clerk
- [ ] Create a new goal
- [ ] Publish goal as template
- [ ] Template card in marketplace shows correct creator name
- [ ] Template detail page shows correct creator name and image
- [ ] Navigate to profile page
- [ ] Verify "Email Notifications" panel is visible
- [ ] Toggle master email switch off
- [ ] Trigger a notification event (create goal)
- [ ] Verify no email was sent
- [ ] Toggle master email switch back on
- [ ] Trigger another notification event
- [ ] Verify email is sent (check logs or inbox)

**Step 4: Performance check**

Monitor the performance impact of syncing Clerk data:
1. Open browser DevTools → Network tab
2. Navigate to any protected page
3. Check the time for API requests
4. Verify auth flow is still fast (< 500ms typically)

Note: Clerk SDK caches user data, so the overhead is minimal.

**Step 5: Final commit**

If any fixes were needed during verification:

```bash
git add .
git commit -m "fix: final adjustments after verification"
```

---

## Summary

**What was fixed:**
1. ✅ Template creator names now display actual Clerk names instead of "New User"
2. ✅ User data (name, email, profileImage) automatically syncs from Clerk on every auth request
3. ✅ Email toggle functionality verified and tested
4. ✅ Comprehensive test coverage added

**Key changes:**
- Modified `getCurrentUser()` to fetch and sync Clerk user data
- Added unit tests for user sync logic
- Added integration tests for email preferences
- Updated documentation

**Performance impact:**
- Minimal - Clerk SDK caches user data
- Database only updated when data changes (optimization)

**Next steps (optional):**
- Monitor Clerk API rate limits in production
- Consider caching synced user data in Redis for high-traffic scenarios
- Set up Clerk webhooks for real-time sync (more efficient than per-request)
