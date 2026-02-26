"use client";

import { useState } from "react";
import {
  useGetFeedPreferencesQuery,
  useUpdateFeedPreferencesMutation,
} from "@/store/slices/profileSlice";

export function FeedPreferencesPanel() {
  const { data: preferences, isLoading } = useGetFeedPreferencesQuery();
  const [updatePreferences] = useUpdateFeedPreferencesMutation();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleToggle = async (field: string, value: boolean) => {
    setSaveStatus("saving");
    try {
      await updatePreferences({ [field]: value }).unwrap();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to update preferences:", error);
      setSaveStatus("idle");
    }
  };

  if (isLoading || !preferences) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Feed Visibility</h2>
        <p className="text-gray-500">Loading preferences...</p>
      </div>
    );
  }

  const feedCategories = [
    {
      title: "Goal Events",
      icon: "🎯",
      key: "goalEvents" as const,
      description: "Goal created, updated, deleted, shared, published, forked",
    },
    {
      title: "Task Events",
      icon: "✅",
      key: "taskEvents" as const,
      description: "Task created, updated, deleted, completed, status changed",
    },
    {
      title: "Substep Events",
      icon: "🔹",
      key: "substepEvents" as const,
      description: "Substep created, updated, deleted",
    },
    {
      title: "Cost Events",
      icon: "💰",
      key: "costEvents" as const,
      description: "Cost added, cost updated",
    },
    {
      title: "Note Events",
      icon: "📌",
      key: "noteEvents" as const,
      description: "Note added, note updated",
    },
    {
      title: "Streak Events",
      icon: "🔥",
      key: "streakEvents" as const,
      description: "Streak milestones, streak at risk alerts",
    },
    {
      title: "Profile Events",
      icon: "👤",
      key: "profileEvents" as const,
      description: "Profile updated, settings changed",
    },
    {
      title: "Social Events",
      icon: "👥",
      key: "socialEvents" as const,
      description: "Friend added, friend changed",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Feed Visibility</h2>
          <p className="text-sm text-gray-500 mt-1">
            Control which types of activities appear in your feed
          </p>
        </div>
        {saveStatus === "saved" && (
          <span className="text-sm text-green-600">✓ Saved</span>
        )}
        {saveStatus === "saving" && (
          <span className="text-sm text-gray-500">Saving...</span>
        )}
      </div>

      <div className="space-y-4">
        {feedCategories.map((category) => (
          <div
            key={category.key}
            className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-brand-primary transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-brand-light to-brand-light/40 rounded-lg flex items-center justify-center text-xl">
              {category.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-gray-900">{category.title}</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences[category.key]}
                    onChange={(e) => handleToggle(category.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                </label>
              </div>
              <p className="text-sm text-gray-500">{category.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-brand-light border border-brand-light rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-xl">ℹ️</span>
          <div className="flex-1">
            <p className="text-sm text-brand-primary font-medium mb-1">
              About Feed Visibility
            </p>
            <p className="text-sm text-brand-primary">
              These settings control what appears in your activity feed. Disabling a
              category won't affect your goals or tasks—it only hides those events
              from the feed view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
