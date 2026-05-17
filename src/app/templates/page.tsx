"use client";

import { useState } from "react";
import { useGetTemplatesQuery } from "@/store/slices/templatesSlice";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplateDetailModal } from "@/components/templates/TemplateDetailModal";
import { ForkRequestsPanel } from "@/components/templates/ForkRequestsPanel";
import type { GoalTemplate } from "@/types";

export default function TemplatesPage() {
  const { data: templates, isLoading } = useGetTemplatesQuery({ includeOwn: true, visibility: "all" });
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [filter, setFilter] = useState<"all" | "own" | "friends">("all");

  const filteredTemplates = templates?.filter((template) => {
    if (filter === "own") return template.authorId === templates.find(t => t.authorId)?.authorId;
    if (filter === "friends") return template.visibility === "friends";
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Page Title */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Goal Templates
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Browse and fork goal templates shared with you
          </p>
        </div>

        {/* Fork Requests (for template authors) */}
        <div className="mb-4 sm:mb-6">
          <ForkRequestsPanel />
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md ${
              filter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            All Templates
          </button>
          <button
            onClick={() => setFilter("own")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md ${
              filter === "own"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            My Templates
          </button>
          <button
            onClick={() => setFilter("friends")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md ${
              filter === "friends"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Friends Only
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 sm:py-12">
            <div className="inline-block h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-2 sm:mt-4 text-sm sm:text-base text-gray-700 font-medium">
              Loading templates...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTemplates.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📋</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No templates yet
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              {filter === "own"
                ? "You haven't shared any templates yet. Share a goal to create your first template!"
                : "No templates shared with you yet. Check back later!"}
            </p>
          </div>
        )}

        {/* Templates Grid */}
        {!isLoading && filteredTemplates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => setSelectedTemplate(template)}
              />
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedTemplate && (
          <TemplateDetailModal
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
          />
        )}
      </div>
    </div>
  );
}
