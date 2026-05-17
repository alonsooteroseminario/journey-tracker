"use client";

import { useState } from "react";
import { ShareGoalStatusModal } from "./ShareGoalStatusModal";

interface ShareGoalStatusButtonProps {
  goalId: string;
  goalTitle: string;
  goalIcon?: string;
  progress: number;
}

export function ShareGoalStatusButton({ goalId, goalTitle, goalIcon, progress }: ShareGoalStatusButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (progress <= 0) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Share goal status"
        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-text-muted hover:text-brand-primary hover:bg-brand-light transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {isOpen && (
        <ShareGoalStatusModal
          goalId={goalId}
          goalTitle={goalTitle}
          goalIcon={goalIcon}
          progress={progress}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
