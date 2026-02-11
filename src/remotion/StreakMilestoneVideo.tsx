import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface StreakMilestoneProps {
  userName: string;
  streakCount: number;
  milestone: number;
}

export const StreakMilestoneVideo: React.FC<StreakMilestoneProps> = ({
  userName,
  streakCount,
  milestone,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame: frame - 20,
    fps,
    config: {
      damping: 12,
    },
  });

  const counterAnimation = interpolate(
    frame,
    [40, 80],
    [0, streakCount],
    {
      extrapolateRight: "clamp",
    }
  );

  const celebrationOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f172a",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Animated background circles */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(251, 146, 60, 0.1), transparent 70%)",
          opacity: fadeIn,
        }}
      />

      <div
        style={{
          textAlign: "center",
          opacity: fadeIn,
        }}
      >
        {/* Emoji celebration */}
        <div
          style={{
            fontSize: 120,
            marginBottom: 40,
            transform: `scale(${scale})`,
          }}
        >
          🔥
        </div>

        {/* User name */}
        <div
          style={{
            fontSize: 48,
            color: "#94a3b8",
            marginBottom: 20,
          }}
        >
          {userName}
        </div>

        {/* Milestone reached */}
        <h1
          style={{
            fontSize: 64,
            fontWeight: "bold",
            color: "#ffffff",
            marginBottom: 40,
          }}
        >
          {milestone}-Day Streak! 🎉
        </h1>

        {/* Streak counter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 30,
            marginBottom: 60,
          }}
        >
          <div
            style={{
              fontSize: 180,
              fontWeight: "bold",
              background: "linear-gradient(135deg, #fb923c, #f97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {Math.round(counterAnimation)}
          </div>
          <div
            style={{
              fontSize: 48,
              color: "#fb923c",
            }}
          >
            Days
          </div>
        </div>

        {/* Celebration message */}
        <div
          style={{
            fontSize: 36,
            color: "#cbd5e1",
            opacity: celebrationOpacity,
          }}
        >
          Keep the momentum going! 💪
        </div>
      </div>

      {/* Bottom branding */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          fontSize: 28,
          color: "#64748b",
        }}
      >
        Journey Tracker
      </div>
    </AbsoluteFill>
  );
};
