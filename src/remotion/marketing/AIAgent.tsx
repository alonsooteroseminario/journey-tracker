import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import { VideoFormat } from "./ExamplePromo";

interface AIAgentProps {
  format: VideoFormat;
}

export const AIAgent: React.FC<AIAgentProps> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isVertical = format === "vertical";

  // ---------------------------------------------------------------------------
  // Scene 1: The Problem (frames 0-50)
  // ---------------------------------------------------------------------------

  const dreamText = "You have a dream.";
  const dreamCharsVisible = Math.floor(
    interpolate(frame, [5, 35], [0, dreamText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const questionText = "But where do you start?";
  const questionCharsVisible = Math.floor(
    interpolate(frame, [30, 50], [0, questionText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // ---------------------------------------------------------------------------
  // Scene 2: User types a goal (frames 50-120)
  // ---------------------------------------------------------------------------

  const goalText = "Learn to play guitar in 6 months";
  const goalCharsVisible = Math.floor(
    interpolate(frame, [60, 105], [0, goalText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const sendArrowOpacity = interpolate(frame, [106, 112], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sendArrowScale =
    sendArrowOpacity *
    (1 +
      0.15 *
        Math.sin(
          interpolate(frame, [112, 120], [0, Math.PI * 3], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        ));

  const inputHintOpacity = interpolate(frame, [55, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---------------------------------------------------------------------------
  // Scene 3: AI responds with plan (frames 120-200)
  // ---------------------------------------------------------------------------

  const inputSlideUp = interpolate(frame, [120, 135], [0, -60], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const aiBubbleOpacity = spring({
    frame: frame - 135,
    fps,
    config: { damping: 15 },
  });

  const planLines = [
    { icon: "\u2713", text: "Goal: Learn Guitar", color: "#ffffff" },
    {
      icon: "\ud83d\udccb",
      text: "Phase 1: Basics (4 tasks)",
      color: "#94a3b8",
    },
    {
      icon: "\ud83d\udccb",
      text: "Phase 2: Chords (5 tasks)",
      color: "#94a3b8",
    },
    {
      icon: "\ud83d\udccb",
      text: "Phase 3: Songs (3 tasks)",
      color: "#94a3b8",
    },
  ];

  const planLineAnimations = planLines.map((_, i) =>
    spring({
      frame: frame - (140 + i * 10),
      fps,
      config: { damping: 14, mass: 0.8 },
    })
  );

  const completePlanOpacity = interpolate(frame, [185, 195], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---------------------------------------------------------------------------
  // Scene 4: CTA (frames 200-270)
  // ---------------------------------------------------------------------------

  const scene3ScaleDown = interpolate(frame, [200, 215], [1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scene3FadeOut = interpolate(frame, [200, 215], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaHeadlineSpring = spring({
    frame: frame - 210,
    fps,
    config: { damping: 14 },
  });

  const ctaSubtextSpring = spring({
    frame: frame - 220,
    fps,
    config: { damping: 14 },
  });

  const ctaButtonScale = spring({
    frame: frame - 232,
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const ctaBrandingOpacity = interpolate(frame, [240, 255], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---------------------------------------------------------------------------
  // Background gradient fade
  // ---------------------------------------------------------------------------

  const bgFade = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
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
            "radial-gradient(ellipse at 25% 35%, rgba(59, 130, 246, 0.15), transparent 55%), radial-gradient(ellipse at 75% 65%, rgba(139, 92, 246, 0.1), transparent 55%)",
          opacity: bgFade,
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Scene 1: The Problem (frames 0-50) */}
      {/* ------------------------------------------------------------------ */}
      <Sequence from={0} durationInFrames={120}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: frame < 50 ? 1 : interpolate(frame, [50, 60], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div style={{ textAlign: "center", padding: isVertical ? 40 : 60 }}>
            <h1
              style={{
                fontSize: isVertical ? 52 : 68,
                fontWeight: "bold",
                color: "#ffffff",
                marginBottom: 20,
                lineHeight: 1.3,
                letterSpacing: -1,
              }}
            >
              {dreamText.slice(0, dreamCharsVisible)}
              <span
                style={{
                  opacity: frame % 16 < 8 && dreamCharsVisible < dreamText.length ? 1 : 0,
                  color: "#3b82f6",
                }}
              >
                |
              </span>
            </h1>
            <p
              style={{
                fontSize: isVertical ? 32 : 40,
                color: "#94a3b8",
                lineHeight: 1.4,
              }}
            >
              {questionText.slice(0, questionCharsVisible)}
              <span
                style={{
                  opacity:
                    frame % 16 < 8 &&
                    questionCharsVisible < questionText.length &&
                    dreamCharsVisible >= dreamText.length
                      ? 1
                      : 0,
                  color: "#3b82f6",
                }}
              >
                |
              </span>
            </p>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ------------------------------------------------------------------ */}
      {/* Scene 2: User types a goal (frames 50-120) */}
      {/* ------------------------------------------------------------------ */}
      <Sequence from={50} durationInFrames={150}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity:
              frame >= 200
                ? scene3FadeOut
                : 1,
            transform:
              frame >= 200
                ? `scale(${scene3ScaleDown})`
                : undefined,
          }}
        >
          <div
            style={{
              width: isVertical ? "88%" : "70%",
              maxWidth: 700,
              transform: `translateY(${frame >= 120 ? inputSlideUp : 0}px)`,
            }}
          >
            {/* Chat input area */}
            <div
              style={{
                border: "2px solid #3b82f6",
                borderRadius: 16,
                padding: isVertical ? "16px 20px" : "20px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(59, 130, 246, 0.05)",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontSize: isVertical ? 22 : 28,
                  color: "#ffffff",
                  flex: 1,
                }}
              >
                {goalText.slice(0, goalCharsVisible)}
                <span
                  style={{
                    opacity:
                      frame % 16 < 8 &&
                      goalCharsVisible < goalText.length &&
                      frame >= 60
                        ? 1
                        : 0,
                    color: "#3b82f6",
                  }}
                >
                  |
                </span>
              </span>

              {/* Send arrow */}
              <div
                style={{
                  opacity: sendArrowOpacity,
                  transform: `scale(${sendArrowScale})`,
                  width: isVertical ? 36 : 44,
                  height: isVertical ? 36 : 44,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginLeft: 12,
                }}
              >
                <svg
                  width={isVertical ? 18 : 22}
                  height={isVertical ? 18 : 22}
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ transform: "rotate(-45deg)" }}
                >
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="#ffffff"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Hint text */}
            <p
              style={{
                fontSize: isVertical ? 18 : 22,
                color: "#94a3b8",
                textAlign: "center",
                opacity: inputHintOpacity,
              }}
            >
              Just tell the AI your goal
            </p>

            {/* ------------------------------------------------------------ */}
            {/* Scene 3: AI response bubble (frames 120-200) */}
            {/* ------------------------------------------------------------ */}
            {frame >= 135 && (
              <div
                style={{
                  marginTop: 24,
                  opacity: aiBubbleOpacity,
                  transform: `translateY(${(1 - aiBubbleOpacity) * 20}px)`,
                }}
              >
                {/* AI label */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 12,
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: isVertical ? 20 : 24 }}>
                    {"\u2728"}
                  </span>
                  <span
                    style={{
                      fontSize: isVertical ? 16 : 18,
                      color: "#8b5cf6",
                      fontWeight: "bold",
                      letterSpacing: 1,
                    }}
                  >
                    AI
                  </span>
                </div>

                {/* Response bubble */}
                <div
                  style={{
                    backgroundColor: "rgba(139, 92, 246, 0.08)",
                    border: "1px solid rgba(139, 92, 246, 0.25)",
                    borderRadius: 14,
                    padding: isVertical ? "18px 20px" : "22px 28px",
                  }}
                >
                  {planLines.map((line, i) => (
                    <div
                      key={i}
                      style={{
                        opacity: planLineAnimations[i],
                        transform: `translateX(${(1 - planLineAnimations[i]) * 30}px)`,
                        fontSize: isVertical ? 20 : 26,
                        color: line.color,
                        marginBottom: i < planLines.length - 1 ? 12 : 0,
                        paddingLeft: i > 0 ? (isVertical ? 16 : 24) : 0,
                        fontWeight: i === 0 ? "bold" : "normal",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span>{line.icon}</span>
                      <span>{line.text}</span>
                    </div>
                  ))}
                </div>

                {/* "Complete plan in seconds" */}
                <p
                  style={{
                    fontSize: isVertical ? 18 : 22,
                    color: "#10b981",
                    textAlign: "center",
                    marginTop: 16,
                    fontWeight: "bold",
                    opacity: completePlanOpacity,
                  }}
                >
                  Complete plan in seconds
                </p>
              </div>
            )}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ------------------------------------------------------------------ */}
      {/* Scene 4: CTA (frames 200-270) */}
      {/* ------------------------------------------------------------------ */}
      <Sequence from={200} durationInFrames={70}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: isVertical ? 40 : 60,
              maxWidth: isVertical ? "90%" : "80%",
            }}
          >
            {/* Big gradient headline */}
            <h1
              style={{
                fontSize: isVertical ? 54 : 72,
                fontWeight: "bold",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: isVertical ? 16 : 24,
                lineHeight: 1.2,
                transform: `translateY(${(1 - ctaHeadlineSpring) * 40}px)`,
                opacity: ctaHeadlineSpring,
              }}
            >
              Tell us your goal.
            </h1>

            {/* Subtext */}
            <p
              style={{
                fontSize: isVertical ? 30 : 38,
                color: "#94a3b8",
                marginBottom: isVertical ? 36 : 48,
                lineHeight: 1.4,
                transform: `translateY(${(1 - ctaSubtextSpring) * 30}px)`,
                opacity: ctaSubtextSpring,
              }}
            >
              AI handles the rest.
            </p>

            {/* CTA button */}
            <div
              style={{
                transform: `scale(${ctaButtonScale})`,
                opacity: ctaButtonScale,
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: isVertical ? "16px 44px" : "18px 56px",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  borderRadius: 14,
                  fontSize: isVertical ? 24 : 30,
                  fontWeight: "bold",
                  color: "#ffffff",
                  letterSpacing: 0.5,
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
              opacity: ctaBrandingOpacity,
            }}
          >
            <div
              style={{
                fontSize: isVertical ? 22 : 28,
                color: "#6b7280",
                marginBottom: 6,
              }}
            >
              Journey Tracker
            </div>
            <div
              style={{
                fontSize: isVertical ? 14 : 16,
                color: "#4b5563",
              }}
            >
              Powered by AI
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
