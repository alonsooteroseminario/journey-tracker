"use client";

import { useState } from "react";
import { useGetRecordingsQuery } from "@/store/slices/adminSlice";
import { RecordingCard } from "./RecordingCard";
import { RecordingCreator } from "./RecordingCreator";

export function RecordingsListView() {
  const { data, isLoading, refetch } = useGetRecordingsQuery();
  const [showCreator, setShowCreator] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const recordings = data?.recordings || [];

  const filteredRecordings =
    filterStatus === "all"
      ? recordings
      : recordings.filter((rec) => rec.status === filterStatus);

  const statusCounts = {
    all: recordings.length,
    pending: recordings.filter((r) => r.status === "pending").length,
    recording: recordings.filter((r) => r.status === "recording").length,
    completed: recordings.filter((r) => r.status === "completed").length,
    failed: recordings.filter((r) => r.status === "failed").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Screen Recordings</h1>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowCreator(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
          >
            + New Recording
          </button>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "recording", label: "Recording" },
          { key: "completed", label: "Completed" },
          { key: "failed", label: "Failed" },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setFilterStatus(filter.key)}
            className={`px-4 py-2 rounded whitespace-nowrap transition ${
              filterStatus === filter.key
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {filter.label} ({statusCounts[filter.key as keyof typeof statusCounts]})
          </button>
        ))}
      </div>

      {/* Recordings grid */}
      {filteredRecordings.length === 0 ? (
        <div className="border border-zinc-700 rounded-lg p-8 text-center text-zinc-400">
          <p className="mb-2">
            No {filterStatus !== "all" ? filterStatus : ""} recordings yet.
          </p>
          <p className="text-sm">
            Create your first screen recording of app user flows.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecordings.map((recording) => (
            <RecordingCard key={recording.id} recording={recording} />
          ))}
        </div>
      )}

      {/* Information */}
      <div className="mt-8 border border-zinc-700 rounded-lg p-4 bg-zinc-800/50">
        <h3 className="font-medium mb-2">🎥 About Screen Recording</h3>
        <ul className="text-sm text-zinc-400 space-y-1">
          <li>• Recordings are captured using Playwright (Chromium)</li>
          <li>• Each flow is predefined with specific user interactions</li>
          <li>• Recording typically takes 10-30 seconds per flow</li>
          <li>• Use these videos to showcase app features in marketing</li>
          <li>• Videos are stored locally and can be downloaded</li>
        </ul>
      </div>

      {/* Creator modal */}
      {showCreator && (
        <RecordingCreator onClose={() => setShowCreator(false)} />
      )}
    </div>
  );
}
