"use client";

import { useState } from "react";
import { ResourceCategory } from "@/types";

interface ResourcesPanelProps {
  resources: ResourceCategory[];
  onAddResource?: (category: string, name: string, url: string) => void;
  onDeleteResource?: (category: string, resourceIndex: number) => void;
}

export function ResourcesPanel({ resources, onAddResource, onDeleteResource }: ResourcesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [hoveredResource, setHoveredResource] = useState<string | null>(null);

  return (
    <div className="bg-surface rounded-2xl shadow-lg border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 sm:p-6 text-left bg-gradient-to-r from-brand-light to-brand-light/40 hover:from-brand-light hover:to-brand-light transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-3xl">🔗</span>
            <div>
              <h3 className="text-sm sm:text-xl font-bold text-text-primary">Official Resources</h3>
              <p className="text-[10px] sm:text-sm text-text-secondary">{resources.length} categories of helpful links</p>
            </div>
          </div>
          <svg
            className={`w-4 h-4 sm:w-6 sm:h-6 text-text-muted transition-transform ${
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
              className="px-2 sm:px-3 py-0.5 sm:py-1 bg-surface/60 rounded-full text-[10px] sm:text-xs font-medium text-text-secondary"
            >
              {cat.category}
            </span>
          ))}
          {resources.length > 5 && (
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-brand-light rounded-full text-[10px] sm:text-xs font-medium text-brand-primary">
              +{resources.length - 5} more
            </span>
          )}
        </div>
      </button>

      {/* Resources Content */}
      {isExpanded && (
        <div className="p-3 sm:p-6 border-t border-border">
          {/* Category Navigation */}
          <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium transition-colors ${
                activeCategory === null
                  ? "bg-brand-primary text-white"
                  : "bg-surface-hover text-text-secondary hover:bg-surface-hover"
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
                    ? "bg-brand-primary text-white"
                    : "bg-surface-hover text-text-secondary hover:bg-surface-hover"
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
                  <h4 className="text-[10px] sm:text-sm font-bold text-text-secondary uppercase tracking-wide mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-primary rounded-full"></span>
                    {category.category}
                  </h4>
                  <div className="grid gap-1.5 sm:gap-2">
                    {category.resources.map((resource, index) => (
                      <div
                        key={index}
                        className="relative group"
                        onMouseEnter={() => setHoveredResource(`${category.category}-${index}`)}
                        onMouseLeave={() => setHoveredResource(null)}
                      >
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-surface-muted rounded-lg hover:bg-brand-light hover:border-brand-light border border-transparent transition-all"
                        >
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-brand-light rounded-lg flex items-center justify-center text-brand-primary group-hover:bg-brand-light transition-colors">
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
                            <p className="font-medium text-xs sm:text-base text-text-primary group-hover:text-brand-primary transition-colors">
                              {resource.name}
                            </p>
                            <p className="text-[10px] sm:text-xs text-text-muted truncate">{resource.url}</p>
                          </div>
                          <svg
                            className="w-5 h-5 text-text-muted group-hover:text-brand-primary transition-colors"
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
                        {onDeleteResource && hoveredResource === `${category.category}-${index}` && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              onDeleteResource(category.category, index);
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-lg"
                            title="Delete resource"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {/* Add Resource Form */}
          {onAddResource && (
            <div className="mt-3 sm:mt-4">
              {!isAdding ? (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full p-2 sm:p-3 border-2 border-dashed border-border-strong rounded-lg text-xs sm:text-sm text-text-secondary hover:border-brand-primary hover:text-brand-primary hover:bg-brand-light transition-all"
                >
                  + Add Resource
                </button>
              ) : (
                <div className="p-2 sm:p-3 bg-brand-light rounded-lg border border-brand-light">
                  <div className="space-y-1.5 sm:space-y-2">
                    <input
                      type="text"
                      placeholder="Resource name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-border-strong rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    />
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="w-full px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-border-strong rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    />
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Category (existing or new)"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        list="resource-categories"
                        className="w-full px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-border-strong rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                      />
                      <datalist id="resource-categories">
                        {resources.map((cat) => (
                          <option key={cat.category} value={cat.category} />
                        ))}
                      </datalist>
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 pt-1">
                      <button
                        onClick={() => {
                          if (newName.trim() && newUrl.trim() && newCategory.trim()) {
                            onAddResource(newCategory.trim(), newName.trim(), newUrl.trim());
                            setNewName("");
                            setNewUrl("");
                            setNewCategory("");
                            setIsAdding(false);
                          }
                        }}
                        disabled={!newName.trim() || !newUrl.trim() || !newCategory.trim()}
                        className="flex-1 px-2 sm:px-3 py-1 sm:py-2 bg-brand-primary text-white text-xs sm:text-sm rounded-md hover:bg-brand-secondary disabled:bg-surface-hover disabled:cursor-not-allowed transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setNewName("");
                          setNewUrl("");
                          setNewCategory("");
                          setIsAdding(false);
                        }}
                        className="flex-1 px-2 sm:px-3 py-1 sm:py-2 bg-surface-hover text-text-secondary text-xs sm:text-sm rounded-md hover:bg-surface-hover transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
