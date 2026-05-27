import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RemindersPanel } from "./RemindersPanel";

// Mock RTK Query
vi.mock("@/store/slices/goalsSlice", () => ({
  useGetGoalsQuery: vi.fn(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { useGetGoalsQuery } from "@/store/slices/goalsSlice";

const mockUseGetGoalsQuery = useGetGoalsQuery as ReturnType<typeof vi.fn>;

describe("RemindersPanel", () => {
  it("returns null when no reminder-enabled items", () => {
    mockUseGetGoalsQuery.mockReturnValue({
      data: [
        {
          id: "g1",
          title: "Goal 1",
          tasks: [{ id: "t1", title: "Task A", status: "not_started", reminderEnabled: false }],
        },
      ],
    });
    const { container } = render(<RemindersPanel />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when all reminder items are completed", () => {
    mockUseGetGoalsQuery.mockReturnValue({
      data: [
        {
          id: "g1",
          title: "Goal 1",
          tasks: [{ id: "t1", title: "Task A", status: "completed", reminderEnabled: true }],
        },
      ],
    });
    const { container } = render(<RemindersPanel />);
    expect(container.firstChild).toBeNull();
  });

  it("shows panel with count when reminder items exist", () => {
    mockUseGetGoalsQuery.mockReturnValue({
      data: [
        {
          id: "g1",
          title: "Goal 1",
          tasks: [
            { id: "t1", title: "Task A", status: "not_started", reminderEnabled: true },
            { id: "t2", title: "Task B", status: "not_started", reminderEnabled: false },
          ],
        },
      ],
    });
    render(<RemindersPanel />);
    expect(screen.getByText(/Reminders \(1\)/)).toBeInTheDocument();
    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.queryByText("Task B")).not.toBeInTheDocument();
  });

  it("groups items by goal title", () => {
    mockUseGetGoalsQuery.mockReturnValue({
      data: [
        {
          id: "g1",
          title: "My Goal",
          tasks: [
            { id: "t1", title: "Task A", status: "not_started", reminderEnabled: true },
            { id: "t2", title: "Task B", status: "not_started", reminderEnabled: true },
          ],
        },
      ],
    });
    render(<RemindersPanel />);
    expect(screen.getByText("My Goal")).toBeInTheDocument();
    expect(screen.getByText(/Reminders \(2\)/)).toBeInTheDocument();
  });

  it("includes substep reminders", () => {
    mockUseGetGoalsQuery.mockReturnValue({
      data: [
        {
          id: "g1",
          title: "Goal 1",
          tasks: [
            {
              id: "t1",
              title: "Task A",
              status: "not_started",
              reminderEnabled: false,
              substeps: [
                { id: "s1", title: "Sub A", status: "not_started", reminderEnabled: true },
              ],
            },
          ],
        },
      ],
    });
    render(<RemindersPanel />);
    expect(screen.getByText("Sub A")).toBeInTheDocument();
  });

  it("handles goals with null tasks", () => {
    mockUseGetGoalsQuery.mockReturnValue({
      data: [{ id: "g1", title: "Goal 1", tasks: null }],
    });
    const { container } = render(<RemindersPanel />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when no goals", () => {
    mockUseGetGoalsQuery.mockReturnValue({ data: [] });
    const { container } = render(<RemindersPanel />);
    expect(container.firstChild).toBeNull();
  });
});
