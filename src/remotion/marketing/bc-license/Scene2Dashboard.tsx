import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoFormat } from "../ninety-days/shared/types";
import { ChatPanel } from "../ninety-days/shared/ChatPanel";

const navItems = [
  { emoji: "\u{1F4CB}", label: "Board" },
  { emoji: "\u{1F4E1}", label: "Feed" },
  { emoji: "\u{1F3EA}", label: "Marketplace" },
  { emoji: "\u{1F464}", label: "Profile" },
];

const CarlosSidebar: React.FC<{
  format: VideoFormat;
  activeItem: string;
  sz: (n: number) => number;
}> = ({ format, activeItem, sz }) => {
  if (format === "vertical") {
    return (
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: sz(56),
          backgroundColor: "#1e1b4b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          zIndex: 10,
        }}
      >
        {navItems.map((item) => (
          <div
            key={item.label}
            style={{
              fontSize: sz(20),
              color: activeItem === item.label ? "#6366f1" : "rgba(255,255,255,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>
    );
  }

  if (format === "square") {
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: sz(48),
          backgroundColor: "#1e1b4b",
          display: "flex",
          alignItems: "center",
          paddingLeft: sz(16),
          paddingRight: sz(16),
          gap: sz(16),
          zIndex: 10,
        }}
      >
        <span
          style={{
            color: "#fff",
            fontWeight: 600,
            fontSize: sz(14),
            fontFamily: "Arial, sans-serif",
            marginRight: sz(16),
          }}
        >
          {"\u{1F3AF}"} Journey Tracker
        </span>
        {navItems.map((item) => {
          const isActive = activeItem === item.label;
          return (
            <div
              key={item.label}
              style={{
                fontSize: sz(12),
                fontFamily: "Arial, sans-serif",
                color: isActive ? "#6366f1" : "rgba(255,255,255,0.6)",
                backgroundColor: isActive ? "rgba(238,242,255,0.15)" : "transparent",
                borderRadius: sz(6),
                padding: `${sz(4)}px ${sz(8)}px`,
                display: "flex",
                alignItems: "center",
                gap: sz(4),
              }}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Landscape
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: sz(256),
        backgroundColor: "#1e1b4b",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        zIndex: 10,
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          padding: `${sz(24)}px ${sz(20)}px`,
          color: "#fff",
          fontWeight: 600,
          fontSize: sz(18),
        }}
      >
        {"\u{1F3AF}"} Journey Tracker
      </div>

      {/* Nav items */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: sz(8),
          padding: `0 ${sz(12)}px`,
          flex: 1,
        }}
      >
        {navItems.map((item) => {
          const isActive = activeItem === item.label;
          return (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: sz(10),
                padding: `${sz(8)}px ${sz(12)}px`,
                borderRadius: sz(6),
                fontSize: sz(14),
                color: isActive ? "#6366f1" : "rgba(255,255,255,0.6)",
                backgroundColor: isActive ? "rgba(238,242,255,0.15)" : "transparent",
              }}
            >
              <span style={{ fontSize: sz(16) }}>{item.emoji}</span>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Bottom avatar - Carlos Garcia */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: sz(10),
          padding: `${sz(16)}px ${sz(20)}px`,
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            width: sz(32),
            height: sz(32),
            borderRadius: "50%",
            backgroundColor: "#f97316",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: sz(12),
            fontWeight: 600,
          }}
        >
          CG
        </div>
        <span
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: sz(14),
          }}
        >
          Carlos Garcia
        </span>
      </div>
    </div>
  );
};

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

  // Typing animation: frames 45-120
  const fullText =
    "I need to get my BC driver's license. I'm from Colombia and my license isn't valid here. I failed the knowledge test last week and need to retake it. Can you build me a complete plan with everything I need to do?";
  const charsTyped = Math.floor(
    interpolate(frame, [45, 120], [0, fullText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const inputText = frame >= 45 && frame < 125 ? fullText.slice(0, charsTyped) : "";

  // Build messages array
  const messages: Array<{ role: string; text: string }> = [
    {
      role: "ai",
      text: "Welcome back, Carlos! How's the move going?",
    },
  ];

  if (frame >= 125) {
    messages.push({
      role: "user",
      text: fullText,
    });
  }

  const showTypingIndicator = frame >= 135;

  // FAB visibility: hidden once chat is open
  const fabOpacity = frame < 30
    ? 1
    : interpolate(chatOpen, [0, 0.3], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  return (
    <AbsoluteFill style={{ backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif" }}>
      {/* Sidebar */}
      <CarlosSidebar format={format} activeItem="Board" sz={sz} />

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
        {/* Heading + Streak */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: sz(24),
          }}
        >
          <h1
            style={{
              fontSize: sz(24),
              fontWeight: "bold",
              color: "#111827",
              margin: 0,
            }}
          >
            My Goals
          </h1>

          {/* Streak counter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: sz(6),
              backgroundColor: "#ffedd5",
              borderRadius: sz(999),
              padding: `${sz(4)}px ${sz(12)}px`,
            }}
          >
            <span style={{ fontSize: sz(16) }}>{"\u{1F525}"}</span>
            <span
              style={{
                fontSize: sz(18),
                fontWeight: 800,
                color: "#f97316",
              }}
            >
              8
            </span>
          </div>
        </div>

        {/* Existing goal card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: sz(8),
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            padding: sz(16),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: sz(8),
              marginBottom: sz(12),
            }}
          >
            <span style={{ fontSize: sz(24) }}>{"\u{1F1E8}\u{1F1E6}"}</span>
            <span style={{ fontSize: sz(18), fontWeight: 600, color: "#111827" }}>
              Settle Into Vancouver
            </span>
          </div>

          {/* Progress bar */}
          <div>
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
                  width: "35%",
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
              4/11 tasks
            </span>
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
              boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
            }}
          >
            <span style={{ fontSize: sz(24) }}>{"\u{1F4AC}"}</span>
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
