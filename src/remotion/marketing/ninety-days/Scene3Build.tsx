import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoFormat } from "./shared/types";
import { ChatPanel } from "./shared/ChatPanel";

interface PhaseData {
  emoji: string;
  title: string;
  tasks: string[];
}

const phases: PhaseData[] = [
  {
    emoji: "📐",
    title: "Phase 1: Planning & Design",
    tasks: [
      "Research portfolio inspirations",
      "Choose a tech stack (Next.js + Tailwind)",
      "Wireframe the homepage layout",
      "Design the projects showcase section",
    ],
  },
  {
    emoji: "🛠️",
    title: "Phase 2: Build Core Pages",
    tasks: [
      "Build the homepage with hero section",
      "Create the projects grid with filtering",
      "Build the about/contact page",
      "Add responsive design and dark mode",
    ],
  },
  {
    emoji: "🚀",
    title: "Phase 3: Content & Launch",
    tasks: [
      "Write case studies for 3 projects",
      "Set up custom domain and hosting",
      "SEO optimization and meta tags",
      "Launch and share on social media",
    ],
  },
];

export const Scene3Build: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  // AI response typewriter: frame 0-30 (typing indicator gone, message streams)
  const aiResponseText =
    "I'll create a complete 2-month portfolio plan for you! 🚀 Let me set that up...";
  const aiCharsTyped = Math.floor(
    interpolate(frame, [0, 30], [0, aiResponseText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Tool log pills: staggered at frames 45, 55, 65
  const toolPills = [
    { text: "🔧 create-goal ✅", startFrame: 45 },
    { text: "🔧 create-task ×12 ✅", startFrame: 55 },
    { text: "🔧 add-substep ×36 ✅", startFrame: 65 },
  ];

  // Empty state fades out at frame 30
  const emptyOpacity = frame < 30
    ? 1
    : interpolate(frame, [30, 45], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Goal card appears at frame 45
  const goalCardSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const goalCardScale = interpolate(goalCardSpring, [0, 1], [0.9, 1]);

  // Phase appearances
  const phase1Spring = spring({ frame: frame - 60, fps, config: { damping: 15, stiffness: 120 } });
  const phase2Spring = spring({ frame: frame - 105, fps, config: { damping: 15, stiffness: 120 } });
  const phase3Spring = spring({ frame: frame - 150, fps, config: { damping: 15, stiffness: 120 } });
  const phaseData = [
    { spring: phase1Spring, startFrame: 60 },
    { spring: phase2Spring, startFrame: 105 },
    { spring: phase3Spring, startFrame: 150 },
  ];

  // Chat panel slides away at frame 210
  const chatSlideAway = frame < 210
    ? 0
    : spring({ frame: frame - 210, fps, config: { damping: 15, stiffness: 120 } });
  const chatTranslateX = interpolate(chatSlideAway, [0, 1], [0, 400]);

  // Build messages for chat panel
  const messages: Array<{ role: string; text: string }> = [
    {
      role: "user",
      text: "I want to build a portfolio website and launch it in 2 months. I know some HTML but I'm not a developer.",
    },
  ];

  if (frame >= 0) {
    messages.push({
      role: "ai",
      text: aiResponseText.slice(0, aiCharsTyped),
    });
  }

  if (frame >= 195) {
    messages.push({
      role: "ai",
      text: "Your plan is ready! 12 tasks across 3 phases. First up: 'Research portfolio inspirations'. Want to start now? 🎯",
    });
  }

  // Layout: split screen
  const chatWidth = isVertical ? "100%" : format === "square" ? "50%" : "35%";
  const mainWidth = isVertical ? "100%" : format === "square" ? "50%" : "65%";
  const chatHeight = isVertical ? "40%" : "100%";
  const mainHeight = isVertical ? "60%" : "100%";

  return (
    <AbsoluteFill style={{ backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif" }}>
      {/* Main layout container */}
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Chat panel (top on vertical, right on horizontal) */}
        {isVertical && (
          <div
            style={{
              width: chatWidth,
              height: chatHeight,
              transform: `translateX(${chatTranslateX}px)`,
              flexShrink: 0,
            }}
          >
            <ChatPanel
              sz={sz}
              messages={messages}
              showTypingIndicator={frame >= 0 && frame < 30}
            />
          </div>
        )}

        {/* Main app area */}
        <div
          style={{
            width: mainWidth,
            height: mainHeight,
            overflow: "hidden",
            padding: sz(16),
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Empty state (fades out) */}
          {emptyOpacity > 0 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: sz(8),
                opacity: emptyOpacity,
              }}
            >
              <div
                style={{
                  width: sz(120),
                  height: sz(120),
                  borderRadius: "50%",
                  border: `${sz(2)}px dashed #e5e7eb`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: sz(36) }}>📋</span>
              </div>
              <span style={{ fontSize: sz(16), fontWeight: 600, color: "#111827" }}>
                No goals yet
              </span>
            </div>
          )}

          {/* Goal card materializes at frame 45 */}
          {frame >= 45 && (
            <div
              style={{
                transform: `scale(${goalCardScale})`,
                opacity: goalCardSpring,
                transformOrigin: "top center",
              }}
            >
              {/* Goal header card */}
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: sz(8),
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  padding: sz(16),
                  marginBottom: sz(12),
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: sz(8) }}>
                    <span style={{ fontSize: sz(32) }}>💻</span>
                    <span style={{ fontSize: sz(20), fontWeight: 600, color: "#111827" }}>
                      Build Portfolio Website
                    </span>
                  </div>
                  <div
                    style={{
                      backgroundColor: "#f3f4f6",
                      borderRadius: sz(999),
                      padding: `${sz(4)}px ${sz(12)}px`,
                      fontSize: sz(12),
                      color: "#4b5563",
                    }}
                  >
                    📅 Apr 2026
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: sz(12) }}>
                  <div
                    style={{
                      height: sz(8),
                      backgroundColor: "#e5e7eb",
                      borderRadius: sz(999),
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: "0%",
                        backgroundColor: "#6366f1",
                        borderRadius: sz(999),
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: sz(12),
                      color: "#9ca3af",
                      marginTop: sz(4),
                      display: "block",
                    }}
                  >
                    0/12 tasks
                  </span>
                </div>
              </div>

              {/* Phases */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: sz(12),
                  overflowY: "auto",
                  maxHeight: isVertical ? sz(240) : sz(320),
                }}
              >
                {phases.map((phase, phaseIndex) => {
                  const { spring: phSpring, startFrame } = phaseData[phaseIndex];
                  if (frame < startFrame) return null;

                  const translateY = interpolate(phSpring, [0, 1], [40, 0]);

                  return (
                    <div
                      key={phase.title}
                      style={{
                        opacity: phSpring,
                        transform: `translateY(${translateY}px)`,
                      }}
                    >
                      {/* Phase header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: sz(8),
                          paddingLeft: sz(4),
                          borderLeft: `${sz(4)}px solid #6366f1`,
                          marginBottom: sz(8),
                          paddingTop: sz(2),
                          paddingBottom: sz(2),
                        }}
                      >
                        <span style={{ fontSize: sz(18), fontWeight: 600, color: "#111827" }}>
                          {phase.emoji} {phase.title}
                        </span>
                      </div>

                      {/* Tasks */}
                      <div style={{ display: "flex", flexDirection: "column", gap: sz(6) }}>
                        {phase.tasks.map((task, taskIndex) => {
                          const taskDelay = startFrame + taskIndex * 8;
                          const taskSpring = spring({
                            frame: frame - taskDelay,
                            fps,
                            config: { damping: 15, stiffness: 120 },
                          });
                          if (frame < taskDelay) return null;

                          return (
                            <div
                              key={task}
                              style={{
                                backgroundColor: "#fff",
                                borderRadius: sz(8),
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                padding: `${sz(10)}px ${sz(12)}px`,
                                display: "flex",
                                alignItems: "center",
                                gap: sz(8),
                                opacity: taskSpring,
                                transform: `translateY(${(1 - taskSpring) * 20}px)`,
                              }}
                            >
                              <div
                                style={{
                                  width: sz(14),
                                  height: sz(14),
                                  borderRadius: "50%",
                                  border: `${sz(2)}px solid #9ca3af`,
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ fontSize: sz(13), color: "#111827", flex: 1 }}>
                                {task}
                              </span>
                              <span style={{ fontSize: sz(12), color: "#9ca3af" }}>
                                3 substeps
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Chat panel (right side on landscape/square) */}
        {!isVertical && (
          <div
            style={{
              width: chatWidth,
              height: chatHeight,
              transform: `translateX(${chatTranslateX}px)`,
              flexShrink: 0,
              borderLeft: "1px solid #e5e7eb",
            }}
          >
            {/* Tool pills overlay */}
            <div style={{ position: "relative", height: "100%" }}>
              <ChatPanel
                sz={sz}
                messages={messages}
                showTypingIndicator={frame >= 0 && frame < 30}
              />

              {/* Tool log pills */}
              {frame >= 45 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: sz(60),
                    left: sz(12),
                    right: sz(12),
                    display: "flex",
                    flexDirection: "column",
                    gap: sz(6),
                  }}
                >
                  {toolPills.map((pill) => {
                    if (frame < pill.startFrame) return null;
                    const pillSpring = spring({
                      frame: frame - pill.startFrame,
                      fps,
                      config: { damping: 20, stiffness: 200 },
                    });
                    return (
                      <div
                        key={pill.text}
                        style={{
                          backgroundColor: "#eef2ff",
                          borderRadius: sz(999),
                          padding: `${sz(4)}px ${sz(12)}px`,
                          fontSize: sz(11),
                          color: "#4338ca",
                          fontWeight: 500,
                          opacity: pillSpring,
                          transform: `translateY(${(1 - pillSpring) * 10}px)`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {pill.text}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
