import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CheerButton } from "./CheerButton";

describe("CheerButton", () => {
  it("renders with correct cheer count", () => {
    render(
      <CheerButton
        cheerCount={5}
        hasCheered={false}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("🎉")).toBeInTheDocument();
  });

  it("shows active state when user has cheered", () => {
    render(
      <CheerButton
        cheerCount={3}
        hasCheered={true}
        onToggle={vi.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-orange-100");
    expect(button).toHaveClass("text-orange-700");
  });

  it("shows inactive state when user has not cheered", () => {
    render(
      <CheerButton
        cheerCount={0}
        hasCheered={false}
        onToggle={vi.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-surface-hover");
    expect(button).toHaveClass("text-text-secondary");
  });

  it("calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(
      <CheerButton
        cheerCount={0}
        hasCheered={false}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    const onToggle = vi.fn();
    render(
      <CheerButton
        cheerCount={0}
        hasCheered={false}
        onToggle={onToggle}
        disabled={true}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onToggle).not.toHaveBeenCalled();
  });
});
