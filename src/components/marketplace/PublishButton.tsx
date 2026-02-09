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

  const handlePublish = async () => {
    try {
      await publishTemplate(templateId).unwrap();
      setShowConfirm(false);
    } catch (error) {
      console.error("Failed to publish template:", error);
    }
  };

  if (isPublished) {
    return (
      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs sm:text-sm font-medium">
        <span>✓</span>
        <span>Published to Marketplace</span>
      </div>
    );
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm font-medium"
      >
        🏪 Publish to Marketplace
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
        Publishing makes this template visible to everyone. Continue?
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setShowConfirm(false)}
          className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handlePublish}
          disabled={isLoading}
          className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? "Publishing..." : "Confirm"}
        </button>
      </div>
    </div>
  );
}
