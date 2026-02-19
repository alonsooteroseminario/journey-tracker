import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeedFilters } from "./FeedFilters";

describe("FeedFilters", () => {
  it("renders all filter options", () => {
    render(
      <FeedFilters activeFilter="all" onFilterChange={vi.fn()} />
    );

    expect(screen.getByText("📰")).toBeInTheDocument();
    expect(screen.getByText("🔥")).toBeInTheDocument();
    expect(screen.getByText("🎯")).toBeInTheDocument();
    expect(screen.getByText("✅")).toBeInTheDocument();
  });

  it("highlights active filter", () => {
    render(
      <FeedFilters activeFilter="streaks" onFilterChange={vi.fn()} />
    );

    const buttons = screen.getAllByRole("button");
    const streaksButton = buttons.find((btn) =>
      btn.textContent?.includes("🔥")
    );

    expect(streaksButton).toHaveClass("bg-blue-600");
    expect(streaksButton).toHaveClass("text-white");
  });

  it("calls onFilterChange when a filter is clicked", () => {
    const onFilterChange = vi.fn();
    render(
      <FeedFilters activeFilter="all" onFilterChange={onFilterChange} />
    );

    const buttons = screen.getAllByRole("button");
    const goalsButton = buttons.find((btn) => btn.textContent?.includes("🎯"));

    fireEvent.click(goalsButton!);
    expect(onFilterChange).toHaveBeenCalledWith("goals");
  });

  it("applies correct styling to inactive filters", () => {
    render(
      <FeedFilters activeFilter="all" onFilterChange={vi.fn()} />
    );

    const buttons = screen.getAllByRole("button");
    const streaksButton = buttons.find((btn) =>
      btn.textContent?.includes("🔥")
    );

    expect(streaksButton).toHaveClass("bg-white");
    expect(streaksButton).toHaveClass("text-gray-700");
  });
});
