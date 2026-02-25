import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoFormat, TaskData } from "./shared/types";
import { Sidebar } from "./shared/Sidebar";
import { KanbanCard } from "./shared/KanbanCard";
import { StreakCounter } from "./shared/StreakCounter";

const phase1Tasks: TaskData[] = [
  { title: "Research portfolio inspiration sites", status: "done", phase: 1 },
  { title: "Choose tech stack & hosting", status: "done", phase: 1 },
  { title: "Design wireframes in Figma", status: "done", phase: 1 },
  { title: "Set up Next.js project structure", status: "done", phase: 1 },
];

const phase2Tasks: TaskData[] = [
  { title: "Build responsive navigation", status: "done", phase: 2 },
  { title: "Create hero section with animations", status: "done", phase: 2 },
  { title: "Build projects grid with filtering", status: "done", phase: 2 },
  { title: "Implement contact form with validation", status: "done", phase: 2 },
];

const phase3Tasks: TaskData[] = [
  { title: "Add dark mode toggle", status: "done", phase: 3 },
  { title: "Optimize images and performance", status: "done", phase: 3 },
  { title: "Deploy to Vercel with custom domain", status: "done", phase: 3 },
  { title: "Write case studies for top 3 projects", status: "done", phase: 3 },
];

const allDoneTasks = [...phase1Tasks, ...phase2Tasks, ...phase3Tasks];

export const Scene8CompletedBoard: React.FC<{ format: VideoFormat }> = ({
  format,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth = format === "landscape" ? sz(256) : 0;
  const topOffset = format === "square" ? sz(48) : 0;
  const bottomOffset = format === "vertical" ? sz(56) : 0;

  // Golden shimmer on progress bar: repeating every 60 frames
  const shimmerCycle = frame % 60;
  const shimmerX = interpolate(shimmerCycle, [0, 59], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Victory wave: frame 30, each card highlights at (30 + i*3) for 6 frames
  const getCardHighlight = (i: number): number => {
    const start = 30 + i * 3;
    const mid = start + 3;
    const end = start + 6;
    if (frame < start || frame > end) return 0;
    // Peak at midpoint, use ternary for non-monotonic
    return frame < mid
      ? interpolate(frame, [start, mid], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : interpolate(frame, [mid, end], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  };

  // Board zoom out at frame 90
  const zoomScale =
    frame < 90
      ? 1
      : interpolate(frame, [90, 120], [1, 0.85], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // Edge blur overlay at frame 90
  const edgeBlurOpacity =
    frame < 90
      ? 0
      : interpolate(frame, [90, 120], [0, 0.2], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // Initial entrance
  const entranceSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const columnStyle = (isEmpty: boolean): React.CSSProperties => ({
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: sz(8),
    padding: sz(10),
    display: "flex",
    flexDirection: "column",
    gap: sz(6),
    minWidth: 0,
    alignItems: isEmpty ? "center" : "stretch",
    justifyContent: isEmpty ? "center" : "flex-start",
  });

  const renderPhaseGroup = (
    label: string,
    tasks: TaskData[],
    startIndex: number
  ) => (
    <React.Fragment key={label}>
      <div
        style={{
          fontSize: sz(11),
          fontWeight: 600,
          color: "#4b5563",
          marginTop: startIndex > 0 ? sz(6) : 0,
          marginBottom: sz(2),
        }}
      >
        {label}
      </div>
      {tasks.map((task, i) => {
        const globalIndex = startIndex + i;
        const highlight = getCardHighlight(globalIndex);
        return (
          <div
            key={task.title}
            style={{
              backgroundColor:
                highlight > 0
                  ? `rgba(238,242,255,${highlight})`
                  : "transparent",
              borderRadius: sz(8),
            }}
          >
            <KanbanCard task={task} sz={sz} isCompact />
          </div>
        );
      })}
    </React.Fragment>
  );

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif" }}
    >
      <Sidebar format={format} activeItem="Board" sz={sz} />

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
          transform: `scale(${zoomScale})`,
          transformOrigin: "center center",
        }}
      >
        {/* Page heading */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: sz(12),
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
            {"\u{1F4BB}"} Build Portfolio Website
          </h1>
          <StreakCounter streak={90} sz={sz} glowing />
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: sz(12) }}>
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
            {/* Fill */}
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#6366f1",
                borderRadius: sz(4),
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Golden shimmer */}
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
            </div>
          </div>
          <div
            style={{
              fontSize: sz(14),
              color: "#16a34a",
              marginTop: sz(4),
              fontWeight: 500,
            }}
          >
            12/12 tasks completed
          </div>
        </div>

        {/* Kanban columns */}
        <div
          style={{
            display: "flex",
            gap: sz(10),
            flex: 1,
          }}
        >
          {/* To Do — empty */}
          <div style={columnStyle(true)}>
            <div
              style={{
                fontSize: sz(13),
                fontWeight: 600,
                color: "#111827",
                marginBottom: sz(8),
                alignSelf: "flex-start",
              }}
            >
              To Do
            </div>
            <div
              style={{
                fontSize: sz(14),
                color: "#9ca3af",
                textAlign: "center",
              }}
            >
              {"\u{1F389}"} All clear!
            </div>
          </div>

          {/* In Progress — empty */}
          <div style={columnStyle(true)}>
            <div
              style={{
                fontSize: sz(13),
                fontWeight: 600,
                color: "#111827",
                marginBottom: sz(8),
                alignSelf: "flex-start",
              }}
            >
              In Progress
            </div>
            <div
              style={{
                fontSize: sz(14),
                color: "#9ca3af",
                textAlign: "center",
              }}
            >
              Nothing in progress
            </div>
          </div>

          {/* Done — all 12 cards */}
          <div style={columnStyle(false)}>
            <div
              style={{
                fontSize: sz(13),
                fontWeight: 600,
                color: "#111827",
                marginBottom: sz(4),
              }}
            >
              Done
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: sz(4),
                overflow: "hidden",
              }}
            >
              {renderPhaseGroup(
                "\u{1F4D0} Phase 1",
                phase1Tasks,
                0
              )}
              {renderPhaseGroup(
                "\u{1F6E0}\uFE0F Phase 2",
                phase2Tasks,
                4
              )}
              {renderPhaseGroup(
                "\u{1F680} Phase 3",
                phase3Tasks,
                8
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edge blur overlay when zoomed out */}
      {edgeBlurOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            zIndex: 15,
            background: `
              linear-gradient(to right, rgba(255,255,255,${edgeBlurOpacity}) 0%, transparent ${sz(60)}px, transparent calc(100% - ${sz(60)}px), rgba(255,255,255,${edgeBlurOpacity}) 100%),
              linear-gradient(to bottom, rgba(255,255,255,${edgeBlurOpacity}) 0%, transparent ${sz(60)}px, transparent calc(100% - ${sz(60)}px), rgba(255,255,255,${edgeBlurOpacity}) 100%)
            `,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
