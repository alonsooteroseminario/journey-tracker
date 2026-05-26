import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { KanbanFilters } from "./KanbanFilters";

const defaultProps = {
  searchTerm: "",
  onSearchChange: vi.fn(),
  dateFilter: "all" as const,
  onDateFilterChange: vi.fn(),
  priorityFilter: "all" as const,
  onPriorityFilterChange: vi.fn(),
  showDateFilter: false,
  showPriorityFilter: false,
  viewLevel: "tasks" as const,
  onViewLevelChange: vi.fn(),
  doneToday: false,
  onDoneTodayChange: vi.fn(),
  reminderOnly: false,
  onReminderOnlyChange: vi.fn(),
};

describe("KanbanFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders bell chip", () => {
    render(<KanbanFilters {...defaultProps} />);
    const bellBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("🔔"));
    expect(bellBtn).toBeTruthy();
  });

  it("bell chip inactive styling — does not have bg-brand-light class", () => {
    render(<KanbanFilters {...defaultProps} reminderOnly={false} />);
    const bellBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("🔔"))!;
    expect(bellBtn.className).not.toContain("bg-brand-light");
  });

  it("bell chip active styling — has bg-brand-light class when reminderOnly is true", () => {
    render(<KanbanFilters {...defaultProps} reminderOnly={true} />);
    const bellBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("🔔"))!;
    expect(bellBtn.className).toContain("bg-brand-light");
  });

  it("clicking bell chip calls onReminderOnlyChange(true) when inactive", () => {
    const onReminderOnlyChange = vi.fn();
    render(
      <KanbanFilters
        {...defaultProps}
        reminderOnly={false}
        onReminderOnlyChange={onReminderOnlyChange}
      />
    );
    const bellBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("🔔"))!;
    fireEvent.click(bellBtn);
    expect(onReminderOnlyChange).toHaveBeenCalledWith(true);
  });

  it("clicking bell chip calls onReminderOnlyChange(false) when active", () => {
    const onReminderOnlyChange = vi.fn();
    render(
      <KanbanFilters
        {...defaultProps}
        reminderOnly={true}
        onReminderOnlyChange={onReminderOnlyChange}
      />
    );
    const bellBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("🔔"))!;
    fireEvent.click(bellBtn);
    expect(onReminderOnlyChange).toHaveBeenCalledWith(false);
  });

  it("Clear filters button appears when reminderOnly is true", () => {
    render(<KanbanFilters {...defaultProps} reminderOnly={true} />);
    const clearBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("Clear"));
    expect(clearBtn).toBeTruthy();
  });
});
