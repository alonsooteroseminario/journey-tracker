"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useGetMarketplaceTemplatesQuery } from "@/store/slices/templatesSlice";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { CategoryFilter } from "@/components/marketplace/CategoryFilter";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { Header } from "@/components/Header";

export default function MarketplacePage() {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetMarketplaceTemplatesQuery({
    search,
    category,
    difficulty,
    page,
    limit: 20,
  });

  const templates = data?.templates || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        currentStreak={0}
        profileName={user?.fullName || user?.firstName || undefined}
        profileImage={user?.imageUrl}
        showNewGoalButton={false}
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Template Marketplace
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Discover and fork goal templates shared by the community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
          <MarketplaceSearch
            onSearch={setSearch}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
          />
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>

        {/* Results Count */}
        {pagination && !isLoading && (
          <div className="mb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Showing {templates.length} of {pagination.total} templates
          </div>
        )}

        {/* Templates Grid */}
        <MarketplaceGrid
          templates={templates}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-6 sm:mt-8 flex justify-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Previous
            </button>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.pages}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
