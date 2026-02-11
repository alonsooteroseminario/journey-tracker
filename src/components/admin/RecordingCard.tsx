"use client";

import { useState } from "react";
import type { Recording } from "@/types/admin";
import { useDeleteRecordingMutation } from "@/store/slices/adminSlice";

interface RecordingCardProps {
  recording: Recording;
}

const STATUS_COLORS = {
  pending: "bg-zinc-700 text-zinc-300",
  recording: "bg-blue-900/30 text-blue-400",
  completed: "bg-green-900/30 text-green-400",
  failed: "bg-red-900/30 text-red-400",
};

const FLOW_LABELS: Record<string, string> = {
  goal_creation: "Goal Creation",
  task_completion: "Task Completion",
  dashboard_tour: "Dashboard Tour",
  custom: "Custom Flow",
};

export function RecordingCard({ recording }: RecordingCardProps) {
  const [deleteRecording, { isLoading: isDeleting }] = useDeleteRecordingMutation();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteRecording(recording.id).unwrap();
    } catch (error) {
      console.error("Failed to delete recording:", error);
      alert("Failed to delete recording");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    return `${seconds}s`;
  };

  return (
    <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800">
      {/* Video Preview */}
      {recording.videoUrl && recording.status === "completed" ? (
        <video
          src={recording.videoUrl}
          className="w-full aspect-video bg-zinc-900 rounded mb-3"
          controls
          preload="metadata"
        />
      ) : (
        <div className="w-full aspect-video bg-zinc-900 rounded mb-3 flex items-center justify-center text-zinc-600">
          {recording.status === "recording" ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm">Recording...</p>
            </div>
          ) : recording.status === "failed" ? (
            <div className="text-center text-red-400">
              <p className="text-2xl mb-2">✗</p>
              <p className="text-sm">Recording Failed</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-2xl mb-2">🎥</p>
              <p className="text-sm">Queued</p>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium line-clamp-2">{recording.title}</h3>
          <span
            className={`inline-block text-xs px-2 py-0.5 rounded capitalize whitespace-nowrap ml-2 ${
              STATUS_COLORS[recording.status]
            }`}
          >
            {recording.status}
          </span>
        </div>
        {recording.description && (
          <p className="text-sm text-zinc-400 line-clamp-2">
            {recording.description}
          </p>
        )}
      </div>

      {/* Flow type */}
      <div className="mb-3 text-xs text-zinc-500">
        Flow: {FLOW_LABELS[recording.flowType] || recording.flowType}
      </div>

      {/* Recording specs */}
      <div className="mb-3 flex gap-4 text-xs text-zinc-500">
        <div>1920×1080</div>
        <div>{formatDuration(recording.duration)}</div>
        <div>{formatFileSize(recording.fileSize)}</div>
      </div>

      {/* Error message */}
      {recording.error && (
        <div className="mb-3 text-xs text-red-400 bg-red-900/20 rounded p-2">
          {recording.error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {recording.videoUrl && (
          <a
            href={recording.videoUrl}
            download
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded transition"
          >
            Download
          </a>
        )}
        {showConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded transition disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Confirm"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 rounded transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-red-400 rounded transition"
          >
            Delete
          </button>
        )}
      </div>

      {/* Created date */}
      <div className="mt-3 pt-3 border-t border-zinc-700 text-xs text-zinc-500">
        Created {new Date(recording.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
