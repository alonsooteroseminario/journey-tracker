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
  tasks?: object[];
} = {}) {
  return {
    id: overrides.id ?? "u1",
    email: "user@example.com",
    name: "Alice",
    goals: [
      {
        title: "My Goal",
        tasks: overrides.tasks ?? [],
      },
    ],
  };
}

function makePrefs(overrides: { userId?: string } = {}) {
  return { userId: overrides.userId ?? "u1" };
}

describe("GET /api/cron/task-reminders", () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = SECRET;
    mockSendEmail.mockResolvedValue({ success: true });
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

  it("sends email when user has reminder-enabled tasks", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
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

  it("sends every time cron fires (no daily dedup)", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, reminderEnabled: true }],
      }),
    ]);

    // Fire the cron twice — both should send
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

    // subject should say "2 tasks" (task + 1 non-completed substep)
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

  it("does not update prefs after sending (no dedup state)", async () => {
    const mockUpdate = vi.fn();
    // @ts-ignore
    prisma.emailPreferences.update = mockUpdate;

    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        tasks: [{ id: "t1", title: "Task", status: "not_started", order: 0, reminderEnabled: true }],
      }),
    ]);

    await GET(authedRequest());

    expect(mockUpdate).not.toHaveBeenCalled();
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

  it("processes multiple users independently", async () => {
    mockFindManyPrefs.mockResolvedValue([
      makePrefs({ userId: "u1" }),
      makePrefs({ userId: "u2" }),
    ]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({
        id: "u1",
        tasks: [{ id: "t1", title: "Task A", status: "not_started", order: 0, reminderEnabled: true }],
      }),
      makeUser({
        id: "u2",
        tasks: [{ id: "t2", title: "Task B", status: "not_started", order: 0 }],
      }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    // u1 sends, u2 has no bell-flagged tasks → skips
    expect(data.stats.sent).toBe(1);
    expect(data.stats.skipped).toBe(1);
    expect(mockSendEmail).toHaveBeenCalledOnce();
  });
});
