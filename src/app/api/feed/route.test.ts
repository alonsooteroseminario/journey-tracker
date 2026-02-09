import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { prisma } from "@/lib/prisma";
import * as auth from "@/lib/auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    friendship: {
      findMany: vi.fn(),
    },
    feedItem: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

const mockGetCurrentUser = auth.getCurrentUser as ReturnType<typeof vi.fn>;
const mockFindManyFriendship = prisma.friendship.findMany as ReturnType<
  typeof vi.fn
>;
const mockFindManyFeedItem = prisma.feedItem.findMany as ReturnType<
  typeof vi.fn
>;
const mockCreateFeedItem = prisma.feedItem.create as ReturnType<typeof vi.fn>;

describe("GET /api/feed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/feed");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns feed items from friends and self", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "user-1",
      name: "Test User",
    });

    mockFindManyFriendship.mockResolvedValue([
      { friendId: "friend-1" },
      { friendId: "friend-2" },
    ]);

    const mockFeedItems = [
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
        cheers: [],
      },
      {
        id: "feed-2",
        userId: "user-1",
        type: "goal_created",
        content: "I created a new goal!",
        metadata: { goalId: "goal-123" },
        visibility: "friends",
        createdAt: new Date("2024-01-14"),
        user: { id: "user-1", name: "Test User", profileImage: null },
        comments: [],
        cheers: [
          { userId: "user-1", user: { id: "user-1", name: "Test User" } },
        ],
      },
    ];

    mockFindManyFeedItem.mockResolvedValue(mockFeedItems);

    const request = new Request("http://localhost/api/feed?limit=20");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].cheerCount).toBe(0);
    expect(data[0].hasCheered).toBe(false);
    expect(data[1].cheerCount).toBe(1);
    expect(data[1].hasCheered).toBe(true);
  });

  it("respects limit and offset parameters", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: "Test" });
    mockFindManyFriendship.mockResolvedValue([]);
    mockFindManyFeedItem.mockResolvedValue([]);

    const request = new Request(
      "http://localhost/api/feed?limit=10&offset=20"
    );
    await GET(request);

    expect(mockFindManyFeedItem).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      })
    );
  });

  it("caps limit at 100", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: "Test" });
    mockFindManyFriendship.mockResolvedValue([]);
    mockFindManyFeedItem.mockResolvedValue([]);

    const request = new Request("http://localhost/api/feed?limit=500");
    await GET(request);

    expect(mockFindManyFeedItem).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    );
  });
});

describe("POST /api/feed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/feed", {
      method: "POST",
      body: JSON.stringify({
        type: "goal_created",
        content: "Test content",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("creates a new feed item", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      profileImage: null,
    });

    mockCreateFeedItem.mockResolvedValue({
      id: "feed-1",
      userId: "user-1",
      type: "goal_created",
      content: "Created a new goal!",
      metadata: { goalId: "goal-123" },
      visibility: "friends",
      createdAt: new Date("2024-01-15"),
      user: {
        id: "user-1",
        name: "Test User",
        profileImage: null,
      },
    });

    const request = new Request("http://localhost/api/feed", {
      method: "POST",
      body: JSON.stringify({
        type: "goal_created",
        content: "Created a new goal!",
        metadata: { goalId: "goal-123" },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe("goal_created");
    expect(data.content).toBe("Created a new goal!");
    expect(data.cheerCount).toBe(0);
    expect(data.hasCheered).toBe(false);

    expect(mockCreateFeedItem).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "goal_created",
        content: "Created a new goal!",
        metadata: { goalId: "goal-123" },
        visibility: "friends",
      },
      include: expect.any(Object),
    });
  });

  it("validates feed item type", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: "Test" });

    const request = new Request("http://localhost/api/feed", {
      method: "POST",
      body: JSON.stringify({
        type: "invalid_type",
        content: "Test",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request data");
  });
});
