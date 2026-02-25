import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoFormat } from "./shared/types";

export const Scene1Landing: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  // Landing page slides in from right
  const slideIn = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const translateX = interpolate(slideIn, [0, 1], [80, 0]);

  // Cursor appears at frame 30
  const cursorOpacity = frame < 30
    ? 0
    : interpolate(frame, [30, 35], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Cursor moves toward CTA button (from right area to center)
  const cursorX = frame < 30
    ? sz(500)
    : interpolate(frame, [30, 58], [sz(500), sz(300)], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const cursorY = frame < 30
    ? sz(100)
    : interpolate(frame, [30, 58], [sz(100), sz(260)], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Button click effect at frame 60
  const clickSpring = spring({
    frame: frame - 60,
    fps,
    config: { damping: 20, stiffness: 200 },
  });
  // Scale: 1.0 -> 0.95 -> 1.0 (press and release)
  const buttonScale = frame < 60
    ? 1
    : frame < 65
      ? interpolate(frame, [60, 65], [1, 0.95], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })
      : 0.95 + clickSpring * 0.05;

  // Zoom at frame 75
  const zoomScale = frame < 75
    ? 1
    : interpolate(frame, [75, 90], [1, 1.1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // White flash at frame 75
  const whiteFlash = frame < 75
    ? 0
    : interpolate(frame, [75, 90], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const howItWorksCards = [
    { emoji: "🤖", title: "AI builds your plan", desc: "Tell the AI your goal and it creates a complete roadmap with tasks and milestones." },
    { emoji: "🔥", title: "Streaks keep you going", desc: "Daily streaks and milestones create powerful momentum you don't want to break." },
    { emoji: "👥", title: "Friends hold you accountable", desc: "Share progress, encourage each other, and celebrate wins together." },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#f9fafb" }}>
      {/* Landing page container */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: `translateX(${translateX}px) scale(${zoomScale})`,
          transformOrigin: "center center",
          fontFamily: "Arial, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Hero Section */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e1b4b, #4338ca)",
            padding: `${sz(48)}px ${sz(32)}px ${sz(40)}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Nav bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              marginBottom: sz(32),
            }}
          >
            <span style={{ color: "#fff", fontWeight: 600, fontSize: sz(16) }}>
              🎯 Journey Tracker
            </span>
            <div style={{ display: "flex", gap: sz(16), alignItems: "center" }}>
              <span style={{ color: "#e0e7ff", fontSize: sz(13) }}>Features</span>
              <span style={{ color: "#e0e7ff", fontSize: sz(13) }}>Pricing</span>
              <span
                style={{
                  color: "#fff",
                  fontSize: sz(13),
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: `${sz(4)}px ${sz(12)}px`,
                  borderRadius: sz(6),
                }}
              >
                Sign In
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: sz(36),
              fontWeight: "bold",
              color: "#ffffff",
              lineHeight: 1.2,
              marginBottom: sz(12),
              margin: 0,
            }}
          >
            Turn ambitious goals into daily wins.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: sz(18),
              color: "#e0e7ff",
              lineHeight: 1.5,
              marginBottom: sz(24),
              maxWidth: sz(500),
              margin: `${sz(12)}px 0 ${sz(24)}px`,
            }}
          >
            AI-powered goal tracking with streaks, accountability, and proven templates.
          </p>

          {/* CTA Button */}
          <div
            style={{
              transform: `scale(${buttonScale})`,
              display: "inline-block",
            }}
          >
            <div
              style={{
                backgroundColor: "#6366f1",
                color: "#ffffff",
                fontSize: sz(16),
                fontWeight: 600,
                padding: `${sz(12)}px ${sz(24)}px`,
                borderRadius: sz(8),
                cursor: "pointer",
              }}
            >
              Get Started Free →
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div
          style={{
            padding: `${sz(24)}px ${sz(24)}px`,
            backgroundColor: "#f9fafb",
          }}
        >
          <h2
            style={{
              fontSize: sz(22),
              fontWeight: "bold",
              color: "#111827",
              textAlign: "center",
              marginBottom: sz(16),
              margin: `0 0 ${sz(16)}px`,
            }}
          >
            How It Works
          </h2>

          <div
            style={{
              display: "flex",
              gap: sz(12),
              flexDirection: isVertical ? "column" : "row",
            }}
          >
            {howItWorksCards.map((card) => (
              <div
                key={card.title}
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: sz(8),
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  padding: sz(20),
                  display: "flex",
                  flexDirection: "column",
                  gap: sz(8),
                }}
              >
                <span style={{ fontSize: sz(28) }}>{card.emoji}</span>
                <span style={{ fontSize: sz(14), fontWeight: 600, color: "#111827" }}>
                  {card.title}
                </span>
                <span style={{ fontSize: sz(12), color: "#4b5563", lineHeight: 1.4 }}>
                  {card.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cursor */}
      {frame >= 30 && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            opacity: cursorOpacity,
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <svg
            width={sz(16)}
            height={sz(20)}
            viewBox="0 0 16 20"
            style={{ transform: "rotate(-30deg)" }}
          >
            <polygon
              points="0,0 0,16 5,12 8,20 11,19 8,11 14,11"
              fill="#ffffff"
              stroke="#111827"
              strokeWidth="1"
            />
          </svg>
        </div>
      )}

      {/* White flash overlay */}
      {whiteFlash > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#ffffff",
            opacity: whiteFlash,
            zIndex: 30,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
