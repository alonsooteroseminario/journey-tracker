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
  // Streaks
  streak_milestone: "🔥",
  streak_at_risk: "⚠️",

  // Goals
  goal_created: "🎯",
  goal_updated: "📝",
  goal_deleted: "🗑️",
  goal_shared: "🤝",
  goal_published: "🌟",
  goal_forked: "🔱",

  // Tasks
  task_created: "➕",
  task_updated: "✏️",
  task_deleted: "❌",
  task_completed: "✅",
  task_status_changed: "🔄",

  // Substeps
  substep_created: "🔹",
  substep_updated: "🔸",
  substep_deleted: "⬜",

  // Costs & Notes
  cost_added: "💰",
  cost_updated: "💵",
  note_added: "📌",
  note_updated: "📋",

  // Profile & Friends
  profile_updated: "👤",
  friend_added: "👥",
  friend_changed: "🔔",
};

const FEED_TYPE_COLORS: Record<string, string> = {
  // Streaks
  streak_milestone: "bg-orange-50 border-orange-200",
  streak_at_risk: "bg-red-50 border-red-200",

  // Goals
  goal_created: "bg-blue-50 border-blue-200",
  goal_updated: "bg-blue-50 border-blue-200",
  goal_deleted: "bg-gray-50 border-gray-300",
  goal_shared: "bg-purple-50 border-purple-200",
  goal_published: "bg-yellow-50 border-yellow-200",
  goal_forked: "bg-indigo-50 border-indigo-200",

  // Tasks
  task_created: "bg-emerald-50 border-emerald-200",
  task_updated: "bg-teal-50 border-teal-200",
  task_deleted: "bg-gray-50 border-gray-300",
  task_completed: "bg-green-50 border-green-200",
  task_status_changed: "bg-cyan-50 border-cyan-200",

  // Substeps
  substep_created: "bg-violet-50 border-violet-200",
  substep_updated: "bg-fuchsia-50 border-fuchsia-200",
  substep_deleted: "bg-gray-50 border-gray-300",

  // Costs & Notes
  cost_added: "bg-amber-50 border-amber-200",
  cost_updated: "bg-yellow-50 border-yellow-200",
  note_added: "bg-lime-50 border-lime-200",
  note_updated: "bg-green-50 border-green-200",

  // Profile & Friends
  profile_updated: "bg-indigo-50 border-indigo-200",
  friend_added: "bg-pink-50 border-pink-200",
  friend_changed: "bg-rose-50 border-rose-200",
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
  const hasDiffs = item.metadata?.diffs && Array.isArray(item.metadata.diffs) && item.metadata.diffs.length > 0;

  const renderDiffs = (): JSX.Element | null => {
    if (!hasDiffs || !item.metadata?.diffs) return null;

    const diffs = item.metadata.diffs as any[];
    return (
      <div className="mt-2 p-2 bg-white/50 rounded-lg border border-gray-200 text-xs sm:text-sm space-y-1">
        {diffs.slice(0, 3).map((diff: any, index: number) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-gray-500 font-medium min-w-[60px]">{diff.field}:</span>
            <div className="flex-1">
              {diff.oldValue !== undefined && (
                <span className="text-red-600 line-through">
                  {String(diff.oldValue).substring(0, 50)}
                  {String(diff.oldValue).length > 50 ? "..." : ""}
                </span>
              )}
              {diff.oldValue !== undefined && diff.newValue !== undefined && (
                <span className="mx-1 text-gray-400">→</span>
              )}
              {diff.newValue !== undefined && (
                <span className="text-green-600 font-medium">
                  {String(diff.newValue).substring(0, 50)}
                  {String(diff.newValue).length > 50 ? "..." : ""}
                </span>
              )}
            </div>
          </div>
        ))}
        {diffs.length > 3 && (
          <div className="text-gray-400 italic">
            +{diffs.length - 3} more changes
          </div>
        )}
      </div>
    );
  };

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

          {renderDiffs()}

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
