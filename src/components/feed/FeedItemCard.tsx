"use client";

import { FeedItem } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { CheerButton } from "./CheerButton";
import { CommentSection } from "./CommentSection";

interface FeedItemCardProps {
  item: FeedItem;
  isExpanded: boolean;
  onToggleExpanded: (feedItemId: string) => void;
  onToggleCheer: (feedItemId: string) => Promise<void>;
  onAddComment: (feedItemId: string, content: string) => Promise<void>;
}

const FEED_TYPE_ICONS: Record<string, string> = {
  streak_milestone: "🔥",
  goal_created: "🎯",
  task_completed: "✅",
  goal_shared: "🤝",
  goal_published: "🌟",
  goal_forked: "🔱",
  streak_at_risk: "⚠️",
};

const FEED_TYPE_COLORS: Record<string, string> = {
  streak_milestone: "bg-orange-50 border-orange-200",
  goal_created: "bg-blue-50 border-blue-200",
  task_completed: "bg-green-50 border-green-200",
  goal_shared: "bg-purple-50 border-purple-200",
  goal_published: "bg-yellow-50 border-yellow-200",
  goal_forked: "bg-indigo-50 border-indigo-200",
  streak_at_risk: "bg-red-50 border-red-200",
};

export function FeedItemCard({
  item,
  isExpanded,
  onToggleExpanded,
  onToggleCheer,
  onAddComment,
}: FeedItemCardProps) {
  const handleCheerToggle = async () => {
    try {
      await onToggleCheer(item.id);
    } catch (error) {
      console.error("Failed to toggle cheer:", error);
    }
  };

  const handleSendEncouragement = async () => {
    const encouragementMessages = [
      "You've got this! Keep the streak alive! 💪",
      "Don't break the streak! You're doing amazing! 🔥",
      "Your streak is too valuable to lose! Keep going! 🌟",
      "Just a quick task will keep your streak alive! You can do it! ✨",
      "The hardest part is starting - and you've already done that! Keep it up! 🚀",
    ];
    const randomMessage =
      encouragementMessages[
        Math.floor(Math.random() * encouragementMessages.length)
      ];

    try {
      await onAddComment(item.id, randomMessage);
      if (!isExpanded) {
        onToggleExpanded(item.id);
      }
    } catch (error) {
      console.error("Failed to send encouragement:", error);
    }
  };

  const typeIcon = FEED_TYPE_ICONS[item.type] || "📌";
  const typeColor = FEED_TYPE_COLORS[item.type] || "bg-gray-50 border-gray-200";
  const commentCount = item.comments?.length || 0;
  const isStreakAtRisk = item.type === "streak_at_risk";

  return (
    <div
      className={`
        border-2 rounded-xl p-4 sm:p-5 transition-all duration-200
        ${typeColor}
        hover:shadow-md
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-base sm:text-lg font-bold shadow-md">
          {item.userName?.[0]?.toUpperCase() || "?"}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm sm:text-base text-gray-900">
              {item.userName || "Unknown"}
            </span>
            <span className="text-lg sm:text-xl">{typeIcon}</span>
          </div>
          <p className="text-sm sm:text-base text-gray-700 mb-2 break-words">
            {item.content}
          </p>
          <div className="text-xs sm:text-sm text-gray-500">
            {formatDistanceToNow(new Date(item.createdAt), {
              addSuffix: true,
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3 mt-4 pt-3 border-t border-gray-200/50 flex-wrap">
        <CheerButton
          cheerCount={item.cheerCount || 0}
          hasCheered={item.hasCheered || false}
          onToggle={handleCheerToggle}
        />
        <button
          onClick={() => onToggleExpanded(item.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <span>💬</span>
          <span>{commentCount}</span>
        </button>
        {isStreakAtRisk && (
          <button
            onClick={handleSendEncouragement}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md hover:shadow-lg active:scale-95"
          >
            <span>💪</span>
            <span className="hidden sm:inline">Send Encouragement</span>
            <span className="sm:hidden">Encourage</span>
          </button>
        )}
      </div>

      {/* Comments Section */}
      <CommentSection
        feedItemId={item.id}
        comments={item.comments || []}
        onAddComment={onAddComment}
        isExpanded={isExpanded}
      />
    </div>
  );
}
