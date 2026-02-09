"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForkTemplateMutation } from "@/store/slices/templatesSlice";

interface ForkButtonProps {
  templateId: string;
  templateTitle: string;
}

export function ForkButton({ templateId, templateTitle }: ForkButtonProps) {
  const router = useRouter();
  const [forkTemplate, { isLoading }] = useForkTemplateMutation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [customTitle, setCustomTitle] = useState("");

  const handleFork = async () => {
    try {
      const result = await forkTemplate({
        id: templateId,
        data: customTitle ? { customTitle } : {},
      }).unwrap();

      // Navigate to the new goal
      router.push(`/goals?id=${result.goalId}`);
    } catch (error) {
      console.error("Failed to fork template:", error);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full sm:flex-1 px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        🍴 Fork This Template
      </button>
    );
  }

  return (
    <div className="w-full sm:flex-1 space-y-2 sm:space-y-3">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 sm:p-4 rounded-md">
        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
          This will create a new goal based on this template. All tasks will start
          uncompleted.
        </p>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
            Custom Title (optional)
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder={templateTitle}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <button
          onClick={() => setShowConfirm(false)}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleFork}
          disabled={isLoading}
          className="w-full sm:flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? "Forking..." : "Confirm Fork"}
        </button>
      </div>
    </div>
  );
}
