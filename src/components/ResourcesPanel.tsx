"use client";

import { useState } from "react";
import { ResourceCategory } from "@/types";

interface ResourcesPanelProps {
  resources: ResourceCategory[];
}

export function ResourcesPanel({ resources }: ResourcesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 sm:p-6 text-left bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-3xl">🔗</span>
            <div>
              <h3 className="text-sm sm:text-xl font-bold text-gray-800">Official Resources</h3>
              <p className="text-[10px] sm:text-sm text-gray-600">{resources.length} categories of helpful links</p>
            </div>
          </div>
          <svg
            className={`w-4 h-4 sm:w-6 sm:h-6 text-gray-500 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* Quick Category Pills */}
        <div className="mt-2 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
          {resources.slice(0, 5).map((cat) => (
            <span
              key={cat.category}
              className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/60 rounded-full text-[10px] sm:text-xs font-medium text-gray-600"
            >
              {cat.category}
            </span>
          ))}
          {resources.length > 5 && (
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 rounded-full text-[10px] sm:text-xs font-medium text-blue-600">
              +{resources.length - 5} more
            </span>
          )}
        </div>
      </button>

      {/* Resources Content */}
      {isExpanded && (
        <div className="p-3 sm:p-6 border-t border-gray-100">
          {/* Category Navigation */}
          <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium transition-colors ${
                activeCategory === null
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {resources.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium transition-colors ${
                  activeCategory === cat.category
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>

          {/* Resources Grid */}
          <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
            {resources
              .filter((cat) => !activeCategory || cat.category === activeCategory)
              .map((category) => (
                <div key={category.category}>
                  <h4 className="text-[10px] sm:text-sm font-bold text-gray-700 uppercase tracking-wide mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></span>
                    {category.category}
                  </h4>
                  <div className="grid gap-1.5 sm:gap-2">
                    {category.resources.map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all group"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-base text-gray-800 group-hover:text-blue-600 transition-colors">
                            {resource.name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">{resource.url}</p>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
