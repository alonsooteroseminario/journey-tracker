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

interface UserJourneyProps {
  format: VideoFormat;
}

export const UserJourney: React.FC<UserJourneyProps> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isVertical = format === "vertical";

  // ── Scene 1: Meet Alex (0-50) ──────────────────────────────────────

  const avatarScale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const nameSlide = spring({
    frame: frame - 8,
    fps,
    config: { damping: 15 },
  });

  const taglineOpacity = interpolate(frame, [18, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Scene 2: Dashboard (50-110) ────────────────────────────────────

  const avatarShrink = interpolate(frame, [50, 70], [1, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const avatarMoveX = interpolate(
    frame,
    [50, 70],
    [0, isVertical ? -120 : -260],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const avatarMoveY = interpolate(
    frame,
    [50, 70],
    [0, isVertical ? -280 : -200],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const dashboardOpacity = interpolate(frame, [60, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dashboardScale = spring({
    frame: Math.max(0, frame - 60),
    fps,
    config: { damping: 14 },
  });

  const plusButtonScale = spring({
    frame: Math.max(0, frame - 85),
    fps,
    config: { damping: 10, mass: 0.6 },
  });

  const freshStartOpacity = interpolate(frame, [80, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Scene 3: AI creates goal (110-170) ─────────────────────────────

  const plusPulse =
    frame >= 110 && frame <= 125
      ? 1 + 0.15 * Math.sin((frame - 110) * 0.5)
      : 1;

  const goalCardSlide = spring({
    frame: Math.max(0, frame - 120),
    fps,
    config: { damping: 14 },
  });

  const taskItems = [0, 1, 2].map((i) =>
    spring({
      frame: Math.max(0, frame - 135 - i * 6),
      fps,
      config: { damping: 13 },
    })
  );

  const aiTextOpacity = interpolate(frame, [150, 162], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Scene 4: First task completed (170-230) ────────────────────────

  const checkmarkScale = spring({
    frame: Math.max(0, frame - 175),
    fps,
    config: { damping: 8, mass: 0.5 },
  });

  const confettiPieces = [
    { x: -30, y: -40, color: "#3b82f6", delay: 0 },
    { x: 20, y: -50, color: "#8b5cf6", delay: 2 },
    { x: -50, y: -20, color: "#10b981", delay: 4 },
    { x: 40, y: -35, color: "#f59e0b", delay: 1 },
    { x: -10, y: -55, color: "#ec4899", delay: 3 },
    { x: 50, y: -15, color: "#3b82f6", delay: 5 },
  ];

  const streakBadgeScale = spring({
    frame: Math.max(0, frame - 195),
    fps,
    config: { damping: 10, mass: 0.7 },
  });

  const scene4TextOpacity = interpolate(frame, [205, 218], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Scene 5: Streak grows + friend (230-290) ──────────────────────

  const streakGrowScale = spring({
    frame: Math.max(0, frame - 235),
    fps,
    config: { damping: 12 },
  });

  const friendAvatarScale = spring({
    frame: Math.max(0, frame - 248),
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const nudgeSlide = spring({
    frame: Math.max(0, frame - 258),
    fps,
    config: { damping: 14 },
  });

  const scene5TextOpacity = interpolate(frame, [268, 280], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Scene 6: CTA (290-360) ─────────────────────────────────────────

  const scene6FadeIn = interpolate(frame, [295, 315], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaHeadlineSlide = spring({
    frame: Math.max(0, frame - 300),
    fps,
    config: { damping: 15 },
  });

  const ctaButtonScale = spring({
    frame: Math.max(0, frame - 320),
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const brandingOpacity = interpolate(frame, [330, 345], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Cross-scene fades ──────────────────────────────────────────────

  const scene1Opacity = interpolate(frame, [45, 55], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scene2Opacity = interpolate(frame, [105, 115], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scene3Opacity = interpolate(frame, [165, 175], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scene4Opacity = interpolate(frame, [225, 235], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scene5Opacity = interpolate(frame, [285, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Shared sizes ──────────────────────────────────────────────────

  const avatarSize = isVertical ? 100 : 120;
  const dashWidth = isVertical ? 300 : 420;
  const dashHeight = isVertical ? 180 : 200;

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
            "radial-gradient(ellipse at 30% 40%, rgba(59,130,246,0.12), transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(139,92,246,0.08), transparent 60%)",
        }}
      />

      {/* ── Scene 1: Meet Alex ─────────────────────────────────── */}
      <Sequence from={0} durationInFrames={60}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: scene1Opacity,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${avatarScale})`,
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontSize: isVertical ? 40 : 48,
                fontWeight: "bold",
                color: "#ffffff",
              }}
            >
              A
            </span>
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: isVertical ? 36 : 48,
              fontWeight: "bold",
              color: "#ffffff",
              transform: `translateY(${(1 - nameSlide) * 30}px)`,
              opacity: nameSlide,
              marginBottom: 12,
            }}
          >
            Meet Alex, 32
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: isVertical ? 20 : 26,
              color: "#94a3b8",
              opacity: taglineOpacity,
            }}
          >
            Has big goals. Needs a plan.
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 2: Dashboard ─────────────────────────────────── */}
      <Sequence from={50} durationInFrames={70}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: scene2Opacity,
          }}
        >
          {/* Shrinking avatar in top-left */}
          <div
            style={{
              position: "absolute",
              top: isVertical ? 60 : 40,
              left: isVertical ? 40 : 60,
              width: avatarSize,
              height: avatarSize,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${avatarShrink}) translate(${avatarMoveX}px, ${avatarMoveY}px)`,
            }}
          >
            <span
              style={{
                fontSize: isVertical ? 40 : 48,
                fontWeight: "bold",
                color: "#ffffff",
              }}
            >
              A
            </span>
          </div>

          {/* Dashboard mockup */}
          <div
            style={{
              width: dashWidth,
              height: dashHeight,
              borderRadius: 16,
              backgroundColor: "#1a1a2e",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              opacity: dashboardOpacity,
              transform: `scale(${dashboardScale})`,
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: isVertical ? 16 : 20,
                color: "#94a3b8",
                marginBottom: 16,
              }}
            >
              No goals yet
            </div>

            {/* Plus button */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                transform: `scale(${plusButtonScale})`,
                opacity: plusButtonScale,
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "#ffffff",
                  lineHeight: 1,
                }}
              >
                +
              </span>
            </div>
          </div>

          {/* Fresh start text */}
          <div
            style={{
              position: "absolute",
              bottom: isVertical ? 120 : 80,
              fontSize: isVertical ? 20 : 26,
              color: "#94a3b8",
              opacity: freshStartOpacity,
            }}
          >
            A fresh start
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 3: AI creates first goal ─────────────────────── */}
      <Sequence from={110} durationInFrames={70}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: scene3Opacity,
          }}
        >
          {/* Dashboard with goal card */}
          <div
            style={{
              width: dashWidth,
              height: dashHeight + 40,
              borderRadius: 16,
              backgroundColor: "#1a1a2e",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: 20,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Pulsing plus button (top-right) */}
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                transform: `scale(${plusPulse})`,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#ffffff",
                  lineHeight: 1,
                }}
              >
                +
              </span>
            </div>

            {/* Goal card sliding in */}
            <div
              style={{
                marginTop: 8,
                padding: isVertical ? 10 : 14,
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderLeft: "3px solid #3b82f6",
                transform: `translateX(${(1 - goalCardSlide) * 200}px)`,
                opacity: goalCardSlide,
              }}
            >
              <div
                style={{
                  fontSize: isVertical ? 14 : 18,
                  fontWeight: "bold",
                  color: "#ffffff",
                  marginBottom: 10,
                }}
              >
                Learn TypeScript
              </div>

              {/* Task items */}
              {["Basics & Setup", "Advanced Types", "Build a Project"].map(
                (task, i) => (
                  <div
                    key={task}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                      opacity: taskItems[i],
                      transform: `translateX(${(1 - taskItems[i]) * 40}px)`,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#10b981",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: isVertical ? 11 : 13,
                        color: "#94a3b8",
                      }}
                    >
                      {task}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* AI text */}
          <div
            style={{
              position: "absolute",
              bottom: isVertical ? 120 : 80,
              fontSize: isVertical ? 20 : 26,
              color: "#94a3b8",
              opacity: aiTextOpacity,
              textAlign: "center",
            }}
          >
            AI built the entire plan in seconds
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 4: First task completed ──────────────────────── */}
      <Sequence from={170} durationInFrames={70}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: scene4Opacity,
          }}
        >
          {/* Dashboard with completed task */}
          <div
            style={{
              width: dashWidth,
              height: dashHeight + 40,
              borderRadius: 16,
              backgroundColor: "#1a1a2e",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: 20,
              position: "relative",
            }}
          >
            <div
              style={{
                padding: isVertical ? 10 : 14,
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderLeft: "3px solid #3b82f6",
              }}
            >
              <div
                style={{
                  fontSize: isVertical ? 14 : 18,
                  fontWeight: "bold",
                  color: "#ffffff",
                  marginBottom: 10,
                }}
              >
                Learn TypeScript
              </div>

              {["Basics & Setup", "Advanced Types", "Build a Project"].map(
                (task, i) => (
                  <div
                    key={task}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    {i === 0 ? (
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          backgroundColor: "#10b981",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          transform: `scale(${checkmarkScale})`,
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            color: "#ffffff",
                            fontWeight: "bold",
                          }}
                        >
                          {"\u2713"}
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "#10b981",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: isVertical ? 11 : 13,
                        color: i === 0 ? "#ffffff" : "#94a3b8",
                        textDecoration: i === 0 ? "line-through" : "none",
                      }}
                    >
                      {task}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* Confetti */}
            {confettiPieces.map((piece, i) => {
              const confettiProgress = interpolate(
                frame,
                [180 + piece.delay, 195 + piece.delay],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
              const confettiFade = interpolate(
                frame,
                [195 + piece.delay, 210 + piece.delay],
                [1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: "40%",
                    left: "30%",
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: piece.color,
                    transform: `translate(${piece.x * confettiProgress}px, ${piece.y * confettiProgress}px) rotate(${confettiProgress * 180}deg)`,
                    opacity: confettiFade * confettiProgress,
                  }}
                />
              );
            })}

            {/* Streak badge */}
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                display: "flex",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(245,158,11,0.15)",
                padding: "4px 10px",
                borderRadius: 8,
                transform: `scale(${streakBadgeScale})`,
                opacity: streakBadgeScale,
              }}
            >
              <span style={{ fontSize: 16 }}>{"\uD83D\uDD25"}</span>
              <span
                style={{
                  fontSize: isVertical ? 13 : 15,
                  fontWeight: "bold",
                  color: "#f59e0b",
                }}
              >
                1
              </span>
            </div>
          </div>

          {/* Text */}
          <div
            style={{
              position: "absolute",
              bottom: isVertical ? 120 : 80,
              fontSize: isVertical ? 20 : 26,
              color: "#94a3b8",
              opacity: scene4TextOpacity,
              textAlign: "center",
            }}
          >
            First task done. Streak started.
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 5: Streak grows + friend ─────────────────────── */}
      <Sequence from={230} durationInFrames={70}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: scene5Opacity,
          }}
        >
          {/* Streak badge large */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(245,158,11,0.15)",
              padding: "10px 24px",
              borderRadius: 14,
              transform: `scale(${streakGrowScale})`,
              marginBottom: 30,
            }}
          >
            <span style={{ fontSize: isVertical ? 28 : 36 }}>
              {"\uD83D\uDD25"}
            </span>
            <span
              style={{
                fontSize: isVertical ? 30 : 40,
                fontWeight: "bold",
                color: "#f59e0b",
              }}
            >
              14
            </span>
          </div>

          {/* Avatars row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* Alex avatar */}
            <div
              style={{
                width: isVertical ? 56 : 64,
                height: isVertical ? 56 : 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: isVertical ? 24 : 28,
                  fontWeight: "bold",
                  color: "#ffffff",
                }}
              >
                A
              </span>
            </div>

            {/* Friend avatar */}
            <div
              style={{
                width: isVertical ? 48 : 56,
                height: isVertical ? 48 : 56,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                transform: `scale(${friendAvatarScale})`,
                opacity: friendAvatarScale,
              }}
            >
              <span
                style={{
                  fontSize: isVertical ? 20 : 24,
                  fontWeight: "bold",
                  color: "#ffffff",
                }}
              >
                S
              </span>
            </div>
          </div>

          {/* Nudge notification */}
          <div
            style={{
              backgroundColor: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.25)",
              padding: "8px 20px",
              borderRadius: 10,
              transform: `translateY(${(1 - nudgeSlide) * 20}px)`,
              opacity: nudgeSlide,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: isVertical ? 14 : 18,
                color: "#10b981",
              }}
            >
              Sam cheered you on!
            </span>
          </div>

          {/* Text */}
          <div
            style={{
              position: "absolute",
              bottom: isVertical ? 120 : 80,
              fontSize: isVertical ? 20 : 26,
              color: "#94a3b8",
              opacity: scene5TextOpacity,
              textAlign: "center",
            }}
          >
            Friends keep you accountable
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 6: CTA ───────────────────────────────────────── */}
      <Sequence from={290} durationInFrames={70}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: scene6FadeIn,
          }}
        >
          {/* Headline */}
          <div
            style={{
              fontSize: isVertical ? 34 : 44,
              fontWeight: "bold",
              color: "#ffffff",
              textAlign: "center",
              marginBottom: isVertical ? 30 : 40,
              transform: `translateY(${(1 - ctaHeadlineSlide) * 30}px)`,
              opacity: ctaHeadlineSlide,
            }}
          >
            Your journey starts here.
          </div>

          {/* CTA button */}
          <div
            style={{
              transform: `scale(${ctaButtonScale})`,
              opacity: ctaButtonScale,
            }}
          >
            <div
              style={{
                padding: isVertical ? "14px 36px" : "18px 48px",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                borderRadius: 14,
                fontSize: isVertical ? 20 : 26,
                fontWeight: "bold",
                color: "#ffffff",
                textAlign: "center",
              }}
            >
              Create Your First Goal
            </div>
          </div>

          {/* Branding */}
          <div
            style={{
              position: "absolute",
              bottom: isVertical ? 60 : 40,
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: isVertical ? 20 : 26,
              color: "#6b7280",
              opacity: brandingOpacity,
            }}
          >
            Journey Tracker
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
