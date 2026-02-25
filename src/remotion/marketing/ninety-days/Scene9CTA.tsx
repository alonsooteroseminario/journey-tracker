import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoFormat } from "./shared/types";

export const Scene9CTA: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  // Line 1: "One sentence to the AI." — frame 0
  const line1Spring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Line 2: "90 days of momentum." — frame 45
  const line2Spring =
    frame < 45
      ? 0
      : spring({
          frame: frame - 45,
          fps,
          config: { damping: 15, stiffness: 120 },
        });

  // Line 3: "12 tasks. 3 phases. 1 completed dream." — frame 90
  const line3Spring =
    frame < 90
      ? 0
      : spring({
          frame: frame - 90,
          fps,
          config: { damping: 15, stiffness: 120 },
        });

  // Logo — frame 120
  const logoSpring =
    frame < 120
      ? 0
      : spring({
          frame: frame - 120,
          fps,
          config: { damping: 12, stiffness: 80 },
        });

  // CTA button — frame 150
  const ctaSpring =
    frame < 150
      ? 0
      : spring({
          frame: frame - 150,
          fps,
          config: { damping: 15, stiffness: 120 },
        });

  // URL — frame 160
  const urlOpacity =
    frame < 160
      ? 0
      : interpolate(frame, [160, 175], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // CTA button pulsing glow
  const glowCycle = frame % 30;
  const glowSpread = interpolate(glowCycle, [0, 15, 29], [20, 40, 20]);
  const glowAlpha =
    glowCycle < 15
      ? interpolate(glowCycle, [0, 15], [0.3, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : interpolate(glowCycle, [15, 29], [0, 0.3], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #f9fafb 0%, #e5e7eb 100%)",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Subtle brand overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(30,27,75,0.05)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: sz(16),
          padding: sz(32),
          zIndex: 1,
        }}
      >
        {/* Line 1 */}
        <div
          style={{
            fontSize: sz(30),
            fontWeight: "bold",
            color: "#111827",
            opacity: line1Spring,
            transform: `translateY(${interpolate(line1Spring, [0, 1], [20, 0])}px)`,
          }}
        >
          One sentence to the AI.
        </div>

        {/* Line 2 */}
        <div
          style={{
            fontSize: sz(30),
            fontWeight: "bold",
            color: "#f97316",
            opacity: line2Spring,
            transform: `translateY(${interpolate(line2Spring, [0, 1], [20, 0])}px)`,
          }}
        >
          90 days of momentum.
        </div>

        {/* Line 3 */}
        <div
          style={{
            fontSize: sz(18),
            color: "#4b5563",
            opacity: line3Spring,
            transform: `translateY(${interpolate(line3Spring, [0, 1], [15, 0])}px)`,
          }}
        >
          12 tasks. 3 phases. 1 completed dream.
        </div>

        {/* Logo */}
        <div
          style={{
            opacity: logoSpring,
            transform: `translateY(${interpolate(logoSpring, [0, 1], [15, 0])}px)`,
            marginTop: sz(16),
          }}
        >
          <div
            style={{
              fontSize: sz(24),
              fontWeight: "bold",
              color: "#111827",
            }}
          >
            {"\u{1F3AF}"} Journey Tracker
          </div>
          <div
            style={{
              fontSize: sz(14),
              color: "#9ca3af",
              marginTop: sz(4),
            }}
          >
            Your goals deserve a system.
          </div>
        </div>

        {/* CTA Button */}
        <div
          style={{
            opacity: ctaSpring,
            transform: `scale(${interpolate(ctaSpring, [0, 1], [0.8, 1])})`,
            marginTop: sz(8),
          }}
        >
          <div
            style={{
              backgroundColor: "#6366f1",
              color: "#fff",
              fontSize: sz(18),
              fontWeight: 600,
              padding: `${sz(16)}px ${sz(32)}px`,
              borderRadius: sz(8),
              boxShadow:
                frame >= 150
                  ? `0 0 ${glowSpread}px rgba(99,102,241,${glowAlpha})`
                  : "none",
            }}
          >
            Start Free {"\u2192"}
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: sz(14),
            color: "#9ca3af",
            opacity: urlOpacity,
          }}
        >
          journeytracker.app
        </div>
      </div>
    </AbsoluteFill>
  );
};
