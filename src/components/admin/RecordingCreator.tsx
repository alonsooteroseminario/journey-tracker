"use client";

import { useState } from "react";
import {
  useCreateRecordingMutation,
  useGetAvailableFlowsQuery,
} from "@/store/slices/adminSlice";

interface RecordingCreatorProps {
  onClose: () => void;
}

export function RecordingCreator({ onClose }: RecordingCreatorProps) {
  const [createRecording, { isLoading }] = useCreateRecordingMutation();
  const { data: flowsData } = useGetAvailableFlowsQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flowType, setFlowType] = useState("goal_creation");

  const flows = flowsData?.flows || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createRecording({
        title,
        description,
        flowType: flowType as any,
      }).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to create recording:", error);
      alert("Failed to create recording");
    }
  };

  return (
    <div className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Create Screen Recording</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Flow type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Recording Flow *
              </label>
              <select
                value={flowType}
                onChange={(e) => setFlowType(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
              >
                {flows.map((flow) => (
                  <option key={flow.type} value={flow.type}>
                    {flow.name}
                  </option>
                ))}
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
                placeholder="My App Demo"
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
                placeholder="Describe this recording..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 resize-none"
              />
            </div>

            {/* Flow description */}
            <div className="bg-zinc-800 border border-zinc-700 rounded p-3 text-sm text-zinc-400">
              <p className="font-medium mb-1">About this flow:</p>
              <ul className="text-xs space-y-0.5">
                {flowType === "goal_creation" && (
                  <>
                    <li>• Navigate to Goals page</li>
                    <li>• Click New Goal button</li>
                    <li>• Fill in goal details</li>
                    <li>• Create the goal</li>
                  </>
                )}
                {flowType === "task_completion" && (
                  <>
                    <li>• Navigate to Goals page</li>
                    <li>• Open first goal</li>
                    <li>• Complete a task</li>
                  </>
                )}
                {flowType === "dashboard_tour" && (
                  <>
                    <li>• Navigate to Dashboard</li>
                    <li>• Scroll through sections</li>
                    <li>• Show key features</li>
                  </>
                )}
              </ul>
            </div>

            {/* Info */}
            <div className="bg-zinc-800 border border-zinc-700 rounded p-3 text-sm text-zinc-400">
              <p className="font-medium mb-1">Recording Specs:</p>
              <ul className="text-xs space-y-0.5">
                <li>• Resolution: 1920×1080 (Full HD)</li>
                <li>• Format: WebM</li>
                <li>• Browser: Chromium (headless)</li>
                <li>• Duration: ~10-30 seconds</li>
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
                {isLoading ? "Creating..." : "Start Recording"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
