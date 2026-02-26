"use client";

import { useState } from "react";
import { useCreateVideoMutation } from "@/store/slices/adminSlice";
import type { VideoTemplateType } from "@/types/admin";

interface VideoCreatorProps {
  onClose: () => void;
  goals?: any[];
  streaks?: any;
}

export function VideoCreator({ onClose, goals = [], streaks }: VideoCreatorProps) {
  const [createVideo, { isLoading }] = useCreateVideoMutation();

  const [templateType, setTemplateType] = useState<VideoTemplateType>("goal_progress");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [streakMilestone, setStreakMilestone] = useState("30");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let sourceData: any;

    switch (templateType) {
      case "goal_progress":
        const selectedGoal = goals.find((g) => g.id === selectedGoalId);
        if (!selectedGoal) {
          alert("Please select a goal");
          return;
        }
        sourceData = selectedGoal;
        break;
      case "streak_milestone":
        if (!streaks) {
          alert("No streak data available");
          return;
        }
        sourceData = {
          streakCount: streaks.currentStreak,
          milestone: parseInt(streakMilestone),
        };
        break;
      default:
        alert("Unsupported template type");
        return;
    }

    try {
      await createVideo({
        title,
        description,
        templateType,
        sourceData,
      }).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to create video:", error);
      alert("Failed to create video");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Create Video</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Template type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Video Template *
              </label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as VideoTemplateType)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
              >
                <option value="goal_progress">Goal Progress</option>
                <option value="streak_milestone">Streak Milestone</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="My Awesome Progress Video"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe your video..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 resize-none"
              />
            </div>

            {/* Template-specific fields */}
            {templateType === "goal_progress" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Goal *
                </label>
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
                >
                  <option value="">Choose a goal...</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
                {goals.length === 0 && (
                  <p className="text-sm text-zinc-500 mt-1">
                    No goals available. Create a goal first.
                  </p>
                )}
              </div>
            )}

            {templateType === "streak_milestone" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Milestone *
                </label>
                <select
                  value={streakMilestone}
                  onChange={(e) => setStreakMilestone(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
                >
                  <option value="7">7-Day Streak</option>
                  <option value="14">14-Day Streak</option>
                  <option value="30">30-Day Streak</option>
                  <option value="60">60-Day Streak</option>
                  <option value="90">90-Day Streak</option>
                  <option value="365">365-Day Streak</option>
                </select>
                {streaks && (
                  <p className="text-sm text-zinc-500 mt-1">
                    Current streak: {streaks.currentStreak} days
                  </p>
                )}
              </div>
            )}

            {/* Info */}
            <div className="bg-zinc-800 border border-zinc-700 rounded p-3 text-sm text-zinc-400">
              <p className="font-medium mb-1">Video Specs:</p>
              <ul className="text-xs space-y-0.5">
                <li>• Resolution: 1920×1080 (Full HD)</li>
                <li>• Frame rate: 30 fps</li>
                <li>• Duration: 4-5 seconds</li>
                <li>• Format: MP4 (H.264)</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Create Video"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
