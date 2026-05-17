"use client";

import { useState } from "react";
import { usePublishTemplateMutation } from "@/store/slices/templatesSlice";

interface PublishButtonProps {
  templateId: string;
  isPublished: boolean;
}

export function PublishButton({ templateId, isPublished }: PublishButtonProps) {
  const [publishTemplate, { isLoading }] = usePublishTemplateMutation();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleToggle = async () => {
    try {
      await publishTemplate(templateId).unwrap();
      setShowConfirm(false);
    } catch (error) {
      console.error("Failed to toggle publish:", error);
    }
  };

  if (isPublished && !showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs sm:text-sm font-medium">
          <span>&#10003;</span>
          <span>Published</span>
        </span>
        <button
          onClick={() => setShowConfirm(true)}
          className="px-3 py-1.5 text-xs text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Unpublish
        </button>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="space-y-2">
        <p className="text-xs sm:text-sm text-text-secondary">
          {isPublished
            ? "Remove this template from the marketplace?"
            : "Publishing makes this template visible to everyone. Continue?"}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-text-secondary bg-surface-hover rounded-lg hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white rounded-lg disabled:opacity-50 ${
              isPublished
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isLoading
              ? isPublished ? "Unpublishing..." : "Publishing..."
              : isPublished ? "Confirm Unpublish" : "Confirm Publish"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm font-medium"
    >
      Publish to Marketplace
    </button>
  );
}
