import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import * as auth from "@/lib/auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    feedCheer: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

const mockGetCurrentUser = auth.getCurrentUser as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.feedCheer.findUnique as ReturnType<typeof vi.fn>;
const mockCreate = prisma.feedCheer.create as ReturnType<typeof vi.fn>;
const mockDelete = prisma.feedCheer.delete as ReturnType<typeof vi.fn>;

describe("POST /api/feed/[feedItemId]/cheers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/feed/feed-1/cheers", {
      method: "POST",
      body: JSON.stringify({ emoji: "🎉" }),
    });

    const response = await POST(request, { params: { feedItemId: "feed-1" } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("adds a cheer when user has not cheered yet", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: "Test" });
    mockFindUnique.mockResolvedValue(null);

    mockCreate.mockResolvedValue({
      id: "cheer-1",
      feedItemId: "feed-1",
      userId: "user-1",
      emoji: "🎉",
      createdAt: new Date("2024-01-15"),
    });

    const request = new Request("http://localhost/api/feed/feed-1/cheers", {
      method: "POST",
      body: JSON.stringify({ emoji: "🎉" }),
    });

    const response = await POST(request, { params: { feedItemId: "feed-1" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.action).toBe("added");
    expect(data.message).toBe("Cheer added");

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        feedItemId: "feed-1",
        userId: "user-1",
        emoji: "🎉",
      },
    });
  });

  it("removes cheer when user has already cheered", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: "Test" });

    mockFindUnique.mockResolvedValue({
      id: "cheer-1",
      feedItemId: "feed-1",
      userId: "user-1",
      emoji: "🎉",
    });

    const request = new Request("http://localhost/api/feed/feed-1/cheers", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: { feedItemId: "feed-1" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.action).toBe("removed");
    expect(data.message).toBe("Cheer removed");

    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: "cheer-1" },
    });

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("uses default emoji when not provided", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: "Test" });
    mockFindUnique.mockResolvedValue(null);

    mockCreate.mockResolvedValue({
      id: "cheer-1",
      feedItemId: "feed-1",
      userId: "user-1",
      emoji: "🎉",
      createdAt: new Date("2024-01-15"),
    });

    const request = new Request("http://localhost/api/feed/feed-1/cheers", {
      method: "POST",
      body: JSON.stringify({}),
    });

    await POST(request, { params: { feedItemId: "feed-1" } });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        feedItemId: "feed-1",
        userId: "user-1",
        emoji: "🎉",
      },
    });
  });
});
