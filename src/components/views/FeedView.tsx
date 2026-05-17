"use client";

import { FeedList } from "@/components/feed/FeedList";

export function FeedView() {
  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          📰 Activity Feed
        </h1>
        <p className="text-sm sm:text-base text-text-secondary">
          See what you and your friends are accomplishing
        </p>
      </div>

      {/* Feed List */}
      <FeedList />
    </div>
  );
}
