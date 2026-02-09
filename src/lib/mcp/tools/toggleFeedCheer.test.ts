import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeToggleFeedCheer } from "./toggleFeedCheer";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    feedCheer: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockFindUnique = prisma.feedCheer.findUnique as ReturnType<typeof vi.fn>;
const mockCreate = prisma.feedCheer.create as ReturnType<typeof vi.fn>;
const mockDelete = prisma.feedCheer.delete as ReturnType<typeof vi.fn>;

describe("executeToggleFeedCheer", () => {
  const userId = "user-123";
  const feedItemId = "feed-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a cheer when user has not cheered yet", async () => {
    mockFindUnique.mockResolvedValue(null);

    mockCreate.mockResolvedValue({
      id: "cheer-1",
      feedItemId,
      userId,
      emoji: "🎉",
      createdAt: new Date("2024-01-15"),
    });

    const result = await executeToggleFeedCheer({ feedItemId }, userId);

    expect(result.success).toBe(true);
    expect(result.action).toBe("added");
    expect(result.message).toBe("Cheer added");

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: {
        feedItemId_userId: {
          feedItemId,
          userId,
        },
      },
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        feedItemId,
        userId,
        emoji: "🎉",
      },
    });

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("removes cheer when user has already cheered", async () => {
    mockFindUnique.mockResolvedValue({
      id: "cheer-1",
      feedItemId,
      userId,
      emoji: "🎉",
    });

    const result = await executeToggleFeedCheer({ feedItemId }, userId);

    expect(result.success).toBe(true);
    expect(result.action).toBe("removed");
    expect(result.message).toBe("Cheer removed");

    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: "cheer-1" },
    });

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("uses custom emoji when provided", async () => {
    mockFindUnique.mockResolvedValue(null);

    mockCreate.mockResolvedValue({
      id: "cheer-1",
      feedItemId,
      userId,
      emoji: "❤️",
    });

    await executeToggleFeedCheer({ feedItemId, emoji: "❤️" }, userId);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        feedItemId,
        userId,
        emoji: "❤️",
      },
    });
  });

  it("defaults to 🎉 emoji when not provided", async () => {
    mockFindUnique.mockResolvedValue(null);

    mockCreate.mockResolvedValue({
      id: "cheer-1",
      feedItemId,
      userId,
      emoji: "🎉",
    });

    await executeToggleFeedCheer({ feedItemId }, userId);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        feedItemId,
        userId,
        emoji: "🎉",
      },
    });
  });
});
