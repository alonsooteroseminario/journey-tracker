import React from "react";
import {
  AbsoluteFill,
  Sequence,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoFormat } from "../ninety-days/shared/types";
import { Toast } from "../ninety-days/shared/Toast";
import { ConfettiExplosion } from "../ninety-days/shared/ConfettiExplosion";

/* ------------------------------------------------------------------ */
/*  Local sidebar                                                      */
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
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: sz(14) }}>
          Carlos Garcia
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Mini chat bubble                                                   */
/* ------------------------------------------------------------------ */

interface ChatBubble {
  sender: "user" | "ai";
  text: string;
}

interface ToolPill {
  label: string;
}

const MiniChat: React.FC<{
  messages: ChatBubble[];
  toolPills?: ToolPill[];
  sz: (n: number) => number;
}> = ({ messages, toolPills, sz }) => (
  <div
    style={{
      width: sz(250),
      backgroundColor: "#fff",
      borderRadius: sz(8),
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      overflow: "hidden",
      fontFamily: "Arial, sans-serif",
    }}
  >
    {/* Header */}
    <div
      style={{
        backgroundColor: "#1e1b4b",
        padding: `${sz(6)}px ${sz(10)}px`,
        fontSize: sz(10),
        color: "#fff",
        fontWeight: 600,
      }}
    >
      🤖 AI Assistant
    </div>
    <div
      style={{
        padding: sz(8),
        display: "flex",
        flexDirection: "column",
        gap: sz(6),
      }}
    >
      {messages.map((msg, i) => (
        <div
          key={i}
          style={{
            backgroundColor: msg.sender === "user" ? "#eef2ff" : "#f9fafb",
            borderRadius: sz(6),
            padding: `${sz(4)}px ${sz(8)}px`,
            fontSize: sz(9),
            color: msg.sender === "user" ? "#3730a3" : "#374151",
            lineHeight: 1.4,
            alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
          }}
        >
          {msg.text}
        </div>
      ))}
      {toolPills && (
        <div style={{ display: "flex", gap: sz(4), flexWrap: "wrap" }}>
          {toolPills.map((pill, i) => (
            <span
              key={i}
              style={{
                fontSize: sz(8),
                color: "#16a34a",
                backgroundColor: "#f0fdf4",
                borderRadius: sz(4),
                padding: `${sz(1)}px ${sz(6)}px`,
                fontWeight: 500,
              }}
            >
              {pill.label}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Mini kanban card                                                   */
/* ------------------------------------------------------------------ */

const MiniKanbanCard: React.FC<{
  title: string;
  done?: boolean;
  sz: (n: number) => number;
}> = ({ title, done, sz }) => (
  <div
    style={{
      backgroundColor: "#fff",
      borderRadius: sz(4),
      padding: `${sz(4)}px ${sz(6)}px`,
      borderLeft: `${sz(3)}px solid ${done ? "#16a34a" : "#e5e7eb"}`,
      fontSize: sz(8),
      fontFamily: "Arial, sans-serif",
      color: done ? "#9ca3af" : "#111827",
      textDecoration: done ? "line-through" : "none",
      display: "flex",
      alignItems: "center",
      gap: sz(4),
    }}
  >
    {done && <span style={{ fontSize: sz(8) }}>✅</span>}
    {title}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Task list item (goal detail view)                                  */
/* ------------------------------------------------------------------ */

interface TaskItem {
  title: string;
  status: "done" | "in_progress" | "todo";
  expanded?: boolean;
  substeps?: SubstepItem[];
}

interface SubstepItem {
  title: string;
  status: "done" | "in_progress" | "todo";
  highlighted?: boolean;
}

const TaskListItem: React.FC<{
  task: TaskItem;
  sz: (n: number) => number;
  checkAnimProgress?: number; // 0-1, animates the last in_progress substep
}> = ({ task, sz, checkAnimProgress }) => {
  const dotColor =
    task.status === "done"
      ? "#16a34a"
      : task.status === "in_progress"
        ? "#6366f1"
        : "#d1d5db";

  return (
    <div style={{ marginBottom: sz(8) }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: sz(8),
          padding: `${sz(6)}px 0`,
        }}
      >
        {/* Status dot */}
        <div
          style={{
            width: sz(12),
            height: sz(12),
            borderRadius: "50%",
            backgroundColor: dotColor,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {task.status === "done" && (
            <span
              style={{ fontSize: sz(8), color: "#fff", lineHeight: 1 }}
            >
              ✓
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: sz(13),
            fontWeight: 500,
            color: task.status === "done" ? "#9ca3af" : "#111827",
            textDecoration: task.status === "done" ? "line-through" : "none",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {task.title}
        </span>
      </div>

      {/* Substeps */}
      {task.expanded && task.substeps && (
        <div style={{ paddingLeft: sz(32) }}>
          {task.substeps.map((sub, idx) => {
            // If this substep is in_progress and we have check animation
            const isAnimating =
              sub.status === "in_progress" &&
              checkAnimProgress !== undefined &&
              checkAnimProgress > 0;
            const effectiveStatus = isAnimating && checkAnimProgress >= 1
              ? "done"
              : sub.status;
            const subDotColor =
              effectiveStatus === "done"
                ? "#16a34a"
                : effectiveStatus === "in_progress"
                  ? "#6366f1"
                  : "#d1d5db";

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: sz(6),
                  padding: `${sz(4)}px 0`,
                  backgroundColor: sub.highlighted ? "#eef2ff" : "transparent",
                  borderRadius: sz(4),
                  paddingLeft: sub.highlighted ? sz(4) : 0,
                  paddingRight: sub.highlighted ? sz(4) : 0,
                }}
              >
                {/* Substep check circle / animated check */}
                <div
                  style={{
                    width: sz(14),
                    height: sz(14),
                    borderRadius: "50%",
                    backgroundColor: subDotColor,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  {(effectiveStatus === "done" || isAnimating) && (
                    <svg
                      width={sz(10)}
                      height={sz(10)}
                      viewBox="0 0 20 20"
                      style={{ position: "absolute" }}
                    >
                      <path
                        d="M 4 10 L 8 14 L 16 6"
                        fill="none"
                        stroke="#fff"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={20}
                        strokeDashoffset={
                          isAnimating && checkAnimProgress < 1
                            ? 20 * (1 - checkAnimProgress)
                            : 0
                        }
                      />
                    </svg>
                  )}
                </div>
                <span
                  style={{
                    fontSize: sz(11),
                    color:
                      effectiveStatus === "done" ? "#9ca3af" : "#374151",
                    textDecoration:
                      effectiveStatus === "done" ? "line-through" : "none",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {sub.title}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Streak chip                                                        */
/* ------------------------------------------------------------------ */

const StreakChip: React.FC<{
  value: number;
  sz: (n: number) => number;
  scale?: number;
}> = ({ value, sz, scale = 1 }) => (
  <div
    style={{
      backgroundColor: "#ffedd5",
      borderRadius: sz(999),
      padding: `${sz(4)}px ${sz(12)}px`,
      display: "flex",
      alignItems: "center",
      gap: sz(6),
      transform: `scale(${scale})`,
    }}
  >
    <span style={{ fontSize: sz(16) }}>🔥</span>
    <span style={{ fontSize: sz(16), fontWeight: 700, color: "#f97316" }}>
      {value}
    </span>
    <span style={{ fontSize: sz(11), color: "#ea580c" }}>day streak</span>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Progress bar                                                       */
/* ------------------------------------------------------------------ */

const ProgressBar: React.FC<{
  percent: number;
  sz: (n: number) => number;
}> = ({ percent, sz }) => (
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
        width: `${percent}%`,
        backgroundColor: "#6366f1",
        borderRadius: sz(999),
      }}
    />
  </div>
);

/* ------------------------------------------------------------------ */
/*  Mini kanban board                                                   */
/* ------------------------------------------------------------------ */

const MiniKanbanColumn: React.FC<{
  title: string;
  barColor: string;
  count: number;
  cards: { title: string; done?: boolean }[];
  sz: (n: number) => number;
}> = ({ title, barColor, count, cards, sz }) => (
  <div
    style={{
      flex: 1,
      backgroundColor: "#f9fafb",
      borderRadius: sz(6),
      overflow: "hidden",
    }}
  >
    <div style={{ height: sz(3), backgroundColor: barColor }} />
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${sz(4)}px ${sz(6)}px`,
      }}
    >
      <span
        style={{
          fontSize: sz(8),
          fontWeight: 600,
          color: barColor,
          fontFamily: "Arial, sans-serif",
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: sz(7),
          fontWeight: 600,
          color: "#4b5563",
          backgroundColor: "#e5e7eb",
          borderRadius: sz(999),
          width: sz(14),
          height: sz(14),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {count}
      </span>
    </div>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: sz(3),
        padding: `0 ${sz(4)}px ${sz(4)}px`,
      }}
    >
      {cards.map((card) => (
        <MiniKanbanCard
          key={card.title}
          title={card.title}
          done={card.done}
          sz={sz}
        />
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Vignettes                                                          */
/* ------------------------------------------------------------------ */

const Vignette1: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth = format === "landscape" ? sz(256) : 0;
  const topOffset = format === "square" ? sz(48) : 0;
  const bottomOffset = format === "vertical" ? sz(56) : 0;

  const chatEntrance = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#f3f4f6", fontFamily: "Arial, sans-serif" }}
    >
      <BCLicenseSidebar format={format} activeItem="Board" sz={sz} />
      <div
        style={{
          position: "absolute",
          top: topOffset,
          left: sidebarWidth,
          right: 0,
          bottom: bottomOffset,
          padding: sz(12),
          display: "flex",
          flexDirection: "column",
          gap: sz(8),
        }}
      >
        {/* Day label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: sz(10),
              fontWeight: 700,
              color: "#6366f1",
              backgroundColor: "#eef2ff",
              padding: `${sz(2)}px ${sz(8)}px`,
              borderRadius: sz(4),
            }}
          >
            DAY 10
          </span>
          <StreakChip value={10} sz={sz} />
        </div>

        <ProgressBar percent={20} sz={sz} />

        {/* Mini board */}
        <div style={{ display: "flex", gap: sz(6), flex: 1 }}>
          <MiniKanbanColumn
            title="To Do"
            barColor="#9ca3af"
            count={4}
            cards={[
              { title: "Book Road Test" },
              { title: "Take Road Test" },
              { title: "Pay Fees" },
              { title: "Receive License" },
            ]}
            sz={sz}
          />
          <MiniKanbanColumn
            title="In Progress"
            barColor="#6366f1"
            count={1}
            cards={[{ title: "Book Knowledge Test" }]}
            sz={sz}
          />
          <MiniKanbanColumn
            title="Done"
            barColor="#16a34a"
            count={2}
            cards={[
              { title: "Study for Knowledge Test", done: true },
              { title: "Practice Driving", done: true },
            ]}
            sz={sz}
          />
        </div>
      </div>

      {/* Mini chat */}
      <div
        style={{
          position: "absolute",
          bottom: sz(16) + bottomOffset,
          right: sz(16),
          zIndex: 20,
          opacity: chatEntrance,
          transform: `translateY(${(1 - chatEntrance) * sz(20)}px)`,
        }}
      >
        <MiniChat
          messages={[
            { sender: "user", text: "I passed all practice tests with 90%+" },
            {
              sender: "ai",
              text: "Amazing! Time to book the real test. I'll move 'Book Knowledge Test' to In Progress 🎯",
            },
          ]}
          toolPills={[{ label: "🔧 update-task-status ✅" }]}
          sz={sz}
        />
      </div>
    </AbsoluteFill>
  );
};

const Vignette2: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth = format === "landscape" ? sz(256) : 0;
  const topOffset = format === "square" ? sz(48) : 0;
  const bottomOffset = format === "vertical" ? sz(56) : 0;

  // Check animation at local frame 30 (within this vignette)
  const checkFrame = frame - 30;
  const checkProgress =
    checkFrame < 0
      ? 0
      : checkFrame >= 10
        ? 1
        : interpolate(checkFrame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

  // Progress bar
  const progressSpring = spring({
    frame: checkFrame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const progressVal = checkFrame < 0 ? 35 : 35 + 7 * progressSpring;

  // Task status after check
  const bookTaskStatus: "in_progress" | "done" =
    checkProgress >= 1 ? "done" : "in_progress";

  // Streak pulse at check
  const streakScale = spring({
    frame: checkFrame,
    fps,
    config: { damping: 8, stiffness: 150 },
  });
  const streakPulse = checkFrame >= 0 ? 1 + 0.1 * (1 - streakScale) : 1;

  // "Two Weeks!" float text
  const weekTextOpacity =
    checkFrame < 0 || checkFrame >= 24
      ? 0
      : checkFrame < 12
        ? interpolate(checkFrame, [0, 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : interpolate(checkFrame, [13, 24], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
  const weekTextY =
    checkFrame < 0
      ? 0
      : interpolate(checkFrame, [0, 24], [0, -20], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const tasks: TaskItem[] = [
    { title: "Study for Knowledge Test", status: "done" },
    {
      title: "Book and Take Knowledge Test",
      status: bookTaskStatus,
      expanded: true,
      substeps: [
        {
          title: "Bring 2 pieces of ID + proof of BC address",
          status: "done",
        },
        {
          title: "Visit ICBC licensing office (Kingsway location)",
          status: "done",
        },
        {
          title: "Pass knowledge test (40 questions, need 80%)",
          status: "in_progress",
          highlighted: true,
        },
      ],
    },
    { title: "Book Road Test Appointment", status: "todo" },
    { title: "Practice Driving in BC", status: "done" },
    { title: "Take Road Test", status: "todo" },
    { title: "Pay License Fees", status: "todo" },
    { title: "Receive BC Driver's License", status: "todo" },
  ];

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#f3f4f6", fontFamily: "Arial, sans-serif" }}
    >
      <BCLicenseSidebar format={format} activeItem="Board" sz={sz} />
      <div
        style={{
          position: "absolute",
          top: topOffset,
          left: sidebarWidth,
          right: 0,
          bottom: bottomOffset,
          padding: sz(16),
          display: "flex",
          flexDirection: "column",
          gap: sz(8),
          overflow: "hidden",
        }}
      >
        {/* Day + Streak */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: sz(10),
              fontWeight: 700,
              color: "#6366f1",
              backgroundColor: "#eef2ff",
              padding: `${sz(2)}px ${sz(8)}px`,
              borderRadius: sz(4),
            }}
          >
            DAY 14
          </span>
          <div style={{ position: "relative" }}>
            <StreakChip value={14} sz={sz} scale={streakPulse} />
            {checkFrame >= 0 && (
              <div
                style={{
                  position: "absolute",
                  top: sz(-16),
                  left: "50%",
                  transform: `translateX(-50%) translateY(${weekTextY}px)`,
                  fontSize: sz(10),
                  fontWeight: 700,
                  color: "#f97316",
                  opacity: weekTextOpacity,
                  whiteSpace: "nowrap",
                }}
              >
                ⚡ Two Weeks!
              </div>
            )}
          </div>
        </div>

        {/* Goal header */}
        <div
          style={{
            fontSize: sz(isVertical ? 14 : 18),
            fontWeight: 700,
            color: "#111827",
          }}
        >
          🚗 BC Driver's License - Non-Canadian Resident
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: sz(8),
          }}
        >
          <span style={{ fontSize: sz(11), color: "#4b5563" }}>
            Progress: {Math.round(progressVal)}%
          </span>
        </div>
        <ProgressBar percent={progressVal} sz={sz} />

        {/* Task list */}
        <div
          style={{
            flex: 1,
            overflowY: "hidden",
            backgroundColor: "#fff",
            borderRadius: sz(8),
            padding: sz(12),
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          {tasks.map((task) => (
            <TaskListItem
              key={task.title}
              task={task}
              sz={sz}
              checkAnimProgress={
                task.title === "Book and Take Knowledge Test"
                  ? checkProgress
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Confetti for 2-week milestone */}
      <ConfettiExplosion
        count={8}
        colors={["#f97316", "#eab308", "#6366f1", "#ec4899"]}
        originX={0.85}
        originY={0.08}
        triggerFrame={30}
        sz={sz}
      />
    </AbsoluteFill>
  );
};

const Vignette3: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth = format === "landscape" ? sz(256) : 0;
  const topOffset = format === "square" ? sz(48) : 0;
  const bottomOffset = format === "vertical" ? sz(56) : 0;

  const chatEntrance = spring({
    frame: frame - 5,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#f3f4f6", fontFamily: "Arial, sans-serif" }}
    >
      <BCLicenseSidebar format={format} activeItem="Board" sz={sz} />
      <div
        style={{
          position: "absolute",
          top: topOffset,
          left: sidebarWidth,
          right: 0,
          bottom: bottomOffset,
          padding: sz(12),
          display: "flex",
          flexDirection: "column",
          gap: sz(8),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: sz(10),
              fontWeight: 700,
              color: "#6366f1",
              backgroundColor: "#eef2ff",
              padding: `${sz(2)}px ${sz(8)}px`,
              borderRadius: sz(4),
            }}
          >
            DAY 18
          </span>
          <StreakChip value={18} sz={sz} />
        </div>

        <ProgressBar percent={50} sz={sz} />

        {/* Mini board */}
        <div style={{ display: "flex", gap: sz(6), flex: 1 }}>
          <MiniKanbanColumn
            title="To Do"
            barColor="#9ca3af"
            count={3}
            cards={[
              { title: "Take Road Test" },
              { title: "Pay Fees" },
              { title: "Receive License" },
            ]}
            sz={sz}
          />
          <MiniKanbanColumn
            title="In Progress"
            barColor="#6366f1"
            count={1}
            cards={[{ title: "Book Road Test Appt." }]}
            sz={sz}
          />
          <MiniKanbanColumn
            title="Done"
            barColor="#16a34a"
            count={3}
            cards={[
              { title: "Study for Knowledge Test", done: true },
              { title: "Book & Take Knowledge Test", done: true },
              { title: "Practice Driving", done: true },
            ]}
            sz={sz}
          />
        </div>
      </div>

      {/* Mini chat */}
      <div
        style={{
          position: "absolute",
          bottom: sz(16) + bottomOffset,
          right: sz(16),
          zIndex: 20,
          opacity: chatEntrance,
          transform: `translateY(${(1 - chatEntrance) * sz(20)}px)`,
        }}
      >
        <MiniChat
          messages={[
            { sender: "user", text: "Knowledge test passed! What's next?" },
            {
              sender: "ai",
              text: "Congrats! 🎉 Next: book your road test. ICBC wait times are 3-6 weeks, so book NOW.",
            },
          ]}
          toolPills={[
            { label: "🔧 update-task-status ✅" },
            { label: "🔧 update-priority ✅" },
          ]}
          sz={sz}
        />
      </div>
    </AbsoluteFill>
  );
};

const Vignette4: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth = format === "landscape" ? sz(256) : 0;
  const topOffset = format === "square" ? sz(48) : 0;
  const bottomOffset = format === "vertical" ? sz(56) : 0;

  // Streak counter animates 18->28 over first 60 frames
  const streakVal =
    frame >= 60
      ? 28
      : Math.round(
          interpolate(frame, [0, 60], [18, 28], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        );

  // Board crossfade at frame 15-35
  const boardBefore =
    frame < 15 ? 1 : frame >= 35 ? 0 : interpolate(frame, [15, 35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const boardAfter =
    frame < 15 ? 0 : frame >= 35 ? 1 : interpolate(frame, [15, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Progress
  const progressSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const progressVal = frame < 15 ? 50 : 50 + 15 * progressSpring;

  // 3-week streak pulse
  const weekPulse = spring({
    frame: frame - 30,
    fps,
    config: { damping: 8, stiffness: 150 },
  });
  const streakScale = frame >= 30 && frame < 50 ? 1 + 0.1 * (1 - weekPulse) : 1;

  // Fade out frames 75-90
  const fadeOut =
    frame < 75 ? 1 : interpolate(frame, [75, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f3f4f6",
        fontFamily: "Arial, sans-serif",
        opacity: fadeOut,
      }}
    >
      <BCLicenseSidebar format={format} activeItem="Board" sz={sz} />
      <div
        style={{
          position: "absolute",
          top: topOffset,
          left: sidebarWidth,
          right: 0,
          bottom: bottomOffset,
          padding: sz(12),
          display: "flex",
          flexDirection: "column",
          gap: sz(8),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: sz(10),
              fontWeight: 700,
              color: "#6366f1",
              backgroundColor: "#eef2ff",
              padding: `${sz(2)}px ${sz(8)}px`,
              borderRadius: sz(4),
            }}
          >
            DAY {streakVal}
          </span>
          <StreakChip value={streakVal} sz={sz} scale={streakScale} />
        </div>

        <ProgressBar percent={progressVal} sz={sz} />

        {/* Board states crossfade */}
        <div style={{ flex: 1, position: "relative" }}>
          {/* Before: To Do 3, In Progress 1, Done 3 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: boardBefore,
              display: "flex",
              gap: sz(6),
            }}
          >
            <MiniKanbanColumn
              title="To Do"
              barColor="#9ca3af"
              count={3}
              cards={[
                { title: "Take Road Test" },
                { title: "Pay Fees" },
                { title: "Receive License" },
              ]}
              sz={sz}
            />
            <MiniKanbanColumn
              title="In Progress"
              barColor="#6366f1"
              count={1}
              cards={[{ title: "Book Road Test Appt." }]}
              sz={sz}
            />
            <MiniKanbanColumn
              title="Done"
              barColor="#16a34a"
              count={3}
              cards={[
                { title: "Study for Knowledge Test", done: true },
                { title: "Book & Take Knowledge Test", done: true },
                { title: "Practice Driving", done: true },
              ]}
              sz={sz}
            />
          </div>

          {/* After: To Do 3, In Progress 0, Done 4 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: boardAfter,
              display: "flex",
              gap: sz(6),
            }}
          >
            <MiniKanbanColumn
              title="To Do"
              barColor="#9ca3af"
              count={3}
              cards={[
                { title: "Take Road Test" },
                { title: "Pay Fees" },
                { title: "Receive License" },
              ]}
              sz={sz}
            />
            <MiniKanbanColumn
              title="In Progress"
              barColor="#6366f1"
              count={0}
              cards={[]}
              sz={sz}
            />
            <MiniKanbanColumn
              title="Done"
              barColor="#16a34a"
              count={4}
              cards={[
                { title: "Study for Knowledge Test", done: true },
                { title: "Book & Take Knowledge Test", done: true },
                { title: "Practice Driving", done: true },
                { title: "Book Road Test Appt.", done: true },
              ]}
              sz={sz}
            />
          </div>
        </div>
      </div>

      {/* 3-week confetti */}
      <ConfettiExplosion
        count={6}
        colors={["#f97316", "#eab308", "#6366f1", "#16a34a"]}
        originX={0.85}
        originY={0.08}
        triggerFrame={30}
        sz={sz}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Scene                                                         */
/* ------------------------------------------------------------------ */

export const Scene5Grind: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();

  // Cross-dissolve helper: overlap = 10 frames at boundaries
  // V1: 0-45, V2: 45-105, V3: 105-150, V4: 150-240
  // Dissolves: 35-45, 95-105, 140-150

  // Fade between vignettes
  const v1Opacity =
    frame < 35
      ? 1
      : frame >= 45
        ? 0
        : interpolate(frame, [35, 45], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

  const v2Opacity =
    frame < 35
      ? 0
      : frame < 45
        ? interpolate(frame, [35, 45], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : frame < 95
          ? 1
          : frame >= 105
            ? 0
            : interpolate(frame, [95, 105], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

  const v3Opacity =
    frame < 95
      ? 0
      : frame < 105
        ? interpolate(frame, [95, 105], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : frame < 140
          ? 1
          : frame >= 150
            ? 0
            : interpolate(frame, [140, 150], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

  const v4Opacity =
    frame < 140
      ? 0
      : frame < 150
        ? interpolate(frame, [140, 150], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#f3f4f6" }}>
      {/* Vignette 1 */}
      <Sequence from={0} durationInFrames={45}>
        <AbsoluteFill style={{ opacity: v1Opacity }}>
          <Vignette1 format={format} />
        </AbsoluteFill>
      </Sequence>

      {/* Vignette 2 */}
      <Sequence from={35} durationInFrames={70}>
        <AbsoluteFill style={{ opacity: v2Opacity }}>
          <Vignette2 format={format} />
        </AbsoluteFill>
      </Sequence>

      {/* Vignette 3 */}
      <Sequence from={95} durationInFrames={55}>
        <AbsoluteFill style={{ opacity: v3Opacity }}>
          <Vignette3 format={format} />
        </AbsoluteFill>
      </Sequence>

      {/* Vignette 4 */}
      <Sequence from={140} durationInFrames={100}>
        <AbsoluteFill style={{ opacity: v4Opacity }}>
          <Vignette4 format={format} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
