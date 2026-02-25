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

interface AIBuildsDreamProps {
  format: VideoFormat;
}

export const AIBuildsDream: React.FC<AIBuildsDreamProps> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isVertical = format === "vertical";
  const isSquare = format === "square";

  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  // ---------------------------------------------------------------------------
  // Layout dimensions
  // ---------------------------------------------------------------------------
  const appWidth = isVertical ? "100%" : isSquare ? "55%" : "60%";
  const chatWidth = isVertical ? "100%" : isSquare ? "45%" : "40%";
  const chatHeight = isVertical ? "55%" : "100%";

  // ---------------------------------------------------------------------------
  // Background fade
  // ---------------------------------------------------------------------------
  const bgFade = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // ---------------------------------------------------------------------------
  // Scene 1: Empty State (frames 0-90)
  // ---------------------------------------------------------------------------

  // Chat bubble icon pulse glow
  const glowCycle = (frame % 30) / 30;
  const glowIntensity = interpolate(
    Math.sin(glowCycle * Math.PI * 2),
    [-1, 1],
    [4, 16],
  );

  // Chat icon tap at frame 45
  const chatIconTap = spring({
    frame: frame - 45,
    fps,
    config: { damping: 8, mass: 0.5, stiffness: 300 },
  });
  const chatIconScale =
    frame < 45
      ? 1
      : frame < 55
        ? 1 - 0.08 * chatIconTap + 0.08 * chatIconTap * chatIconTap
        : 1;

  // Chat panel slide in at frame 55
  const chatPanelSpring = spring({
    frame: frame - 55,
    fps,
    config: { damping: 15, mass: 1 },
  });
  const chatPanelTranslate = isVertical
    ? `translateY(${(1 - chatPanelSpring) * 100}%)`
    : `translateX(${(1 - chatPanelSpring) * 100}%)`;

  // ---------------------------------------------------------------------------
  // Scene 2: The Prompt (frames 90-210)
  // ---------------------------------------------------------------------------
  const promptText =
    "I want to run a marathon in 6 months. I've never run more than 2 miles.";
  const charsTyped = Math.floor(
    interpolate(frame, [90, 175], [0, promptText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  // Cursor blink
  const cursorVisible = frame % 16 < 8;

  // Send button highlight at frame 180
  const sendScale = spring({
    frame: frame - 180,
    fps,
    config: { damping: 10, mass: 0.6 },
  });

  // User message bubble at frame 185
  const userBubbleSpring = spring({
    frame: frame - 185,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Typing indicator at frame 195
  const typingDotsVisible = frame >= 195 && frame < 215;

  // ---------------------------------------------------------------------------
  // Scene 3: The Build (frames 210-450)
  // ---------------------------------------------------------------------------

  // AI response typewriter
  const aiResponseText =
    "I'll create a complete 6-month marathon plan for you! \u{1F3C3}\u200D\u2642\uFE0F";
  const aiResponseChars = Math.floor(
    interpolate(frame, [210, 240], [0, aiResponseText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const aiResponseOpacity = interpolate(frame, [210, 215], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tool call badges
  const toolBadges = [
    { frame: 240, label: "create-goal", count: "" },
    { frame: 248, label: "create-task", count: " \u00D76" },
    { frame: 256, label: "add-substep", count: " \u00D718" },
  ];

  // Goal card fade in (frames 245-270)
  const goalCardSpring = spring({
    frame: frame - 245,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Task count updates
  const taskCount =
    frame < 340 ? (frame < 280 ? 0 : 3) : frame < 400 ? 6 : 9;

  // Phase data
  const phases = [
    {
      startFrame: 280,
      color: "#3b82f6",
      title: "Phase 1: Base Building",
      subtitle: "Weeks 1-8",
      tasks: [
        "Run 3x/week starting at 1 mile",
        "Get fitted for running shoes",
        "Establish pre-run stretching routine",
      ],
    },
    {
      startFrame: 340,
      color: "#8b5cf6",
      title: "Phase 2: Building Endurance",
      subtitle: "Weeks 9-16",
      tasks: [
        "Increase weekly mileage by 10%",
        "Complete first 10K",
        "Add cross-training days",
      ],
    },
    {
      startFrame: 400,
      color: "#10b981",
      title: "Phase 3: Race Preparation",
      subtitle: "Weeks 17-24",
      tasks: [
        "Run a half-marathon",
        "Practice race-day nutrition",
        "Taper for race week",
      ],
    },
  ];

  // ---------------------------------------------------------------------------
  // Scene 4: The Payoff (frames 450-540)
  // ---------------------------------------------------------------------------

  // Chat panel fade out
  const chatFadeOut = interpolate(frame, [450, 465], [1, 0.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chatSlideOut = isVertical
    ? `translateY(${interpolate(frame, [450, 465], [0, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%)`
    : `translateX(${interpolate(frame, [450, 465], [0, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%)`;

  // Streak counter
  const streakSpring = spring({
    frame: frame - 465,
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  // Golden glow on goal card
  const goldenGlowIntensity = interpolate(frame, [470, 490], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline typing
  const taglineText = "One sentence. One complete plan.";
  const taglineChars = Math.floor(
    interpolate(frame, [475, 505], [0, taglineText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  // Subtitle fade
  const subtitleOpacity = interpolate(frame, [510, 525], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // URL fade
  const urlOpacity = interpolate(frame, [520, 535], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Empty state fade out when goal card appears
  const emptyStateFade = interpolate(frame, [245, 260], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderTopBar = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${sz(12)}px ${sz(16)}px`,
        borderBottom: "1px solid #1e293b",
      }}
    >
      <span
        style={{
          fontSize: sz(20),
          fontWeight: "bold",
          color: "#ffffff",
        }}
      >
        Journey Tracker
      </span>
      <div
        style={{
          width: sz(32),
          height: sz(32),
          borderRadius: "50%",
          backgroundColor: "#374151",
        }}
      />
    </div>
  );

  const renderEmptyState = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        opacity: emptyStateFade,
      }}
    >
      <div
        style={{
          width: sz(200),
          height: sz(200),
          borderRadius: "50%",
          border: "2px dashed #374151",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: sz(18),
            color: "#6b7280",
          }}
        >
          No goals yet
        </span>
      </div>
    </div>
  );

  const renderChatIcon = () => (
    <div
      style={{
        position: "absolute",
        bottom: sz(20),
        right: sz(20),
        width: sz(48),
        height: sz(48),
        borderRadius: "50%",
        backgroundColor: "#3b82f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${chatIconScale})`,
        boxShadow: `0 0 ${glowIntensity}px ${glowIntensity / 2}px rgba(59, 130, 246, 0.5)`,
        opacity: frame < 55 ? 1 : 1 - chatPanelSpring,
      }}
    >
      <span style={{ fontSize: sz(22) }}>{"\u2728"}</span>
    </div>
  );

  const renderGoalCard = () => {
    if (frame < 245) return null;
    return (
      <div
        style={{
          margin: `${sz(12)}px ${sz(16)}px`,
          padding: sz(16),
          backgroundColor: "#ffffff",
          borderRadius: 12,
          opacity: goalCardSpring,
          transform: `translateY(${(1 - goalCardSpring) * 20}px)`,
          boxShadow:
            goldenGlowIntensity > 0
              ? `0 0 ${20 * goldenGlowIntensity}px ${8 * goldenGlowIntensity}px rgba(234, 179, 8, 0.3)`
              : "0 2px 8px rgba(0,0,0,0.1)",
          border:
            goldenGlowIntensity > 0
              ? `2px solid rgba(234, 179, 8, ${0.6 * goldenGlowIntensity})`
              : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: sz(8),
          }}
        >
          <span
            style={{
              fontSize: sz(20),
              fontWeight: "bold",
              color: "#111827",
            }}
          >
            {"\u{1F3C3}"} Run a Marathon
          </span>
          <span
            style={{
              fontSize: sz(11),
              backgroundColor: "#eff6ff",
              color: "#3b82f6",
              padding: `${sz(3)}px ${sz(8)}px`,
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            Aug 2026
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: sz(8) }}>
          <span style={{ fontSize: sz(11), color: "#9ca3af" }}>
            {taskCount}/9 tasks
          </span>
          <div
            style={{
              flex: 1,
              height: sz(6),
              backgroundColor: "#e5e7eb",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(taskCount / 9) * 100}%`,
                height: "100%",
                backgroundColor: "#3b82f6",
                borderRadius: 3,
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderPhase = (
    phase: (typeof phases)[0],
    index: number,
  ) => {
    if (frame < phase.startFrame) return null;
    const phaseSpring = spring({
      frame: frame - phase.startFrame,
      fps,
      config: { damping: 14, mass: 0.8 },
    });
    return (
      <div
        key={index}
        style={{
          margin: `${sz(8)}px ${sz(16)}px`,
          opacity: phaseSpring,
          transform: `translateY(${(1 - phaseSpring) * 15}px)`,
        }}
      >
        <div
          style={{
            borderLeft: `4px solid ${phase.color}`,
            paddingLeft: sz(12),
            marginBottom: sz(6),
          }}
        >
          <div
            style={{
              fontSize: sz(16),
              fontWeight: 600,
              color: "#1f2937",
            }}
          >
            {"\u{1F4CB}"} {phase.title}
          </div>
          <div style={{ fontSize: sz(12), color: "#9ca3af" }}>
            {phase.subtitle}
          </div>
        </div>
        {phase.tasks.map((task, ti) => {
          const taskDelay = phase.startFrame + 10 + ti * 10;
          if (frame < taskDelay) return null;
          const taskSpring = spring({
            frame: frame - taskDelay,
            fps,
            config: { damping: 14, mass: 0.6 },
          });
          return (
            <div
              key={ti}
              style={{
                display: "flex",
                alignItems: "center",
                gap: sz(8),
                marginLeft: sz(16),
                marginBottom: sz(4),
                opacity: taskSpring,
                transform: `translateX(${(1 - taskSpring) * 20}px)`,
              }}
            >
              <div
                style={{
                  width: sz(14),
                  height: sz(14),
                  borderRadius: "50%",
                  border: "2px solid #d1d5db",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: sz(13), color: "#374151" }}>
                {task}
              </span>
              <span style={{ fontSize: sz(10), color: "#9ca3af", flexShrink: 0 }}>
                3 substeps
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderChatPanel = () => {
    if (frame < 55) return null;
    return (
      <div
        style={{
          position: "absolute",
          top: isVertical ? "auto" : 0,
          bottom: isVertical ? 0 : "auto",
          right: 0,
          width: isVertical ? "100%" : chatWidth,
          height: isVertical ? chatHeight : "100%",
          backgroundColor: "#ffffff",
          borderTopLeftRadius: isVertical ? 16 : 0,
          borderTopRightRadius: isVertical ? 16 : 0,
          transform:
            frame >= 450
              ? chatSlideOut
              : chatPanelTranslate,
          opacity: frame >= 450 ? chatFadeOut : chatPanelSpring,
          display: "flex",
          flexDirection: "column",
          zIndex: 10,
          boxShadow: "-4px 0 16px rgba(0,0,0,0.15)",
        }}
      >
        {/* Chat header */}
        <div
          style={{
            padding: `${sz(12)}px ${sz(16)}px`,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            gap: sz(6),
          }}
        >
          <span style={{ fontSize: sz(16) }}>{"\u2728"}</span>
          <span
            style={{
              fontSize: sz(16),
              fontWeight: "bold",
              color: "#111827",
            }}
          >
            Claude AI
          </span>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            padding: `${sz(12)}px ${sz(12)}px`,
            overflowY: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: sz(8),
          }}
        >
          {/* User message bubble */}
          {frame >= 185 && (
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "85%",
                opacity: userBubbleSpring,
                transform: `translateX(${(1 - userBubbleSpring) * 30}px)`,
              }}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                  color: "#ffffff",
                  fontSize: sz(13),
                  padding: `${sz(10)}px ${sz(14)}px`,
                  borderRadius: 12,
                  borderBottomRightRadius: 4,
                  lineHeight: 1.4,
                }}
              >
                {promptText}
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {typingDotsVisible && (
            <div
              style={{
                alignSelf: "flex-start",
                display: "flex",
                gap: 4,
                padding: `${sz(10)}px ${sz(14)}px`,
                backgroundColor: "#1e1e2e",
                borderRadius: 12,
                borderBottomLeftRadius: 4,
              }}
            >
              {[0, 1, 2].map((dotIndex) => {
                const dotCycle = ((frame - 195 + dotIndex * 6) % 20) / 20;
                const dotOpacity = interpolate(
                  Math.sin(dotCycle * Math.PI * 2),
                  [-1, 1],
                  [0.3, 1],
                );
                return (
                  <div
                    key={dotIndex}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#94a3b8",
                      opacity: dotOpacity,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* AI response bubble */}
          {frame >= 210 && (
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "90%",
                opacity: aiResponseOpacity,
              }}
            >
              <div
                style={{
                  backgroundColor: "#1e1e2e",
                  color: "#e2e8f0",
                  fontSize: sz(13),
                  padding: `${sz(10)}px ${sz(14)}px`,
                  borderRadius: 12,
                  borderBottomLeftRadius: 4,
                  lineHeight: 1.4,
                }}
              >
                {aiResponseText.slice(0, aiResponseChars)}
                {aiResponseChars < aiResponseText.length && (
                  <span style={{ opacity: cursorVisible ? 1 : 0, color: "#3b82f6" }}>
                    |
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tool call badges */}
          {toolBadges.map((badge, i) => {
            if (frame < badge.frame) return null;
            const framesIn = frame - badge.frame;
            const isComplete = framesIn >= 4;
            const badgeSpring = spring({
              frame: framesIn,
              fps,
              config: { damping: 12, mass: 0.5 },
            });
            const spinRotation = isComplete
              ? 0
              : interpolate(framesIn, [0, 4], [0, 360], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
            return (
              <div
                key={i}
                style={{
                  alignSelf: "flex-start",
                  opacity: badgeSpring,
                  transform: `translateY(${(1 - badgeSpring) * 10}px)`,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    fontSize: sz(11),
                    padding: `${sz(4)}px ${sz(10)}px`,
                    borderRadius: 999,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      transform: `rotate(${spinRotation}deg)`,
                    }}
                  >
                    {isComplete ? "\u2705" : "\u{1F527}"}
                  </span>
                  <span>
                    {badge.label}
                    {badge.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input field */}
        <div
          style={{
            padding: `${sz(10)}px ${sz(12)}px`,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: sz(8),
            }}
          >
            <div
              style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                borderRadius: 8,
                padding: `${sz(8)}px ${sz(12)}px`,
                fontSize: sz(13),
                color: frame >= 90 && frame < 185 ? "#111827" : "#9ca3af",
                minHeight: sz(18),
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {frame >= 90 && frame < 185 ? (
                <>
                  {promptText.slice(0, charsTyped)}
                  <span
                    style={{
                      opacity: cursorVisible && charsTyped < promptText.length ? 1 : 0,
                      color: "#3b82f6",
                    }}
                  >
                    |
                  </span>
                </>
              ) : frame >= 185 ? (
                "Type a message..."
              ) : (
                "Type a message..."
              )}
            </div>
            {/* Send button */}
            {frame >= 175 && frame < 185 && (
              <div
                style={{
                  width: sz(30),
                  height: sz(30),
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${sendScale})`,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: sz(14),
                    lineHeight: 1,
                  }}
                >
                  {"\u2191"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Scene 4 overlay elements
  // ---------------------------------------------------------------------------

  const renderPayoff = () => {
    if (frame < 450) return null;

    // Expand app area after chat slides away
    const appExpandSpring = spring({
      frame: frame - 465,
      fps,
      config: { damping: 15 },
    });
    const appExpandWidth = isVertical
      ? "100%"
      : `${interpolate(appExpandSpring, [0, 1], [isSquare ? 55 : 60, 100])}%`;

    return (
      <>
        {/* Streak counter */}
        {frame >= 465 && (
          <div
            style={{
              position: "absolute",
              top: sz(60),
              right: sz(20),
              backgroundColor: "rgba(251, 146, 60, 0.15)",
              border: "1px solid rgba(251, 146, 60, 0.3)",
              borderRadius: 10,
              padding: `${sz(6)}px ${sz(14)}px`,
              fontSize: sz(14),
              color: "#fb923c",
              fontWeight: 600,
              transform: `scale(${streakSpring})`,
              opacity: streakSpring,
              zIndex: 20,
            }}
          >
            {"\u{1F525}"} Day 1 — Let&apos;s go!
          </div>
        )}

        {/* Tagline */}
        {frame >= 475 && (
          <div
            style={{
              position: "absolute",
              bottom: isVertical ? sz(100) : sz(90),
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 20,
            }}
          >
            <div
              style={{
                fontSize: sz(32),
                fontWeight: "bold",
                color: "#ffffff",
                textShadow: "0 2px 12px rgba(0,0,0,0.8)",
              }}
            >
              {taglineText.slice(0, taglineChars)}
              {taglineChars < taglineText.length && (
                <span
                  style={{
                    opacity: cursorVisible ? 1 : 0,
                    color: "#3b82f6",
                  }}
                >
                  |
                </span>
              )}
            </div>
          </div>
        )}

        {/* Subtitle */}
        <div
          style={{
            position: "absolute",
            bottom: isVertical ? sz(70) : sz(60),
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: subtitleOpacity,
            zIndex: 20,
          }}
        >
          <span
            style={{
              fontSize: sz(18),
              color: "#94a3b8",
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            Journey Tracker — AI that builds with you
          </span>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: isVertical ? sz(45) : sz(35),
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: urlOpacity,
            zIndex: 20,
          }}
        >
          <span
            style={{
              fontSize: sz(14),
              color: "#6b7280",
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            journeytracker.app
          </span>
        </div>

        {/* Darken overlay for text legibility */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: isVertical ? "35%" : "30%",
            background:
              "linear-gradient(to top, rgba(10, 10, 10, 0.9), transparent)",
            zIndex: 15,
            opacity: interpolate(frame, [475, 490], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />

        {/* Invisible div to drive app area width expansion */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: appExpandWidth,
            height: 0,
            pointerEvents: "none",
          }}
        />
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
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
            "radial-gradient(ellipse at 25% 35%, rgba(59, 130, 246, 0.12), transparent 55%), radial-gradient(ellipse at 75% 65%, rgba(139, 92, 246, 0.08), transparent 55%)",
          opacity: bgFade,
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* App area */}
      {/* ------------------------------------------------------------------ */}
      <Sequence from={0} durationInFrames={540}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width:
              frame >= 465
                ? `${interpolate(
                    spring({
                      frame: frame - 465,
                      fps,
                      config: { damping: 15 },
                    }),
                    [0, 1],
                    [isSquare ? 55 : isVertical ? 100 : 60, 100],
                  )}%`
                : appWidth,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "#0f172a",
          }}
        >
          {renderTopBar()}

          {/* Content area */}
          <div
            style={{
              flex: 1,
              position: "relative",
              overflowY: "hidden",
            }}
          >
            {/* Empty state */}
            {frame < 270 && renderEmptyState()}

            {/* Goal card + phases */}
            {renderGoalCard()}
            {phases.map((phase, i) => renderPhase(phase, i))}
          </div>

          {/* Chat bubble icon */}
          {frame < 55 && renderChatIcon()}
        </div>
      </Sequence>

      {/* ------------------------------------------------------------------ */}
      {/* Chat panel */}
      {/* ------------------------------------------------------------------ */}
      <Sequence from={0} durationInFrames={540}>
        {renderChatPanel()}
      </Sequence>

      {/* ------------------------------------------------------------------ */}
      {/* Scene 4 payoff overlay */}
      {/* ------------------------------------------------------------------ */}
      <Sequence from={450} durationInFrames={90}>
        {renderPayoff()}
      </Sequence>
    </AbsoluteFill>
  );
};
