import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailPreferences: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/email/templates/task-reminder-digest", () => ({
  TaskReminderDigestEmail: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/dateUtils", () => ({
  getTodayInTimezone: vi.fn().mockReturnValue("2026-05-24"),
}));

import { prisma } from "@/lib/prisma";
import * as emailSend from "@/lib/email/send";

const mockFindManyPrefs = prisma.emailPreferences.findMany as ReturnType<typeof vi.fn>;
const mockFindManyUsers = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockUpdatePrefs = prisma.emailPreferences.update as ReturnType<typeof vi.fn>;
const mockSendEmail = emailSend.sendEmail as ReturnType<typeof vi.fn>;

const SECRET = "test-secret";

const authedRequest = () =>
  new Request("http://localhost/api/cron/task-reminders", {
    headers: { Authorization: `Bearer ${SECRET}` },
  });

// Helper: build a minimal user fixture
function makeUser(overrides: {
  id?: string;
  timezone?: string | null;
  tasks?: object[];
} = {}) {
  return {
    id: overrides.id ?? "u1",
    email: "user@example.com",
    name: "Alice",
    timezone: overrides.timezone ?? "UTC",
    goals: [
      {
        title: "My Goal",
        tasks: overrides.tasks ?? [],
      },
    ],
  };
}

// Helper: build eligiblePrefs fixture
function makePrefs(overrides: {
  userId?: string;
  reminderTime?: string;
  reminderLastSentDate?: string | null;
} = {}) {
  return {
    userId: overrides.userId ?? "u1",
    reminderTime: overrides.reminderTime ?? "15:00",
    reminderLastSentDate: overrides.reminderLastSentDate ?? null,
  };
}

describe("GET /api/cron/task-reminders", () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = SECRET;
    mockSendEmail.mockResolvedValue({ success: true });
    mockUpdatePrefs.mockResolvedValue({});
    // Default: 3pm UTC so hour=15
    vi.setSystemTime(new Date("2026-05-24T15:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalEnv;
  });

  it("returns 401 without valid auth header", async () => {
    const res = await GET(new Request("http://localhost/api/cron/task-reminders"));
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 200 with zero users when no eligible prefs", async () => {
    mockFindManyPrefs.mockResolvedValue([]);
    mockFindManyUsers.mockResolvedValue([]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.stats.usersChecked).toBe(0);
    expect(data.stats.sent).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips user when current hour does not match their reminderTime", async () => {
    // System time is 15:00 UTC; user wants reminders at 09:00
    mockFindManyPrefs.mockResolvedValue([makePrefs({ reminderTime: "09:00" })]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, reminderEnabled: true }],
      }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.stats.sent).toBe(0);
    expect(data.stats.skipped).toBe(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips user who was already sent today (dedup)", async () => {
    mockFindManyPrefs.mockResolvedValue([
      makePrefs({ reminderTime: "15:00", reminderLastSentDate: "2026-05-24" }),
    ]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, reminderEnabled: true }],
      }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.sent).toBe(0);
    expect(data.stats.skipped).toBe(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips user with no reminder-enabled tasks", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs({ reminderTime: "15:00" })]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [
          { id: "t1", title: "Task A", status: "not_started", order: 0, reminderEnabled: false },
          { id: "t2", title: "Task B", status: "not_started", order: 1 },
        ],
      }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.sent).toBe(0);
    expect(data.stats.skipped).toBe(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("sends email when user has reminder-enabled tasks at matching hour", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs({ reminderTime: "15:00" })]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [
          { id: "t1", title: "Finish API", status: "not_started", order: 0, reminderEnabled: true },
        ],
      }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.stats.sent).toBe(1);
    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: expect.stringContaining("1 task"),
      }),
    );
  });

  it("collects substep reminders alongside task reminders", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs({ reminderTime: "15:00" })]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [
          {
            id: "t1",
            title: "Big Task",
            status: "not_started",
            order: 0,
            reminderEnabled: true,
            substeps: [
              { id: "s1", title: "Sub A", status: "not_started", order: 0, reminderEnabled: true },
              { id: "s2", title: "Sub B", status: "completed", order: 1, reminderEnabled: true },
            ],
          },
        ],
      }),
    ]);

    await GET(authedRequest());

    // subject should say "2 tasks" (task + 1 non-completed substep)
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("2 tasks"),
      }),
    );
  });

  it("skips completed and archived tasks/substeps", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs({ reminderTime: "15:00" })]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [
          { id: "t1", title: "Done", status: "completed", order: 0, reminderEnabled: true },
          { id: "t2", title: "Archived", status: "not_started", order: 1, reminderEnabled: true, isArchived: true },
        ],
      }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.sent).toBe(0);
    expect(data.stats.skipped).toBe(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("updates reminderLastSentDate after successful send", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs({ reminderTime: "15:00" })]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, reminderEnabled: true }],
      }),
    ]);

    await GET(authedRequest());

    expect(mockUpdatePrefs).toHaveBeenCalledWith({
      where: { userId: "u1" },
      data: { reminderLastSentDate: "2026-05-24" },
    });
  });

  it("does not update reminderLastSentDate when send fails", async () => {
    mockSendEmail.mockResolvedValue({ success: false });
    mockFindManyPrefs.mockResolvedValue([makePrefs({ reminderTime: "15:00" })]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, reminderEnabled: true }],
      }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.failed).toBe(1);
    expect(mockUpdatePrefs).not.toHaveBeenCalled();
  });

  it("handles sendEmail rejection gracefully", async () => {
    mockSendEmail.mockRejectedValue(new Error("SMTP error"));
    mockFindManyPrefs.mockResolvedValue([makePrefs({ reminderTime: "15:00" })]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, reminderEnabled: true }],
      }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.stats.failed).toBe(1);
    expect(data.stats.sent).toBe(0);
  });

  it("returns 500 on database error", async () => {
    mockFindManyPrefs.mockRejectedValue(new Error("DB connection failed"));

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to process task reminders");
  });

  it("processes multiple users independently", async () => {
    // User 1: correct hour, has tasks → sends
    // User 2: wrong hour → skips
    mockFindManyPrefs.mockResolvedValue([
      makePrefs({ userId: "u1", reminderTime: "15:00" }),
      makePrefs({ userId: "u2", reminderTime: "08:00" }),
    ]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        id: "u1",
        tasks: [{ id: "t1", title: "Task A", status: "not_started", order: 0, reminderEnabled: true }],
      }),
      makeUser({
        id: "u2",
        tasks: [{ id: "t2", title: "Task B", status: "not_started", order: 0, reminderEnabled: true }],
      }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.sent).toBe(1);
    expect(data.stats.skipped).toBe(1);
    expect(mockSendEmail).toHaveBeenCalledOnce();
  });
});
