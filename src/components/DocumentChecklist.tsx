"use client";

import { useState } from "react";
import { DocumentItem } from "@/types";

interface DocumentChecklistProps {
  documents: DocumentItem[];
  onUpdateStatus: (docId: string, status: DocumentItem["status"]) => void;
}

export function DocumentChecklist({ documents, onUpdateStatus }: DocumentChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "obtained" | "submitted">("all");

  const filteredDocs = documents.filter((doc) => {
    if (filter === "all") return true;
    return doc.status === filter;
  });

  const statusCounts = {
    pending: documents.filter((d) => d.status === "pending").length,
    obtained: documents.filter((d) => d.status === "obtained").length,
    submitted: documents.filter((d) => d.status === "submitted").length,
  };

  const progress = Math.round(
    ((statusCounts.obtained + statusCounts.submitted) / documents.length) * 100
  );

  const statusColors = {
    pending: "bg-gray-100 text-gray-600 border-gray-200",
    obtained: "bg-yellow-100 text-yellow-700 border-yellow-200",
    submitted: "bg-green-100 text-green-700 border-green-200",
  };

  const statusIcons = {
    pending: "○",
    obtained: "◐",
    submitted: "●",
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 sm:p-6 text-left bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-3xl">📋</span>
            <div>
              <h3 className="text-sm sm:text-xl font-bold text-gray-800">Document Checklist</h3>
              <p className="text-[10px] sm:text-sm text-gray-600">{documents.length} documents to track</p>
            </div>
          </div>
          <svg
            className={`w-4 h-4 sm:w-6 sm:h-6 text-gray-500 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 sm:mt-4">
          <div className="flex justify-between text-[10px] sm:text-sm mb-1">
            <span className="text-gray-600">Documents Ready</span>
            <span className="font-bold text-amber-600">{progress}%</span>
          </div>
          <div className="h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-2 sm:mt-4 flex gap-2 sm:gap-3">
          <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-sm">
            <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-300"></span>
            <span className="text-gray-600">{statusCounts.pending} pending</span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-sm">
            <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-400"></span>
            <span className="text-gray-600">{statusCounts.obtained} obtained</span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-sm">
            <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">{statusCounts.submitted} submitted</span>
          </div>
        </div>
      </button>

      {/* Document List */}
      {isExpanded && (
        <div className="p-3 sm:p-6 border-t border-gray-100">
          {/* Filter Tabs */}
          <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
            {(["all", "pending", "obtained", "submitted"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium transition-colors ${
                  filter === status
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== "all" && (
                  <span className="ml-1">
                    ({status === "pending" ? statusCounts.pending : status === "obtained" ? statusCounts.obtained : statusCounts.submitted})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Documents Grid */}
          <div className="space-y-1.5 sm:space-y-2 max-h-96 overflow-y-auto">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Status Selector */}
                <select
                  value={doc.status}
                  onChange={(e) =>
                    onUpdateStatus(doc.id, e.target.value as DocumentItem["status"])
                  }
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border text-[10px] sm:text-sm font-medium cursor-pointer ${
                    statusColors[doc.status]
                  }`}
                >
                  <option value="pending">○ Pending</option>
                  <option value="obtained">◐ Obtained</option>
                  <option value="submitted">● Submitted</option>
                </select>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-base text-gray-800 truncate">{doc.name}</p>
                  <div className="flex gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
                    <span className="bg-blue-100 text-blue-700 px-1.5 sm:px-2 py-0.5 rounded">
                      {doc.requiredFor}
                    </span>
                    <span>{doc.whenNeeded}</span>
                  </div>
                </div>

                {/* Notes */}
                {doc.notes && (
                  <span className="text-xs text-gray-400 hidden md:block max-w-32 truncate">
                    {doc.notes}
                  </span>
                )}
              </div>
            ))}
          </div>

          {filteredDocs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No documents match this filter
            </div>
          )}
        </div>
      )}
    </div>
  );
}
