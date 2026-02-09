import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeAddFeedComment } from "./addFeedComment";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    feedItem: {
      findUnique: vi.fn(),
    },
    feedComment: {
      create: vi.fn(),
    },
  },
}));

const mockFindUnique = prisma.feedItem.findUnique as ReturnType<typeof vi.fn>;
const mockCreate = prisma.feedComment.create as ReturnType<typeof vi.fn>;

describe("executeAddFeedComment", () => {
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a comment to an existing feed item", async () => {
    mockFindUnique.mockResolvedValue({
      id: "feed-1",
      userId: "friend-1",
      type: "streak_milestone",
    });

    mockCreate.mockResolvedValue({
      id: "comment-1",
      feedItemId: "feed-1",
      userId,
      content: "Great job!",
      createdAt: new Date("2024-01-15"),
      user: {
        id: userId,
        name: "Test User",
        profileImage: null,
      },
    });

    const result = await executeAddFeedComment(
      { feedItemId: "feed-1", content: "Great job!" },
      userId
    );

    expect(result.success).toBe(true);
    expect(result.comment?.content).toBe("Great job!");
    expect(result.comment?.userName).toBe("Test User");

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "feed-1" },
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        feedItemId: "feed-1",
        userId,
        content: "Great job!",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  });

  it("throws error when feed item not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(
      executeAddFeedComment(
        { feedItemId: "nonexistent", content: "Comment" },
        userId
      )
    ).rejects.toThrow("Feed item not found");

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("validates content length", async () => {
    const longContent = "a".repeat(501);

    await expect(
      executeAddFeedComment(
        { feedItemId: "feed-1", content: longContent },
        userId
      )
    ).rejects.toThrow();

    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});
