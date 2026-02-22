import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeedItemCard } from "./FeedItemCard";
import { FeedItem } from "@/types";

const mockFeedItem: FeedItem = {
  id: "feed-1",
  userId: "user-1",
  userName: "John Doe",
  userImage: null,
  type: "streak_milestone",
  content: "John Doe reached a 7-day streak! 🔥",
  metadata: { streakCount: 7 },
  visibility: "friends",
  createdAt: new Date("2024-01-15T10:00:00Z"),
  cheerCount: 5,
  hasCheered: false,
  comments: [
    {
      id: "comment-1",
      feedItemId: "feed-1",
      userId: "user-2",
      userName: "Jane Smith",
      userImage: null,
      content: "Great job!",
      createdAt: new Date("2024-01-15T11:00:00Z"),
    },
  ],
  cheers: [],
};

describe("FeedItemCard", () => {
  it("renders feed item content correctly", () => {
    render(
      <FeedItemCard
        item={mockFeedItem}
        isExpanded={false}
        onToggleExpanded={vi.fn()}
        onToggleCheer={vi.fn()}
        onAddComment={vi.fn()}
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(
      screen.getByText("John Doe reached a 7-day streak! 🔥")
    ).toBeInTheDocument();
    expect(screen.getByText("🔥")).toBeInTheDocument();
  });

  it("displays cheer count", () => {
    render(
      <FeedItemCard
        item={mockFeedItem}
        isExpanded={false}
        onToggleExpanded={vi.fn()}
        onToggleCheer={vi.fn()}
        onAddComment={vi.fn()}
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("displays comment count", () => {
    render(
      <FeedItemCard
        item={mockFeedItem}
        isExpanded={false}
        onToggleExpanded={vi.fn()}
        onToggleCheer={vi.fn()}
        onAddComment={vi.fn()}
      />
    );

    expect(screen.getByText("1")).toBeInTheDocument(); // 1 comment
  });

  it("calls onToggleExpanded when comment button is clicked", () => {
    const onToggleExpanded = vi.fn();
    render(
      <FeedItemCard
        item={mockFeedItem}
        isExpanded={false}
        onToggleExpanded={onToggleExpanded}
        onToggleCheer={vi.fn()}
        onAddComment={vi.fn()}
      />
    );

    const commentButton = screen.getAllByRole("button")[1]; // Second button is comment button
    fireEvent.click(commentButton);
    expect(onToggleExpanded).toHaveBeenCalledWith("feed-1");
  });

  it("does not show comments when not expanded", () => {
    render(
      <FeedItemCard
        item={mockFeedItem}
        isExpanded={false}
        onToggleExpanded={vi.fn()}
        onToggleCheer={vi.fn()}
        onAddComment={vi.fn()}
      />
    );

    expect(screen.queryByText("Great job!")).not.toBeInTheDocument();
  });

  it("shows comments when expanded", () => {
    render(
      <FeedItemCard
        item={mockFeedItem}
        isExpanded={true}
        onToggleExpanded={vi.fn()}
        onToggleCheer={vi.fn()}
        onAddComment={vi.fn()}
      />
    );

    expect(screen.getByText("Great job!")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("applies correct styling based on feed type", () => {
    const { container } = render(
      <FeedItemCard
        item={mockFeedItem}
        isExpanded={false}
        onToggleExpanded={vi.fn()}
        onToggleCheer={vi.fn()}
        onAddComment={vi.fn()}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("bg-orange-50");
    expect(card).toHaveClass("border-orange-200");
  });

  it("shows Send Encouragement button for streak_at_risk items", () => {
    const atRiskItem: FeedItem = { ...mockFeedItem, type: "streak_at_risk" };
    render(
      <FeedItemCard
        item={atRiskItem}
        isExpanded={false}
        onToggleExpanded={vi.fn()}
        onToggleCheer={vi.fn()}
        onAddComment={vi.fn()}
      />
    );
    expect(screen.getByText("Encourage")).toBeInTheDocument();
  });

  it("calls onAddComment and onToggleExpanded when Send Encouragement clicked (not expanded)", async () => {
    const onAddComment = vi.fn().mockResolvedValue(undefined);
    const onToggleExpanded = vi.fn();
    const atRiskItem: FeedItem = { ...mockFeedItem, type: "streak_at_risk" };
    render(
      <FeedItemCard
        item={atRiskItem}
        isExpanded={false}
        onToggleExpanded={onToggleExpanded}
        onToggleCheer={vi.fn()}
        onAddComment={onAddComment}
      />
    );
    fireEvent.click(screen.getByText("Encourage"));
    await vi.waitFor(() => expect(onAddComment).toHaveBeenCalledWith("feed-1", expect.any(String)));
  });

  it("does not show Send Encouragement button for non-streak_at_risk items", () => {
    render(
      <FeedItemCard
        item={mockFeedItem}
        isExpanded={false}
        onToggleExpanded={vi.fn()}
        onToggleCheer={vi.fn()}
        onAddComment={vi.fn()}
      />
    );
    expect(screen.queryByText("Encourage")).not.toBeInTheDocument();
  });

  it("renders diffs when metadata.diffs is present", () => {
    const itemWithDiffs: FeedItem = {
      ...mockFeedItem,
      metadata: {
        diffs: [
          { field: "title", oldValue: "Old Title", newValue: "New Title" },
          { field: "status", oldValue: "pending", newValue: "completed" },
        ],
      },
    };
    render(
      <FeedItemCard
        item={itemWithDiffs}
        isExpanded={false}
        onToggleExpanded={vi.fn()}
        onToggleCheer={vi.fn()}
        onAddComment={vi.fn()}
      />
    );
    expect(screen.getByText("title:")).toBeInTheDocument();
    expect(screen.getByText("Old Title")).toBeInTheDocument();
    expect(screen.getByText("New Title")).toBeInTheDocument();
  });

  it("shows '+N more changes' when diffs exceed 3", () => {
    const itemWithManyDiffs: FeedItem = {
      ...mockFeedItem,
      metadata: {
        diffs: [
          { field: "f1", oldValue: "a", newValue: "b" },
          { field: "f2", oldValue: "c", newValue: "d" },
          { field: "f3", oldValue: "e", newValue: "f" },
          { field: "f4", oldValue: "g", newValue: "h" },
        ],
      },
    };
    render(
      <FeedItemCard
        item={itemWithManyDiffs}
        isExpanded={false}
        onToggleExpanded={vi.fn()}
        onToggleCheer={vi.fn()}
        onAddComment={vi.fn()}
      />
    );
    expect(screen.getByText("+1 more changes")).toBeInTheDocument();
  });

  it("calls onToggleCheer via cheer button", async () => {
    const onToggleCheer = vi.fn().mockResolvedValue(undefined);
    render(
      <FeedItemCard
        item={mockFeedItem}
        isExpanded={false}
        onToggleExpanded={vi.fn()}
        onToggleCheer={onToggleCheer}
        onAddComment={vi.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole("button")[0]);
    await vi.waitFor(() => expect(onToggleCheer).toHaveBeenCalledWith("feed-1"));
  });
});
