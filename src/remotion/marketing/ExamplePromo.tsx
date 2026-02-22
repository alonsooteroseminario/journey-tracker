import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type VideoFormat = "landscape" | "square" | "vertical";

interface ExamplePromoProps {
  headline: string;
  subtext: string;
  format: VideoFormat;
}

export const ExamplePromo: React.FC<ExamplePromoProps> = ({
  headline,
  subtext,
  format,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isVertical = format === "vertical";

  // Animations
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const headlineSlide = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15 },
  });

  const subtextSlide = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15 },
  });

  const ctaScale = spring({
    frame: frame - 60,
    fps,
    config: { damping: 12, mass: 0.8 },
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
            "radial-gradient(ellipse at 30% 40%, rgba(59, 130, 246, 0.15), transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(139, 92, 246, 0.1), transparent 60%)",
          opacity: fadeIn,
        }}
      />

      <div
        style={{
          textAlign: "center",
          padding: isVertical ? 40 : 60,
          maxWidth: isVertical ? "90%" : "80%",
          opacity: fadeIn,
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontSize: isVertical ? 56 : 72,
            fontWeight: "bold",
            color: "#ffffff",
            marginBottom: isVertical ? 24 : 40,
            lineHeight: 1.2,
            transform: `translateY(${(1 - headlineSlide) * 40}px)`,
            opacity: headlineSlide,
          }}
        >
          {headline}
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontSize: isVertical ? 28 : 36,
            color: "#94a3b8",
            marginBottom: isVertical ? 40 : 60,
            lineHeight: 1.5,
            transform: `translateY(${(1 - subtextSlide) * 30}px)`,
            opacity: subtextSlide,
          }}
        >
          {subtext}
        </p>

        {/* CTA button */}
        <div
          style={{
            transform: `scale(${ctaScale})`,
            opacity: ctaScale,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "16px 48px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              borderRadius: 12,
              fontSize: isVertical ? 24 : 28,
              fontWeight: "bold",
              color: "#ffffff",
            }}
          >
            Try Journey Tracker
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <div
        style={{
          position: "absolute",
          bottom: isVertical ? 60 : 40,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: isVertical ? 22 : 28,
          color: "#6b7280",
          opacity: fadeIn,
        }}
      >
        Journey Tracker
      </div>
    </AbsoluteFill>
  );
};
