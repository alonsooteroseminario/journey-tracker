import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
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

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/email/templates/task-reminder-digest", () => ({
  TaskReminderDigestEmail: vi.fn().mockReturnValue(null),
}));

import { prisma } from "@/lib/prisma";
import * as emailSend from "@/lib/email/send";

const mockFindManyPrefs = prisma.emailPreferences.findMany as ReturnType<typeof vi.fn>;
const mockFindManyUsers = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockSendEmail = emailSend.sendEmail as ReturnType<typeof vi.fn>;

const SECRET = "test-secret";

const authedRequest = () =>
  new Request("http://localhost/api/cron/task-reminders", {
    headers: { Authorization: `Bearer ${SECRET}` },
  });

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

function makePrefs(overrides: {
  userId?: string;
  reminderStartTime?: string;
} = {}) {
  return {
    userId: overrides.userId ?? "u1",
    reminderStartTime: overrides.reminderStartTime ?? "09:00",
  };
}

describe("GET /api/cron/task-reminders", () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = SECRET;
    mockSendEmail.mockResolvedValue({ success: true });
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

  it("skips user when current hour is before their start time", async () => {
    // System time is 15:00 UTC; user wants reminders to start at 17:00
    mockFindManyPrefs.mockResolvedValue([makePrefs({ reminderStartTime: "17:00" })]);
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

  it("sends when current hour matches start time exactly", async () => {
    // System time is 15:00 UTC; start time is 15:00 — boundary condition
    mockFindManyPrefs.mockResolvedValue([makePrefs({ reminderStartTime: "15:00" })]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, reminderEnabled: true }],
      }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.sent).toBe(1);
    expect(mockSendEmail).toHaveBeenCalledOnce();
  });

  it("sends when current hour is past the start time", async () => {
    // System time is 15:00; start time is 09:00 → already past start
    mockFindManyPrefs.mockResolvedValue([makePrefs({ reminderStartTime: "09:00" })]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, reminderEnabled: true }],
      }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.sent).toBe(1);
    expect(mockSendEmail).toHaveBeenCalledOnce();
  });

  it("defaults to 09:00 start when reminderStartTime is null", async () => {
    // System time is 10:00 UTC → past default 09:00 start
    vi.setSystemTime(new Date("2026-05-24T10:00:00Z"));
    mockFindManyPrefs.mockResolvedValue([{ userId: "u1", reminderStartTime: null }]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, reminderEnabled: true }],
      }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.sent).toBe(1);
  });

  it("skips user with no reminder-enabled tasks", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
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

  it("sends every time cron fires after start time (no dedup)", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs({ reminderStartTime: "09:00" })]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, reminderEnabled: true }],
      }),
    ]);

    await GET(authedRequest());
    await GET(authedRequest());

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });

  it("collects substep reminders alongside task reminders", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
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

    // subject: task + 1 incomplete substep = 2 tasks
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("2 tasks"),
      }),
    );
  });

  it("skips completed and archived tasks/substeps", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
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

  it("counts failed when sendEmail returns success: false", async () => {
    mockSendEmail.mockResolvedValue({ success: false });
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, reminderEnabled: true }],
      }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.failed).toBe(1);
    expect(data.stats.sent).toBe(0);
  });

  it("handles sendEmail rejection gracefully", async () => {
    mockSendEmail.mockRejectedValue(new Error("SMTP error"));
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
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

  it("processes multiple users independently by start time", async () => {
    // u1: start 09:00, current 15:00 → past start → sends
    // u2: start 17:00, current 15:00 → before start → skips
    mockFindManyPrefs.mockResolvedValue([
      makePrefs({ userId: "u1", reminderStartTime: "09:00" }),
      makePrefs({ userId: "u2", reminderStartTime: "17:00" }),
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
