import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface GoalProgressProps {
  goalTitle: string;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  userName: string;
}

export const GoalProgressVideo: React.FC<GoalProgressProps> = ({
  goalTitle,
  progress,
  tasksCompleted,
  totalTasks,
  userName,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation timings
  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const progressBarAnimation = interpolate(
    frame,
    [30, 90],
    [0, progress],
    {
      extrapolateRight: "clamp",
    }
  );

  const statsReveal = interpolate(frame, [60, 90], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.1), transparent 50%)",
          opacity: fadeIn,
        }}
      />

      <div
        style={{
          textAlign: "center",
          padding: 60,
          opacity: fadeIn,
        }}
      >
        {/* User name */}
        <div
          style={{
            fontSize: 36,
            color: "#9ca3af",
            marginBottom: 20,
          }}
        >
          {userName}'s Progress
        </div>

        {/* Goal title */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: "#ffffff",
            marginBottom: 60,
            maxWidth: 1200,
          }}
        >
          {goalTitle}
        </h1>

        {/* Progress bar container */}
        <div
          style={{
            width: 800,
            height: 40,
            backgroundColor: "#1f2937",
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 40,
          }}
        >
          {/* Progress bar fill */}
          <div
            style={{
              width: `${progressBarAnimation}%`,
              height: "100%",
              background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
              transition: "width 0.5s ease",
            }}
          />
        </div>

        {/* Progress percentage */}
        <div
          style={{
            fontSize: 96,
            fontWeight: "bold",
            color: "#3b82f6",
            marginBottom: 40,
          }}
        >
          {Math.round(progressBarAnimation)}%
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: 80,
            justifyContent: "center",
            opacity: statsReveal,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 64,
                fontWeight: "bold",
                color: "#10b981",
              }}
            >
              {tasksCompleted}
            </div>
            <div
              style={{
                fontSize: 24,
                color: "#9ca3af",
              }}
            >
              Tasks Completed
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 64,
                fontWeight: "bold",
                color: "#6b7280",
              }}
            >
              {totalTasks - tasksCompleted}
            </div>
            <div
              style={{
                fontSize: 24,
                color: "#9ca3af",
              }}
            >
              Tasks Remaining
            </div>
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 28,
          color: "#6b7280",
          opacity: fadeIn,
        }}
      >
        Journey Tracker
      </div>
    </AbsoluteFill>
  );
};
