import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import type { VideoFormat } from "./ExamplePromo";

interface HeroOverviewProps {
  format: VideoFormat;
}

export const HeroOverview: React.FC<HeroOverviewProps> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isVertical = format === "vertical";

  // ── Scene 1: Opening Hook (frames 0-60) ──

  const scene1FadeOut = interpolate(frame, [50, 60], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const mainTextSpring = spring({
    frame,
    fps,
    config: { damping: 12, mass: 1.2 },
  });

  const subTextFade = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Scene 2: Goal Hierarchy (frames 60-120) ──

  const scene2Opacity = interpolate(frame, [60, 70, 110, 120], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const goalBoxSpring = spring({
    frame: Math.max(0, frame - 65),
    fps,
    config: { damping: 14 },
  });

  const phaseBoxSpring = spring({
    frame: Math.max(0, frame - 75),
    fps,
    config: { damping: 14 },
  });

  const taskBoxSpring = spring({
    frame: Math.max(0, frame - 85),
    fps,
    config: { damping: 14 },
  });

  const scene2LabelFade = interpolate(frame, [90, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Scene 3: Streaks (frames 120-180) ──

  const scene3Opacity = interpolate(
    frame,
    [120, 130, 170, 180],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const streakCounterSpring = spring({
    frame: Math.max(0, frame - 158),
    fps,
    config: { damping: 10, mass: 0.8 },
  });

  // ── Scene 4: AI Agent (frames 180-240) ──

  const scene4Opacity = interpolate(
    frame,
    [180, 190, 230, 240],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const userBubbleSpring = spring({
    frame: Math.max(0, frame - 190),
    fps,
    config: { damping: 14 },
  });

  const aiBubbleSpring = spring({
    frame: Math.max(0, frame - 205),
    fps,
    config: { damping: 14 },
  });

  const scene4LabelFade = interpolate(frame, [215, 225], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Scene 5: CTA (frames 240-300) ──

  const scene5Opacity = interpolate(frame, [240, 255], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaTitleSpring = spring({
    frame: Math.max(0, frame - 245),
    fps,
    config: { damping: 12, mass: 1 },
  });

  const ctaButtonSpring = spring({
    frame: Math.max(0, frame - 260),
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const ctaBrandFade = interpolate(frame, [270, 285], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Font size helpers ──

  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Background gradient (persistent) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 30% 40%, rgba(59, 130, 246, 0.15), transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(139, 92, 246, 0.1), transparent 60%)",
        }}
      />

      {/* ── Scene 1: Opening Hook ── */}
      <Sequence from={0} durationInFrames={60}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: scene1FadeOut,
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: isVertical ? 40 : 60,
            }}
          >
            <h1
              style={{
                fontSize: sz(80),
                fontWeight: "bold",
                color: "#ffffff",
                margin: 0,
                marginBottom: sz(24),
                lineHeight: 1.1,
                transform: `translateY(${(1 - mainTextSpring) * 50}px)`,
                opacity: mainTextSpring,
              }}
            >
              92% of resolutions fail.
            </h1>
            <p
              style={{
                fontSize: sz(44),
                fontWeight: 600,
                color: "#a78bfa",
                margin: 0,
                opacity: subTextFade,
              }}
            >
              Yours won&apos;t.
            </p>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 2: Goal Hierarchy ── */}
      <Sequence from={60} durationInFrames={60}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: scene2Opacity,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: sz(12),
            }}
          >
            {/* Goal box */}
            <div
              style={{
                width: sz(500),
                height: sz(60),
                borderRadius: 12,
                border: "2px solid #3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3b82f6",
                fontSize: sz(22),
                fontWeight: 600,
                transform: `scale(${goalBoxSpring})`,
                opacity: goalBoxSpring,
              }}
            >
              Goal
            </div>
            {/* Phase box */}
            <div
              style={{
                width: sz(400),
                height: sz(55),
                borderRadius: 10,
                border: "2px solid #8b5cf6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8b5cf6",
                fontSize: sz(20),
                fontWeight: 600,
                transform: `scale(${phaseBoxSpring})`,
                opacity: phaseBoxSpring,
              }}
            >
              Phase
            </div>
            {/* Task box */}
            <div
              style={{
                width: sz(300),
                height: sz(50),
                borderRadius: 8,
                border: "2px solid #10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
                fontSize: sz(18),
                fontWeight: 600,
                transform: `scale(${taskBoxSpring})`,
                opacity: taskBoxSpring,
              }}
            >
              Task
            </div>
            {/* Label */}
            <p
              style={{
                fontSize: sz(30),
                color: "#94a3b8",
                marginTop: sz(24),
                opacity: scene2LabelFade,
                textAlign: "center",
              }}
            >
              Break any goal into achievable steps
            </p>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 3: Streaks ── */}
      <Sequence from={120} durationInFrames={60}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: scene3Opacity,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: sz(32),
            }}
          >
            {/* Day circles row */}
            <div
              style={{
                display: "flex",
                gap: sz(14),
              }}
            >
              {Array.from({ length: 7 }).map((_, i) => {
                const fillProgress = interpolate(
                  frame,
                  [125 + i * 4, 129 + i * 4],
                  [0, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }
                );
                return (
                  <div
                    key={i}
                    style={{
                      width: sz(48),
                      height: sz(48),
                      borderRadius: "50%",
                      border: "2px solid #f59e0b",
                      backgroundColor: `rgba(245, 158, 11, ${fillProgress})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: sz(16),
                      fontWeight: 600,
                      color:
                        fillProgress > 0.5
                          ? "#0a0a0a"
                          : "rgba(245, 158, 11, 0.6)",
                    }}
                  >
                    {["M", "T", "W", "T", "F", "S", "S"][i]}
                  </div>
                );
              })}
            </div>

            {/* Streak counter */}
            <div
              style={{
                fontSize: sz(48),
                fontWeight: "bold",
                color: "#f59e0b",
                transform: `scale(${streakCounterSpring})`,
                opacity: streakCounterSpring,
              }}
            >
              7-day streak!
            </div>

            {/* Label */}
            <p
              style={{
                fontSize: sz(28),
                color: "#94a3b8",
                margin: 0,
                opacity: interpolate(frame, [160, 170], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Build momentum that lasts
            </p>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 4: AI Agent ── */}
      <Sequence from={180} durationInFrames={60}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: scene4Opacity,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: sz(16),
              width: isVertical ? "85%" : "70%",
              maxWidth: 700,
            }}
          >
            {/* User chat bubble */}
            <div
              style={{
                alignSelf: "flex-end",
                backgroundColor: "#3b82f6",
                borderRadius: 16,
                borderBottomRightRadius: 4,
                padding: `${sz(14)}px ${sz(22)}px`,
                fontSize: sz(22),
                color: "#ffffff",
                transform: `translateX(${(1 - userBubbleSpring) * 60}px)`,
                opacity: userBubbleSpring,
                maxWidth: "80%",
              }}
            >
              Learn TypeScript in 3 months
            </div>

            {/* AI response bubble */}
            <div
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#1e1e2e",
                border: "1px solid #2d2d3d",
                borderRadius: 16,
                borderBottomLeftRadius: 4,
                padding: `${sz(14)}px ${sz(22)}px`,
                fontSize: sz(20),
                color: "#e2e8f0",
                transform: `translateX(${(1 - aiBubbleSpring) * -60}px)`,
                opacity: aiBubbleSpring,
                maxWidth: "85%",
              }}
            >
              <span style={{ marginRight: 8 }}>&#10024;</span>
              I&apos;ve created your goal with 4 phases and 12 tasks
            </div>

            {/* Label */}
            <p
              style={{
                fontSize: sz(30),
                color: "#94a3b8",
                marginTop: sz(16),
                textAlign: "center",
                opacity: scene4LabelFade,
              }}
            >
              AI plans your entire journey
            </p>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 5: CTA ── */}
      <Sequence from={240} durationInFrames={60}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: scene5Opacity,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: sz(32),
            }}
          >
            {/* Title with gradient */}
            <h1
              style={{
                fontSize: sz(72),
                fontWeight: "bold",
                margin: 0,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                transform: `translateY(${(1 - ctaTitleSpring) * 40}px)`,
                opacity: ctaTitleSpring,
              }}
            >
              Journey Tracker
            </h1>

            {/* CTA button */}
            <div
              style={{
                transform: `scale(${ctaButtonSpring})`,
                opacity: ctaButtonSpring,
              }}
            >
              <div
                style={{
                  padding: `${sz(18)}px ${sz(56)}px`,
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  borderRadius: 14,
                  fontSize: sz(30),
                  fontWeight: "bold",
                  color: "#ffffff",
                }}
              >
                Start Your Journey
              </div>
            </div>

            {/* Bottom branding bar */}
            <div
              style={{
                position: "absolute",
                bottom: isVertical ? 60 : 40,
                left: 0,
                right: 0,
                textAlign: "center",
                fontSize: sz(22),
                color: "#6b7280",
                opacity: ctaBrandFade,
              }}
            >
              journeytracker.app
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
