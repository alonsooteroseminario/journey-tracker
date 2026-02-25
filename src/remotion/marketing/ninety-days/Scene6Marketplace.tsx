import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoFormat, TemplateData } from "./shared/types";
import { Sidebar } from "./shared/Sidebar";
import { TemplateCard } from "./shared/TemplateCard";
import { Toast } from "./shared/Toast";

const filterPills = [
  { label: "All", active: false },
  { label: "Career", active: true },
  { label: "Fitness", active: false },
  { label: "Learning", active: false },
  { label: "Creative", active: false },
  { label: "Finance", active: false },
];

const templates: TemplateData[] = [
  {
    category: "Career",
    categoryBg: "#e0e7ff",
    categoryColor: "#4f46e5",
    title: "Land a Product Manager Role in 6 Months",
    emoji: "\u{1F4BC}",
    author: "Alex Martinez",
    authorInitials: "AM",
    forks: 47,
    difficulty: "Intermediate",
    difficultyBg: "#fef3c7",
    difficultyColor: "#92400e",
  },
  {
    category: "Fitness",
    categoryBg: "#dcfce7",
    categoryColor: "#15803d",
    title: "Couch to Marathon in 6 Months",
    emoji: "\u{1F3C3}",
    author: "Sam Park",
    authorInitials: "SP",
    forks: 128,
    difficulty: "Advanced",
    difficultyBg: "#fee2e2",
    difficultyColor: "#991b1b",
  },
  {
    category: "Learning",
    categoryBg: "#f3e8ff",
    categoryColor: "#7e22ce",
    title: "Learn Conversational Spanish in 90 Days",
    emoji: "\u{1F1EA}\u{1F1F8}",
    author: "Jordan Kim",
    authorInitials: "JK",
    forks: 89,
    difficulty: "Beginner",
    difficultyBg: "#dcfce7",
    difficultyColor: "#15803d",
  },
  {
    category: "Creative",
    categoryBg: "#fce7f3",
    categoryColor: "#be185d",
    title: "UX Design Portfolio in 60 Days",
    emoji: "\u{1F4D0}",
    author: "Maya Rodriguez",
    authorInitials: "MR",
    forks: 34,
    difficulty: "Intermediate",
    difficultyBg: "#fef3c7",
    difficultyColor: "#92400e",
  },
];

export const Scene6Marketplace: React.FC<{ format: VideoFormat }> = ({
  format,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth = format === "landscape" ? sz(256) : 0;
  const topOffset = format === "square" ? sz(48) : 0;
  const bottomOffset = format === "vertical" ? sz(56) : 0;

  // Hover effect on card 1 at frame 60
  const hoverSpring =
    frame < 60
      ? 0
      : spring({
          frame: frame - 60,
          fps,
          config: { damping: 20, stiffness: 200 },
        });

  // Fork count animation (frame 90-120)
  const forkCount =
    frame < 90
      ? 47
      : Math.round(
          interpolate(frame, [90, 120], [47, 51], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        );

  // Toast at frame 120
  const toastSpring =
    frame < 120
      ? 0
      : spring({
          frame: frame - 120,
          fps,
          config: { damping: 15, stiffness: 120 },
        });

  // Transition out at frame 150
  const fadeOut =
    frame < 150
      ? 1
      : interpolate(frame, [150, 180], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // Track previous fork count for +1 floaters
  const prevForkCount =
    frame <= 90
      ? 47
      : Math.round(
          interpolate(frame - 1, [90, 120], [47, 51], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        );
  const showPlusOne = frame > 90 && frame <= 120 && forkCount > prevForkCount;

  // Determine the grid layout
  const gridColumns = isVertical ? 1 : 2;

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif" }}
    >
      <Sidebar format={format} activeItem="Marketplace" sz={sz} />

      <div
        style={{
          position: "absolute",
          top: topOffset,
          left: sidebarWidth,
          right: 0,
          bottom: bottomOffset,
          padding: sz(24),
          overflow: "hidden",
          opacity: fadeOut,
        }}
      >
        {/* Page heading */}
        <h1
          style={{
            fontSize: sz(24),
            fontWeight: "bold",
            color: "#111827",
            margin: 0,
          }}
        >
          Template Marketplace
        </h1>
        <p
          style={{
            fontSize: sz(14),
            color: "#4b5563",
            margin: `${sz(4)}px 0 ${sz(16)}px`,
          }}
        >
          Proven goal templates from the community
        </p>

        {/* Search bar */}
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: sz(8),
            padding: `${sz(8)}px ${sz(12)}px`,
            fontSize: sz(14),
            color: "#9ca3af",
            marginBottom: sz(12),
          }}
        >
          Search templates...
        </div>

        {/* Filter pills */}
        <div
          style={{
            display: "flex",
            gap: sz(6),
            marginBottom: sz(16),
            flexWrap: "wrap",
          }}
        >
          {filterPills.map((pill) => (
            <div
              key={pill.label}
              style={{
                fontSize: sz(14),
                padding: `${sz(4)}px ${sz(12)}px`,
                borderRadius: sz(999),
                backgroundColor: pill.active ? "#6366f1" : "#f3f4f6",
                color: pill.active ? "#fff" : "#4b5563",
                fontWeight: pill.active ? 600 : 400,
              }}
            >
              {pill.label}
            </div>
          ))}
        </div>

        {/* Template grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
            gap: sz(12),
          }}
        >
          {templates.map((template, i) => {
            const delay = i * 3;
            const cardSpring =
              frame < delay
                ? 0
                : spring({
                    frame: frame - delay,
                    fps,
                    config: { damping: 15, stiffness: 120 },
                  });

            const isFirstCard = i === 0;
            const isHighlighted = isFirstCard && frame >= 60;

            // Override fork count for card 1
            const displayTemplate = isFirstCard
              ? { ...template, forks: forkCount }
              : template;

            return (
              <div
                key={template.title}
                style={{
                  opacity: cardSpring,
                  transform: `translateY(${interpolate(cardSpring, [0, 1], [20, 0])}px)`,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    transform: isHighlighted
                      ? `translateY(${interpolate(hoverSpring, [0, 1], [0, -2])}px)`
                      : "none",
                    boxShadow: isHighlighted
                      ? `0 ${sz(4 + hoverSpring * 4)}px ${sz(6 + hoverSpring * 6)}px rgba(0,0,0,${0.05 + hoverSpring * 0.1})`
                      : undefined,
                    borderRadius: sz(8),
                  }}
                >
                  <TemplateCard
                    template={displayTemplate}
                    sz={sz}
                    highlighted={isHighlighted}
                  />
                </div>

                {/* +1 floater */}
                {isFirstCard && showPlusOne && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: sz(60),
                      left: sz(16),
                      fontSize: sz(12),
                      fontWeight: 600,
                      color: "#16a34a",
                      opacity: 0.8,
                      transform: `translateY(${sz(-10)}px)`,
                    }}
                  >
                    +1
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Toast */}
        {frame >= 120 && (
          <div
            style={{
              position: "absolute",
              bottom: sz(24),
              right: sz(24),
              opacity: toastSpring,
              transform: `translateY(${interpolate(toastSpring, [0, 1], [20, 0])}px)`,
            }}
          >
            <Toast
              message={
                "\u{1F389} Your template 'Land a PM Role' just hit 50 forks!"
              }
              sz={sz}
              variant="streak"
            />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
