import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoFormat } from "../ninety-days/shared/types";
import { Toast } from "../ninety-days/shared/Toast";
import { ConfettiExplosion } from "../ninety-days/shared/ConfettiExplosion";

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

// Board state phases based on frame
type BoardPhase = "initial" | "roadTestDone" | "feesDone" | "allDone";

const getBoardPhase = (frame: number): BoardPhase => {
  if (frame < 45) return "initial";
  if (frame < 90) return "roadTestDone";
  if (frame < 105) return "feesDone";
  return "allDone";
};

interface CardData {
  title: string;
  done: boolean;
  priority?: string;
  badge?: { text: string; bg: string; color: string };
}

const KanbanColumn: React.FC<{
  title: string;
  color: string;
  barColor: string;
  cards: CardData[];
  sz: (n: number) => number;
}> = ({ title, color, barColor, cards, sz }) => (
  <div
    style={{
      flex: 1,
      backgroundColor: "#f3f4f6",
      borderRadius: sz(8),
      padding: sz(8),
      display: "flex",
      flexDirection: "column",
      gap: sz(4),
      minWidth: 0,
    }}
  >
    <div
      style={{
        height: sz(4),
        backgroundColor: barColor,
        borderRadius: sz(2),
        marginBottom: sz(4),
      }}
    />
    <div
      style={{
        fontSize: sz(12),
        fontWeight: 600,
        color,
        marginBottom: sz(4),
      }}
    >
      {title}
    </div>
    {cards.map((card) => (
      <div
        key={card.title}
        style={{
          backgroundColor: "#fff",
          borderRadius: sz(6),
          padding: `${sz(6)}px ${sz(8)}px`,
          borderLeft: `${sz(4)}px solid ${card.done ? "#16a34a" : card.priority === "critical" ? "#dc2626" : "#e5e7eb"}`,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: sz(4),
            fontSize: sz(11),
            color: card.done ? "#9ca3af" : "#111827",
            textDecoration: card.done ? "line-through" : "none",
          }}
        >
          {card.done && <span style={{ fontSize: sz(10) }}>{"\u2705"}</span>}
          <span>{card.title}</span>
        </div>
        {card.badge && (
          <div
            style={{
              display: "inline-block",
              marginTop: sz(3),
              fontSize: sz(9),
              fontWeight: 600,
              backgroundColor: card.badge.bg,
              color: card.badge.color,
              borderRadius: sz(4),
              padding: `${sz(1)}px ${sz(6)}px`,
            }}
          >
            {card.badge.text}
          </div>
        )}
      </div>
    ))}
    {cards.length === 0 && (
      <div style={{ fontSize: sz(11), color: "#9ca3af", textAlign: "center", padding: sz(8) }}>
        Empty
      </div>
    )}
  </div>
);

export const Scene8Victory: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth = format === "landscape" ? sz(256) : 0;
  const topOffset = format === "square" ? sz(48) : 0;
  const bottomOffset = format === "vertical" ? sz(56) : 0;

  const phase = getBoardPhase(frame);

  // Streak value based on phase
  const streak =
    phase === "initial" ? 35 :
    phase === "roadTestDone" ? 36 :
    phase === "feesDone" ? 37 :
    37;

  // Progress percentage based on phase
  const targetProgress =
    phase === "initial" ? 65 :
    phase === "roadTestDone" ? 78 :
    phase === "feesDone" ? 88 :
    100;

  const progressSpring = spring({
    frame: phase === "initial" ? 0 :
           phase === "roadTestDone" ? frame - 45 :
           phase === "feesDone" ? frame - 90 :
           frame - 105,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const prevProgress =
    phase === "initial" ? 65 :
    phase === "roadTestDone" ? 65 :
    phase === "feesDone" ? 78 :
    88;

  const currentProgress = prevProgress + (targetProgress - prevProgress) * progressSpring;

  // Task counts
  const taskLabel =
    phase === "allDone" ? "7/7 tasks \u00B7 14/14 substeps" :
    phase === "feesDone" ? "6/7 tasks" :
    phase === "roadTestDone" ? "5/7 tasks" :
    "4/7 tasks";

  // "Day 35" label at frame 30
  const day35Opacity =
    frame < 30 ? 0 :
    frame < 35 ? interpolate(frame, [30, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) :
    frame < 45 ? 1 :
    interpolate(frame, [45, 50], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Floating card during road test drag (frame 45-69)
  const dragActive = frame >= 45 && frame < 69;
  const dragProgress = dragActive
    ? spring({
        frame: frame - 45,
        fps,
        config: { damping: 20, stiffness: 200 },
      })
    : 0;

  // Toast visibility (frame 69-120)
  const toastOpacity =
    frame < 69 ? 0 :
    frame < 75 ? interpolate(frame, [69, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) :
    frame < 110 ? 1 :
    interpolate(frame, [110, 120], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Board columns based on phase
  const todoCards: CardData[] = [];
  const inProgressCards: CardData[] = [];
  const doneCards: CardData[] = [];

  // Done cards (always present from the start)
  const baseDoneCards: CardData[] = [
    { title: "Study for Knowledge Test", done: true },
    { title: "Book and Take Knowledge Test", done: true },
    { title: "Book Road Test Appointment", done: true },
    { title: "Practice Driving in BC", done: true },
  ];
  doneCards.push(...baseDoneCards);

  if (phase === "initial") {
    todoCards.push(
      { title: "Pay License Fees", done: false },
      { title: "Receive BC Driver's License", done: false },
    );
    inProgressCards.push({
      title: "Take Road Test",
      done: false,
      priority: "critical",
      badge: { text: "critical", bg: "#fee2e2", color: "#b91c1c" },
    });
  } else if (phase === "roadTestDone") {
    todoCards.push(
      { title: "Pay License Fees", done: false },
      { title: "Receive BC Driver's License", done: false },
    );
    doneCards.push({
      title: "Take Road Test",
      done: true,
      badge: { text: "\u2705 passed", bg: "#dcfce7", color: "#166534" },
    });
  } else if (phase === "feesDone") {
    todoCards.push(
      { title: "Receive BC Driver's License", done: false },
    );
    doneCards.push(
      {
        title: "Take Road Test",
        done: true,
        badge: { text: "\u2705 passed", bg: "#dcfce7", color: "#166534" },
      },
      { title: "Pay License Fees", done: true },
    );
  } else {
    // allDone
    doneCards.push(
      {
        title: "Take Road Test",
        done: true,
        badge: { text: "\u2705 passed", bg: "#dcfce7", color: "#166534" },
      },
      { title: "Pay License Fees", done: true },
      { title: "Receive BC Driver's License", done: true },
    );
  }

  // Phase crossfade transitions
  const boardTransition1 =
    frame < 45 ? 0 :
    frame < 50 ? interpolate(frame, [45, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) :
    1;

  // Board pulse at frame 135
  const boardPulse =
    frame < 135 ? 1 :
    frame < 140 ? interpolate(frame, [135, 140], [1, 1.02], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) :
    frame < 145 ? interpolate(frame, [140, 145], [1.02, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) :
    1;

  // Celebration overlay (frame 135-225)
  const overlaySpring =
    frame < 135
      ? 0
      : spring({
          frame: frame - 135,
          fps,
          config: { damping: 12, stiffness: 80 },
        });
  const overlayOpacity =
    frame < 135 ? 0 :
    frame < 225 ? overlaySpring :
    interpolate(frame, [225, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const overlayY = interpolate(overlaySpring, [0, 1], [-80, 0]);
  const floatY = frame >= 135 ? Math.sin(frame * 0.1) * 4 : 0;

  // Golden shimmer on progress bar when 100%
  const shimmerCycle = frame % 60;
  const shimmerX = interpolate(shimmerCycle, [0, 59], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Motivation text
  const motivationText = "Legendary consistency. The compound effect is real.";

  // Entrance animation
  const entranceSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif" }}>
      <CarlosSidebar format={format} activeItem="Board" sz={sz} />

      <div
        style={{
          position: "absolute",
          top: topOffset,
          left: sidebarWidth,
          right: 0,
          bottom: bottomOffset,
          padding: sz(16),
          overflow: "hidden",
          opacity: entranceSpring,
          transform: `scale(${boardPulse})`,
          transformOrigin: "center center",
        }}
      >
        {/* Page heading */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: sz(8),
          }}
        >
          <h1
            style={{
              fontSize: sz(20),
              fontWeight: "bold",
              color: "#111827",
              margin: 0,
            }}
          >
            {"\u{1F697}"} BC Driver{"\u0027"}s License - Non-Canadian Resident
          </h1>
        </div>

        {/* Progress bar + streak row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: sz(12),
            marginBottom: sz(8),
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: "100%",
                height: sz(8),
                backgroundColor: "#e5e7eb",
                borderRadius: sz(4),
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${currentProgress}%`,
                  height: "100%",
                  backgroundColor: "#6366f1",
                  borderRadius: sz(4),
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Golden shimmer when 100% */}
                {currentProgress >= 99.5 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: `${shimmerX}%`,
                      width: sz(40),
                      height: "100%",
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                      transform: "translateX(-50%)",
                    }}
                  />
                )}
              </div>
            </div>
            <div
              style={{
                fontSize: sz(11),
                color: currentProgress >= 99.5 ? "#16a34a" : "#9ca3af",
                marginTop: sz(2),
                fontWeight: currentProgress >= 99.5 ? 500 : 400,
              }}
            >
              {taskLabel}
            </div>
          </div>
          {/* Streak */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: sz(4),
              backgroundColor: "#ffedd5",
              borderRadius: sz(999),
              padding: `${sz(3)}px ${sz(10)}px`,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: sz(14) }}>{"\u{1F525}"}</span>
            <span
              style={{
                fontSize: sz(16),
                fontWeight: 800,
                color: "#f97316",
              }}
            >
              {streak}
            </span>
          </div>
        </div>

        {/* Motivation text */}
        <div
          style={{
            fontSize: sz(10),
            color: "#4b5563",
            marginBottom: sz(8),
            fontStyle: "italic",
          }}
        >
          {motivationText}
        </div>

        {/* Day 35 label */}
        {day35Opacity > 0 && (
          <div
            style={{
              textAlign: "center",
              fontSize: sz(16),
              color: "#4b5563",
              marginBottom: sz(6),
              opacity: day35Opacity,
            }}
          >
            Day 35
          </div>
        )}

        {/* Kanban Board */}
        <div
          style={{
            display: "flex",
            gap: sz(8),
            flex: 1,
            position: "relative",
          }}
        >
          <KanbanColumn
            title="To Do"
            color="#9ca3af"
            barColor="#9ca3af"
            cards={todoCards}
            sz={sz}
          />
          <KanbanColumn
            title="In Progress"
            color="#6366f1"
            barColor="#6366f1"
            cards={inProgressCards}
            sz={sz}
          />
          <KanbanColumn
            title="Done"
            color="#16a34a"
            barColor="#16a34a"
            cards={doneCards}
            sz={sz}
          />

          {/* Floating drag card during road test move */}
          {dragActive && (
            <div
              style={{
                position: "absolute",
                top: sz(40),
                left: `${33 + dragProgress * 34}%`,
                transform: `scale(1.03)`,
                zIndex: 5,
                opacity: 1 - boardTransition1,
              }}
            >
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: sz(6),
                  padding: `${sz(6)}px ${sz(8)}px`,
                  borderLeft: `${sz(4)}px solid #dc2626`,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
                  fontSize: sz(11),
                  color: "#111827",
                  whiteSpace: "nowrap",
                }}
              >
                Take Road Test
                <div
                  style={{
                    display: "inline-block",
                    marginLeft: sz(6),
                    fontSize: sz(9),
                    fontWeight: 600,
                    backgroundColor: "#fee2e2",
                    color: "#b91c1c",
                    borderRadius: sz(4),
                    padding: `${sz(1)}px ${sz(6)}px`,
                  }}
                >
                  critical
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toastOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: topOffset + sz(12),
            right: sz(16),
            zIndex: 30,
            opacity: toastOpacity,
          }}
        >
          <Toast
            message="Road test passed! You're almost there!"
            sz={sz}
            variant="success"
          />
        </div>
      )}

      {/* Confetti at frame 135 */}
      <ConfettiExplosion
        count={30}
        colors={["#6366f1", "#f97316", "#16a34a", "#FFD700", "#ffffff"]}
        originX={0.5}
        originY={0.4}
        triggerFrame={135}
        sz={sz}
      />

      {/* Celebration Overlay */}
      {frame >= 135 && overlayOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1, #4338ca)",
              borderRadius: sz(12),
              padding: `${sz(32)}px ${sz(48)}px`,
              textAlign: "center",
              opacity: overlayOpacity,
              transform: `translateY(${overlayY + floatY}px)`,
              boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
            }}
          >
            <div
              style={{
                fontSize: sz(30),
                fontWeight: "bold",
                color: "#fff",
                marginBottom: sz(8),
              }}
            >
              {"\u{1F389}"} Goal Completed!
            </div>
            <div
              style={{
                fontSize: sz(18),
                color: "rgba(255,255,255,0.8)",
                marginBottom: sz(8),
              }}
            >
              {"\u{1F697}"} BC Driver{"\u0027"}s License - Non-Canadian Resident
            </div>
            <div
              style={{
                fontSize: sz(16),
                color: "rgba(255,255,255,0.6)",
                marginBottom: sz(12),
              }}
            >
              37 days {"\u00B7"} 7 tasks {"\u00B7"} 14 substeps {"\u00B7"} 0 excuses
            </div>
            <div
              style={{
                display: "inline-block",
                backgroundColor: "#ffedd5",
                color: "#ea580c",
                borderRadius: sz(999),
                padding: `${sz(4)}px ${sz(14)}px`,
                fontSize: sz(14),
                fontWeight: 600,
              }}
            >
              {"\u{1F525}"} 37-day streak
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
