"use client";

import { TemplateCard } from "@/components/templates/TemplateCard";
import type { GoalTemplate } from "@/types";

interface MarketplaceGridProps {
  templates: GoalTemplate[];
  onTemplateClick: (template: GoalTemplate) => void;
  isLoading?: boolean;
}

export function MarketplaceGrid({
  templates,
  onTemplateClick,
  isLoading,
}: MarketplaceGridProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Loading templates...
        </p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl sm:text-6xl mb-4">🔍</div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No templates found
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onClick={() => onTemplateClick(template)}
        />
      ))}
    </div>
  );
}
