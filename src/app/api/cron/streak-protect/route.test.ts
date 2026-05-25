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

vi.mock("@/lib/email/templates/streak-reminder", () => ({
  StreakReminderEmail: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/email/generateAiContext", () => ({
  generateAiContext: vi.fn().mockResolvedValue(null),
}));

// No mock for @/lib/dateUtils — real implementations use vi.setSystemTime correctly:
// getTodayInTimezone(timezone) reads new Date() → faked by vi.setSystemTime
// getCurrentHourInTimezone(timezone, now) receives the nowUtc passed explicitly

import { prisma } from "@/lib/prisma";
import * as emailSend from "@/lib/email/send";
import * as generateAiContextModule from "@/lib/email/generateAiContext";

const mockFindManyPrefs = prisma.emailPreferences.findMany as ReturnType<typeof vi.fn>;
const mockFindManyUsers = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockUpdatePrefs = prisma.emailPreferences.update as ReturnType<typeof vi.fn>;
const mockSendEmail = emailSend.sendEmail as ReturnType<typeof vi.fn>;
const mockGenerateAiContext = generateAiContextModule.generateAiContext as ReturnType<typeof vi.fn>;

const SECRET = "test-secret";

const authedRequest = () =>
  new Request("http://localhost/api/cron/streak-protect", {
    headers: { Authorization: `Bearer ${SECRET}` },
  });

function makeUser(overrides: {
  id?: string;
  clerkId?: string;
  timezone?: string | null;
  currentStreak?: number;
  streakHistory?: string[];
} = {}) {
  return {
    id: overrides.id ?? "u1",
    clerkId: overrides.clerkId ?? "clerk_u1",
    email: "user@example.com",
    name: "Alice",
    timezone: overrides.timezone ?? "UTC",
    streakData: {
      currentStreak: overrides.currentStreak ?? 5,
      streakHistory: overrides.streakHistory ?? [],
    },
  };
}

function makePrefs(overrides: {
  userId?: string;
  streakProtectTime?: string;
  streakProtectLastSentDate?: string | null;
} = {}) {
  return {
    userId: overrides.userId ?? "u1",
    streakProtectTime: overrides.streakProtectTime ?? "20:00",
    streakProtectLastSentDate: overrides.streakProtectLastSentDate ?? null,
  };
}

describe("GET /api/cron/streak-protect", () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = SECRET;
    mockSendEmail.mockResolvedValue({ success: true });
    mockUpdatePrefs.mockResolvedValue({});
    // Default: 8pm UTC (20:00)
    vi.setSystemTime(new Date("2026-05-24T20:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalEnv;
  });

  it("returns 401 without valid auth header", async () => {
    const res = await GET(new Request("http://localhost/api/cron/streak-protect"));
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
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips user with no active streak", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
    mockFindManyUsers.mockResolvedValue([makeUser({ currentStreak: 0 })]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.skipped).toBe(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips user with null streakData", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
    mockFindManyUsers.mockResolvedValue([{ ...makeUser(), streakData: null }]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.skipped).toBe(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips user before their configured warning time", async () => {
    // System time is 20:00 UTC; user wants warning at 22:00
    mockFindManyPrefs.mockResolvedValue([makePrefs({ streakProtectTime: "22:00" })]);
    mockFindManyUsers.mockResolvedValue([makeUser({ currentStreak: 7 })]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.skipped).toBe(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips user who already completed activity today", async () => {
    // streakHistory includes today → streak NOT at risk
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({ currentStreak: 5, streakHistory: ["2026-05-24"] }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.skipped).toBe(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips user already warned today (dedup)", async () => {
    mockFindManyPrefs.mockResolvedValue([
      makePrefs({ streakProtectLastSentDate: "2026-05-24" }),
    ]);
    mockFindManyUsers.mockResolvedValue([makeUser({ currentStreak: 5 })]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.skipped).toBe(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("sends warning when streak is at risk at the configured time", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs({ streakProtectTime: "20:00" })]);
    mockFindManyUsers.mockResolvedValue([makeUser({ currentStreak: 14 })]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.stats.sent).toBe(1);
    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: expect.stringContaining("14-day streak"),
      }),
    );
  });

  it("defaults to 20:00 warning time when streakProtectTime is null", async () => {
    mockFindManyPrefs.mockResolvedValue([{ userId: "u1", streakProtectTime: null, streakProtectLastSentDate: null }]);
    mockFindManyUsers.mockResolvedValue([makeUser({ currentStreak: 3 })]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.sent).toBe(1);
  });

  it("updates streakProtectLastSentDate after successful send", async () => {
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
    mockFindManyUsers.mockResolvedValue([makeUser({ currentStreak: 5 })]);

    await GET(authedRequest());

    expect(mockUpdatePrefs).toHaveBeenCalledWith({
      where: { userId: "u1" },
      data: { streakProtectLastSentDate: "2026-05-24" },
    });
  });

  it("does not update dedup date when send fails", async () => {
    mockSendEmail.mockResolvedValue({ success: false });
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
    mockFindManyUsers.mockResolvedValue([makeUser({ currentStreak: 5 })]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.failed).toBe(1);
    expect(mockUpdatePrefs).not.toHaveBeenCalled();
  });

  it("handles sendEmail rejection gracefully", async () => {
    mockSendEmail.mockRejectedValue(new Error("SMTP error"));
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
    mockFindManyUsers.mockResolvedValue([makeUser({ currentStreak: 5 })]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.stats.failed).toBe(1);
  });

  it("returns 500 on database error", async () => {
    mockFindManyPrefs.mockRejectedValue(new Error("DB connection failed"));

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to check streaks");
  });

  it("passes aiContext to template when generateAiContext returns a string", async () => {
    mockGenerateAiContext.mockResolvedValue("Your streak is your superpower — protect it!");
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
    mockFindManyUsers.mockResolvedValue([makeUser({ currentStreak: 5 })]);

    await GET(authedRequest());

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        react: expect.objectContaining({
          props: expect.objectContaining({ aiContext: "Your streak is your superpower — protect it!" }),
        }),
      }),
    );
  });

  it("omits aiContext from template when generateAiContext returns null", async () => {
    mockGenerateAiContext.mockResolvedValue(null);
    mockFindManyPrefs.mockResolvedValue([makePrefs()]);
    mockFindManyUsers.mockResolvedValue([makeUser({ currentStreak: 5 })]);

    await GET(authedRequest());

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        react: expect.objectContaining({
          props: expect.objectContaining({ aiContext: undefined }),
        }),
      }),
    );
  });

  it("processes multiple users independently", async () => {
    // u1: streak=5, no activity → sends
    // u2: streak=0 → skips (no streak to protect)
    // u3: already warned today → skips
    mockFindManyPrefs.mockResolvedValue([
      makePrefs({ userId: "u1" }),
      makePrefs({ userId: "u2" }),
      makePrefs({ userId: "u3", streakProtectLastSentDate: "2026-05-24" }),
    ]);
    mockFindManyUsers.mockResolvedValue([
      makeUser({ id: "u1", currentStreak: 5 }),
      makeUser({ id: "u2", currentStreak: 0 }),
      makeUser({ id: "u3", currentStreak: 10 }),
    ]);

    const res = await GET(authedRequest());
    const data = await res.json();

    expect(data.stats.sent).toBe(1);
    expect(data.stats.skipped).toBe(2);
    expect(mockSendEmail).toHaveBeenCalledOnce();
  });
});
