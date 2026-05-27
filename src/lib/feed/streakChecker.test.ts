import { describe, it, expect, vi, beforeEach } from "vitest";
import { findAtRiskUsers, notifyFriendsOfAtRiskStreaks } from "./streakChecker";
import { prisma } from "@/lib/prisma";
import * as notifications from "@/lib/email/notifications";
import * as dateUtils from "@/lib/dateUtils";

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
  // Preserve real-date behavior so existing findAtRiskUsers tests are unaffected
  getTodayInTimezone: vi.fn().mockImplementation(() => new Date().toISOString().split("T")[0]),
  getCurrentHourInTimezone: vi.fn().mockReturnValue(14), // default: 2 PM
}));

const mockFindManyStreakData = prisma.streakData.findMany as ReturnType<typeof vi.fn>;
const mockFindManyFriendship = prisma.friendship.findMany as ReturnType<typeof vi.fn>;
const mockCreateFeedItem = prisma.feedItem.create as ReturnType<typeof vi.fn>;
const mockFindManyUser = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockNotify = notifications.notify as ReturnType<typeof vi.fn>;
const mockGetCurrentHour = dateUtils.getCurrentHourInTimezone as ReturnType<typeof vi.fn>;

describe("streakChecker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindManyUser.mockResolvedValue([]);
    mockGetCurrentHour.mockReturnValue(14);
  });

  describe("findAtRiskUsers", () => {
    it("identifies users with active streaks but no activity today", async () => {
      const today = new Date().toISOString().split("T")[0];

      mockFindManyStreakData.mockResolvedValue([
        {
          userId: "user-1",
          currentStreak: 5,
          streakHistory: ["2024-01-01"], // No activity today
          user: { id: "user-1", name: "Alice" },
        },
        {
          userId: "user-2",
          currentStreak: 10,
          streakHistory: [today], // Has activity today
          user: { id: "user-2", name: "Bob" },
        },
      ]);

      // Mock friendships for user-1
      mockFindManyFriendship.mockImplementation(async (query) => {
        if (query.where.userId === "user-1") {
          return [{ friendId: "friend-1" }];
        }
        if (query.where.friendId === "user-1") {
          return [{ userId: "friend-2" }];
        }
        return [];
      });

      const atRiskUsers = await findAtRiskUsers();

      expect(atRiskUsers).toHaveLength(1);
      expect(atRiskUsers[0]).toMatchObject({
        userId: "user-1",
        userName: "Alice",
        currentStreak: 5,
        friendIds: expect.arrayContaining(["friend-1", "friend-2"]),
      });
    });

    it("excludes users with no friends", async () => {
      mockFindManyStreakData.mockResolvedValue([
        {
          userId: "user-1",
          currentStreak: 3,
          streakHistory: [],
          user: { id: "user-1", name: "Alice" },
        },
      ]);

      mockFindManyFriendship.mockResolvedValue([]);

      const atRiskUsers = await findAtRiskUsers();

      expect(atRiskUsers).toHaveLength(0);
    });

    it("excludes users with zero streak", async () => {
      mockFindManyStreakData.mockResolvedValue([
        {
          userId: "user-1",
          currentStreak: 0,
          streakHistory: [],
          user: { id: "user-1", name: "Alice" },
        },
      ]);

      const atRiskUsers = await findAtRiskUsers();

      expect(atRiskUsers).toHaveLength(0);
    });
  });

  describe("notifyFriendsOfAtRiskStreaks", () => {
    it("creates feed items and sends notifications", async () => {
      mockFindManyStreakData.mockResolvedValue([
        {
          userId: "user-1",
          currentStreak: 7,
          streakHistory: [],
          user: { id: "user-1", name: "Alice" },
        },
      ]);

      mockFindManyFriendship.mockImplementation(async (query) => {
        if (query.where.userId === "user-1") {
          return [{ friendId: "friend-1" }, { friendId: "friend-2" }];
        }
        return [];
      });

      mockCreateFeedItem.mockResolvedValue({});
      mockNotify.mockResolvedValue({ success: true });

      const results = await notifyFriendsOfAtRiskStreaks();

      expect(results.atRiskUsers).toBe(1);
      expect(results.feedItemsCreated).toBe(1);
      expect(results.notificationsSent).toBe(2);
      expect(results.errors).toBe(0);

      expect(mockCreateFeedItem).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          type: "streak_at_risk",
          content: expect.stringContaining("Alice"),
          metadata: { streakCount: 7 },
          visibility: "friends",
        },
      });

      expect(mockNotify).toHaveBeenCalledTimes(2);
    });

    it("handles notification failures gracefully", async () => {
      mockFindManyStreakData.mockResolvedValue([
        {
          userId: "user-1",
          currentStreak: 5,
          streakHistory: [],
          user: { id: "user-1", name: "Alice" },
        },
      ]);

      mockFindManyFriendship.mockImplementation(async (query) => {
        if (query.where.userId === "user-1") {
          return [{ friendId: "friend-1" }];
        }
        return [];
      });

      mockCreateFeedItem.mockResolvedValue({});
      mockNotify.mockRejectedValue(new Error("Email service down"));

      const results = await notifyFriendsOfAtRiskStreaks();

      expect(results.feedItemsCreated).toBe(1);
      expect(results.notificationsSent).toBe(0);
      expect(results.errors).toBe(1);
    });

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
          emailPreferences: null,
        },
      ]);
      mockGetCurrentHour.mockReturnValue(23);

      mockCreateFeedItem.mockResolvedValue({});
      mockNotify.mockResolvedValue({ success: true });

      const results = await notifyFriendsOfAtRiskStreaks();

      expect(results.notificationsSent).toBe(1);
      expect(results.notificationsSkipped).toBe(0);
    });
  });
});
