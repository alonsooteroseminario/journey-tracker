"use client";

import { useState, useEffect } from "react";
import { Goal, Phase } from "@/types";
import { createBCPNPtoPRChecklist } from "@/lib/sampleData";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGoal: (title: string, description?: string, phases?: Phase[]) => void;
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
  const [usePhases, setUsePhases] = useState(false);
  const [phases, setPhases] = useState<{ name: string; description: string }[]>([]);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseDesc, setNewPhaseDesc] = useState("");

  const focusTrapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const addPhase = () => {
    if (newPhaseName.trim()) {
      setPhases((prev) => [...prev, { name: newPhaseName.trim(), description: newPhaseDesc.trim() }]);
      setNewPhaseName("");
      setNewPhaseDesc("");
    }
  };

  const removePhase = (index: number) => {
    setPhases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const phaseObjects: Phase[] | undefined =
        usePhases && phases.length > 0
          ? phases.map((p, i) => ({
              id: `phase${i + 1}`,
              name: `Phase ${i + 1}: ${p.name}`,
              description: p.description,
              taskIds: [] as string[],
            }))
          : undefined;

      onCreateGoal(title.trim(), description.trim() || undefined, phaseObjects);
      setTitle("");
      setDescription("");
      setPhases([]);
      setUsePhases(false);
      onClose();
    }
  };

  const handleLoadTemplate = () => {
    const bcPnpGoal = createBCPNPtoPRChecklist();
    onAddGoalWithTasks(bcPnpGoal);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-goal-title"
    >
      <div ref={focusTrapRef} className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full mx-2 sm:mx-0 shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-none">
        {/* Header - Sticky on scroll */}
        <div className="bg-gradient-to-r from-red-500 via-white to-red-500 p-3 sm:p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 id="create-goal-title" className="text-lg sm:text-2xl font-bold text-gray-800">Create New Goal</h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 p-3 min-w-[48px] min-h-[48px] flex items-center justify-center transition-colors"
              aria-label="Close modal"
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
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Set a goal and break it down into manageable tasks
          </p>
        </div>

        {/* Content - Scrollable Area */}
        <div className="p-3 sm:p-6 pb-safe">
          {/* Template Option */}
          {showTemplates && (
            <div className="mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Featured Template
              </h3>
              <button
                onClick={handleLoadTemplate}
                className="w-full p-3 sm:p-5 bg-gradient-to-r from-red-50 via-white to-red-50 border-2 border-red-200 rounded-xl text-left hover:shadow-lg hover:border-red-300 transition-all group min-h-[48px]"
              >
                <div className="flex items-start gap-2 sm:gap-4">
                  <span className="text-2xl sm:text-4xl flex-shrink-0">🍁</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 group-hover:text-red-600 transition-colors text-base sm:text-lg">
                      BC PNP to Permanent Residence
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Complete end-to-end checklist from Day 1 to PR Card Receipt
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        55 Steps
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        8 Phases
                      </span>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                        Budget
                      </span>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                        Docs
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 hidden sm:block">
                      Includes: Timeline comparison, official resources, cost breakdown
                    </div>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-3 my-4 sm:my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs sm:text-sm text-gray-400">or create custom goal</span>
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
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Phases toggle */}
            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="usePhases"
                checked={usePhases}
                onChange={(e) => setUsePhases(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="usePhases" className="text-sm text-gray-700 cursor-pointer select-none">
                Organize tasks with Phases
              </label>
            </div>

            {/* Phases input section */}
            {usePhases && (
              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/40 space-y-3">
                <p className="text-xs text-blue-600 font-medium">
                  Add phases to break your goal into milestones. You can assign tasks to phases after creation.
                </p>

                {/* Phase name + description inputs */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newPhaseName}
                    onChange={(e) => setNewPhaseName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPhase(); } }}
                    placeholder="Phase name (e.g. Preparation)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={newPhaseDesc}
                    onChange={(e) => setNewPhaseDesc(e.target.value)}
                    placeholder="Description (optional, e.g. Weeks 1–4)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addPhase}
                    disabled={!newPhaseName.trim()}
                    className="w-full py-2 min-h-[40px] bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    + Add Phase
                  </button>
                </div>

                {/* Phase list */}
                {phases.length > 0 && (
                  <div className="space-y-1.5">
                    {phases.map((phase, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">
                            Phase {i + 1}: {phase.name}
                          </p>
                          {phase.description && (
                            <p className="text-xs text-gray-500 truncate">{phase.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePhase(i)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                          aria-label={`Remove phase ${i + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 min-h-[48px] border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="flex-1 py-3 min-h-[48px] bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
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
