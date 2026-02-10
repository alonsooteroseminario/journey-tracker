"use client";

import type { GoalTemplate } from "@/types";

interface TemplateCardProps {
  template: GoalTemplate;
  onClick?: () => void;
}

const difficultyColors = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
};

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
        <span className="text-2xl sm:text-3xl">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
            {template.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            by {template.author?.name || "Unknown"}
          </p>
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 line-clamp-2">
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
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
            {template.category}
          </span>
        )}

        {/* Duration */}
        {template.estimatedDuration && (
          <span className="text-gray-600">
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
              className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="text-xs text-gray-600">
              +{template.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-200 text-xs sm:text-sm text-gray-600">
        <span>🍴 {template.forkCount} forks</span>
        <span className="px-2 py-1 bg-gray-100 rounded">
          {template.visibility === "public" ? "🌍 Public" : "👥 Friends"}
        </span>
      </div>
    </div>
  );
}
