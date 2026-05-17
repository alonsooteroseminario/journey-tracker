"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  progress: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  label,
  size = "md",
  showPercentage = true,
  animated = true,
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      // Animate the progress bar
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, animated]);

  const heights = {
    sm: "h-1.5 sm:h-2",
    md: "h-2.5 sm:h-4",
    lg: "h-4 sm:h-6",
  };

  const textSizes = {
    sm: "text-[10px] sm:text-xs",
    md: "text-xs sm:text-sm",
    lg: "text-sm sm:text-base",
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className={`font-medium text-text-secondary ${textSizes[size]}`}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span
              className={`font-bold ${textSizes[size]} ${
                progress === 100 ? "text-green-600" : "text-text-secondary"
              }`}
            >
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-surface-hover rounded-full overflow-hidden ${heights[size]}`}
      >
        <div
          className={`${heights[size]} rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
            progress === 100
              ? "bg-gradient-to-r from-green-500 to-emerald-400"
              : "bg-gradient-to-r from-brand-primary to-brand-secondary"
          }`}
          style={{ width: `${displayProgress}%` }}
        >
          {/* Shimmer effect */}
          {progress > 0 && progress < 100 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          )}
          {/* Completion celebration effect */}
          {progress === 100 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
