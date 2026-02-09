"use client";

import type { GoalTemplate } from "@/types";

interface TemplateCardProps {
  template: GoalTemplate;
  onClick?: () => void;
}

const difficultyColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
        <span className="text-2xl sm:text-3xl">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
            {template.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            by {template.author?.name || "Unknown"}
          </p>
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3 line-clamp-2">
          {template.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm mb-2 sm:mb-3">
        {/* Difficulty Badge */}
        <span
          className={`px-2 py-1 rounded-full font-medium ${
            difficultyColors[template.difficulty]
          }`}
        >
          {template.difficulty}
        </span>

        {/* Category */}
        {template.category && (
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
            {template.category}
          </span>
        )}

        {/* Duration */}
        {template.estimatedDuration && (
          <span className="text-gray-500 dark:text-gray-400">
            ⏱ {template.estimatedDuration}
          </span>
        )}
      </div>

      {/* Tags */}
      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{template.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        <span>🍴 {template.forkCount} forks</span>
        <span className="px-2 py-1 bg-gray-50 dark:bg-gray-700/50 rounded">
          {template.visibility === "public" ? "🌍 Public" : "👥 Friends"}
        </span>
      </div>
    </div>
  );
}
