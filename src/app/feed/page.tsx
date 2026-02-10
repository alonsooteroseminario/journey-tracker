"use client";

import { FeedList } from "@/components/feed/FeedList";
import { Header } from "@/components/Header";
import { useGoals } from "@/hooks/useGoals";

export default function FeedPage() {
  const { profile, streak } = useGoals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header
        currentStreak={streak.currentStreak}
        showNewGoalButton={false}
      />
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Activity Feed
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            See what you and your friends are accomplishing
          </p>
        </div>

        {/* Feed List */}
        <FeedList />
      </div>
    </div>
  );
}
