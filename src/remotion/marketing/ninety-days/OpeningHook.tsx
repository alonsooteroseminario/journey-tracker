import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoFormat } from "./shared/types";

export const OpeningHook: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  // Frame 0-24: First line fades in
  const line1Opacity = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Frame 60-74: First line scales down, second line fades in
  const line1Scale = frame < 60
    ? 1
    : interpolate(frame, [60, 74], [1, 0.95], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const line2Opacity = spring({
    frame: frame - 60,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Frame 81-90: Both lines fade out
  const fadeOut = frame < 81
    ? 1
    : interpolate(frame, [81, 90], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: sz(16),
          opacity: fadeOut,
          transform: `scale(${line1Scale})`,
        }}
      >
        {/* Main stat line */}
        <div
          style={{
            fontSize: sz(36),
            fontWeight: "bold",
            color: "#ffffff",
            opacity: line1Opacity,
            textAlign: "center",
            padding: `0 ${sz(24)}px`,
          }}
        >
          92% of people abandon their goals.
        </div>

        {/* Second line */}
        {frame >= 60 && (
          <div
            style={{
              fontSize: sz(20),
              fontWeight: "normal",
              color: "#9ca3af",
              opacity: line2Opacity,
              textAlign: "center",
              padding: `0 ${sz(24)}px`,
            }}
          >
            This is the story of the other 8%.
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
