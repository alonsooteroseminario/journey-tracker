"use client";

import { useEffect, useRef, useState } from "react";
import { FeedItem } from "@/types";
import { FeedItemCard } from "./FeedItemCard";
import { FeedFilters, FILTER_TYPE_MAP } from "./FeedFilters";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { toggleFeedItemExpanded, setFeedFilter } from "@/store/slices/feedSlice";
import {
  useGetFeedQuery,
  useAddCommentMutation,
  useToggleCheerMutation,
} from "@/store/slices/feedSlice";

export function FeedList() {
  const dispatch = useAppDispatch();
  const { expandedFeedItems, filters } = useAppSelector((state) => state.feed);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const { data: feedItems = [], isLoading, error } = useGetFeedQuery({
    limit: ITEMS_PER_PAGE,
    offset: page * ITEMS_PER_PAGE,
  });

  const [addComment] = useAddCommentMutation();
  const [toggleCheer] = useToggleCheerMutation();

  const handleToggleExpanded = (feedItemId: string) => {
    dispatch(toggleFeedItemExpanded(feedItemId));
  };

  const handleToggleCheer = async (feedItemId: string) => {
    await toggleCheer({ feedItemId }).unwrap();
  };

  const handleAddComment = async (feedItemId: string, content: string) => {
    await addComment({ feedItemId, content }).unwrap();
  };

  const handleFilterChange = (
    filter: "all" | "goals" | "tasks" | "substeps" | "streaks" | "social" | "notes_costs"
  ) => {
    dispatch(setFeedFilter(filter));
    setPage(0); // Reset to first page when filter changes
  };

  // Filter feed items based on active filter
  const filteredItems =
    filters.type === "all"
      ? feedItems
      : feedItems.filter((item: FeedItem) => {
          const allowedTypes = FILTER_TYPE_MAP[filters.type as keyof typeof FILTER_TYPE_MAP];
          return allowedTypes?.includes(item.type);
        });

  if (isLoading && page === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-2">😕</div>
        <p className="text-red-800 font-semibold mb-1">
          Failed to load feed
        </p>
        <p className="text-red-600 text-sm">Please try refreshing the page</p>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="bg-brand-light border-2 border-brand-light rounded-xl p-8 sm:p-12 text-center">
        <div className="text-5xl sm:text-6xl mb-4">📭</div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          No activity yet
        </h3>
        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
          When you and your friends create goals, complete tasks, or hit streak
          milestones, they'll appear here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <FeedFilters
        activeFilter={filters.type}
        onFilterChange={handleFilterChange}
      />

      {/* Feed Items */}
      <div className="space-y-3 sm:space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-600">
              No {filters.type === "all" ? "" : filters.type.replace("_", " ")}{" "}
              activity to show
            </p>
          </div>
        ) : (
          filteredItems.map((item: FeedItem) => (
            <FeedItemCard
              key={item.id}
              item={item}
              isExpanded={expandedFeedItems.includes(item.id)}
              onToggleExpanded={handleToggleExpanded}
              onToggleCheer={handleToggleCheer}
              onAddComment={handleAddComment}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {filteredItems.length >= ITEMS_PER_PAGE && (
        <div className="text-center pt-4">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={isLoading}
            className="px-6 py-2 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
