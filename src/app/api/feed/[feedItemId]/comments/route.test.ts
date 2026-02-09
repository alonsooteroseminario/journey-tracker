import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { prisma } from "@/lib/prisma";
import * as auth from "@/lib/auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    feedComment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    feedItem: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

const mockGetCurrentUser = auth.getCurrentUser as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.feedComment.findMany as ReturnType<typeof vi.fn>;
const mockCreate = prisma.feedComment.create as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.feedItem.findUnique as ReturnType<typeof vi.fn>;

describe("GET /api/feed/[feedItemId]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/feed/feed-1/comments");
    const response = await GET(request, { params: { feedItemId: "feed-1" } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns comments for a feed item", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: "Test" });

    const mockComments = [
      {
        id: "comment-1",
        feedItemId: "feed-1",
        userId: "user-2",
        content: "Great job!",
        createdAt: new Date("2024-01-15T10:00:00Z"),
        user: {
          id: "user-2",
          name: "Friend",
          profileImage: null,
        },
      },
      {
        id: "comment-2",
        feedItemId: "feed-1",
        userId: "user-1",
        content: "Thanks!",
        createdAt: new Date("2024-01-15T11:00:00Z"),
        user: {
          id: "user-1",
          name: "Test",
          profileImage: null,
        },
      },
    ];

    mockFindMany.mockResolvedValue(mockComments);

    const request = new Request("http://localhost/api/feed/feed-1/comments");
    const response = await GET(request, { params: { feedItemId: "feed-1" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].userName).toBe("Friend");
    expect(data[1].userName).toBe("Test");

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { feedItemId: "feed-1" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  });
});

describe("POST /api/feed/[feedItemId]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/feed/feed-1/comments", {
      method: "POST",
      body: JSON.stringify({ content: "Great!" }),
    });

    const response = await POST(request, { params: { feedItemId: "feed-1" } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("creates a comment on a feed item", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      profileImage: null,
    });

    mockFindUnique.mockResolvedValue({ id: "feed-1" });

    mockCreate.mockResolvedValue({
      id: "comment-1",
      feedItemId: "feed-1",
      userId: "user-1",
      content: "Great job!",
      createdAt: new Date("2024-01-15"),
      user: {
        id: "user-1",
        name: "Test User",
        profileImage: null,
      },
    });

    const request = new Request("http://localhost/api/feed/feed-1/comments", {
      method: "POST",
      body: JSON.stringify({ content: "Great job!" }),
    });

    const response = await POST(request, { params: { feedItemId: "feed-1" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBe("Great job!");
    expect(data.userName).toBe("Test User");

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        feedItemId: "feed-1",
        userId: "user-1",
        content: "Great job!",
      },
      include: expect.any(Object),
    });
  });

  it("returns 404 when feed item not found", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: "Test" });
    mockFindUnique.mockResolvedValue(null);

    const request = new Request("http://localhost/api/feed/feed-1/comments", {
      method: "POST",
      body: JSON.stringify({ content: "Comment" }),
    });

    const response = await POST(request, { params: { feedItemId: "feed-1" } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Feed item not found");
  });

  it("validates comment content length", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: "Test" });

    const request = new Request("http://localhost/api/feed/feed-1/comments", {
      method: "POST",
      body: JSON.stringify({ content: "" }),
    });

    const response = await POST(request, { params: { feedItemId: "feed-1" } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request data");
  });
});
