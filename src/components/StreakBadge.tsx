"use client";

import { StreakTier } from "@/types";

const tierConfig = {
  bronze: { icon: "\u{1F949}", label: "Bronze Streak", color: "bg-amber-100 text-amber-700" },
  silver: { icon: "\u{1F948}", label: "Silver Streak", color: "bg-gray-100 text-gray-700" },
  gold: { icon: "\u{1F947}", label: "Gold Streak", color: "bg-yellow-100 text-yellow-700" },
};

interface StreakBadgeProps {
  tier: StreakTier;
  streak?: number;
}

export function StreakBadge({ tier, streak }: StreakBadgeProps) {
  if (!tier) return null;
  const config = tierConfig[tier];
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${config.color}`}
      title={`${config.label}${streak ? ` (${streak} days)` : ""}`}
    >
      {config.icon}
      {streak != null && streak > 0 && <span>{streak}d</span>}
    </span>
  );
}
