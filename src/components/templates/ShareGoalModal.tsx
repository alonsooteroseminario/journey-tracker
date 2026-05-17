"use client";

import { useState } from "react";
import { useCreateTemplateMutation } from "@/store/slices/templatesSlice";

interface ShareGoalModalProps {
  goalId: string;
  goalTitle: string;
  onClose: () => void;
}

export function ShareGoalModal({ goalId, goalTitle, onClose }: ShareGoalModalProps) {
  const [createTemplate, { isLoading }] = useCreateTemplateMutation();
  const [formData, setFormData] = useState({
    lessonsLearned: "",
    tips: "",
    estimatedDuration: "",
    difficulty: "intermediate" as "beginner" | "intermediate" | "advanced",
    category: "",
    tags: [] as string[],
    visibility: "friends" as "friends" | "public",
    publishToMarketplace: false,
  });
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { publishToMarketplace, ...templateData } = formData;
      // If publishing to marketplace, force public visibility
      if (publishToMarketplace) {
        templateData.visibility = "public";
      }
      await createTemplate({
        goalId,
        ...templateData,
        isPublished: publishToMarketplace,
      }).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to share template:", error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  return (
    <div className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-white">
              Share as Template
            </h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-secondary text-2xl sm:text-3xl"
            >
              ×
            </button>
          </div>

          <p className="text-sm sm:text-base text-text-secondary mb-4 sm:mb-6">
            Sharing: <strong>{goalTitle}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Lessons Learned */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-2">
                Lessons Learned
              </label>
              <textarea
                value={formData.lessonsLearned}
                onChange={(e) =>
                  setFormData({ ...formData, lessonsLearned: e.target.value })
                }
                className="w-full px-3 py-2 text-sm sm:text-base border border-border-strong rounded-md bg-surface text-text-primary dark:text-white"
                rows={3}
                placeholder="What did you learn while working on this goal?"
              />
            </div>

            {/* Tips */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-2">
                Tips & Advice
              </label>
              <textarea
                value={formData.tips}
                onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                className="w-full px-3 py-2 text-sm sm:text-base border border-border-strong rounded-md bg-surface text-text-primary dark:text-white"
                rows={3}
                placeholder="Tips for others using this template"
              />
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-2">
                Estimated Duration
              </label>
              <input
                type="text"
                value={formData.estimatedDuration}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedDuration: e.target.value })
                }
                className="w-full px-3 py-2 text-sm sm:text-base border border-border-strong rounded-md bg-surface text-text-primary dark:text-white"
                placeholder="e.g., 3 months, 6 weeks"
              />
            </div>

            {/* Difficulty & Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Difficulty */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-2">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      difficulty: e.target.value as "beginner" | "intermediate" | "advanced",
                    })
                  }
                  className="w-full px-3 py-2 text-sm sm:text-base border border-border-strong rounded-md bg-surface text-text-primary dark:text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm sm:text-base border border-border-strong rounded-md bg-surface text-text-primary dark:text-white"
                  placeholder="e.g., Career, Health"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm sm:text-base border border-border-strong rounded-md bg-surface text-text-primary dark:text-white"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-indigo-900 dark:hover:text-indigo-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-2">
                Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="friends"
                    checked={formData.visibility === "friends"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visibility: e.target.value as "friends" | "public",
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm sm:text-base text-text-primary dark:text-white">
                    Friends only
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="public"
                    checked={formData.visibility === "public"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visibility: e.target.value as "friends" | "public",
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm sm:text-base text-text-primary dark:text-white">
                    Public (anyone can see)
                  </span>
                </label>
              </div>

              {/* Publish to Marketplace Checkbox */}
              {formData.visibility === "public" && (
                <label className="mt-3 flex items-start gap-2 p-3 bg-brand-light dark:bg-brand-primary/20 rounded-md cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.publishToMarketplace}
                    onChange={(e) =>
                      setFormData({ ...formData, publishToMarketplace: e.target.checked })
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-text-primary dark:text-white">
                      Publish to Marketplace
                    </span>
                    <p className="text-xs text-text-muted mt-0.5">
                      Make this template discoverable by anyone in the marketplace
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-text-secondary bg-surface-hover rounded-md hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? "Sharing..." : "Share Template"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
