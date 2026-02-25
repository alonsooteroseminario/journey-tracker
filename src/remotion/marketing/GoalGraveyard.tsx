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

interface GoalGraveyardProps {
  format: VideoFormat;
}

/* ── Tombstone data ── */
const TOMBSTONES = [
  { emoji: "\u{1F3CB}\u{FE0F}", text: "Get fit" },
  { emoji: "\u{1F4DA}", text: "Learn Spanish" },
  { emoji: "\u{1F4B0}", text: "Save $10,000" },
  { emoji: "\u{1F3B8}", text: "Learn guitar" },
  { emoji: "\u{1F680}", text: "Launch my startup" },
];

/* ── Tombstone placement angles ── */
const TOMBSTONE_ANGLES = [-2.5, 1.8, -1.2, 3, -2];

/* ── Task items for the alive card ── */
const TASKS = [
  { icon: "\u2705", text: "Research competitors", done: true },
  { icon: "\u2705", text: "Design landing page", done: true },
  { icon: "\u{1F535}", text: "Build MVP", done: false, badge: "In Progress" },
  { icon: "\u2B55", text: "Launch on Product Hunt", done: false },
];

/* ── Crack path data for SVG ── */
const CRACK_PATHS = [
  "M 0,0 L -180,-220 L -200,-350",
  "M 0,0 L 200,-180 L 280,-320",
  "M 0,0 L -50,250 L -120,380",
  "M 0,0 L 170,200 L 250,340",
];

export const GoalGraveyard: React.FC<GoalGraveyardProps> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  /* ═══════════════════════════════════════════════
   * SCENE 1: The Graveyard (frames 0-120, 0s-4s)
   * ═══════════════════════════════════════════════ */

  // Fog drift animation — slow upward movement
  const fogOffset = interpolate(frame, [0, 360], [0, -60], {
    extrapolateRight: "clamp",
  });

  // "Sound familiar?" fade
  const soundFamiliarFade = interpolate(frame, [90, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* ═══════════════════════════════════════════════
   * SCENE 2: Breaking Point (frames 120-165, 4s-5.5s)
   * ═══════════════════════════════════════════════ */

  // Crack line draw progress (120-145)
  const crackProgress = interpolate(frame, [120, 145], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Flash to white (frames 140-147, ~230ms)
  const flashOpacity =
    frame <= 143
      ? interpolate(frame, [140, 143], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : interpolate(frame, [143, 147], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  /* ═══════════════════════════════════════════════
   * SCENE 3: Resurrection (frames 165-300, 5.5s-10s)
   * ═══════════════════════════════════════════════ */

  // Warm background gradient fade-in
  const scene3BgFade = interpolate(frame, [165, 185], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Alive card rises from bottom
  const cardRise = spring({
    frame: Math.max(0, frame - 175),
    fps,
    config: { damping: 14, mass: 1.2 },
  });

  // Progress bar fill (0% to 50%)
  const progressFill = interpolate(frame, [220, 265], [0, 50], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Streak pulse
  const streakPulse = spring({
    frame: Math.max(0, frame - 260),
    fps,
    config: { damping: 8, mass: 0.6 },
  });

  /* ═══════════════════════════════════════════════
   * SCENE 4: CTA (frames 300-360, 10s-12s)
   * ═══════════════════════════════════════════════ */

  // Card scales down + moves up
  const cardScaleDown = interpolate(frame, [300, 315], [1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardMoveUp = interpolate(frame, [300, 315], [0, -60], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Typewriter CTA text
  const ctaText = "Your goals deserve more than a graveyard.";
  const charsVisible = Math.floor(
    interpolate(frame, [315, 315 + ctaText.length * 1.2], [0, ctaText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Logo/branding fade
  const brandFade = interpolate(frame, [345, 358], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ── SCENE 1: The Graveyard ── */}
      <Sequence from={0} durationInFrames={165}>
        <AbsoluteFill>
          {/* Dark fog/gradient background */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: [
                `radial-gradient(ellipse at 30% ${60 + fogOffset * 0.3}%, rgba(88, 28, 135, 0.12), transparent 55%)`,
                `radial-gradient(ellipse at 70% ${50 + fogOffset * 0.5}%, rgba(59, 7, 100, 0.1), transparent 50%)`,
                `radial-gradient(ellipse at 50% ${80 + fogOffset * 0.4}%, rgba(107, 33, 168, 0.08), transparent 45%)`,
              ].join(", "),
            }}
          />

          {/* Tombstones container */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "flex-end",
                gap: sz(20),
                maxWidth: isVertical ? "92%" : "80%",
                padding: sz(20),
              }}
            >
              {TOMBSTONES.map((tomb, i) => {
                // Each tombstone drops in staggered
                const dropDelay = 10 + i * 18;
                const dropSpring = spring({
                  frame: Math.max(0, frame - dropDelay),
                  fps,
                  config: { damping: 8, stiffness: 180, mass: 1 },
                });

                // Strikethrough line animates after tombstone lands
                const strikeDelay = dropDelay + 20;
                const strikeProgress = interpolate(
                  frame,
                  [strikeDelay, strikeDelay + 12],
                  [0, 100],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );

                // Shatter during scene 2 (frame 120+)
                const shatterScale = spring({
                  frame: Math.max(0, frame - 125 - i * 2),
                  fps,
                  config: { damping: 8, stiffness: 200 },
                });
                const shatterOut = frame >= 120 ? 1 - shatterScale : 1;

                return (
                  <div
                    key={i}
                    style={{
                      width: sz(200),
                      minHeight: sz(120),
                      backgroundColor: "#e5e7eb",
                      borderRadius: `${sz(100)}px ${sz(100)}px ${sz(8)}px ${sz(8)}px`,
                      padding: `${sz(28)}px ${sz(16)}px ${sz(16)}px`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: sz(6),
                      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                      transform: [
                        `translateY(${(1 - dropSpring) * 400}px)`,
                        `rotate(${TOMBSTONE_ANGLES[i]}deg)`,
                        `scale(${shatterOut})`,
                      ].join(" "),
                      opacity: dropSpring * shatterOut,
                    }}
                  >
                    <span style={{ fontSize: sz(28) }}>{tomb.emoji}</span>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <span
                        style={{
                          fontSize: sz(16),
                          fontWeight: 600,
                          color: "#374151",
                          fontStyle: "italic",
                          letterSpacing: -0.3,
                        }}
                      >
                        {tomb.text}
                      </span>
                      {/* Red strikethrough line */}
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: 0,
                          height: 2.5,
                          width: `${strikeProgress}%`,
                          backgroundColor: "#ef4444",
                          transform: "translateY(-50%)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* "Sound familiar?" */}
          <div
            style={{
              position: "absolute",
              bottom: isVertical ? 100 : 60,
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: sz(24),
              color: "#6b7280",
              opacity: soundFamiliarFade * (frame < 120 ? 1 : 0),
              fontStyle: "italic",
            }}
          >
            Sound familiar?
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── SCENE 2: Crack overlay (on top of scene 1) ── */}
      {frame >= 120 && frame < 165 && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="-500 -400 1000 800"
            style={{ position: "absolute" }}
          >
            {CRACK_PATHS.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth={3}
                strokeDasharray={600}
                strokeDashoffset={600 - 600 * crackProgress}
                strokeLinecap="round"
              />
            ))}
          </svg>
        </AbsoluteFill>
      )}

      {/* White flash */}
      {frame >= 138 && frame <= 148 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#ffffff",
            opacity: flashOpacity,
          }}
        />
      )}

      {/* ── SCENE 3: Resurrection (frames 165-360) ── */}
      <Sequence from={165} durationInFrames={195}>
        <AbsoluteFill>
          {/* Warm gradient background */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(160deg, #1e1b4b 0%, #3b0764 35%, #1e3a5f 70%, #0c1445 100%)",
              opacity: scene3BgFade,
            }}
          />
          {/* Subtle glow orbs */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: [
                "radial-gradient(ellipse at 35% 30%, rgba(99, 102, 241, 0.2), transparent 50%)",
                "radial-gradient(ellipse at 65% 70%, rgba(139, 92, 246, 0.15), transparent 50%)",
              ].join(", "),
              opacity: scene3BgFade,
            }}
          />

          {/* Alive goal card */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: frame >= 300 ? "flex-start" : "center",
              paddingTop: frame >= 300 ? (isVertical ? "15%" : "8%") : 0,
            }}
          >
            <div
              style={{
                width: isVertical ? "88%" : sz(560),
                backgroundColor: "#ffffff",
                borderRadius: sz(20),
                padding: sz(28),
                boxShadow: "0 8px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(99,102,241,0.2)",
                transform: [
                  `translateY(${(1 - cardRise) * 500 + (frame >= 300 ? cardMoveUp : 0)}px)`,
                  `scale(${frame >= 300 ? cardScaleDown : 1})`,
                ].join(" "),
                opacity: cardRise,
                position: "relative",
              }}
            >
              {/* Streak counter top-right */}
              <div
                style={{
                  position: "absolute",
                  top: sz(16),
                  right: sz(20),
                  fontSize: sz(16),
                  fontWeight: 700,
                  color: "#f59e0b",
                  transform: `scale(${streakPulse * 0.15 + 1})`,
                  opacity: streakPulse,
                }}
              >
                {"\u{1F525}"} 23 days
              </div>

              {/* Goal title */}
              <div
                style={{
                  fontSize: sz(24),
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: sz(20),
                }}
              >
                {"\u{1F680}"} Launch my startup
              </div>

              {/* Task items */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: sz(10),
                  marginBottom: sz(20),
                }}
              >
                {TASKS.map((task, i) => {
                  const taskDelay = 200 + i * 6;
                  const taskSpring = spring({
                    frame: Math.max(0, frame - 165 - taskDelay + 165),
                    fps,
                    config: { damping: 14 },
                  });
                  // Recalculate: task appears at global frame (165 + offset)
                  // stagger 200ms = 6 frames apart, starting ~frame 200
                  const taskAppear = spring({
                    frame: Math.max(0, frame - (200 + i * 6)),
                    fps,
                    config: { damping: 14 },
                  });

                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: sz(10),
                        fontSize: sz(15),
                        color: task.done ? "#6b7280" : "#111827",
                        textDecoration: task.done ? "line-through" : "none",
                        transform: `translateX(${(1 - taskAppear) * 40}px)`,
                        opacity: taskAppear,
                      }}
                    >
                      <span style={{ fontSize: sz(14), flexShrink: 0 }}>
                        {task.icon}
                      </span>
                      <span style={{ flex: 1 }}>{task.text}</span>
                      {task.badge && (
                        <span
                          style={{
                            fontSize: sz(11),
                            fontWeight: 600,
                            color: "#3b82f6",
                            backgroundColor: "#eff6ff",
                            padding: `${sz(2)}px ${sz(8)}px`,
                            borderRadius: sz(6),
                          }}
                        >
                          {task.badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div
                style={{
                  width: "100%",
                  height: sz(10),
                  backgroundColor: "#e5e7eb",
                  borderRadius: sz(5),
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressFill}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                    borderRadius: sz(5),
                    transition: "none",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: sz(12),
                  color: "#9ca3af",
                  marginTop: sz(6),
                  textAlign: "right",
                }}
              >
                {Math.round(progressFill)}% complete
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── SCENE 4: CTA (frames 300-360) ── */}
      <Sequence from={300} durationInFrames={60}>
        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: isVertical ? "25%" : "12%",
          }}
        >
          {/* Typewriter CTA */}
          <div
            style={{
              fontSize: sz(30),
              fontWeight: 700,
              color: "#ffffff",
              textAlign: "center",
              maxWidth: isVertical ? "85%" : "70%",
              lineHeight: 1.3,
              minHeight: sz(40),
            }}
          >
            {ctaText.slice(0, charsVisible)}
            {charsVisible < ctaText.length && (
              <span
                style={{
                  opacity: frame % 10 < 5 ? 1 : 0,
                  color: "#8b5cf6",
                }}
              >
                |
              </span>
            )}
          </div>

          {/* Logo / wordmark */}
          <div
            style={{
              marginTop: sz(24),
              opacity: brandFade,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: sz(8),
            }}
          >
            <div
              style={{
                fontSize: sz(36),
                fontWeight: 800,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Journey Tracker
            </div>
            <div
              style={{
                fontSize: sz(16),
                color: "#6b7280",
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
