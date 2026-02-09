import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { GET } from "./route";
import * as streakChecker from "@/lib/feed/streakChecker";

vi.mock("@/lib/feed/streakChecker", () => ({
  notifyFriendsOfAtRiskStreaks: vi.fn(),
}));

const mockNotifyFriendsOfAtRiskStreaks =
  streakChecker.notifyFriendsOfAtRiskStreaks as ReturnType<typeof vi.fn>;

describe("GET /api/cron/check-streaks", () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalEnv;
  });

  it("returns 401 without valid auth header", async () => {
    const request = new Request("http://localhost/api/cron/check-streaks");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("processes streak checks successfully", async () => {
    mockNotifyFriendsOfAtRiskStreaks.mockResolvedValue({
      usersChecked: 5,
      atRiskUsers: 2,
      feedItemsCreated: 2,
      notificationsSent: 4,
      errors: 0,
    });

    const request = new Request("http://localhost/api/cron/check-streaks", {
      headers: { Authorization: "Bearer test-secret" },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.stats.atRiskUsers).toBe(2);
    expect(data.stats.notificationsSent).toBe(4);
  });

  it("handles no at-risk users", async () => {
    mockNotifyFriendsOfAtRiskStreaks.mockResolvedValue({
      usersChecked: 0,
      atRiskUsers: 0,
      feedItemsCreated: 0,
      notificationsSent: 0,
      errors: 0,
    });

    const request = new Request("http://localhost/api/cron/check-streaks", {
      headers: { Authorization: "Bearer test-secret" },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.atRiskUsers).toBe(0);
  });

  it("handles errors gracefully", async () => {
    mockNotifyFriendsOfAtRiskStreaks.mockRejectedValue(
      new Error("Database error")
    );

    const request = new Request("http://localhost/api/cron/check-streaks", {
      headers: { Authorization: "Bearer test-secret" },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Failed to check streaks");
  });
});
