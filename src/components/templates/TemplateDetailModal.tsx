"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import type { GoalTemplate, Task } from "@/types";
import { ForkButton } from "./ForkButton";
import { PublishButton } from "../marketplace/PublishButton";
import { TemplateEditor } from "./TemplateEditor";
import { useGetTemplateByIdQuery } from "@/store/slices/templatesSlice";

interface TemplateDetailModalProps {
  template: GoalTemplate;
  onClose: () => void;
  showPublishButton?: boolean;
  initialEditing?: boolean;
}

const difficultyColors = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
};

export function TemplateDetailModal({ template: initialTemplate, onClose, showPublishButton, initialEditing = false }: TemplateDetailModalProps) {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(initialEditing);

  // Fetch live template data so editor mutations are reflected
  const { data: liveTemplate } = useGetTemplateByIdQuery(initialTemplate.id);
  const template = liveTemplate || initialTemplate;

  const tasks = (template.tasks as unknown as Task[]) || [];
  const isOwnTemplate = user?.id === template.authorId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-3 flex-1">
              <span className="text-3xl sm:text-4xl">{template.icon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                  {template.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  by {template.author?.name || "Unknown"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {isOwnTemplate && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-md ${
                    isEditing
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {isEditing ? "Done Editing" : "Edit"}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Metadata Badges */}
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            <span
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                difficultyColors[template.difficulty]
              }`}
            >
              {template.difficulty}
            </span>
            {template.category && (
              <span className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm">
                {template.category}
              </span>
            )}
            {template.estimatedDuration && (
              <span className="px-2 sm:px-3 py-1 bg-brand-light text-brand-primary rounded-full text-xs sm:text-sm">
                ⏱ {template.estimatedDuration}
              </span>
            )}
            <span className="px-2 sm:px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs sm:text-sm">
              🍴 {template.forkCount} forks
            </span>
          </div>

          {/* Description */}
          {template.description && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-sm sm:text-base text-gray-700">
                {template.description}
              </p>
            </div>
          )}

          {/* Lessons Learned */}
          {template.lessonsLearned && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                📚 Lessons Learned
              </h3>
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
                {template.lessonsLearned}
              </p>
            </div>
          )}

          {/* Tips */}
          {template.tips && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                💡 Tips & Advice
              </h3>
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
                {template.tips}
              </p>
            </div>
          )}

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                🏷 Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-indigo-50 text-indigo-600 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tasks — Editor or Read-Only */}
          {isEditing ? (
            <div className="mb-4 sm:mb-6">
              <TemplateEditor template={template} />
            </div>
          ) : (
            tasks.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">
                  Tasks ({tasks.length})
                </h3>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 rounded-lg p-2 sm:p-3"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs sm:text-sm">&#9744;</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {task.description}
                            </p>
                          )}
                          {task.substeps && task.substeps.length > 0 && (
                            <div className="mt-2 ml-3 sm:ml-4 space-y-1">
                              {task.substeps.map((substep) => (
                                <div key={substep.id} className="flex items-start gap-2">
                                  <span className="text-xs">&#9643;</span>
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

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            {/* Publish Button (for own templates) */}
            {isOwnTemplate && showPublishButton !== false && template.visibility === "public" && (
              <div>
                <PublishButton templateId={template.id} isPublished={template.isPublished} />
              </div>
            )}

            {/* Fork and Close Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
              {!isOwnTemplate && user && (
                <ForkButton
                  templateId={template.id}
                  templateTitle={template.title}
                  isPublic={template.visibility === "public" && template.isPublished}
                />
              )}
              {!user && (
                <Link
                  href="/sign-in"
                  className="w-full sm:flex-1 px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-center"
                >
                  Sign in to fork this template
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
