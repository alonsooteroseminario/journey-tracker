import { describe, it, expect } from "vitest";
import { computeGoalTier, computeGoldStatus } from "./computeTier";

describe("computeGoalTier", () => {
  it("returns null when streak is 0", () => {
    expect(computeGoalTier(0)).toBeNull();
  });

  it("returns bronze for streak 1-6", () => {
    expect(computeGoalTier(1)).toBe("bronze");
    expect(computeGoalTier(6)).toBe("bronze");
  });

  it("returns silver for streak 7+", () => {
    expect(computeGoalTier(7)).toBe("silver");
    expect(computeGoalTier(30)).toBe("silver");
  });
});

describe("computeGoldStatus", () => {
  it("returns true when all goals have bronze+ streaks", () => {
    const streaks = [
      { currentStreak: 1, goalId: "g1" },
      { currentStreak: 3, goalId: "g2" },
    ];
    expect(computeGoldStatus(streaks as any[], 2)).toBe(true);
  });

  it("returns false when any goal has 0 streak", () => {
    const streaks = [
      { currentStreak: 1, goalId: "g1" },
      { currentStreak: 0, goalId: "g2" },
    ];
    expect(computeGoldStatus(streaks as any[], 2)).toBe(false);
  });

  it("returns false when not all goals have streaks", () => {
    const streaks = [{ currentStreak: 1, goalId: "g1" }];
    expect(computeGoldStatus(streaks as any[], 3)).toBe(false);
  });

  it("returns false when there are no goals", () => {
    expect(computeGoldStatus([], 0)).toBe(false);
  });
});
