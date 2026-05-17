"use client";

import { useEffect } from "react";

export default function GoalsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Goals error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-lg border border-border p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Failed to load your goals
        </h2>
        <p className="text-text-secondary mb-6">
          Something went wrong while loading your goals. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
