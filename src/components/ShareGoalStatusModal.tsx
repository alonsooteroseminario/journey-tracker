"use client";

import { useState } from "react";

interface ShareGoalStatusModalProps {
  goalId: string;
  goalTitle: string;
  goalIcon?: string;
  progress: number;
  onClose: () => void;
}

function buildPreviewUrl(params: {
  goalId: string;
  showProgress: boolean;
  showTasks: boolean;
  showStreak: boolean;
  showTagline: boolean;
  showAppName: boolean;
}): string {
  const p = new URLSearchParams();
  p.set("goalId", params.goalId);
  p.set("showProgress", String(params.showProgress));
  p.set("showTasks", String(params.showTasks));
  p.set("showStreak", String(params.showStreak));
  p.set("showTagline", String(params.showTagline));
  p.set("showAppName", String(params.showAppName));
  return `/api/share/goal?${p.toString()}`;
}

function buildTweetText(goalTitle: string, progress: number): string {
  const text = `I'm ${progress}% of the way to "${goalTitle}" 🎯 Staying consistent on my journey!\n\n#JourneyTracker #Goals #Progress`;
  return encodeURIComponent(text);
}

export function ShareGoalStatusModal({
  goalId,
  goalTitle,
  progress,
  onClose,
}: ShareGoalStatusModalProps) {
  const [showProgress, setShowProgress] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showStreak, setShowStreak] = useState(true);
  const [showTagline, setShowTagline] = useState(true);
  const [showAppName, setShowAppName] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [xCopied, setXCopied] = useState(false);

  const previewUrl = buildPreviewUrl({ goalId, showProgress, showTasks, showStreak, showTagline, showAppName });

  const handleShareX = async () => {
    const tweetText = buildTweetText(goalTitle, progress);
    const intentUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

    try {
      setIsSharing(true);
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const file = new File([blob], "goal-status.png", { type: "image/png" });

      // Mobile: use native share sheet with image — user picks X from share sheet
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Goal Progress", text: decodeURIComponent(tweetText) });
        return;
      }

      // Desktop: copy image to clipboard then open X compose
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setXCopied(true);
      setTimeout(() => setXCopied(false), 4000);
      window.open(intentUrl, "_blank");
    } catch {
      // Clipboard API unavailable — fall back to just opening X intent
      window.open(intentUrl, "_blank");
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareInstagram = async () => {
    if (typeof navigator.share === "undefined") {
      const a = document.createElement("a");
      a.href = previewUrl;
      a.download = "goal-status.png";
      a.click();
      return;
    }
    try {
      setIsSharing(true);
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const file = new File([blob], "goal-status.png", { type: "image/png" });
      await navigator.share({ files: [file], title: "My Goal Progress" });
    } catch {
      // silent
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Share goal status</h2>
            <p className="text-sm text-gray-500">{goalTitle}</p>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Preview */}
        <div className="p-4">
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
            <img
              src={previewUrl}
              alt="Goal status share preview"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="px-4 pb-2 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customize</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" aria-label="Show progress" checked={showProgress} onChange={(e) => setShowProgress(e.target.checked)} className="w-4 h-4 accent-brand-primary" />
              Progress %
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" aria-label="Show tasks" checked={showTasks} onChange={(e) => setShowTasks(e.target.checked)} className="w-4 h-4 accent-brand-primary" />
              Tasks done
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" aria-label="Show streak" checked={showStreak} onChange={(e) => setShowStreak(e.target.checked)} className="w-4 h-4 accent-brand-primary" />
              Streak
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" aria-label="Show tagline" checked={showTagline} onChange={(e) => setShowTagline(e.target.checked)} className="w-4 h-4 accent-brand-primary" />
              Tagline
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" aria-label="Show app name" checked={showAppName} onChange={(e) => setShowAppName(e.target.checked)} className="w-4 h-4 accent-brand-primary" />
              App name
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2 border-t border-gray-100">
          {xCopied && (
            <p className="text-xs text-center text-brand-primary font-medium">
              Image copied to clipboard — paste it into your tweet with Ctrl+V / ⌘V
            </p>
          )}
          <button
            onClick={handleShareX}
            disabled={isSharing}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
            </svg>
            {isSharing ? "Preparing…" : "Share on X"}
          </button>

          <button
            onClick={handleShareInstagram}
            disabled={isSharing}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            {isSharing ? "Preparing…" : "Share on Instagram"}
          </button>

          <a
            href={previewUrl}
            download="goal-status.png"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PNG
          </a>
        </div>
      </div>
    </div>
  );
}
