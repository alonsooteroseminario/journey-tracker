import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoFormat } from "./shared/types";
import { Sidebar } from "./shared/Sidebar";
import { ChatPanel } from "./shared/ChatPanel";

export const Scene2Dashboard: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth = format === "landscape" ? sz(256) : 0;
  const topBarHeight = format === "square" ? sz(48) : 0;

  // Chat FAB pulse ring
  const pulsePhase = (frame % 45) / 45;
  const pulseScale = interpolate(pulsePhase, [0, 1], [1, 1.5]);
  const pulseOpacity = interpolate(pulsePhase, [0, 1], [0.3, 0]);

  // Chat panel opens at frame 30
  const chatOpen = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Typing animation: frames 75-135
  const fullText =
    "I want to build a portfolio website and launch it in 2 months. I know some HTML but I'm not a developer.";
  const charsTyped = Math.floor(
    interpolate(frame, [75, 135], [0, fullText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const inputText = frame >= 75 && frame < 140 ? fullText.slice(0, charsTyped) : "";

  // Build messages array
  const messages: Array<{ role: string; text: string }> = [
    {
      role: "ai",
      text: "Welcome, Alex! \uD83D\uDC4B What's a goal you've been putting off? Tell me and I'll build you a complete plan.",
    },
  ];

  if (frame >= 140) {
    messages.push({
      role: "user",
      text: fullText,
    });
  }

  const showTypingIndicator = frame >= 145;

  // FAB visibility: hidden once chat is open
  const fabOpacity = frame < 30 ? 1 : interpolate(chatOpen, [0, 0.3], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif" }}>
      {/* Sidebar */}
      <Sidebar format={format} activeItem="Board" sz={sz} />

      {/* Main content */}
      <div
        style={{
          position: "absolute",
          top: topBarHeight,
          left: sidebarWidth,
          right: 0,
          bottom: format === "vertical" ? sz(56) : 0,
          display: "flex",
          flexDirection: "column",
          padding: sz(24),
        }}
      >
        {/* Heading */}
        <h1
          style={{
            fontSize: sz(24),
            fontWeight: "bold",
            color: "#111827",
            margin: `0 0 ${sz(24)}px`,
          }}
        >
          My Goals
        </h1>

        {/* Empty state */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: sz(12),
          }}
        >
          {/* Dotted circle */}
          <div
            style={{
              width: sz(200),
              height: sz(200),
              borderRadius: "50%",
              border: `${sz(2)}px dashed #e5e7eb`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: sz(48) }}>📋</span>
          </div>

          <span
            style={{
              fontSize: sz(20),
              fontWeight: 600,
              color: "#111827",
            }}
          >
            No goals yet
          </span>

          <span
            style={{
              fontSize: sz(14),
              color: "#4b5563",
              textAlign: "center",
            }}
          >
            Create your first goal or browse templates
          </span>

          <div
            style={{
              backgroundColor: "#6366f1",
              color: "#ffffff",
              fontSize: sz(14),
              fontWeight: 600,
              padding: `${sz(10)}px ${sz(20)}px`,
              borderRadius: sz(8),
              marginTop: sz(8),
            }}
          >
            Create Goal
          </div>
        </div>
      </div>

      {/* Chat FAB */}
      {fabOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: format === "vertical" ? sz(72) : sz(24),
            right: sz(24),
            opacity: fabOpacity,
            zIndex: 20,
          }}
        >
          {/* Pulse ring */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: sz(56),
              height: sz(56),
              borderRadius: "50%",
              border: `${sz(2)}px solid #6366f1`,
              transform: `scale(${pulseScale})`,
              opacity: pulseOpacity,
              transformOrigin: "center center",
            }}
          />
          {/* FAB button */}
          <div
            style={{
              width: sz(56),
              height: sz(56),
              borderRadius: "50%",
              backgroundColor: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 12px rgba(99,102,241,0.4)`,
            }}
          >
            <span style={{ fontSize: sz(24) }}>💬</span>
          </div>
        </div>
      )}

      {/* Chat Panel slides up from bottom-right */}
      {frame >= 30 && (
        <div
          style={{
            position: "absolute",
            bottom: format === "vertical" ? sz(56) : 0,
            right: 0,
            width: isVertical ? "100%" : sz(360),
            height: isVertical ? "50%" : sz(400),
            transform: `translateY(${(1 - chatOpen) * 100}%)`,
            opacity: chatOpen,
            zIndex: 25,
          }}
        >
          <ChatPanel
            sz={sz}
            messages={messages}
            inputText={inputText}
            showTypingIndicator={showTypingIndicator}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
