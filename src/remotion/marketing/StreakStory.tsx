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

interface StreakStoryProps {
  format: VideoFormat;
}

const AMBER = "#f59e0b";
const ORANGE = "#ef4444";
const BG = "#0a0a0a";
const MUTED = "#94a3b8";

export const StreakStory: React.FC<StreakStoryProps> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isVertical = format === "vertical";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Scene 1: Day 1 (frames 0-50) */}
      <Sequence from={0} durationInFrames={50}>
        <Scene1 fps={fps} isVertical={isVertical} />
      </Sequence>

      {/* Scene 2: Day 7 (frames 50-110) */}
      <Sequence from={50} durationInFrames={60}>
        <Scene2 fps={fps} isVertical={isVertical} />
      </Sequence>

      {/* Scene 3: Day 30 (frames 110-180) */}
      <Sequence from={110} durationInFrames={70}>
        <Scene3 fps={fps} isVertical={isVertical} />
      </Sequence>

      {/* Scene 4: Day 100 (frames 180-240) */}
      <Sequence from={180} durationInFrames={60}>
        <Scene4 fps={fps} isVertical={isVertical} />
      </Sequence>

      {/* Scene 5: CTA (frames 240-300) */}
      <Sequence from={240} durationInFrames={60}>
        <Scene5 fps={fps} isVertical={isVertical} />
      </Sequence>

      {/* Global background that evolves over time */}
      <AbsoluteFill
        style={{
          background: (() => {
            const glowIntensity = interpolate(frame, [0, 110, 180, 240], [0.05, 0.1, 0.2, 0.3], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            });
            return `radial-gradient(ellipse at 50% 50%, rgba(245, 158, 11, ${glowIntensity}), transparent 70%)`;
          })(),
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------- Scene 1: Day 1 ---------- */

const Scene1: React.FC<{ fps: number; isVertical: boolean }> = ({ fps, isVertical }) => {
  const frame = useCurrentFrame();

  const flameScale = spring({
    frame,
    fps,
    config: { damping: 10, mass: 0.8 },
  });

  const titleSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 15 },
  });

  const subOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [40, 50], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const DOT_COUNT = 10;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      {/* Flame circle */}
      <div
        style={{
          width: isVertical ? 80 : 100,
          height: isVertical ? 80 : 100,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${AMBER}, #d97706)`,
          transform: `scale(${flameScale})`,
          boxShadow: `0 0 40px ${AMBER}80`,
          marginBottom: 24,
        }}
      />

      {/* Day text */}
      <h1
        style={{
          fontSize: isVertical ? 64 : 80,
          fontWeight: "bold",
          color: "#ffffff",
          margin: 0,
          transform: `translateY(${(1 - titleSpring) * 40}px)`,
          opacity: titleSpring,
        }}
      >
        Day 1
      </h1>

      {/* Motivational */}
      <p
        style={{
          fontSize: isVertical ? 24 : 30,
          color: MUTED,
          margin: 0,
          marginTop: 16,
          opacity: subOpacity,
        }}
      >
        The hardest step is done.
      </p>

      {/* Streak counter bar */}
      <div
        style={{
          position: "absolute",
          bottom: isVertical ? 80 : 60,
          display: "flex",
          gap: 8,
          justifyContent: "center",
          opacity: subOpacity,
        }}
      >
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: i === 0 ? AMBER : "#333333",
              transition: "background-color 0.3s",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Scene 2: Day 7 ---------- */

const Scene2: React.FC<{ fps: number; isVertical: boolean }> = ({ fps, isVertical }) => {
  const frame = useCurrentFrame();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 14 },
  });

  const titleSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 15 },
  });

  const fadeOut = interpolate(frame, [50, 60], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        transform: `translateX(${(1 - slideIn) * 100}px)`,
        opacity: fadeOut,
      }}
    >
      {/* 7 circles filling one by one */}
      <div
        style={{
          display: "flex",
          gap: isVertical ? 12 : 16,
          marginBottom: 32,
        }}
      >
        {Array.from({ length: 7 }).map((_, i) => {
          const fillProgress = interpolate(frame, [5 + i * 4, 10 + i * 4], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                width: isVertical ? 32 : 40,
                height: isVertical ? 32 : 40,
                borderRadius: "50%",
                border: `2px solid ${AMBER}`,
                backgroundColor: interpolateColor(fillProgress, AMBER),
                boxShadow: fillProgress > 0.5 ? `0 0 12px ${AMBER}60` : "none",
                transform: `scale(${0.8 + fillProgress * 0.2})`,
              }}
            />
          );
        })}
      </div>

      {/* Day text */}
      <h1
        style={{
          fontSize: isVertical ? 64 : 80,
          fontWeight: "bold",
          color: "#ffffff",
          margin: 0,
          transform: `translateY(${(1 - titleSpring) * 30}px)`,
          opacity: titleSpring,
        }}
      >
        Day 7
      </h1>

      {/* Motivational */}
      <p
        style={{
          fontSize: isVertical ? 24 : 30,
          color: MUTED,
          margin: 0,
          marginTop: 16,
          opacity: titleSpring,
        }}
      >
        One week strong! 💪
      </p>
    </AbsoluteFill>
  );
};

/* ---------- Scene 3: Day 30 ---------- */

const Scene3: React.FC<{ fps: number; isVertical: boolean }> = ({ fps, isVertical }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15 },
  });

  const fadeOut = interpolate(frame, [60, 70], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const COLS = 6;
  const ROWS = 5;
  const dotSize = isVertical ? 14 : 18;
  const dotGap = isVertical ? 6 : 8;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      {/* 5x6 grid of circles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, ${dotSize}px)`,
          gap: dotGap,
          marginBottom: 32,
          opacity: fadeIn,
        }}
      >
        {Array.from({ length: ROWS * COLS }).map((_, i) => {
          const delay = i * 0.8;
          const fillProgress = interpolate(frame, [2 + delay, 6 + delay], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: "50%",
                backgroundColor: interpolateColor(fillProgress, AMBER),
                boxShadow: fillProgress > 0.5 ? `0 0 6px ${AMBER}40` : "none",
              }}
            />
          );
        })}
      </div>

      {/* Day text */}
      <h1
        style={{
          fontSize: isVertical ? 64 : 80,
          fontWeight: "bold",
          color: "#ffffff",
          margin: 0,
          transform: `translateY(${(1 - titleSpring) * 30}px)`,
          opacity: titleSpring,
        }}
      >
        Day 30
      </h1>

      {/* Motivational */}
      <p
        style={{
          fontSize: isVertical ? 24 : 30,
          color: MUTED,
          margin: 0,
          marginTop: 16,
          opacity: titleSpring,
        }}
      >
        A whole month! Unstoppable! 🎉
      </p>
    </AbsoluteFill>
  );
};

/* ---------- Scene 4: Day 100 ---------- */

const Scene4: React.FC<{ fps: number; isVertical: boolean }> = ({ fps, isVertical }) => {
  const frame = useCurrentFrame();

  const numberScale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 1.2 },
  });

  const glowPulse = interpolate(frame, [0, 30, 60], [0.4, 1, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [50, 60], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Particle positions (pseudo-random, deterministic)
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    x: ((i * 137.5) % 360) - 180,
    y: ((i * 97.3) % 300) - 150,
    size: 3 + (i % 4) * 2,
    delay: i * 2,
  }));

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      {/* Radiant glow behind number */}
      <div
        style={{
          position: "absolute",
          width: isVertical ? 300 : 400,
          height: isVertical ? 300 : 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${AMBER}${Math.round(glowPulse * 40).toString(16).padStart(2, "0")}, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      {/* Particles */}
      {particles.map((p, i) => {
        const particleOpacity = interpolate(
          frame,
          [p.delay, p.delay + 10, 50, 60],
          [0, 0.3 + (i % 3) * 0.2, 0.3 + (i % 3) * 0.2, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }
        );
        const drift = interpolate(frame, [0, 60], [0, -20 + (i % 5) * 8], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              borderRadius: 2,
              backgroundColor: i % 2 === 0 ? AMBER : ORANGE,
              opacity: particleOpacity,
              transform: `translate(${p.x}px, ${p.y + drift}px)`,
            }}
          />
        );
      })}

      {/* Big 100 number */}
      <h1
        style={{
          fontSize: isVertical ? 120 : 160,
          fontWeight: "bold",
          margin: 0,
          background: `linear-gradient(135deg, ${AMBER}, ${ORANGE})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          transform: `scale(${numberScale})`,
          letterSpacing: -4,
        }}
      >
        100
      </h1>

      {/* Motivational */}
      <p
        style={{
          fontSize: isVertical ? 26 : 34,
          color: "#ffffff",
          margin: 0,
          marginTop: 16,
          fontWeight: "bold",
          opacity: subtitleOpacity,
        }}
      >
        You are the 1%
      </p>
    </AbsoluteFill>
  );
};

/* ---------- Scene 5: CTA ---------- */

const Scene5: React.FC<{ fps: number; isVertical: boolean }> = ({ fps, isVertical }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headlineSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 14 },
  });

  const ctaScale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const brandingOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeIn,
      }}
    >
      {/* Headline */}
      <h1
        style={{
          fontSize: isVertical ? 44 : 56,
          fontWeight: "bold",
          color: "#ffffff",
          margin: 0,
          textAlign: "center",
          lineHeight: 1.3,
          padding: isVertical ? "0 32px" : "0 60px",
          transform: `translateY(${(1 - headlineSpring) * 40}px)`,
          opacity: headlineSpring,
        }}
      >
        Every streak starts with Day 1
      </h1>

      {/* CTA button */}
      <div
        style={{
          marginTop: 40,
          transform: `scale(${ctaScale})`,
          opacity: ctaScale,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: isVertical ? "14px 40px" : "18px 56px",
            background: `linear-gradient(135deg, ${AMBER}, ${ORANGE})`,
            borderRadius: 14,
            fontSize: isVertical ? 24 : 30,
            fontWeight: "bold",
            color: "#ffffff",
            boxShadow: `0 4px 30px ${AMBER}50`,
          }}
        >
          Start Yours Today
        </div>
      </div>

      {/* Bottom branding */}
      <div
        style={{
          position: "absolute",
          bottom: isVertical ? 80 : 50,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: isVertical ? 22 : 28,
          color: "#6b7280",
          opacity: brandingOpacity,
        }}
      >
        Journey Tracker
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Helpers ---------- */

function interpolateColor(progress: number, color: string): string {
  if (progress <= 0) return "#333333";
  if (progress >= 1) return color;
  // Simple blend from dark gray to target color
  const r1 = 0x33, g1 = 0x33, b1 = 0x33;
  const r2 = parseInt(color.slice(1, 3), 16);
  const g2 = parseInt(color.slice(3, 5), 16);
  const b2 = parseInt(color.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * progress);
  const g = Math.round(g1 + (g2 - g1) * progress);
  const b = Math.round(b1 + (b2 - b1) * progress);
  return `rgb(${r}, ${g}, ${b})`;
}
