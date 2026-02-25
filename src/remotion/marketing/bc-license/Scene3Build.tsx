import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoFormat } from "../ninety-days/shared/types";
import { ChatPanel } from "../ninety-days/shared/ChatPanel";

/* ── Task / substep data ──────────────────────────────────────────── */

interface SubstepData {
  text: string;
  done: boolean;
}

interface TaskCardData {
  title: string;
  priority?: "high" | "critical";
  substeps: SubstepData[];
  startFrame: number;
  expandSubsteps?: boolean;
}

const tasks: TaskCardData[] = [
  {
    title: "Study for Knowledge Test",
    priority: "high",
    startFrame: 90,
    expandSubsteps: true,
    substeps: [
      { text: "Download ICBC practice test app", done: false },
      { text: "Read 'Learn to Drive Smart' guide", done: true },
      { text: "Complete 3 full practice tests with 85%+ score", done: true },
    ],
  },
  {
    title: "Book and Take Knowledge Test",
    priority: "critical",
    startFrame: 114,
    expandSubsteps: true,
    substeps: [
      { text: "Bring 2 pieces of ID + proof of BC address", done: false },
      { text: "Visit ICBC licensing office (Kingsway location)", done: false },
      { text: "Pass knowledge test (40 questions, need 80%)", done: false },
    ],
  },
  {
    title: "Book Road Test Appointment",
    priority: "high",
    startFrame: 138,
    substeps: [
      { text: "Book Class 5 road test online", done: false },
      { text: "Select ICBC driver licensing office", done: false },
    ],
  },
  {
    title: "Practice Driving in BC",
    startFrame: 162,
    substeps: [
      { text: "Practice parallel parking", done: false },
      { text: "Drive BC highway routes", done: false },
    ],
  },
  {
    title: "Take Road Test",
    priority: "critical",
    startFrame: 186,
    substeps: [
      { text: "Arrive 30 min early with required documents", done: false },
      { text: "Complete Class 5 road test", done: false },
    ],
  },
  {
    title: "Pay License Fees",
    startFrame: 210,
    substeps: [
      { text: "Pay licensing fee ($31)", done: false },
    ],
  },
  {
    title: "Receive BC Driver's License",
    startFrame: 228,
    substeps: [
      { text: "Collect license card from ICBC", done: false },
    ],
  },
];

/* ── Inline sidebar for Carlos ─────────────────────────────────── */

const sidebarNavItems = [
  { emoji: "\u{1F4CB}", label: "Board" },
  { emoji: "\u{1F4E1}", label: "Feed" },
  { emoji: "\u{1F3EA}", label: "Marketplace" },
  { emoji: "\u{1F464}", label: "Profile" },
];

const CarlosSidebarMini: React.FC<{
  format: VideoFormat;
  sz: (n: number) => number;
}> = ({ format, sz }) => {
  if (format === "vertical") {
    return null; // no sidebar in vertical split-screen
  }
  if (format === "square") {
    return null; // no sidebar in square split-screen
  }

  // Landscape: thin sidebar on the very left of the main area
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: sz(48),
        backgroundColor: "#1e1b4b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: sz(16),
        gap: sz(12),
        zIndex: 5,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: sz(16), marginBottom: sz(8) }}>{"\u{1F3AF}"}</span>
      {sidebarNavItems.map((item) => (
        <div
          key={item.label}
          style={{
            fontSize: sz(14),
            color: item.label === "Board" ? "#6366f1" : "rgba(255,255,255,0.5)",
          }}
        >
          {item.emoji}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div
        style={{
          width: sz(28),
          height: sz(28),
          borderRadius: "50%",
          backgroundColor: "#f97316",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: sz(9),
          fontWeight: 600,
          marginBottom: sz(12),
        }}
      >
        CG
      </div>
    </div>
  );
};

/* ── Priority badge ───────────────────────────────────────────────── */

const PriorityBadge: React.FC<{
  priority: "high" | "critical";
  sz: (n: number) => number;
}> = ({ priority, sz }) => (
  <div
    style={{
      backgroundColor: "#fee2e2",
      color: "#b91c1c",
      fontSize: sz(10),
      fontWeight: priority === "critical" ? 700 : 500,
      borderRadius: sz(999),
      padding: `${sz(2)}px ${sz(8)}px`,
      lineHeight: 1.3,
      textTransform: "lowercase",
    }}
  >
    {priority}
  </div>
);

/* ── Task card (list view) ────────────────────────────────────────── */

const TaskCard: React.FC<{
  task: TaskCardData;
  sz: (n: number) => number;
  opacity: number;
  translateY: number;
  frame: number;
  fps: number;
}> = ({ task, sz, opacity, translateY, frame, fps }) => {
  const doneCount = task.substeps.filter((s) => s.done).length;
  const totalCount = task.substeps.length;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {/* Main card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: sz(8),
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          padding: `${sz(10)}px ${sz(14)}px`,
          display: "flex",
          alignItems: "center",
          gap: sz(10),
          borderLeft: task.priority
            ? `${sz(4)}px solid #dc2626`
            : `${sz(4)}px solid transparent`,
        }}
      >
        {/* Circle */}
        <div
          style={{
            width: sz(16),
            height: sz(16),
            borderRadius: "50%",
            border: `${sz(2)}px solid #d1d5db`,
            flexShrink: 0,
          }}
        />

        {/* Title */}
        <span
          style={{
            fontSize: sz(14),
            fontWeight: 500,
            color: "#111827",
            flex: 1,
          }}
        >
          {task.title}
        </span>

        {/* Priority badge */}
        {task.priority && <PriorityBadge priority={task.priority} sz={sz} />}

        {/* Substep counter */}
        <span style={{ fontSize: sz(11), color: "#9ca3af", whiteSpace: "nowrap" }}>
          {"\u{1F4CB}"} {doneCount}/{totalCount} substeps
        </span>
      </div>

      {/* Expanded substeps */}
      {task.expandSubsteps && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: sz(4),
            paddingLeft: sz(36),
            marginTop: sz(4),
          }}
        >
          {task.substeps.map((sub, si) => {
            const subDelay = task.startFrame + 12 + si * 5;
            const subSpring = spring({
              frame: frame - subDelay,
              fps,
              config: { damping: 20, stiffness: 200 },
            });

            return (
              <div
                key={si}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: sz(8),
                  opacity: subSpring,
                  transform: `translateY(${(1 - subSpring) * 10}px)`,
                }}
              >
                {/* Circle / check */}
                {sub.done ? (
                  <div
                    style={{
                      width: sz(14),
                      height: sz(14),
                      borderRadius: "50%",
                      backgroundColor: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: sz(9),
                      flexShrink: 0,
                    }}
                  >
                    {"\u2713"}
                  </div>
                ) : (
                  <div
                    style={{
                      width: sz(14),
                      height: sz(14),
                      borderRadius: "50%",
                      border: `${sz(2)}px solid #d1d5db`,
                      flexShrink: 0,
                    }}
                  />
                )}

                {/* Text */}
                <span
                  style={{
                    fontSize: sz(12),
                    color: sub.done ? "#9ca3af" : "#4b5563",
                    textDecoration: sub.done ? "line-through" : "none",
                  }}
                >
                  {sub.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── Main scene ───────────────────────────────────────────────────── */

export const Scene3Build: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  /* ── Chat messages ─────────────────────────────────────────────── */

  // AI response typewriter: frame 15-75  (~196 chars)
  const aiResponseText =
    "I'll create a complete BC driver's license plan for you, Carlos! Since your Colombian license isn't directly transferable and you need to retake the knowledge test, here's everything step by step \u{1F697}";
  const aiCharsTyped = Math.floor(
    interpolate(frame, [15, 75], [0, aiResponseText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Tool pills: staggered at frames 60, 68, 76, 82
  const toolPills = [
    { text: "\u{1F527} create-goal \u2705", startFrame: 60 },
    { text: "\u{1F527} create-task \u00D77 \u2705", startFrame: 68 },
    { text: "\u{1F527} add-substep \u00D714 \u2705", startFrame: 76 },
    { text: "\u{1F527} set-priority \u00D74 \u2705", startFrame: 82 },
  ];

  // Final AI message at frame 249
  const finalAiText =
    "Your plan is ready! 7 tasks, 14 substeps. I've marked the knowledge test tasks as high/critical priority since that's your immediate blocker. First up: finish studying \u2014 you've got 2/3 practice substeps done already. Let's pass that test! \u{1F4AA}";

  const messages: Array<{ role: string; text: string }> = [
    {
      role: "user",
      text: "I need to get my BC driver's license. I'm from Colombia and my license isn't valid here. I failed the knowledge test last week and need to retake it. Can you build me a complete plan with everything I need to do?",
    },
  ];

  if (frame >= 15) {
    messages.push({
      role: "ai",
      text: aiResponseText.slice(0, aiCharsTyped),
    });
  }

  if (frame >= 249) {
    messages.push({
      role: "ai",
      text: finalAiText,
    });
  }

  const showTypingIndicator = frame >= 0 && frame < 15;

  // Chat slides away at frame 270
  const chatSlideAway = frame < 270
    ? 0
    : spring({ frame: frame - 270, fps, config: { damping: 15, stiffness: 120 } });
  const chatTranslateX = interpolate(chatSlideAway, [0, 1], [0, 400]);

  /* ── Main area animations ──────────────────────────────────────── */

  // Existing goal slides up at frame 30
  const existingGoalSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const existingGoalTranslateY = interpolate(existingGoalSpring, [0, 1], [0, -60]);

  // New goal card materializes at frame 45
  const newGoalSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const newGoalScale = interpolate(newGoalSpring, [0, 1], [0.9, 1]);

  // Progress update at frame 240
  const progressSpring = spring({
    frame: frame - 240,
    fps,
    config: { damping: 20, stiffness: 200 },
  });
  // 2 out of 14 substeps completed = ~14.3% -> round to ~8% visually as per spec
  const progressWidth = interpolate(progressSpring, [0, 1], [0, 8]);

  /* ── Layout sizing ─────────────────────────────────────────────── */

  const chatWidth = isVertical ? "100%" : format === "square" ? "40%" : "35%";
  const mainWidth = isVertical ? "100%" : format === "square" ? "60%" : "65%";
  const chatHeight = isVertical ? "35%" : "100%";
  const mainHeight = isVertical ? "65%" : "100%";
  const miniSidebarWidth = format === "landscape" ? sz(48) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Chat panel (top on vertical, right on landscape/square) */}
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
              showTypingIndicator={showTypingIndicator}
            />
          </div>
        )}

        {/* Main app area */}
        <div
          style={{
            width: mainWidth,
            height: mainHeight,
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "row",
          }}
        >
          {/* Mini sidebar (landscape only) */}
          <CarlosSidebarMini format={format} sz={sz} />

          {/* Content */}
          <div
            style={{
              flex: 1,
              marginLeft: miniSidebarWidth,
              padding: sz(14),
              display: "flex",
              flexDirection: "column",
              gap: sz(8),
              overflowY: "auto",
            }}
          >
            {/* Existing goal card */}
            <div
              style={{
                transform: `translateY(${existingGoalTranslateY}px)`,
              }}
            >
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: sz(8),
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  padding: `${sz(10)}px ${sz(14)}px`,
                  display: "flex",
                  alignItems: "center",
                  gap: sz(8),
                }}
              >
                <span style={{ fontSize: sz(18) }}>{"\u{1F1E8}\u{1F1E6}"}</span>
                <span style={{ fontSize: sz(13), fontWeight: 600, color: "#111827", flex: 1 }}>
                  Settle Into Vancouver
                </span>
                <span style={{ fontSize: sz(11), color: "#9ca3af" }}>35%</span>
              </div>
            </div>

            {/* New goal card */}
            {frame >= 45 && (
              <div
                style={{
                  transform: `scale(${newGoalScale})`,
                  opacity: newGoalSpring,
                  transformOrigin: "top center",
                }}
              >
                {/* Goal header */}
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: sz(8),
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    padding: sz(14),
                    marginBottom: sz(8),
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: sz(8),
                      marginBottom: sz(4),
                    }}
                  >
                    <span style={{ fontSize: sz(22) }}>{"\u{1F697}"}</span>
                    <span style={{ fontSize: sz(15), fontWeight: 600, color: "#111827", flex: 1 }}>
                      {"BC Driver's License - Non-Canadian Resident"}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: sz(11),
                      color: "#6b7280",
                      marginBottom: sz(10),
                      lineHeight: 1.3,
                    }}
                  >
                    {"Complete checklist to obtain BC driver's license as a non-Canadian resident in Vancouver"}
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: sz(6),
                      backgroundColor: "#e5e7eb",
                      borderRadius: sz(999),
                      overflow: "hidden",
                      marginBottom: sz(4),
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

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: sz(11), color: "#9ca3af" }}>
                      {frame >= 240 ? "0/7 tasks \u00B7 2/14 substeps" : "0/7 tasks"}
                    </span>
                    <div
                      style={{
                        backgroundColor: "#f3f4f6",
                        borderRadius: sz(999),
                        padding: `${sz(2)}px ${sz(8)}px`,
                        fontSize: sz(10),
                        color: "#4b5563",
                      }}
                    >
                      7 tasks
                    </div>
                  </div>
                </div>

                {/* Task list */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: sz(6),
                  }}
                >
                  {tasks.map((task, i) => {
                    if (frame < task.startFrame) return null;

                    const taskSpring = spring({
                      frame: frame - task.startFrame,
                      fps,
                      config: { damping: 15, stiffness: 120 },
                    });
                    const taskTranslateY = (1 - taskSpring) * 20;

                    return (
                      <TaskCard
                        key={i}
                        task={task}
                        sz={sz}
                        opacity={taskSpring}
                        translateY={taskTranslateY}
                        frame={frame}
                        fps={fps}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
            <div style={{ position: "relative", height: "100%" }}>
              <ChatPanel
                sz={sz}
                messages={messages}
                showTypingIndicator={showTypingIndicator}
              />

              {/* Tool log pills */}
              {frame >= 60 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: sz(60),
                    left: sz(12),
                    right: sz(12),
                    display: "flex",
                    flexDirection: "column",
                    gap: sz(4),
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
                          padding: `${sz(3)}px ${sz(10)}px`,
                          fontSize: sz(10),
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
