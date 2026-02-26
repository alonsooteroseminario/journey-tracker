"use client";

import { useState } from "react";
import type { Video } from "@/types/admin";
import { useDeleteVideoMutation } from "@/store/slices/adminSlice";

interface VideoCardProps {
  video: Video;
}

const STATUS_COLORS = {
  pending: "bg-zinc-700 text-zinc-300",
  rendering: "bg-brand-primary/20 text-brand-muted",
  completed: "bg-green-900/30 text-green-400",
  failed: "bg-red-900/30 text-red-400",
};

const TEMPLATE_LABELS: Record<string, string> = {
  goal_progress: "Goal Progress",
  streak_milestone: "Streak Milestone",
  task_completion: "Task Completion",
};

export function VideoCard({ video }: VideoCardProps) {
  const [deleteVideo, { isLoading: isDeleting }] = useDeleteVideoMutation();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteVideo(video.id).unwrap();
    } catch (error) {
      console.error("Failed to delete video:", error);
      alert("Failed to delete video");
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
      {/* Thumbnail/Preview */}
      {video.videoUrl && video.status === "completed" ? (
        <video
          src={video.videoUrl}
          className="w-full aspect-video bg-zinc-900 rounded mb-3"
          controls
          preload="metadata"
        />
      ) : (
        <div className="w-full aspect-video bg-zinc-900 rounded mb-3 flex items-center justify-center text-zinc-600">
          {video.status === "rendering" ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-2"></div>
              <p className="text-sm">Rendering...</p>
            </div>
          ) : video.status === "failed" ? (
            <div className="text-center text-red-400">
              <p className="text-2xl mb-2">✗</p>
              <p className="text-sm">Render Failed</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-2xl mb-2">🎬</p>
              <p className="text-sm">Queued</p>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium line-clamp-2">{video.title}</h3>
          <span
            className={`inline-block text-xs px-2 py-0.5 rounded capitalize whitespace-nowrap ml-2 ${
              STATUS_COLORS[video.status]
            }`}
          >
            {video.status}
          </span>
        </div>
        {video.description && (
          <p className="text-sm text-zinc-400 line-clamp-2">
            {video.description}
          </p>
        )}
      </div>

      {/* Template type */}
      <div className="mb-3 text-xs text-zinc-500">
        Template: {TEMPLATE_LABELS[video.templateType] || video.templateType}
      </div>

      {/* Video specs */}
      <div className="mb-3 flex gap-4 text-xs text-zinc-500">
        <div>
          {video.width}×{video.height}
        </div>
        <div>{video.fps} fps</div>
        <div>{formatDuration(video.duration)}</div>
        <div>{formatFileSize(video.fileSize)}</div>
      </div>

      {/* Error message */}
      {video.error && (
        <div className="mb-3 text-xs text-red-400 bg-red-900/20 rounded p-2">
          {video.error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {video.videoUrl && (
          <a
            href={video.videoUrl}
            download
            className="px-3 py-1.5 text-sm bg-brand-primary hover:bg-brand-secondary rounded transition"
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
        Created {new Date(video.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
