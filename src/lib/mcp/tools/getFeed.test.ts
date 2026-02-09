import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeGetFeed } from "./getFeed";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    friendship: {
      findMany: vi.fn(),
    },
    feedItem: {
      findMany: vi.fn(),
    },
  },
}));

const mockFindManyFriendship = prisma.friendship.findMany as ReturnType<
  typeof vi.fn
>;
const mockFindManyFeedItem = prisma.feedItem.findMany as ReturnType<
  typeof vi.fn
>;

describe("executeGetFeed", () => {
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns feed items from self and friends", async () => {
    mockFindManyFriendship.mockResolvedValue([
      { friendId: "friend-1" },
      { friendId: "friend-2" },
    ]);

    mockFindManyFeedItem.mockResolvedValue([
      {
        id: "feed-1",
        userId: "friend-1",
        type: "streak_milestone",
        content: "Friend reached 7-day streak!",
        metadata: { streakCount: 7 },
        visibility: "friends",
        createdAt: new Date("2024-01-15"),
        user: { id: "friend-1", name: "Friend One", profileImage: null },
        comments: [],
        cheers: [
          { userId, emoji: "🎉", user: { id: userId, name: "Me" } },
        ],
      },
      {
        id: "feed-2",
        userId,
        type: "goal_created",
        content: "I created a new goal!",
        metadata: { goalId: "goal-123" },
        visibility: "friends",
        createdAt: new Date("2024-01-14"),
        user: { id: userId, name: "Me", profileImage: null },
        comments: [],
        cheers: [],
      },
    ]);

    const result = await executeGetFeed({ limit: 20, offset: 0 }, userId);

    expect(result.success).toBe(true);
    expect(result.feedItems).toHaveLength(2);
    expect(result.feedItems?.[0].cheerCount).toBe(1);
    expect(result.feedItems?.[0].hasCheered).toBe(true);
    expect(result.feedItems?.[1].cheerCount).toBe(0);
    expect(result.feedItems?.[1].hasCheered).toBe(false);

    // Verify friendships were fetched
    expect(mockFindManyFriendship).toHaveBeenCalledWith({
      where: { userId },
      select: { friendId: true },
    });

    // Verify feed items query included friends + self
    expect(mockFindManyFeedItem).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: { in: [userId, "friend-1", "friend-2"] },
        }),
        skip: 0,
        take: 20,
      })
    );
  });

  it("respects pagination parameters", async () => {
    mockFindManyFriendship.mockResolvedValue([]);
    mockFindManyFeedItem.mockResolvedValue([]);

    await executeGetFeed({ limit: 10, offset: 20 }, userId);

    expect(mockFindManyFeedItem).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      })
    );
  });

  it("handles users with no friends", async () => {
    mockFindManyFriendship.mockResolvedValue([]);
    mockFindManyFeedItem.mockResolvedValue([]);

    const result = await executeGetFeed({ limit: 20, offset: 0 }, userId);

    expect(result.success).toBe(true);
    expect(result.feedItems).toHaveLength(0);

    // Should still query with just the user's ID
    expect(mockFindManyFeedItem).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: { in: [userId] },
        }),
      })
    );
  });
});
