import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { KanbanCard } from "./KanbanCard";
import type { Task } from "@/types";

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

vi.mock("@/store/slices/streaksSlice", () => ({
  useGetGoalStreaksQuery: () => ({ data: [] }),
}));

vi.mock("@/components/StreakBadge", () => ({
  StreakBadge: () => null,
}));

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: "t1",
  title: "Test Task",
  status: "not_started",
  order: 0,
  ...overrides,
});

const defaultCardProps = {
  level: "tasks" as const,
  columnStatus: "not_started" as const,
  onDrillDown: vi.fn(),
};

describe("KanbanCard", () => {
  it("shows bell badge when task reminderEnabled is true", () => {
    render(
      <KanbanCard
        {...defaultCardProps}
        item={makeTask({ reminderEnabled: true })}
      />
    );
    expect(screen.getByText("🔔")).toBeInTheDocument();
  });

  it("hides bell badge when task reminderEnabled is false", () => {
    render(
      <KanbanCard
        {...defaultCardProps}
        item={makeTask({ reminderEnabled: false })}
      />
    );
    expect(screen.queryByText("🔔")).toBeNull();
  });

  it("hides bell badge when reminderEnabled is undefined", () => {
    render(
      <KanbanCard
        {...defaultCardProps}
        item={makeTask()}
      />
    );
    expect(screen.queryByText("🔔")).toBeNull();
  });

  it("hides bell badge at goals level even when item has reminderEnabled", () => {
    render(
      <KanbanCard
        level="goals"
        columnStatus="not_started"
        onDrillDown={vi.fn()}
        item={{
          id: "g1",
          title: "Goal",
          tasks: [],
          createdAt: "",
          updatedAt: "",
          reminderEnabled: true,
        } as any}
      />
    );
    expect(screen.queryByText("🔔")).toBeNull();
  });
});
