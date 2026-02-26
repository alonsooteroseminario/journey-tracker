"use client";

import { useState } from "react";
import { useGetVideosQuery } from "@/store/slices/adminSlice";
import { VideoCard } from "./VideoCard";
import { VideoCreator } from "./VideoCreator";

export function VideosListView() {
  const { data, isLoading, refetch } = useGetVideosQuery();
  const [showCreator, setShowCreator] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const videos = data?.videos || [];

  const filteredVideos =
    filterStatus === "all"
      ? videos
      : videos.filter((video) => video.status === filterStatus);

  const statusCounts = {
    all: videos.length,
    pending: videos.filter((v) => v.status === "pending").length,
    rendering: videos.filter((v) => v.status === "rendering").length,
    completed: videos.filter((v) => v.status === "completed").length,
    failed: videos.filter((v) => v.status === "failed").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Marketing Videos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowCreator(true)}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary rounded transition"
          >
            + New Video
          </button>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "rendering", label: "Rendering" },
          { key: "completed", label: "Completed" },
          { key: "failed", label: "Failed" },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setFilterStatus(filter.key)}
            className={`px-4 py-2 rounded whitespace-nowrap transition ${
              filterStatus === filter.key
                ? "bg-brand-primary text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {filter.label} ({statusCounts[filter.key as keyof typeof statusCounts]})
          </button>
        ))}
      </div>

      {/* Videos grid */}
      {filteredVideos.length === 0 ? (
        <div className="border border-zinc-700 rounded-lg p-8 text-center text-zinc-400">
          <p className="mb-2">
            No {filterStatus !== "all" ? filterStatus : ""} videos yet.
          </p>
          <p className="text-sm">
            Create your first marketing video using Remotion.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}

      {/* Information */}
      <div className="mt-8 border border-zinc-700 rounded-lg p-4 bg-zinc-800/50">
        <h3 className="font-medium mb-2">🎬 About Video Generation</h3>
        <ul className="text-sm text-zinc-400 space-y-1">
          <li>• Videos are rendered using Remotion in the background</li>
          <li>• Rendering typically takes 30-60 seconds per video</li>
          <li>• Generated videos are stored locally and can be downloaded</li>
          <li>• Use completed videos in your social media campaigns</li>
        </ul>
      </div>

      {/* Creator modal */}
      {showCreator && (
        <VideoCreator
          onClose={() => setShowCreator(false)}
          goals={[]}
          streaks={null}
        />
      )}
    </div>
  );
}
