"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useGetMarketplaceTemplateByIdQuery } from "@/store/slices/templatesSlice";
import { ForkButton } from "@/components/templates/ForkButton";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { Header } from "@/components/Header";
import type { Task } from "@/types";

const difficultyColors = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
};

export default function TemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = use(params);
  const { user } = useUser();
  const { data: template, isLoading, error } = useGetMarketplaceTemplateByIdQuery(templateId);
  const [isEditing, setIsEditing] = useState(false);

  const tasks = (template?.tasks as unknown as Task[]) || [];
  const isOwnTemplate = user?.id === template?.authorId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header
        showNewGoalButton={false}
      />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Back Button */}
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4 sm:mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Marketplace
        </Link>

        {/* Login/Register Banner for Unauthenticated Users */}
        {!user && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-1">Join Journey Tracker</h3>
                <p className="text-xs sm:text-sm text-indigo-100">
                  Sign up to fork this template and start tracking your goals
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Link
                  href="/sign-in"
                  className="flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-center font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-center font-medium"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
            <p className="mt-4 text-gray-600">Loading template...</p>
          </div>
        )}

        {/* Error / Not Found */}
        {error && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">404</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Template not found</h2>
            <p className="text-gray-600 mb-6">This template may have been removed or is not publicly available.</p>
            <Link
              href="/marketplace"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Browse Marketplace
            </Link>
          </div>
        )}

        {/* Template Content */}
        {template && (
          <div className="space-y-6">
            {/* Title Section */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <span className="text-4xl sm:text-5xl">{template.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      {template.title}
                    </h1>
                    {isOwnTemplate && (
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-3 py-1.5 text-xs sm:text-sm rounded-md shrink-0 ${
                          isEditing
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {isEditing ? "Done Editing" : "Edit Template"}
                      </button>
                    )}
                  </div>
                  {/* Metadata Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium ${difficultyColors[template.difficulty]}`}>
                      {template.difficulty}
                    </span>
                    {template.category && (
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm">
                        {template.category}
                      </span>
                    )}
                    {template.estimatedDuration && (
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm">
                        {template.estimatedDuration}
                      </span>
                    )}
                    <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full text-xs sm:text-sm">
                      {template.forkCount} forks
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Creator Card */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Created by
              </h2>
              <div className="flex items-center gap-3">
                {template.author?.profileImage ? (
                  <img
                    src={template.author.profileImage}
                    alt={template.author.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {(template.author?.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {template.author?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">Template Author</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {template.description && (
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h2>
                <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap">
                  {template.description}
                </p>
              </div>
            )}

            {/* Lessons Learned & Tips */}
            {(template.lessonsLearned || template.tips) && (
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                {template.lessonsLearned && (
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      Lessons Learned
                    </h2>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {template.lessonsLearned}
                    </p>
                  </div>
                )}
                {template.tips && (
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      Tips & Advice
                    </h2>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {template.tips}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks — Editor or Read-Only */}
            {isEditing ? (
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                <TemplateEditor template={template} />
              </div>
            ) : (
              tasks.length > 0 && (
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                    Tasks ({tasks.length})
                  </h2>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-sm text-gray-400 mt-0.5">&#9744;</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {task.description}
                              </p>
                            )}
                            {task.substeps && task.substeps.length > 0 && (
                              <div className="mt-2 ml-4 space-y-1">
                                {task.substeps.map((substep) => (
                                  <div key={substep.id} className="flex items-start gap-2">
                                    <span className="text-xs text-gray-400">&#9702;</span>
                                    <p className="text-xs text-gray-600">
                                      {substep.title}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* Action Section */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
              {user && !isOwnTemplate && (
                <ForkButton
                  templateId={template.id}
                  templateTitle={template.title}
                  isPublic={template.visibility === "public" && template.isPublished}
                />
              )}
              {user && isOwnTemplate && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">
                    This is your own template
                  </p>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Edit Template
                    </button>
                  )}
                </div>
              )}
              {!user && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Sign in to fork this template and start your own journey
                  </p>
                  <Link
                    href="/sign-in"
                    className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    Sign in to Fork
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
