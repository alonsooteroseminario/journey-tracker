import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoFormat } from "./shared/types";
import { Sidebar } from "./shared/Sidebar";
import { ConfettiExplosion } from "./shared/ConfettiExplosion";

const statsCards = [
  { emoji: "\u{1F3AF}", value: "3", label: "Goals", color: "#111827" },
  { emoji: "\u2705", value: "47", label: "Tasks Done", color: "#111827" },
  { emoji: "\u{1F525}", value: "90", label: "Day Streak", color: "#f97316" },
  {
    emoji: "\u{1F374}",
    value: "51",
    label: "Template Forks",
    color: "#111827",
  },
];

const isActive = (week: number, day: number): boolean => {
  // Deterministic activity pattern based on week ranges
  if (week < 9) {
    // Jan-Feb: mostly empty, occasional light
    return (week * 7 + day) % 11 === 0;
  }
  if (week < 13) {
    // Mar: 30% green
    return (week * 7 + day) % 3 === 0;
  }
  if (week < 17) {
    // Apr: 50% green
    return (week * 7 + day) % 2 === 0;
  }
  if (week < 21) {
    // May: 80% green
    return (week * 7 + day) % 5 !== 0;
  }
  // Jun-present: ALL green
  return true;
};

const getHeatmapColor = (week: number, day: number): string => {
  if (!isActive(week, day)) return "#e5e7eb"; // neutral-200
  if (week < 9) return "rgba(22,163,74,0.15)";
  if (week < 13) return "rgba(22,163,74,0.3)";
  if (week < 17) return "rgba(22,163,74,0.5)";
  if (week < 21) return "rgba(22,163,74,0.8)";
  return "#16a34a";
};

export const Scene7Profile: React.FC<{ format: VideoFormat }> = ({
  format,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth = format === "landscape" ? sz(256) : 0;
  const topOffset = format === "square" ? sz(48) : 0;
  const bottomOffset = format === "vertical" ? sz(56) : 0;

  // Celebration overlay (frame 90-180)
  const overlaySpring =
    frame < 90
      ? 0
      : spring({
          frame: frame - 90,
          fps,
          config: { damping: 8, stiffness: 150 },
        });
  const overlayOpacity =
    frame < 90
      ? 0
      : frame < 180
        ? overlaySpring
        : interpolate(frame, [180, 210], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
  const overlayY = interpolate(overlaySpring, [0, 1], [-60, 0]);

  // Streak card pulse at frame 90
  const streakPulseSpring =
    frame < 90
      ? 0
      : spring({
          frame: frame - 90,
          fps,
          config: { damping: 8, stiffness: 150 },
        });
  // Scale: 1 -> 1.2 -> 1.0 (ternary for peak-in-middle)
  const streakScale =
    frame < 90
      ? 1
      : frame < 100
        ? interpolate(frame, [90, 100], [1, 1.2], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : 1.0 + (1 - streakPulseSpring) * 0.2;

  const streakBg =
    frame < 90
      ? "#fff"
      : frame < 130
        ? "#ffedd5"
        : "#fff";

  // Transition out (frame 210-240)
  const fadeOut =
    frame < 210
      ? 1
      : interpolate(frame, [210, 240], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // Float for overlay badge
  const floatY = frame >= 90 ? Math.sin(frame * 0.1) * 5 : 0;

  // Heatmap column reveal: start at frame 15, 52 columns over ~90 frames
  const heatmapCols = 52;
  const heatmapRows = 7;
  const cellSize = sz(12);
  const cellGap = sz(2);

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif" }}
    >
      <Sidebar format={format} activeItem="Profile" sz={sz} />

      <div
        style={{
          position: "absolute",
          top: topOffset,
          left: sidebarWidth,
          right: 0,
          bottom: bottomOffset,
          padding: sz(24),
          overflow: "hidden",
          opacity: fadeOut,
        }}
      >
        {/* Profile header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: sz(16),
            marginBottom: sz(20),
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: sz(80),
              height: sz(80),
              borderRadius: "50%",
              backgroundColor: "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: sz(32),
              fontWeight: "bold",
              flexShrink: 0,
            }}
          >
            AM
          </div>
          <div>
            <div
              style={{
                fontSize: sz(24),
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              Alex Martinez
            </div>
            <div
              style={{
                fontSize: sz(14),
                color: "#4b5563",
                marginTop: sz(2),
              }}
            >
              Product Manager building cool things
            </div>
            <div
              style={{
                fontSize: sz(12),
                color: "#9ca3af",
                marginTop: sz(4),
              }}
            >
              {"\u{1F4CD}"} San Francisco, CA
            </div>
            <div
              style={{
                fontSize: sz(12),
                color: "#9ca3af",
                marginTop: sz(2),
              }}
            >
              Member since Jan 2026
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: sz(10),
            marginBottom: sz(20),
            flexWrap: "wrap",
          }}
        >
          {statsCards.map((stat, i) => {
            const isStreakCard = i === 2;
            return (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  minWidth: sz(80),
                  backgroundColor: isStreakCard ? streakBg : "#fff",
                  borderRadius: sz(8),
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  padding: sz(16),
                  textAlign: "center",
                  transform: isStreakCard
                    ? `scale(${streakScale})`
                    : "none",
                }}
              >
                <div style={{ fontSize: sz(20) }}>{stat.emoji}</div>
                <div
                  style={{
                    fontSize: sz(24),
                    fontWeight: "bold",
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: sz(12),
                    color: "#9ca3af",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Activity Heatmap */}
        <div style={{ marginBottom: sz(8) }}>
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              gap: cellGap,
            }}
          >
            {Array.from({ length: heatmapCols }).map((_, col) => {
              // Column reveal: starts at frame 15, each col ~1.7 frames apart
              const colRevealFrame = 15 + col * 1.7;
              const colOpacity =
                frame < colRevealFrame
                  ? 0
                  : interpolate(
                      frame,
                      [colRevealFrame, colRevealFrame + 3],
                      [0, 1],
                      {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      }
                    );
              return (
                <div
                  key={col}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: cellGap,
                    opacity: colOpacity,
                  }}
                >
                  {Array.from({ length: heatmapRows }).map((_, row) => (
                    <div
                      key={row}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: sz(2),
                        backgroundColor: getHeatmapColor(col, row),
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
          <div
            style={{
              fontSize: sz(14),
              color: "#f97316",
              marginTop: sz(8),
            }}
          >
            90-day streak — longest streak ever
          </div>
        </div>
      </div>

      {/* Confetti at frame 90 — always rendered, component handles visibility internally */}
      <ConfettiExplosion
        count={24}
        colors={["#6366f1", "#f97316", "#16a34a", "#FFD700"]}
        originX={sidebarWidth + sz(260)}
        originY={topOffset + sz(200)}
        triggerFrame={90}
        sz={sz}
      />

      {/* Celebration overlay */}
      {frame >= 90 && overlayOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1, #4338ca)",
              borderRadius: sz(12),
              padding: `${sz(32)}px ${sz(48)}px`,
              textAlign: "center",
              opacity: overlayOpacity,
              transform: `translateY(${overlayY + floatY}px)`,
              boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
            }}
          >
            <div
              style={{
                fontSize: sz(30),
                fontWeight: "bold",
                color: "#fff",
                marginBottom: sz(8),
              }}
            >
              {"\u{1F3C6}"} 90 Days! Goal Completed!
            </div>
            <div
              style={{
                fontSize: sz(18),
                color: "rgba(255,255,255,0.8)",
              }}
            >
              You built your portfolio website. And became the 1%.
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
