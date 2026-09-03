"use client";

import { FeedList } from "@/components/feed/FeedList";

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-none dark:bg-app">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
            Activity Feed
          </h1>
          <p className="text-sm sm:text-base text-text-secondary">
            See what you and your friends are accomplishing
          </p>
        </div>
        <FeedList />
      </div>
    </div>
  );
}
