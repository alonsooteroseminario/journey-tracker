import React from "react";
import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoFormat } from "../ninety-days/shared/types";

export const OpeningHook: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  // Line 1: "You just moved to a new country." — fades in at frame 9
  const line1Opacity = spring({
    frame: frame - 9,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Line 2: "New language. New rules. New bureaucracy." — fades in at frame 39
  const line2Opacity = spring({
    frame: frame - 39,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Line 3: "Where do you even start?" — fades in at frame 75
  const line3Opacity = spring({
    frame: frame - 75,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // All lines fade out at frame 105 over 12 frames
  const fadeOut = frame < 105
    ? 1
    : interpolate(frame, [105, 117], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

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
          padding: `0 ${sz(24)}px`,
        }}
      >
        {/* Line 1 */}
        <div
          style={{
            fontSize: sz(24),
            fontWeight: "normal",
            color: "#ffffff",
            opacity: line1Opacity,
            textAlign: "center",
          }}
        >
          You just moved to a new country.
        </div>

        {/* Line 2 */}
        <div
          style={{
            fontSize: sz(24),
            fontWeight: "normal",
            color: "#9ca3af",
            opacity: line2Opacity,
            textAlign: "center",
          }}
        >
          New language. New rules. New bureaucracy.
        </div>

        {/* Line 3 */}
        <div
          style={{
            fontSize: sz(30),
            fontWeight: "bold",
            color: "#ffffff",
            opacity: line3Opacity,
            textAlign: "center",
          }}
        >
          Where do you even start?
        </div>
      </div>
    </AbsoluteFill>
  );
};
