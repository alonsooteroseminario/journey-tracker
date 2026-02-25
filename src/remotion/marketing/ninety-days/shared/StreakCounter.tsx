import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

interface StreakCounterProps {
  streak: number;
  sz: (n: number) => number;
  showMotivation?: boolean;
  glowing?: boolean;
}

const getMotivation = (streak: number): string => {
  if (streak >= 90) return "Built different. Nothing can stop you now. 💪";
  if (streak >= 31)
    return "Legendary consistency. The compound effect is real.";
  if (streak === 30) return "A whole month! You're unstoppable. 🎉";
  if (streak >= 8) return "You're on fire. Don't stop now. 🔥";
  if (streak === 7)
    return "One week strong! This is becoming a habit. 🏆";
  if (streak >= 2) return "Keep the momentum going. 🔥";
  if (streak === 1) return "Day one. The hardest step is done.";
  return "";
};

export const StreakCounter: React.FC<StreakCounterProps> = ({
  streak,
  sz,
  showMotivation = false,
  glowing = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glowOpacity = glowing
    ? 0.3 * (0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2))
    : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: sz(8),
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: sz(8),
          backgroundColor: "#ffedd5",
          borderRadius: sz(999),
          padding: `${sz(8)}px ${sz(16)}px`,
          boxShadow: glowing
            ? `0 0 ${sz(20)}px rgba(249,115,22,${glowOpacity})`
            : "none",
        }}
      >
        <span style={{ fontSize: sz(24) }}>🔥</span>
        <span
          style={{
            fontSize: sz(30),
            fontWeight: 800,
            color: "#f97316",
          }}
        >
          {streak}
        </span>
        <span
          style={{
            fontSize: sz(14),
            color: "#4b5563",
          }}
        >
          day streak
        </span>
      </div>

      {showMotivation && streak > 0 && (
        <div
          style={{
            fontSize: sz(14),
            color: "#4b5563",
            textAlign: "center",
          }}
        >
          {getMotivation(streak)}
        </div>
      )}
    </div>
  );
};
