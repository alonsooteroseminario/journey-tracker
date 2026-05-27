import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailPreferences: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email/notifications", () => ({
  notify: vi.fn(),
}));

vi.mock("@/lib/email/generateAiContext", () => ({
  generateAiContext: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/dateUtils", () => ({
  getTodayInTimezone: vi.fn().mockReturnValue("2026-05-23"),
  getCurrentHourInTimezone: vi.fn().mockReturnValue(9),
  isInReminderWindow: vi.fn().mockReturnValue(true),
}));

import { prisma } from "@/lib/prisma";
import * as notifications from "@/lib/email/notifications";
import * as aiContext from "@/lib/email/generateAiContext";
import * as dateUtils from "@/lib/dateUtils";

const mockFindMany = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockFindManyPrefs = prisma.emailPreferences.findMany as ReturnType<typeof vi.fn>;
const mockNotify = notifications.notify as ReturnType<typeof vi.fn>;
const mockGenerateAiContext = aiContext.generateAiContext as ReturnType<typeof vi.fn>;
const mockIsInReminderWindow = dateUtils.isInReminderWindow as ReturnType<typeof vi.fn>;

const authedRequest = () =>
  new Request("http://localhost/api/cron/daily-reminders", {
    headers: { Authorization: "Bearer test-secret" },
  });

function makePrefs(userId: string, overrides: { reminderStartTime?: string; reminderStopTime?: string | null } = {}) {
  return {
    userId,
    discordWebhookUrl: null,
    reminderStartTime: overrides.reminderStartTime ?? "09:00",
    reminderStopTime: overrides.reminderStopTime ?? null,
  };
}

describe("GET /api/cron/daily-reminders (morning digest)", () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
    mockGenerateAiContext.mockResolvedValue(null);
    mockNotify.mockResolvedValue({ success: true });
    mockFindManyPrefs.mockResolvedValue([]);
    // Re-apply defaults cleared by vi.clearAllMocks
    mockIsInReminderWindow.mockReturnValue(true);
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalEnv;
  });

  it("returns 401 without valid auth header", async () => {
    const response = await GET(new Request("http://localhost/api/cron/daily-reminders"));
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("skips users with no overdue or today tasks", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs("u1")]);
    mockFindMany.mockResolvedValue([
      {
        id: "u1",
        clerkId: "clerk_1",
        name: "Alice",
        timezone: null,
        goals: [
          {
            title: "Learn Spanish",
            tasks: [{ id: "t1", title: "Vocab", status: "not_started", order: 0 }],
          },
        ],
        streakData: { currentStreak: 5 },
      },
    ]);

    const response = await GET(authedRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.usersChecked).toBe(1);
    expect(data.stats.sent).toBe(0);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("sends digest when user has overdue tasks", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs("u1")]);
    mockFindMany.mockResolvedValue([
      {
        id: "u1",
        clerkId: "clerk_1",
        name: "Alice",
        timezone: null,
        goals: [
          {
            title: "Learn Spanish",
            tasks: [
              { id: "t1", title: "Vocab", status: "not_started", order: 0, dueDate: "2026-05-22" },
            ],
          },
        ],
        streakData: { currentStreak: 7 },
      },
    ]);

    const response = await GET(authedRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.sent).toBe(1);
    expect(mockNotify).toHaveBeenCalledWith("u1", "morningDigest", {
      userName: "Alice",
      overdueCount: 1,
      todayTaskCount: 0,
      streakCount: 7,
      aiParagraph: undefined,
    });
  });

  it("counts today tasks separately from overdue", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs("u2")]);
    mockFindMany.mockResolvedValue([
      {
        id: "u2",
        clerkId: "clerk_2",
        name: "Bob",
        timezone: null,
        goals: [
          {
            title: "Fitness",
            tasks: [
              { id: "t1", title: "Run", status: "not_started", order: 0, dueDate: "2026-05-23" },
              { id: "t2", title: "Stretch", status: "not_started", order: 1, dueDate: "2026-05-21" },
              { id: "t3", title: "Done", status: "completed", order: 2, dueDate: "2026-05-23" },
            ],
          },
        ],
        streakData: null,
      },
    ]);

    await GET(authedRequest());

    expect(mockNotify).toHaveBeenCalledWith("u2", "morningDigest", {
      userName: "Bob",
      overdueCount: 1,
      todayTaskCount: 1,
      streakCount: 0,
      aiParagraph: undefined,
    });
  });

  it("includes AI paragraph when generateAiContext returns one", async () => {
    mockGenerateAiContext.mockResolvedValue("You're on a great streak!");
    mockFindManyPrefs.mockResolvedValue([makePrefs("u3")]);
    mockFindMany.mockResolvedValue([
      {
        id: "u3",
        clerkId: "clerk_3",
        name: "Carol",
        timezone: null,
        goals: [
          {
            title: "Write Novel",
            tasks: [{ id: "t1", title: "Chapter 1", status: "not_started", order: 0, dueDate: "2026-05-23" }],
          },
        ],
        streakData: { currentStreak: 14 },
      },
    ]);

    await GET(authedRequest());

    expect(mockNotify).toHaveBeenCalledWith("u3", "morningDigest", expect.objectContaining({
      aiParagraph: "You're on a great streak!",
    }));
  });

  it("skips archived and completed tasks", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs("u4")]);
    mockFindMany.mockResolvedValue([
      {
        id: "u4",
        clerkId: "clerk_4",
        name: "Dave",
        timezone: null,
        goals: [
          {
            title: "Goal",
            tasks: [
              { id: "t1", status: "completed", order: 0, dueDate: "2026-05-22" },
              { id: "t2", status: "not_started", order: 1, dueDate: "2026-05-22", isArchived: true },
            ],
          },
        ],
        streakData: null,
      },
    ]);

    const response = await GET(authedRequest());
    const data = await response.json();
    expect(data.stats.sent).toBe(0);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("handles notification failure gracefully", async () => {
    mockNotify.mockRejectedValue(new Error("Email service down"));
    mockFindManyPrefs.mockResolvedValue([makePrefs("u5")]);
    mockFindMany.mockResolvedValue([
      {
        id: "u5",
        clerkId: "clerk_5",
        name: "Eve",
        timezone: null,
        goals: [
          {
            title: "Goal",
            tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, dueDate: "2026-05-22" }],
          },
        ],
        streakData: null,
      },
    ]);

    const response = await GET(authedRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.failed).toBe(1);
    expect(data.stats.sent).toBe(0);
  });

  it("returns 500 on database error", async () => {
    mockFindManyPrefs.mockRejectedValue(new Error("DB connection failed"));

    const response = await GET(authedRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to process morning digest");
  });

  it("skips user when outside reminder window (stop time configured)", async () => {
    mockIsInReminderWindow.mockReturnValueOnce(false);

    mockFindManyPrefs.mockResolvedValue([makePrefs("u1", { reminderStopTime: "21:00" })]);
    mockFindMany.mockResolvedValue([
      {
        id: "u1",
        clerkId: "clerk_1",
        name: "Alice",
        timezone: null,
        goals: [
          {
            title: "Goal",
            tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, dueDate: "2026-05-22" }],
          },
        ],
        streakData: { currentStreak: 5 },
      },
    ]);

    const response = await GET(authedRequest());
    const data = await response.json();

    expect(data.stats.sent).toBe(0);
    expect(mockNotify).not.toHaveBeenCalled();
  });
});
