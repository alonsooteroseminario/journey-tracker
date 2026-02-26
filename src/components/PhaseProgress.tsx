"use client";

import { Phase, Task } from "@/types";

interface PhaseProgressProps {
  phases: Phase[];
  tasks: Task[];
  onPhaseClick?: (phaseId: string) => void;
  onAddPhase?: () => void;
}

export function PhaseProgress({ phases, tasks, onPhaseClick, onAddPhase }: PhaseProgressProps) {
  const getPhaseProgress = (phase: Phase) => {
    const phaseTasks = tasks.filter((t) => phase.taskIds.includes(t.id));
    if (phaseTasks.length === 0) return 0;
    
    // Count both tasks and substeps for progress
    let totalItems = 0;
    let completedItems = 0;

    phaseTasks.forEach((task) => {
      const substeps = task.substeps || [];

      if (substeps.length > 0) {
        // If task has substeps, count substeps only
        totalItems += substeps.length;
        completedItems += substeps.filter((s) => s.status === 'completed').length;
      } else {
        // If no substeps, count the task itself
        totalItems += 1;
        completedItems += task.status === 'completed' ? 1 : 0;
      }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const getPhaseStats = (phase: Phase) => {
    const phaseTasks = tasks.filter((t) => phase.taskIds.includes(t.id));

    // Count both tasks and substeps for stats
    let totalItems = 0;
    let completedItems = 0;

    phaseTasks.forEach((task) => {
      const substeps = task.substeps || [];

      if (substeps.length > 0) {
        // If task has substeps, count substeps only
        totalItems += substeps.length;
        completedItems += substeps.filter((s) => s.status === 'completed').length;
      } else {
        // If no substeps, count the task itself
        totalItems += 1;
        completedItems += task.status === 'completed' ? 1 : 0;
      }
    });

    return { completed: completedItems, total: totalItems };
  };

  const getCurrentPhase = () => {
    for (const phase of phases) {
      const progress = getPhaseProgress(phase);
      if (progress < 100) return phase.id;
    }
    return phases[phases.length - 1]?.id;
  };

  const currentPhaseId = getCurrentPhase();

  const phaseEmojis: Record<string, string> = {
    phase1: "📝",
    phase2: "⏳",
    phase3: "📤",
    phase4: "🔍",
    phase5: "🇨🇦",
    phase6: "⚙️",
    phase7: "🎯",
    phase8: "🎉",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
      <h3 className="text-sm sm:text-lg font-bold text-gray-800 mb-2 flex items-center gap-1">
        <span className="text-base sm:text-xl">🗺️</span>
        <span className="hidden sm:inline">Phases</span>
        <span className="sm:hidden">Ph</span>
      </h3>

      <div className="space-y-1 sm:space-y-2">
        {phases.map((phase, index) => {
          const progress = getPhaseProgress(phase);
          const stats = getPhaseStats(phase);
          const isCurrent = phase.id === currentPhaseId;
          const isComplete = progress === 100;

          return (
            <div
              key={phase.id}
              className={`relative p-1.5 sm:p-3 rounded-md transition-all cursor-pointer ${
                isCurrent
                  ? "bg-brand-light border border-brand-primary"
                  : isComplete
                  ? "bg-green-50 border border-green-200"
                  : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
              }`}
              onClick={() => onPhaseClick?.(phase.id)}
            >
              {/* Phase Header */}
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div
                  className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-xl flex-shrink-0 ${
                    isComplete
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-brand-primary text-white animate-pulse"
                      : "bg-gray-200"
                  }`}
                >
                  {isComplete ? "✓" : phaseEmojis[phase.id] || (index + 1)}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1">
                    <h4 className="font-bold text-gray-800 text-xs sm:text-sm truncate">
                      {phase.name}
                    </h4>
                    {isCurrent && (
                      <span className="hidden sm:inline px-2 py-0.5 bg-brand-primary text-white text-xs rounded-full flex-shrink-0">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="hidden sm:block text-xs text-gray-500 truncate">{phase.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-sm sm:text-lg font-bold ${
                      isComplete
                        ? "text-green-600"
                        : isCurrent
                        ? "text-brand-primary"
                        : "text-gray-400"
                    }`}
                  >
                    {progress}%
                  </span>
                  <p className="text-xs text-gray-500">
                    {stats.completed}/{stats.total}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-1.5 sm:mt-3 h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isComplete
                      ? "bg-green-500"
                      : isCurrent
                      ? "bg-brand-primary"
                      : "bg-gray-300"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Connection Line */}
              {index < phases.length - 1 && (
                <div
                  className={`absolute left-3.5 sm:left-5 top-full w-0.5 h-2 ${
                    isComplete ? "bg-green-300" : "bg-gray-200"
                  }`}
                  style={{ transform: "translateX(-50%)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Progress */}
      <div className="mt-3 sm:mt-6 pt-2 sm:pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-1 sm:mb-2">
          <span className="text-xs sm:text-sm font-medium text-gray-600">
            <span className="hidden sm:inline">Overall Progress</span>
            <span className="sm:hidden">Total</span>
          </span>
          <span className="text-sm sm:text-lg font-bold text-brand-primary">
            {Math.round(
              phases.reduce((acc, phase) => acc + getPhaseProgress(phase), 0) / phases.length
            )}%
          </span>
        </div>
        <div className="h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full transition-all duration-500"
            style={{
              width: `${Math.round(
                phases.reduce((acc, phase) => acc + getPhaseProgress(phase), 0) / phases.length
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Add Phase Button */}
      {onAddPhase && (
        <button
          onClick={onAddPhase}
          className="w-full py-2 sm:py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-brand-primary hover:text-brand-primary transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base mt-4"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Phase
        </button>
      )}
    </div>
  );
}
