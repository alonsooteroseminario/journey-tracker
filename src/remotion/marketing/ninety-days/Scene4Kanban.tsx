import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoFormat, TaskData } from "./shared/types";
import { Sidebar } from "./shared/Sidebar";
import { StreakCounter } from "./shared/StreakCounter";
import { KanbanCard } from "./shared/KanbanCard";
import { Toast } from "./shared/Toast";
import { ConfettiExplosion } from "./shared/ConfettiExplosion";

// Initial board state (Day 12)
const initialTodo: TaskData[] = [
  { title: "Wireframe the homepage layout", status: "todo", substeps: 3, phase: 1 },
  { title: "Design the projects showcase", status: "todo", substeps: 3, phase: 1 },
  { title: "Build the homepage with hero", status: "todo", substeps: 3, phase: 2 },
  { title: "Projects grid with filtering", status: "todo", substeps: 3, phase: 2 },
  { title: "Build the about/contact page", status: "todo", substeps: 3, phase: 2 },
  { title: "Responsive design & dark mode", status: "todo", substeps: 3, phase: 2 },
  { title: "Write case studies for 3 projects", status: "todo", substeps: 3, phase: 3 },
  { title: "Set up custom domain & hosting", status: "todo", substeps: 3, phase: 3 },
];

const initialInProgress: TaskData[] = [
  { title: "Choose a tech stack", status: "in_progress", priority: "high", substeps: 3, phase: 1 },
  { title: "Research portfolio inspirations", status: "in_progress", substeps: 3, phase: 1 },
];

const initialDone: TaskData[] = [
  { title: "Set up project repository", status: "done", substeps: 3, phase: 1 },
  { title: "Install Next.js + Tailwind", status: "done", substeps: 3, phase: 1 },
];

// Later board state (after time-lapse, ~Day 23)
const laterTodo: TaskData[] = [
  { title: "Write case studies for 3 projects", status: "todo", substeps: 3, phase: 3 },
  { title: "SEO optimization and meta tags", status: "todo", substeps: 3, phase: 3 },
  { title: "Launch and share on social media", status: "todo", substeps: 3, phase: 3 },
  { title: "Set up custom domain & hosting", status: "todo", substeps: 3, phase: 3 },
];

const laterInProgress: TaskData[] = [
  { title: "Responsive design & dark mode", status: "in_progress", priority: "medium", substeps: 3, phase: 2 },
  { title: "Build the about/contact page", status: "in_progress", substeps: 3, phase: 2 },
];

const laterDone: TaskData[] = [
  { title: "Set up project repository", status: "done", substeps: 3, phase: 1 },
  { title: "Install Next.js + Tailwind", status: "done", substeps: 3, phase: 1 },
  { title: "Research portfolio inspirations", status: "done", substeps: 3, phase: 1 },
  { title: "Choose a tech stack", status: "done", substeps: 3, phase: 1 },
  { title: "Wireframe the homepage layout", status: "done", substeps: 3, phase: 1 },
  { title: "Design the projects showcase", status: "done", substeps: 3, phase: 1 },
];

// Final board state (after Day 30+ time-lapse)
const finalTodo: TaskData[] = [
  { title: "SEO optimization and meta tags", status: "todo", substeps: 3, phase: 3 },
  { title: "Launch and share on social media", status: "todo", substeps: 3, phase: 3 },
];

const finalInProgress: TaskData[] = [
  { title: "Write case studies for 3 projects", status: "in_progress", substeps: 3, phase: 3 },
  { title: "Set up custom domain & hosting", status: "in_progress", substeps: 3, phase: 3 },
];

const finalDone: TaskData[] = [
  { title: "Set up project repository", status: "done", substeps: 3, phase: 1 },
  { title: "Install Next.js + Tailwind", status: "done", substeps: 3, phase: 1 },
  { title: "Research portfolio inspirations", status: "done", substeps: 3, phase: 1 },
  { title: "Choose a tech stack", status: "done", substeps: 3, phase: 1 },
  { title: "Wireframe the homepage layout", status: "done", substeps: 3, phase: 1 },
  { title: "Design the projects showcase", status: "done", substeps: 3, phase: 1 },
  { title: "Build the homepage with hero", status: "done", substeps: 3, phase: 2 },
  { title: "Projects grid with filtering", status: "done", substeps: 3, phase: 2 },
];

export const Scene4Kanban: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth = format === "landscape" ? sz(256) : 0;
  const topBarHeight = format === "square" ? sz(48) : 0;

  // Streak counter value
  const getStreak = (): number => {
    if (frame < 15) return 12;
    if (frame < 60) return 13;
    // Time-lapse 13->23 over frames 60-105
    if (frame < 105) {
      return Math.floor(
        interpolate(frame, [60, 105], [13, 23], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      );
    }
    if (frame < 120) return 23;
    // Day 30 milestone pulse area
    if (frame < 180) {
      return Math.floor(
        interpolate(frame, [120, 140], [23, 30], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      );
    }
    // Final time-lapse 30->45 over frames 180-210
    if (frame < 210) {
      return Math.floor(
        interpolate(frame, [180, 210], [30, 45], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      );
    }
    return 45;
  };

  const streak = getStreak();

  // Day label
  const dayLabelOpacity =
    frame >= 15 && frame < 45
      ? interpolate(frame, [15, 20, 40, 45], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  // Card move animation: frame 15-33
  const cardMoveSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Toast visibility: frame 15-50
  const toastOpacity =
    frame >= 18 && frame < 55
      ? frame < 22
        ? interpolate(frame, [18, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : frame > 50
          ? interpolate(frame, [50, 55], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : 1
      : 0;

  // Board state crossfade at frame 60-105
  const boardCrossfade =
    frame < 60
      ? 0
      : frame < 105
        ? interpolate(frame, [60, 105], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : 1;

  // Progress bar
  const getProgress = (): number => {
    if (frame < 60) return 17; // ~2/12
    if (frame < 105) {
      return Math.floor(interpolate(frame, [60, 105], [17, 50], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    }
    if (frame < 180) return 50;
    if (frame < 210) {
      return Math.floor(interpolate(frame, [180, 210], [50, 67], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    }
    return 67;
  };

  const progress = getProgress();

  // Day 30 milestone celebration: frame 120-170
  const isMilestone = frame >= 120 && frame < 170;
  const milestoneSpring = spring({
    frame: frame - 120,
    fps,
    config: { damping: 8, stiffness: 150 },
  });
  const streakGlowing = frame >= 120 && frame < 170;

  // Milestone toast
  const milestoneToastOpacity =
    frame >= 125 && frame < 175
      ? frame < 130
        ? interpolate(frame, [125, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : frame > 170
          ? interpolate(frame, [170, 175], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : 1
      : 0;

  // Milestone motivational text
  const motivationOpacity =
    frame >= 130 && frame < 170
      ? frame < 135
        ? interpolate(frame, [130, 135], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : frame > 165
          ? interpolate(frame, [165, 170], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : 1
      : 0;

  // Second time-lapse crossfade (frames 180-210): from laterDone state to finalDone state
  const boardCrossfade2 =
    frame < 180
      ? 0
      : frame < 210
        ? interpolate(frame, [180, 210], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : 1;

  // Scene fade out at frame 225
  const sceneFade = frame < 225
    ? 1
    : interpolate(frame, [225, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Determine which board to show
  const getCurrentBoard = () => {
    if (frame < 60) {
      // Before time-lapse: show initial state but with card moving at frame 15
      if (frame >= 15 && cardMoveSpring < 1) {
        // Card is animating from In Progress to Done
        return {
          todo: initialTodo,
          inProgress: initialInProgress.slice(1), // Remove "Research" (it's animating)
          done: [...initialDone, { ...initialInProgress[1], status: "done" as const }],
          movingCard: initialInProgress[1],
        };
      }
      if (frame >= 15) {
        return {
          todo: initialTodo,
          inProgress: initialInProgress.slice(1),
          done: [...initialDone, { ...initialInProgress[1], status: "done" as const }],
        };
      }
      return { todo: initialTodo, inProgress: initialInProgress, done: initialDone };
    }
    if (frame < 180) {
      // Cross-fading to later state
      return { todo: laterTodo, inProgress: laterInProgress, done: laterDone };
    }
    // After frame 180: cross-fading to final state
    return { todo: finalTodo, inProgress: finalInProgress, done: finalDone };
  };

  const board = getCurrentBoard();

  const columns = [
    { title: "To Do", accentColor: "#9ca3af", cards: board.todo },
    { title: "In Progress", accentColor: "#6366f1", cards: board.inProgress },
    { title: "Done", accentColor: "#16a34a", cards: board.done },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif", opacity: sceneFade }}>
      <Sidebar format={format} activeItem="Board" sz={sz} />

      {/* Main content area */}
      <div
        style={{
          position: "absolute",
          top: topBarHeight,
          left: sidebarWidth,
          right: 0,
          bottom: format === "vertical" ? sz(56) : 0,
          display: "flex",
          flexDirection: "column",
          padding: sz(16),
          overflow: "hidden",
        }}
      >
        {/* Header: title + streak */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: sz(16),
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
            💻 Build Portfolio Website
          </h1>
          <div
            style={{
              transform: isMilestone ? `scale(${0.9 + milestoneSpring * 0.1})` : "scale(1)",
            }}
          >
            <StreakCounter
              streak={streak}
              sz={sz}
              showMotivation={false}
              glowing={streakGlowing}
            />
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: sz(12) }}>
          <div
            style={{
              height: sz(6),
              backgroundColor: "#e5e7eb",
              borderRadius: sz(999),
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                backgroundColor: "#6366f1",
                borderRadius: sz(999),
                transition: "width 0.3s",
              }}
            />
          </div>
          <span style={{ fontSize: sz(12), color: "#9ca3af", marginTop: sz(4), display: "block" }}>
            {progress}% complete
          </span>
        </div>

        {/* Day label */}
        {dayLabelOpacity > 0 && (
          <div
            style={{
              position: "absolute",
              top: sz(8),
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: sz(16),
              color: "#4b5563",
              fontWeight: 600,
              opacity: dayLabelOpacity,
              backgroundColor: "#f3f4f6",
              padding: `${sz(4)}px ${sz(16)}px`,
              borderRadius: sz(999),
              zIndex: 5,
            }}
          >
            Day 12
          </div>
        )}

        {/* Kanban columns */}
        <div
          style={{
            display: "flex",
            gap: sz(12),
            flex: 1,
            overflow: "hidden",
            flexDirection: isVertical ? "column" : "row",
          }}
        >
          {columns.map((col) => (
            <div
              key={col.title}
              style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                borderRadius: sz(8),
                padding: sz(8),
                display: "flex",
                flexDirection: "column",
                gap: sz(6),
                overflow: "hidden",
              }}
            >
              {/* Column header with accent bar */}
              <div
                style={{
                  borderTop: `${sz(4)}px solid ${col.accentColor}`,
                  borderRadius: `${sz(4)}px ${sz(4)}px 0 0`,
                  paddingTop: sz(8),
                  marginBottom: sz(4),
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingLeft: sz(4),
                    paddingRight: sz(4),
                  }}
                >
                  <span
                    style={{
                      fontSize: sz(13),
                      fontWeight: 600,
                      color: col.accentColor,
                    }}
                  >
                    {col.title}
                  </span>
                  <span
                    style={{
                      fontSize: sz(11),
                      color: "#9ca3af",
                      backgroundColor: "#e5e7eb",
                      borderRadius: sz(999),
                      padding: `${sz(2)}px ${sz(8)}px`,
                    }}
                  >
                    {col.cards.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: sz(6),
                  overflow: "hidden",
                  flex: 1,
                }}
              >
                {col.cards.map((task) => (
                  <KanbanCard key={task.title} task={task} sz={sz} isCompact />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task completion toast */}
      {toastOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: format === "vertical" ? sz(72) : sz(24),
            right: sz(24),
            opacity: toastOpacity,
            zIndex: 30,
          }}
        >
          <Toast
            message="Task completed! 🔥 Streak: 13 days"
            sz={sz}
            variant="success"
          />
        </div>
      )}

      {/* Milestone celebration at Day 30 — always rendered, component handles visibility */}
      <ConfettiExplosion
        count={16}
        colors={["#6366f1", "#f97316", "#16a34a", "#FFD700"]}
        originX={0.8}
        originY={0.1}
        triggerFrame={120}
        sz={sz}
      />

      {/* Milestone motivational text */}
      {motivationOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 40,
            opacity: motivationOpacity,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: sz(28),
              fontWeight: 800,
              color: "#ea580c",
              textShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            A whole month! You{"'"}re unstoppable. 🎉
          </div>
        </div>
      )}

      {/* Milestone toast */}
      {milestoneToastOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: format === "vertical" ? sz(72) : sz(24),
            right: sz(24),
            opacity: milestoneToastOpacity,
            zIndex: 30,
          }}
        >
          <Toast
            message="🏆 30-day streak milestone! You're in the top 5%."
            sz={sz}
            variant="streak"
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
