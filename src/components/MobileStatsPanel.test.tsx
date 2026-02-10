import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileStatsPanel } from "./MobileStatsPanel";

const mockStreak = {
  currentStreak: 5,
  longestStreak: 10,
  streakHistory: [
    { date: "2026-02-10", completed: true },
    { date: "2026-02-09", completed: true },
  ],
};

const mockActivityLog = [
  {
    id: "1",
    date: new Date().toISOString(),
    type: "task_completed" as const,
    goalId: "goal-1",
    taskId: "task-1",
    description: "Completed Test Task",
  },
];

describe("MobileStatsPanel", () => {
  it("should render FAB button", () => {
    render(
      <MobileStatsPanel
        totalProgress={50}
        completedTasks={5}
        totalTasks={10}
        totalSubsteps={20}
        goalCount={3}
        streak={mockStreak}
        activityLog={mockActivityLog}
      />
    );

    const fab = screen.getByRole("button", { name: /view stats/i });
    expect(fab).toBeDefined();
  });

  it("should show bottom sheet when FAB is clicked", () => {
    render(
      <MobileStatsPanel
        totalProgress={50}
        completedTasks={5}
        totalTasks={10}
        totalSubsteps={20}
        goalCount={3}
        streak={mockStreak}
        activityLog={mockActivityLog}
      />
    );

    const fab = screen.getByRole("button", { name: /view stats/i });
    fireEvent.click(fab);

    expect(screen.getByText(/overall progress/i)).toBeDefined();
    expect(screen.getByText(/activity calendar/i)).toBeDefined();
  });

  it("should close bottom sheet when overlay is clicked", () => {
    render(
      <MobileStatsPanel
        totalProgress={50}
        completedTasks={5}
        totalTasks={10}
        totalSubsteps={20}
        goalCount={3}
        streak={mockStreak}
        activityLog={mockActivityLog}
      />
    );

    const fab = screen.getByRole("button", { name: /view stats/i });
    fireEvent.click(fab);

    const overlay = screen.getByTestId("stats-overlay");
    fireEvent.click(overlay);

    expect(screen.queryByText(/overall progress/i)).toBeNull();
  });

  it("should display correct stats", () => {
    render(
      <MobileStatsPanel
        totalProgress={75}
        completedTasks={15}
        totalTasks={20}
        totalSubsteps={30}
        goalCount={5}
        streak={mockStreak}
        activityLog={mockActivityLog}
      />
    );

    const fab = screen.getByRole("button", { name: /view stats/i });
    fireEvent.click(fab);

    expect(screen.getByText("75%")).toBeDefined();
    expect(screen.getByText("15 done")).toBeDefined();
    expect(screen.getByText("5 left")).toBeDefined();
  });
});
