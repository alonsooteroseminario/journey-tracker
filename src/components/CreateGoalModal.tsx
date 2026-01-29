"use client";

import { useState } from "react";
import { Goal } from "@/types";
import { createBCPNPtoPRChecklist } from "@/lib/sampleData";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGoal: (title: string, description?: string) => void;
  onAddGoalWithTasks: (goal: Goal) => void;
}

export function CreateGoalModal({
  isOpen,
  onClose,
  onCreateGoal,
  onAddGoalWithTasks,
}: CreateGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showTemplates, setShowTemplates] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreateGoal(title.trim(), description.trim() || undefined);
      setTitle("");
      setDescription("");
      onClose();
    }
  };

  const handleLoadTemplate = () => {
    const bcPnpGoal = createBCPNPtoPRChecklist();
    onAddGoalWithTasks(bcPnpGoal);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 via-white to-red-500 p-6 sticky top-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Create New Goal</h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 p-1 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            Set a goal and break it down into manageable tasks
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Template Option */}
          {showTemplates && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Featured Template
              </h3>
              <button
                onClick={handleLoadTemplate}
                className="w-full p-5 bg-gradient-to-r from-red-50 via-white to-red-50 border-2 border-red-200 rounded-xl text-left hover:shadow-lg hover:border-red-300 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">🍁</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 group-hover:text-red-600 transition-colors text-lg">
                      BC PNP to Permanent Residence
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Complete end-to-end checklist from Day 1 to PR Card Receipt
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        55 Steps
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        8 Phases
                      </span>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                        Budget Tracker
                      </span>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                        Document Checklist
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Includes: Timeline comparison, official resources, cost breakdown
                    </div>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400">or create custom goal</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </div>
          )}

          {/* Custom Goal Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Goal Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Learn Spanish, Complete Course..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus={!showTemplates}
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why is this goal important to you?"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                Create Goal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
