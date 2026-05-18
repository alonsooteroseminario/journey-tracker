import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/hooks/useGoals", () => ({
  useGoals: vi.fn(),
}));
vi.mock("@/store/slices/streaksSlice", () => ({
  useGetStreakQuery: vi.fn(),
}));

import { useGoals } from "@/hooks/useGoals";
import { useGetStreakQuery } from "@/store/slices/streaksSlice";
import { useHeaderStats } from "./useHeaderStats";
import { renderHook } from "@testing-library/react";

const mockUseGoals = vi.mocked(useGoals);
const mockUseGetStreakQuery = vi.mocked(useGetStreakQuery);

beforeEach(() => {
  vi.clearAllMocks();
});

function mockGoals(progress: number) {
  mockUseGoals.mockReturnValue({
    getTotalProgress: () => progress,
    goals: [],
    isLoading: false,
  } as never);
}

function mockStreak(currentStreak: number) {
  mockUseGetStreakQuery.mockReturnValue({
    data: { currentStreak },
    isLoading: false,
  } as never);
}

describe("useHeaderStats", () => {
  it("returns progress from getTotalProgress and streak from query data", () => {
    mockGoals(67);
    mockStreak(5);
    const { result } = renderHook(() => useHeaderStats());
    expect(result.current.progress).toBe(67);
    expect(result.current.streak).toBe(5);
  });

  it("defaults to 0 progress and 0 streak when data is absent", () => {
    mockUseGoals.mockReturnValue({
      getTotalProgress: () => 0,
      goals: [],
      isLoading: true,
    } as never);
    mockUseGetStreakQuery.mockReturnValue({ data: undefined, isLoading: true } as never);
    const { result } = renderHook(() => useHeaderStats());
    expect(result.current.progress).toBe(0);
    expect(result.current.streak).toBe(0);
  });

  it("floors fractional progress to an integer", () => {
    mockGoals(42.7);
    mockStreak(3);
    const { result } = renderHook(() => useHeaderStats());
    expect(result.current.progress).toBe(42);
  });
});
