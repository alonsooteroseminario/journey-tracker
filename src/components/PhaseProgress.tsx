"use client";

import { Phase, Task } from "@/types";

interface PhaseProgressProps {
  phases: Phase[];
  tasks: Task[];
  onPhaseClick?: (phaseId: string) => void;
}

export function PhaseProgress({ phases, tasks, onPhaseClick }: PhaseProgressProps) {
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
        completedItems += substeps.filter((s) => s.completed).length;
      } else {
        // If no substeps, count the task itself
        totalItems += 1;
        completedItems += task.completed ? 1 : 0;
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
        completedItems += substeps.filter((s) => s.completed).length;
      } else {
        // If no substeps, count the task itself
        totalItems += 1;
        completedItems += task.completed ? 1 : 0;
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🗺️</span>
        Journey Phases
      </h3>

      <div className="space-y-3">
        {phases.map((phase, index) => {
          const progress = getPhaseProgress(phase);
          const stats = getPhaseStats(phase);
          const isCurrent = phase.id === currentPhaseId;
          const isComplete = progress === 100;

          return (
            <div
              key={phase.id}
              className={`relative p-4 rounded-xl transition-all cursor-pointer ${
                isCurrent
                  ? "bg-blue-50 border-2 border-blue-300 shadow-md"
                  : isComplete
                  ? "bg-green-50 border border-green-200"
                  : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
              }`}
              onClick={() => onPhaseClick?.(phase.id)}
            >
              {/* Phase Header */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                    isComplete
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-blue-500 text-white animate-pulse"
                      : "bg-gray-200"
                  }`}
                >
                  {isComplete ? "✓" : phaseEmojis[phase.id] || (index + 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-800 text-sm truncate">
                      {phase.name}
                    </h4>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{phase.description}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-lg font-bold ${
                      isComplete
                        ? "text-green-600"
                        : isCurrent
                        ? "text-blue-600"
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
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isComplete
                      ? "bg-green-500"
                      : isCurrent
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Connection Line */}
              {index < phases.length - 1 && (
                <div
                  className={`absolute left-9 top-full w-0.5 h-3 ${
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
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">Overall Journey Progress</span>
          <span className="text-lg font-bold text-blue-600">
            {Math.round(
              phases.reduce((acc, phase) => acc + getPhaseProgress(phase), 0) / phases.length
            )}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{
              width: `${Math.round(
                phases.reduce((acc, phase) => acc + getPhaseProgress(phase), 0) / phases.length
              )}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
