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

interface StreakRushProps {
  format: VideoFormat;
}

const MUTED = "#94a3b8";
const BG = "#0a0a0a";

/* ---------- Helpers ---------- */

/**
 * Deterministic pseudo-random from seed (0-1 range).
 * Uses a simple hash so particles are consistent across frames.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Piecewise counter: maps frame (0-390) to day (1-100).
 * Uses multiple clamped interpolate calls stitched together.
 */
function getDayAtFrame(frame: number): number {
  // Clamp frame to 0-390 range for the counter portion
  const f = Math.max(0, Math.min(frame, 390));

  // Segment 1: frames 0-40 → days 1-7
  if (f <= 40) {
    return interpolate(f, [0, 40], [1, 7], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  // Pause at day 7: frames 40-55
  if (f <= 55) {
    return 7;
  }
  // Segment 2: frames 55-95 → days 7-14
  if (f <= 95) {
    return interpolate(f, [55, 95], [7, 14], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  // Pause at day 14: frames 95-110
  if (f <= 110) {
    return 14;
  }
  // Segment 3: frames 110-160 → days 14-30
  if (f <= 160) {
    return interpolate(f, [110, 160], [14, 30], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  // Pause at day 30: frames 160-185
  if (f <= 185) {
    return 30;
  }
  // Segment 4: frames 185-260 → days 30-60
  if (f <= 260) {
    return interpolate(f, [185, 260], [30, 60], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  // Pause at day 60: frames 260-275
  if (f <= 275) {
    return 60;
  }
  // Segment 5: frames 275-370 → days 60-97
  if (f <= 370) {
    return interpolate(f, [275, 370], [60, 97], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  // Segment 6: frames 370-390 → days 97-100 (dramatic slowdown)
  return interpolate(f, [370, 390], [97, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/**
 * Ring color: transitions through gray → blue → purple → orange → gold
 * based on the current day value (0-100).
 */
function getRingColor(day: number): string {
  // Hex colors and their RGB values:
  // gray #6b7280: 107, 114, 128
  // blue #3b82f6: 59, 130, 246
  // purple #8b5cf6: 139, 92, 246
  // orange #f59e0b: 245, 158, 11
  // gold #fbbf24: 251, 191, 36
  const d = Math.max(0, Math.min(day, 100));

  let r: number, g: number, b: number;

  if (d <= 25) {
    r = interpolate(d, [0, 25], [107, 59], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    g = interpolate(d, [0, 25], [114, 130], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    b = interpolate(d, [0, 25], [128, 246], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else if (d <= 50) {
    r = interpolate(d, [25, 50], [59, 139], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    g = interpolate(d, [25, 50], [130, 92], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    b = interpolate(d, [25, 50], [246, 246], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else if (d <= 75) {
    r = interpolate(d, [50, 75], [139, 245], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    g = interpolate(d, [50, 75], [92, 158], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    b = interpolate(d, [50, 75], [246, 11], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else {
    r = interpolate(d, [75, 100], [245, 251], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    g = interpolate(d, [75, 100], [158, 191], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    b = interpolate(d, [75, 100], [11, 36], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  }

  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/* ---------- Particle types ---------- */

interface ParticleConfig {
  angle: number;
  speed: number;
  size: number;
  color: string;
  lifetime: number;
}

const PARTICLE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#fbbf24", "#ef4444", "#10b981"];

function createParticles(count: number, seed: number): ParticleConfig[] {
  return Array.from({ length: count }).map((_, i) => {
    const r = seededRandom(seed + i);
    const r2 = seededRandom(seed + i + 1000);
    const r3 = seededRandom(seed + i + 2000);
    return {
      angle: (i / count) * Math.PI * 2 + (r - 0.5) * 0.3,
      speed: 80 + r2 * 60,
      size: 6 + r3 * 6,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      lifetime: 20 + Math.round(r * 10),
    };
  });
}

/* ---------- Milestone definitions ---------- */

interface Milestone {
  day: number;
  triggerFrame: number;
  holdFrames: number;
  label: string;
  particleCount: number;
  pulseScale: number;
  seed: number;
  hasGlow?: boolean;
  hasConfetti?: boolean;
}

const MILESTONES: Milestone[] = [
  { day: 7, triggerFrame: 40, holdFrames: 15, label: "\u{1F31F} First Week!", particleCount: 10, pulseScale: 1.15, seed: 7 },
  { day: 14, triggerFrame: 95, holdFrames: 15, label: "\u26A1 Two Weeks!", particleCount: 18, pulseScale: 1.2, seed: 14 },
  { day: 30, triggerFrame: 160, holdFrames: 25, label: "\u{1F525} ONE MONTH!", particleCount: 35, pulseScale: 1.25, seed: 30, hasGlow: true, hasConfetti: true },
  { day: 60, triggerFrame: 260, holdFrames: 15, label: "\u{1F4AA} 60 DAYS!", particleCount: 25, pulseScale: 1.2, seed: 60, hasGlow: true },
];

/* ---------- Main Component ---------- */

export const StreakRush: React.FC<StreakRushProps> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const day = getDayAtFrame(frame);
  const dayInt = Math.round(day);
  const progress = day / 100;

  // Ring geometry
  const ringRadius = sz(300) / 2;
  const ringStroke = 12;
  const circumference = 2 * Math.PI * ringRadius;
  const dashOffset = circumference * (1 - progress);
  const ringColor = getRingColor(day);

  // Is the final CTA phase active? (frames 390-450)
  const isCTA = frame >= 390;
  const isDay100 = dayInt >= 100 && frame >= 370;

  // White flash at day 100 (frame ~388-393)
  const flashOpacity = (() => {
    if (frame < 388) return 0;
    if (frame <= 390) {
      return interpolate(frame, [388, 390], [0, 0.9], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
    return interpolate(frame, [390, 395], [0.9, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  })();

  // CTA transition: counter scales down and moves up
  const ctaProgress = isCTA
    ? interpolate(frame, [390, 420], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const counterScale = isCTA
    ? interpolate(ctaProgress, [0, 1], [1, 0.6], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  const counterY = isCTA
    ? interpolate(ctaProgress, [0, 1], [0, isVertical ? -120 : -100], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Day 100 counter scale-up effect
  const day100Scale = isDay100 && !isCTA
    ? spring({
        frame: frame - 388,
        fps,
        config: { damping: 10, mass: 1.2 },
      })
    : 0;

  // Background
  const bgGradient = (() => {
    if (isDay100) {
      const bgTransition = interpolate(frame, [388, 420], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return `radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, ${0.15 + bgTransition * 0.2}), rgba(251, 191, 36, ${bgTransition * 0.1}), ${BG} 80%)`;
    }
    const baseGlow = interpolate(frame, [0, 200, 390], [0.05, 0.12, 0.2], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return `radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, ${baseGlow}), transparent 70%)`;
  })();

  // Milestone pulse for the ring
  const ringPulseScale = (() => {
    let scale = 1;
    for (const m of MILESTONES) {
      const start = m.triggerFrame;
      const end = start + m.holdFrames;
      if (frame >= start && frame <= end) {
        const pulseSpring = spring({
          frame: frame - start,
          fps,
          config: { damping: 8, mass: 0.6 },
        });
        scale = 1 + (m.pulseScale - 1) * pulseSpring;
      }
    }
    // Day 100 pulse
    if (isDay100) {
      const pulseSpring = spring({
        frame: frame - 388,
        fps,
        config: { damping: 8, mass: 0.8 },
      });
      scale = Math.max(scale, 1 + 0.3 * pulseSpring);
    }
    return scale;
  })();

  // Ring glow for milestones 30+ and day 60
  const ringGlow = (() => {
    if (frame >= 260 && frame < 390) {
      const pulse = interpolate(
        frame % 30,
        [0, 15, 29],
        [0.3, 0.7, 0.3],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );
      return pulse;
    }
    if (isDay100) return 1;
    return 0;
  })();

  // Typewriter text for CTA
  // 30ms per char at 30fps ≈ 1 char per frame
  const ctaText = "This could be you in 100 days.";
  const typewriterChars = isCTA
    ? Math.min(ctaText.length, Math.max(0, frame - 405))
    : 0;

  const brandOpacity = isCTA
    ? interpolate(frame, [425, 440], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const subCtaOpacity = isCTA
    ? interpolate(frame, [435, 448], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // "UNSTOPPABLE" text for day 100
  const unstoppableSpring = isDay100
    ? spring({
        frame: frame - 393,
        fps,
        config: { damping: 12, mass: 0.8 },
      })
    : 0;

  // Day 100 ring golden stroke
  const goldenRingOpacity = isDay100
    ? interpolate(frame, [388, 395], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        fontFamily: "Arial, sans-serif",
        justifyContent: "center",
        alignItems: "center",
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
          background: bgGradient,
        }}
      />

      {/* Counter + Ring group */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${counterY}px) scale(${counterScale * (1 + day100Scale * 0.15)})`,
          position: "relative",
        }}
      >
        {/* Progress ring */}
        <div
          style={{
            position: "relative",
            width: sz(300),
            height: sz(300),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${ringPulseScale})`,
          }}
        >
          {/* Ring glow effect */}
          {ringGlow > 0 && (
            <svg
              width={sz(300)}
              height={sz(300)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                filter: `blur(8px)`,
                opacity: ringGlow * 0.5,
              }}
            >
              <circle
                cx={sz(300) / 2}
                cy={sz(300) / 2}
                r={ringRadius - ringStroke / 2}
                fill="none"
                stroke={ringColor}
                strokeWidth={ringStroke + 4}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${sz(300) / 2} ${sz(300) / 2})`}
              />
            </svg>
          )}

          {/* Main ring SVG */}
          <svg
            width={sz(300)}
            height={sz(300)}
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            {/* Background ring track */}
            <circle
              cx={sz(300) / 2}
              cy={sz(300) / 2}
              r={ringRadius - ringStroke / 2}
              fill="none"
              stroke="#1f2937"
              strokeWidth={ringStroke}
            />
            {/* Progress ring */}
            <circle
              cx={sz(300) / 2}
              cy={sz(300) / 2}
              r={ringRadius - ringStroke / 2}
              fill="none"
              stroke={goldenRingOpacity > 0 ? `rgb(251, 191, 36)` : ringColor}
              strokeWidth={ringStroke}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${sz(300) / 2} ${sz(300) / 2})`}
              style={{
                opacity: goldenRingOpacity > 0 ? goldenRingOpacity : 1,
              }}
            />
            {/* Original color ring underneath golden one */}
            {goldenRingOpacity > 0 && goldenRingOpacity < 1 && (
              <circle
                cx={sz(300) / 2}
                cy={sz(300) / 2}
                r={ringRadius - ringStroke / 2}
                fill="none"
                stroke={ringColor}
                strokeWidth={ringStroke}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${sz(300) / 2} ${sz(300) / 2})`}
                style={{ opacity: 1 - goldenRingOpacity }}
              />
            )}
          </svg>

          {/* Counter number */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: sz(160),
                fontWeight: "bold",
                color: "#ffffff",
                lineHeight: 1,
                letterSpacing: -3,
              }}
            >
              {dayInt}
            </div>
            <div
              style={{
                fontSize: sz(24),
                color: MUTED,
                marginTop: 4,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              day streak
            </div>
          </div>
        </div>
      </div>

      {/* Milestone effects layer */}
      {MILESTONES.map((milestone) => (
        <MilestoneEffect
          key={milestone.day}
          milestone={milestone}
          frame={frame}
          fps={fps}
          sz={sz}
          isVertical={isVertical}
        />
      ))}

      {/* Day 100 mega particles */}
      {isDay100 && (
        <Day100Particles frame={frame} fps={fps} sz={sz} />
      )}

      {/* "UNSTOPPABLE" text for day 100 */}
      {isDay100 && frame < 420 && (
        <div
          style={{
            position: "absolute",
            top: isVertical ? "22%" : "18%",
            left: 0,
            right: 0,
            textAlign: "center",
            transform: `translateY(${(1 - unstoppableSpring) * 60}px)`,
            opacity: unstoppableSpring,
          }}
        >
          <span
            style={{
              fontSize: sz(48),
              fontWeight: "bold",
              color: "#fbbf24",
              letterSpacing: 4,
            }}
          >
            {"\u{1F451}"} UNSTOPPABLE
          </span>
        </div>
      )}

      {/* White flash */}
      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#ffffff",
            opacity: flashOpacity,
            zIndex: 10,
          }}
        />
      )}

      {/* CTA section (frames 390-450) */}
      {isCTA && (
        <Sequence from={0} durationInFrames={60}>
          <div
            style={{
              position: "absolute",
              bottom: isVertical ? "18%" : "15%",
              left: 0,
              right: 0,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* Typewriter text */}
            <div
              style={{
                fontSize: sz(32),
                color: "#ffffff",
                fontWeight: "bold",
                minHeight: sz(40),
              }}
            >
              {ctaText.slice(0, typewriterChars)}
              {typewriterChars < ctaText.length && typewriterChars > 0 && (
                <span style={{ opacity: frame % 10 < 5 ? 1 : 0 }}>|</span>
              )}
            </div>

            {/* Journey Tracker wordmark */}
            <div
              style={{
                fontSize: sz(28),
                color: "#6b7280",
                opacity: brandOpacity,
                letterSpacing: 1,
              }}
            >
              Journey Tracker
            </div>

            {/* Sub-CTA */}
            <div
              style={{
                fontSize: sz(18),
                color: MUTED,
                opacity: subCtaOpacity,
              }}
            >
              Start your streak today
            </div>
          </div>
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

/* ---------- Milestone Effect Component ---------- */

const MilestoneEffect: React.FC<{
  milestone: Milestone;
  frame: number;
  fps: number;
  sz: (base: number) => number;
  isVertical: boolean;
}> = ({ milestone, frame, fps, sz, isVertical }) => {
  const { triggerFrame, holdFrames, label, particleCount, seed, hasGlow, hasConfetti } = milestone;
  const effectEnd = triggerFrame + holdFrames + 20; // extra frames for particle fadeout
  const isActive = frame >= triggerFrame && frame <= effectEnd;

  if (!isActive) return null;

  const localFrame = frame - triggerFrame;
  const particles = createParticles(particleCount, seed);

  // Badge fade
  const badgeOpacity = (() => {
    if (localFrame <= holdFrames) {
      return interpolate(localFrame, [0, 5], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
    return interpolate(localFrame, [holdFrames, holdFrames + 10], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  })();

  // Is this the Day 30 milestone with glow text?
  const isDay30 = milestone.day === 30;

  return (
    <>
      {/* Badge label */}
      <div
        style={{
          position: "absolute",
          top: isVertical ? "20%" : "16%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: badgeOpacity,
          zIndex: 5,
        }}
      >
        {/* Glow duplicate for Day 30 */}
        {isDay30 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              fontSize: sz(40),
              fontWeight: "bold",
              color: "#f59e0b",
              filter: "blur(8px)",
              opacity: 0.5,
              transform: "scale(1.05)",
            }}
          >
            {label}
          </div>
        )}
        <span
          style={{
            fontSize: isDay30 ? sz(40) : sz(28),
            fontWeight: "bold",
            color: isDay30 ? "#f59e0b" : "#ffffff",
            position: "relative",
          }}
        >
          {label}
        </span>
      </div>

      {/* Particles */}
      {particles.map((p, i) => {
        const particleProgress = Math.min(1, localFrame / p.lifetime);
        const x = Math.cos(p.angle) * p.speed * particleProgress;
        const y = Math.sin(p.angle) * p.speed * particleProgress + particleProgress * particleProgress * 30;
        const opacity = 1 - particleProgress;

        if (opacity <= 0) return null;

        return (
          <div
            key={`m${milestone.day}-p${i}`}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: p.color,
              opacity,
              transform: `translate(${x - p.size / 2}px, ${y - p.size / 2}px)`,
              zIndex: 4,
            }}
          />
        );
      })}

      {/* Confetti for Day 30 */}
      {hasConfetti &&
        Array.from({ length: 7 }).map((_, i) => {
          const confettiProgress = Math.min(1, localFrame / 30);
          const cx = seededRandom(seed + i + 5000) * sz(400) - sz(200);
          const cy = confettiProgress * 200 - 80;
          const rotation = seededRandom(seed + i + 6000) * 360 + localFrame * 8;
          const confettiOpacity = 1 - confettiProgress;
          const confettiColor = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
          const confettiWidth = 5 + seededRandom(seed + i + 7000) * 4;
          const confettiHeight = 7 + seededRandom(seed + i + 8000) * 4;

          if (confettiOpacity <= 0) return null;

          return (
            <div
              key={`confetti-${i}`}
              style={{
                position: "absolute",
                left: "50%",
                top: "40%",
                width: confettiWidth,
                height: confettiHeight,
                backgroundColor: confettiColor,
                borderRadius: 1,
                opacity: confettiOpacity,
                transform: `translate(${cx}px, ${cy}px) rotate(${rotation}deg)`,
                zIndex: 4,
              }}
            />
          );
        })}
    </>
  );
};

/* ---------- Day 100 Mega Particles ---------- */

const Day100Particles: React.FC<{
  frame: number;
  fps: number;
  sz: (base: number) => number;
}> = ({ frame }) => {
  const localFrame = frame - 388;
  if (localFrame < 0) return null;

  const particles = createParticles(50, 100);

  return (
    <>
      {particles.map((p, i) => {
        const particleProgress = Math.min(1, localFrame / (p.lifetime + 10));
        const x = Math.cos(p.angle) * (p.speed + 40) * particleProgress;
        const y =
          Math.sin(p.angle) * (p.speed + 40) * particleProgress +
          particleProgress * particleProgress * 40;
        const opacity = 1 - particleProgress;

        if (opacity <= 0) return null;

        return (
          <div
            key={`d100-p${i}`}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: p.size,
              height: p.size,
              borderRadius: i % 3 === 0 ? "50%" : 2,
              backgroundColor: p.color,
              opacity,
              transform: `translate(${x - p.size / 2}px, ${y - p.size / 2}px)`,
              zIndex: 4,
            }}
          />
        );
      })}
    </>
  );
};
