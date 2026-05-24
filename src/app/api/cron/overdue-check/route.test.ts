import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
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
}));

import { prisma } from "@/lib/prisma";
import * as notifications from "@/lib/email/notifications";
import * as aiContext from "@/lib/email/generateAiContext";

const mockFindMany = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockNotify = notifications.notify as ReturnType<typeof vi.fn>;
const mockGenerateAiContext = aiContext.generateAiContext as ReturnType<typeof vi.fn>;

const authedRequest = () =>
  new Request("http://localhost/api/cron/overdue-check", {
    headers: { Authorization: "Bearer test-secret" },
  });

describe("GET /api/cron/overdue-check", () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
    mockGenerateAiContext.mockResolvedValue(null);
    mockNotify.mockResolvedValue({ success: true });
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalEnv;
  });

  it("returns 401 without valid auth header", async () => {
    const response = await GET(new Request("http://localhost/api/cron/overdue-check"));
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("sends alert for an overdue task", async () => {
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
              { id: "t1", title: "Vocab quiz", status: "not_started", order: 0, dueDate: "2026-05-21" },
            ],
          },
        ],
      },
    ]);

    const response = await GET(authedRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.sent).toBe(1);
    expect(mockNotify).toHaveBeenCalledWith("u1", "overdueAlert", {
      userName: "Alice",
      taskTitle: "Vocab quiz",
      goalTitle: "Learn Spanish",
      daysOverdue: 2,
      aiContext: undefined,
    });
  });

  it("skips completed and archived tasks", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "u2",
        clerkId: "clerk_2",
        name: "Bob",
        timezone: null,
        goals: [
          {
            title: "Goal",
            tasks: [
              { id: "t1", status: "completed", order: 0, dueDate: "2026-05-20" },
              { id: "t2", status: "not_started", order: 1, dueDate: "2026-05-20", isArchived: true },
            ],
          },
        ],
      },
    ]);

    const response = await GET(authedRequest());
    const data = await response.json();

    expect(data.stats.sent).toBe(0);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("skips tasks due today or in the future", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "u3",
        clerkId: "clerk_3",
        name: "Carol",
        timezone: null,
        goals: [
          {
            title: "Goal",
            tasks: [
              { id: "t1", title: "Today", status: "not_started", order: 0, dueDate: "2026-05-23" },
              { id: "t2", title: "Future", status: "not_started", order: 1, dueDate: "2026-05-25" },
            ],
          },
        ],
      },
    ]);

    await GET(authedRequest());
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("includes AI context when generateAiContext returns one", async () => {
    mockGenerateAiContext.mockResolvedValue("This is blocking your promotion goal.");
    mockFindMany.mockResolvedValue([
      {
        id: "u4",
        clerkId: "clerk_4",
        name: "Dave",
        timezone: null,
        goals: [
          {
            title: "Get Promotion",
            tasks: [
              { id: "t1", title: "Write proposal", status: "not_started", order: 0, dueDate: "2026-05-22" },
            ],
          },
        ],
      },
    ]);

    await GET(authedRequest());

    expect(mockNotify).toHaveBeenCalledWith("u4", "overdueAlert", expect.objectContaining({
      aiContext: "This is blocking your promotion goal.",
    }));
  });

  it("returns 500 on database error", async () => {
    mockFindMany.mockRejectedValue(new Error("DB connection failed"));

    const response = await GET(authedRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to process overdue check");
  });
});
