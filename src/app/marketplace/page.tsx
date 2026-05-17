"use client";

import { useState } from "react";
import Link from "next/link";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header
        currentStreak={0}
        showNewGoalButton={false}
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-2">
            Template Marketplace
          </h1>
          <p className="text-sm sm:text-base text-text-secondary">
            Discover and fork goal templates shared by the community
          </p>
        </div>

        {/* Login/Register Banner for Unauthenticated Users */}
        {!user && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-1">Join Journey Tracker</h3>
                <p className="text-xs sm:text-sm text-indigo-100">
                  Sign up to fork templates and start tracking your goals
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Link
                  href="/sign-in"
                  className="flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm bg-surface/20 hover:bg-surface/30 rounded-lg transition-colors text-center font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm bg-surface text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-center font-medium"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}

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
          <div className="mb-4 text-xs sm:text-sm text-text-secondary">
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
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-surface border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-muted text-text-secondary"
            >
              Previous
            </button>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-text-secondary">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.pages}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-surface border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-muted text-text-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
