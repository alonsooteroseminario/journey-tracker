import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateGoalStreak } from "./goalStreakUpdater";
import { prisma } from "@/lib/prisma";

const mockFindUnique = prisma.goalStreak.findUnique as ReturnType<typeof vi.fn>;
const mockUpsert = prisma.goalStreak.upsert as ReturnType<typeof vi.fn>;

describe("updateGoalStreak", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates new streak record when none exists", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({});

    await updateGoalStreak("goal-1", "user-1");

    expect(mockUpsert).toHaveBeenCalledOnce();
    const call = mockUpsert.mock.calls[0][0];
    expect(call.where).toEqual({ goalId_userId: { goalId: "goal-1", userId: "user-1" } });
    expect(call.create.currentStreak).toBe(1);
    expect(call.create.longestStreak).toBe(1);
  });

  it("increments streak when last completion was yesterday", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    mockFindUnique.mockResolvedValue({
      currentStreak: 5,
      longestStreak: 10,
      lastCompletionDate: yesterday,
      streakHistory: [],
    });
    mockUpsert.mockResolvedValue({});

    await updateGoalStreak("goal-1", "user-1");

    expect(mockUpsert).toHaveBeenCalledOnce();
    const call = mockUpsert.mock.calls[0][0];
    expect(call.update.currentStreak).toBe(6);
    expect(call.update.longestStreak).toBe(10);
  });

  it("skips update when last completion is today", async () => {
    mockFindUnique.mockResolvedValue({
      currentStreak: 3,
      longestStreak: 5,
      lastCompletionDate: new Date(),
      streakHistory: [],
    });

    await updateGoalStreak("goal-1", "user-1");

    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("resets streak to 1 when there is a gap", async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    mockFindUnique.mockResolvedValue({
      currentStreak: 10,
      longestStreak: 15,
      lastCompletionDate: threeDaysAgo,
      streakHistory: [],
    });
    mockUpsert.mockResolvedValue({});

    await updateGoalStreak("goal-1", "user-1");

    expect(mockUpsert).toHaveBeenCalledOnce();
    const call = mockUpsert.mock.calls[0][0];
    expect(call.update.currentStreak).toBe(1);
    expect(call.update.longestStreak).toBe(15);
  });

  it("updates longestStreak when current exceeds it", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    mockFindUnique.mockResolvedValue({
      currentStreak: 5,
      longestStreak: 5,
      lastCompletionDate: yesterday,
      streakHistory: [],
    });
    mockUpsert.mockResolvedValue({});

    await updateGoalStreak("goal-1", "user-1");

    const call = mockUpsert.mock.calls[0][0];
    expect(call.update.currentStreak).toBe(6);
    expect(call.update.longestStreak).toBe(6);
  });
});
