import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoFormat } from "../ninety-days/shared/types";

export const Scene10CTA: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  // Line 1: "Carlos told the AI what he needed." — frame 15
  const line1Spring =
    frame < 15
      ? 0
      : spring({
          frame: frame - 15,
          fps,
          config: { damping: 15, stiffness: 120 },
        });

  // Line 2: "37 days later, he was driving in Vancouver." — frame 60
  const line2Spring =
    frame < 60
      ? 0
      : spring({
          frame: frame - 60,
          fps,
          config: { damping: 15, stiffness: 120 },
        });

  // Line 3: "Then 30 strangers used his template..." — frame 105
  const line3Spring =
    frame < 105
      ? 0
      : spring({
          frame: frame - 105,
          fps,
          config: { damping: 15, stiffness: 120 },
        });

  // Logo — frame 135
  const logoSpring =
    frame < 135
      ? 0
      : spring({
          frame: frame - 135,
          fps,
          config: { damping: 12, stiffness: 80 },
        });

  // CTA button — frame 165
  const ctaSpring =
    frame < 165
      ? 0
      : spring({
          frame: frame - 165,
          fps,
          config: { damping: 15, stiffness: 120 },
        });

  // URL — frame 172
  const urlOpacity =
    frame < 172
      ? 0
      : interpolate(frame, [172, 185], [0, 1], {
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
        background: "linear-gradient(180deg, rgba(249,250,251,0.95) 0%, rgba(229,231,235,0.9) 100%)",
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
          backgroundColor: "rgba(30,27,75,0.03)",
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
            fontSize: sz(24),
            fontWeight: "normal",
            color: "#111827",
            opacity: line1Spring,
            transform: `translateY(${interpolate(line1Spring, [0, 1], [20, 0])}px)`,
          }}
        >
          Carlos told the AI what he needed.
        </div>

        {/* Line 2 */}
        <div
          style={{
            fontSize: sz(24),
            fontWeight: "bold",
            color: "#f97316",
            opacity: line2Spring,
            transform: `translateY(${interpolate(line2Spring, [0, 1], [20, 0])}px)`,
          }}
        >
          37 days later, he was driving in Vancouver.
        </div>

        {/* Line 3 */}
        <div
          style={{
            fontSize: sz(18),
            fontWeight: "normal",
            color: "#4b5563",
            opacity: line3Spring,
            transform: `translateY(${interpolate(line3Spring, [0, 1], [15, 0])}px)`,
          }}
        >
          Then 30 strangers used his template to do the same thing.
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
            Turn life{"\u0027"}s chaos into a system.
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
                frame >= 165
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
