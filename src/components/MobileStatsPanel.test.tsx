import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileStatsPanel } from "./MobileStatsPanel";
import type { Goal } from "@/types";

// Mock child components
vi.mock("./StreakCounter", () => ({
  StreakCounter: () => <div data-testid="streak-counter">StreakCounter</div>,
}));

vi.mock("./ProgressBar", () => ({
  ProgressBar: ({ value, max }: { value: number; max: number }) => (
    <div data-testid="progress-bar">
      {value}/{max}
    </div>
  ),
}));

vi.mock("./Calendar", () => ({
  Calendar: () => <div data-testid="calendar">Calendar</div>,
}));

describe("MobileStatsPanel", () => {
  const mockGoals: Goal[] = [
    {
      id: "1",
      userId: "user1",
      title: "Goal 1",
      description: "Description 1",
      targetDate: new Date("2026-12-31"),
      priority: "high",
      status: "in-progress",
      tags: [],
      tasks: [
        {
          id: "t1",
          title: "Task 1",
          completed: true,
          priority: "medium",
          phaseId: null,
          order: 0,
          substeps: [],
        },
        {
          id: "t2",
          title: "Task 2",
          completed: false,
          priority: "medium",
          phaseId: null,
          order: 1,
          substeps: [],
        },
      ],
      phases: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it("renders FAB button when closed", () => {
    render(<MobileStatsPanel goals={mockGoals} />);

    const fab = screen.getByRole("button", { name: /view stats/i });
    expect(fab).toBeInTheDocument();
    expect(fab).toHaveClass("lg:hidden"); // Only visible on mobile
  });

  it("opens bottom sheet when FAB is clicked", () => {
    render(<MobileStatsPanel goals={mockGoals} />);

    // Initially, bottom sheet should not be visible
    expect(screen.queryByText("Your Progress")).not.toBeInTheDocument();

    // Click FAB
    const fab = screen.getByRole("button", { name: /view stats/i });
    fireEvent.click(fab);

    // Bottom sheet should now be visible
    expect(screen.getByText("Your Progress")).toBeInTheDocument();
    expect(screen.getByTestId("streak-counter")).toBeInTheDocument();
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    expect(screen.getByTestId("calendar")).toBeInTheDocument();
  });

  it("closes bottom sheet when overlay is clicked", () => {
    render(<MobileStatsPanel goals={mockGoals} />);

    // Open bottom sheet
    const fab = screen.getByRole("button", { name: /view stats/i });
    fireEvent.click(fab);

    // Verify it's open
    const heading = screen.getByText("Your Progress");
    expect(heading).toBeInTheDocument();

    // Click overlay
    const overlay = screen.getByTestId("stats-overlay");
    fireEvent.click(overlay);

    // Bottom sheet should be closed
    expect(screen.queryByText("Your Progress")).not.toBeInTheDocument();
  });

  it("closes bottom sheet when close button is clicked", () => {
    render(<MobileStatsPanel goals={mockGoals} />);

    // Open bottom sheet
    const fab = screen.getByRole("button", { name: /view stats/i });
    fireEvent.click(fab);

    // Verify it's open
    expect(screen.getByText("Your Progress")).toBeInTheDocument();

    // Click close button
    const closeButton = screen.getByRole("button", { name: /close stats/i });
    fireEvent.click(closeButton);

    // Bottom sheet should be closed
    expect(screen.queryByText("Your Progress")).not.toBeInTheDocument();
  });

  it("displays correct stats from goals", () => {
    render(<MobileStatsPanel goals={mockGoals} />);

    // Open bottom sheet
    const fab = screen.getByRole("button", { name: /view stats/i });
    fireEvent.click(fab);

    // Check Quick Stats section
    expect(screen.getByText("Active Goals")).toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();

    // Check ProgressBar (mocked component shows "1/2")
    expect(screen.getByTestId("progress-bar")).toHaveTextContent("1/2");

    // Verify stats components are rendered
    expect(screen.getByTestId("streak-counter")).toBeInTheDocument();
    expect(screen.getByTestId("calendar")).toBeInTheDocument();
  });
});
