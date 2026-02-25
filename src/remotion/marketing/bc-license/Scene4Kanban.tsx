import React from "react";
import {
  AbsoluteFill,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoFormat } from "../ninety-days/shared/types";
import { Toast } from "../ninety-days/shared/Toast";
import { ConfettiExplosion } from "../ninety-days/shared/ConfettiExplosion";

/* ------------------------------------------------------------------ */
/*  Local sidebar (Carlos Garcia / CG instead of Alex M.)             */
/* ------------------------------------------------------------------ */

const navItems = [
  { emoji: "📋", label: "Board" },
  { emoji: "📡", label: "Feed" },
  { emoji: "🏪", label: "Marketplace" },
  { emoji: "👤", label: "Profile" },
];

const BCLicenseSidebar: React.FC<{
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
              color:
                activeItem === item.label
                  ? "#6366f1"
                  : "rgba(255,255,255,0.6)",
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
          🎯 Journey Tracker
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
                backgroundColor: isActive
                  ? "rgba(238,242,255,0.15)"
                  : "transparent",
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
        🎯 Journey Tracker
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
                backgroundColor: isActive
                  ? "rgba(238,242,255,0.15)"
                  : "transparent",
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

/* ------------------------------------------------------------------ */
/*  Kanban card                                                        */
/* ------------------------------------------------------------------ */

interface KanbanCardData {
  title: string;
  priority?: "critical" | "high" | null;
  substeps?: string; // e.g. "0/3 substeps"
  done?: boolean;
  highlighted?: boolean;
}

const KanbanCard: React.FC<{
  card: KanbanCardData;
  sz: (n: number) => number;
  style?: React.CSSProperties;
}> = ({ card, sz, style }) => {
  const borderColor = card.done
    ? "#16a34a"
    : card.priority === "critical" || card.priority === "high"
      ? "#dc2626"
      : "transparent";

  const priorityBadge =
    card.priority === "critical"
      ? { label: "critical", bg: "#fee2e2", color: "#b91c1c" }
      : card.priority === "high"
        ? { label: "high", bg: "#fee2e2", color: "#b91c1c" }
        : null;

  return (
    <div
      style={{
        backgroundColor: card.highlighted ? "#eef2ff" : "#fff",
        borderRadius: sz(8),
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        padding: sz(12),
        borderLeft: `${sz(4)}px solid ${borderColor}`,
        fontFamily: "Arial, sans-serif",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: sz(6),
        }}
      >
        {card.done && (
          <span style={{ fontSize: sz(14), color: "#16a34a" }}>✅</span>
        )}
        <span
          style={{
            fontSize: sz(12),
            fontWeight: 500,
            color: card.done ? "#9ca3af" : "#111827",
            textDecoration: card.done ? "line-through" : "none",
            flex: 1,
          }}
        >
          {card.title}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: sz(6),
          marginTop: sz(6),
        }}
      >
        {priorityBadge && (
          <span
            style={{
              fontSize: sz(9),
              fontWeight: 700,
              color: priorityBadge.color,
              backgroundColor: priorityBadge.bg,
              borderRadius: sz(4),
              padding: `${sz(1)}px ${sz(6)}px`,
            }}
          >
            {priorityBadge.label}
          </span>
        )}
        {card.substeps && (
          <span style={{ fontSize: sz(10), color: "#9ca3af" }}>
            📋 {card.substeps}
          </span>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Column component                                                   */
/* ------------------------------------------------------------------ */

const KanbanColumn: React.FC<{
  title: string;
  titleColor: string;
  barColor: string;
  count: number;
  cards: KanbanCardData[];
  sz: (n: number) => number;
}> = ({ title, titleColor, barColor, count, cards, sz }) => (
  <div
    style={{
      flex: 1,
      backgroundColor: "#f9fafb",
      borderRadius: sz(8),
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}
  >
    {/* Color bar */}
    <div style={{ height: sz(4), backgroundColor: barColor }} />
    {/* Header */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${sz(10)}px ${sz(10)}px ${sz(6)}px`,
      }}
    >
      <span
        style={{
          fontSize: sz(12),
          fontWeight: 600,
          color: titleColor,
          fontFamily: "Arial, sans-serif",
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: sz(10),
          fontWeight: 600,
          color: "#4b5563",
          backgroundColor: "#e5e7eb",
          borderRadius: sz(999),
          width: sz(20),
          height: sz(20),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {count}
      </span>
    </div>
    {/* Cards */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: sz(8),
        padding: `0 ${sz(8)}px ${sz(8)}px`,
        flex: 1,
      }}
    >
      {cards.map((card) => (
        <KanbanCard key={card.title} card={card} sz={sz} />
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Board states                                                       */
/* ------------------------------------------------------------------ */

const todoCardsBefore: KanbanCardData[] = [
  {
    title: "Book and Take Knowledge Test",
    priority: "critical",
    substeps: "0/3 substeps",
  },
  { title: "Book Road Test Appointment", priority: "high" },
  { title: "Take Road Test", priority: "critical" },
  { title: "Pay License Fees" },
  { title: "Receive BC Driver's License" },
];

const inProgressBefore: KanbanCardData[] = [
  {
    title: "Study for Knowledge Test",
    priority: "high",
    substeps: "2/3 substeps",
    highlighted: true,
  },
];

const doneBefore: KanbanCardData[] = [
  { title: "Practice Driving in BC", done: true },
];

const todoCardsAfter: KanbanCardData[] = [...todoCardsBefore];

const inProgressAfter: KanbanCardData[] = [];

const doneAfter: KanbanCardData[] = [
  { title: "Practice Driving in BC", done: true },
  {
    title: "Study for Knowledge Test",
    done: true,
    substeps: "3/3 substeps",
  },
];

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */

export const Scene4Kanban: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth =
    format === "landscape" ? sz(256) : 0;
  const topOffset = format === "square" ? sz(48) : 0;
  const bottomOffset = format === "vertical" ? sz(56) : 0;

  // Phase: before (frame < 30), crossfade (30–50), after (> 50)
  const isDragging = frame >= 30 && frame < 50;
  const isAfter = frame >= 50;

  const beforeOpacity = frame < 30 ? 1 : frame >= 50 ? 0 : interpolate(frame, [30, 50], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const afterOpacity = frame < 30 ? 0 : frame >= 50 ? 1 : interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Floating card during drag
  const floatingX = isDragging
    ? interpolate(frame, [30, 50], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const floatingShadow = isDragging
    ? "0 8px 24px rgba(0,0,0,0.15)"
    : "0 1px 2px rgba(0,0,0,0.05)";
  const floatingScale = isDragging ? 1.02 : 1;

  // Streak counter
  const streakVal = isAfter ? 9 : 8;

  // Progress bar
  const progressTarget = isAfter ? 25 : 15;
  const progressSpring = spring({
    frame: frame - 50,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const progressWidth =
    frame < 50 ? 15 : 15 + (25 - 15) * progressSpring;

  // Toast (appears at frame 50, stays 45 frames)
  const toastVisible = frame >= 50 && frame < 95;
  const toastEntrance = spring({
    frame: frame - 50,
    fps,
    config: { damping: 20, stiffness: 200 },
  });
  const toastFade =
    frame < 85
      ? 1
      : frame >= 95
        ? 0
        : interpolate(frame, [85, 95], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

  // "Book and Take Knowledge Test" highlight at frame 75
  const highlightFrame = frame - 75;
  const highlightOpacity =
    highlightFrame < 0 || highlightFrame > 15
      ? 0
      : highlightFrame <= 7
        ? interpolate(highlightFrame, [0, 7], [0, 0.8], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : interpolate(highlightFrame, [8, 15], [0.8, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

  // Build the highlighted version of todo cards after
  const todoCardsAfterHighlighted = todoCardsAfter.map((card) => ({
    ...card,
    highlighted:
      card.title === "Book and Take Knowledge Test" && highlightOpacity > 0,
  }));

  const renderBoard = (
    todo: KanbanCardData[],
    inProgress: KanbanCardData[],
    done: KanbanCardData[],
  ) => (
    <div
      style={{
        display: "flex",
        gap: sz(12),
        flex: 1,
        minHeight: 0,
      }}
    >
      <KanbanColumn
        title="To Do"
        titleColor="#9ca3af"
        barColor="#9ca3af"
        count={todo.length}
        cards={todo}
        sz={sz}
      />
      <KanbanColumn
        title="In Progress"
        titleColor="#6366f1"
        barColor="#6366f1"
        count={inProgress.length}
        cards={inProgress}
        sz={sz}
      />
      <KanbanColumn
        title="Done"
        titleColor="#16a34a"
        barColor="#16a34a"
        count={done.length}
        cards={done}
        sz={sz}
      />
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f3f4f6",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <BCLicenseSidebar format={format} activeItem="Board" sz={sz} />

      {/* Main content area */}
      <div
        style={{
          position: "absolute",
          top: topOffset,
          left: sidebarWidth,
          right: 0,
          bottom: bottomOffset,
          display: "flex",
          flexDirection: "column",
          padding: sz(16),
          gap: sz(12),
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: sz(12),
                color: "#9ca3af",
                marginBottom: sz(4),
              }}
            >
              Board &gt; BC Driver's License
            </div>
            <div
              style={{
                fontSize: sz(isVertical ? 16 : 24),
                fontWeight: 700,
                color: "#111827",
              }}
            >
              🚗 BC Driver's License - Non-Canadian Resident
            </div>
          </div>

          {/* Streak counter */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: sz(4),
            }}
          >
            <div
              style={{
                backgroundColor: "#ffedd5",
                borderRadius: sz(999),
                padding: `${sz(4)}px ${sz(12)}px`,
                display: "flex",
                alignItems: "center",
                gap: sz(6),
              }}
            >
              <span style={{ fontSize: sz(16) }}>🔥</span>
              <span
                style={{
                  fontSize: sz(16),
                  fontWeight: 700,
                  color: "#f97316",
                }}
              >
                {streakVal}
              </span>
              <span
                style={{
                  fontSize: sz(11),
                  color: "#ea580c",
                }}
              >
                day streak
              </span>
            </div>
            <span
              style={{
                fontSize: sz(10),
                color: "#ea580c",
                fontStyle: "italic",
              }}
            >
              You're on fire. Don't stop now. 🔥
            </span>
          </div>
        </div>

        {/* Progress bar */}
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
              width: `${progressWidth}%`,
              backgroundColor: "#6366f1",
              borderRadius: sz(999),
              transition: "width 0.3s",
            }}
          />
        </div>

        {/* Board states — crossfade */}
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          {/* Before state */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: beforeOpacity,
              display: "flex",
            }}
          >
            {renderBoard(todoCardsBefore, inProgressBefore, doneBefore)}
          </div>

          {/* After state */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: afterOpacity,
              display: "flex",
            }}
          >
            {renderBoard(
              isAfter ? todoCardsAfterHighlighted : todoCardsAfter,
              inProgressAfter,
              doneAfter,
            )}
          </div>

          {/* Floating card during drag */}
          {isDragging && (
            <div
              style={{
                position: "absolute",
                top: sz(60),
                left: `${33 + floatingX * 34}%`,
                width: `${sz(200)}px`,
                zIndex: 20,
                transform: `scale(${floatingScale})`,
                boxShadow: floatingShadow,
              }}
            >
              <KanbanCard
                card={{
                  title: "Study for Knowledge Test",
                  priority: "high",
                  substeps: "2/3 substeps",
                  highlighted: true,
                }}
                sz={sz}
              />
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toastVisible && (
        <div
          style={{
            position: "absolute",
            bottom: sz(24) + bottomOffset,
            right: sz(24),
            zIndex: 30,
            opacity: toastEntrance * toastFade,
            transform: `translateY(${(1 - toastEntrance) * sz(20)}px)`,
          }}
        >
          <Toast
            message="Task completed! 🔥 Streak: 9 days"
            sz={sz}
            variant="success"
          />
        </div>
      )}

      {/* Confetti on task completion */}
      <ConfettiExplosion
        count={10}
        colors={["#6366f1", "#f97316", "#16a34a", "#eab308", "#ec4899"]}
        originX={0.7}
        originY={0.15}
        triggerFrame={50}
        sz={sz}
      />
    </AbsoluteFill>
  );
};
