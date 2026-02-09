import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { GET } from "./route";
import { prisma } from "@/lib/prisma";
import * as notifications from "@/lib/email/notifications";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    streakData: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email/notifications", () => ({
  notify: vi.fn(),
}));

const mockFindMany = prisma.streakData.findMany as ReturnType<typeof vi.fn>;
const mockNotify = notifications.notify as ReturnType<typeof vi.fn>;

describe("GET /api/cron/daily-reminders", () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalEnv;
  });

  it("returns 401 without valid auth header", async () => {
    const request = new Request("http://localhost/api/cron/daily-reminders");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("processes users with streaks but no activity today", async () => {
    const today = new Date().toISOString().split("T")[0];

    mockFindMany.mockResolvedValue([
      {
        userId: "user-1",
        currentStreak: 5,
        streakHistory: ["2024-01-01"], // No activity today
        user: { id: "user-1", name: "Alice" },
      },
      {
        userId: "user-2",
        currentStreak: 10,
        streakHistory: [today], // Already has activity today
        user: { id: "user-2", name: "Bob" },
      },
    ]);

    mockNotify.mockResolvedValue({ success: true });

    const request = new Request("http://localhost/api/cron/daily-reminders", {
      headers: { Authorization: "Bearer test-secret" },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.stats.usersChecked).toBe(2);
    expect(data.stats.remindersToSend).toBe(1);
    expect(data.stats.sent).toBe(1);

    // Should only send to user-1 (no activity today)
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith("user-1", "streakReminder", {
      userName: "Alice",
      currentStreak: 5,
    });
  });

  it("handles no users with active streaks", async () => {
    mockFindMany.mockResolvedValue([]);

    const request = new Request("http://localhost/api/cron/daily-reminders", {
      headers: { Authorization: "Bearer test-secret" },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.remindersToSend).toBe(0);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("handles notification failures gracefully", async () => {
    mockFindMany.mockResolvedValue([
      {
        userId: "user-1",
        currentStreak: 3,
        streakHistory: [],
        user: { id: "user-1", name: "Charlie" },
      },
    ]);

    mockNotify.mockRejectedValue(new Error("Email service down"));

    const request = new Request("http://localhost/api/cron/daily-reminders", {
      headers: { Authorization: "Bearer test-secret" },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.remindersToSend).toBe(1);
    expect(data.stats.failed).toBe(1);
  });
});
