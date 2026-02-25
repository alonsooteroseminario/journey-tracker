import React from "react";
import {
  AbsoluteFill,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoFormat, TemplateData } from "../ninety-days/shared/types";
import { TemplateCard } from "../ninety-days/shared/TemplateCard";
import { Toast } from "../ninety-days/shared/Toast";

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
/*  Template data                                                      */
/* ------------------------------------------------------------------ */

const templates: TemplateData[] = [
  {
    category: "Immigration",
    categoryBg: "#dbeafe",
    categoryColor: "#1d4ed8",
    title: "BC Driver's License - Non-Canadian Resident",
    emoji: "🚗",
    author: "Carlos Garcia",
    authorInitials: "CG",
    forks: 23,
    difficulty: "Intermediate",
    difficultyBg: "#fef3c7",
    difficultyColor: "#92400e",
  },
  {
    category: "Immigration",
    categoryBg: "#dbeafe",
    categoryColor: "#1d4ed8",
    title: "Canadian PR Application Step-by-Step",
    emoji: "🇨🇦",
    author: "Kevin Wang",
    authorInitials: "KW",
    forks: 156,
    difficulty: "Advanced",
    difficultyBg: "#fee2e2",
    difficultyColor: "#991b1b",
  },
  {
    category: "Immigration",
    categoryBg: "#dbeafe",
    categoryColor: "#1d4ed8",
    title: "First 90 Days in Vancouver Checklist",
    emoji: "🏠",
    author: "Ana Torres",
    authorInitials: "AT",
    forks: 89,
    difficulty: "Beginner",
    difficultyBg: "#dcfce7",
    difficultyColor: "#15803d",
  },
  {
    category: "Immigration",
    categoryBg: "#dbeafe",
    categoryColor: "#1d4ed8",
    title: "Open Canadian Bank Account & Build Credit",
    emoji: "🏦",
    author: "Maria Rodriguez",
    authorInitials: "MR",
    forks: 67,
    difficulty: "Beginner",
    difficultyBg: "#dcfce7",
    difficultyColor: "#15803d",
  },
];

const filterPills = ["All", "Immigration", "Career", "Fitness", "Learning"];

/* ------------------------------------------------------------------ */
/*  Inline template card (Card 1 with animated forks)                  */
/* ------------------------------------------------------------------ */

const AnimatedTemplateCard: React.FC<{
  template: TemplateData;
  forks: number;
  sz: (n: number) => number;
  highlighted: boolean;
  floatingPlus?: { opacity: number; translateY: number } | null;
}> = ({ template, forks, sz, highlighted, floatingPlus }) => (
  <div
    style={{
      backgroundColor: "#fff",
      borderRadius: sz(8),
      boxShadow: highlighted
        ? "0 4px 6px rgba(0,0,0,0.1)"
        : "0 1px 2px rgba(0,0,0,0.05)",
      padding: sz(16),
      fontFamily: "Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
      gap: sz(10),
      transform: highlighted ? `translateY(${sz(-2)}px)` : "none",
      border: highlighted ? "1px solid #eef2ff" : "1px solid transparent",
    }}
  >
    {/* Category badge */}
    <div style={{ display: "flex", alignItems: "center" }}>
      <span
        style={{
          fontSize: sz(11),
          fontWeight: 500,
          color: template.categoryColor,
          backgroundColor: template.categoryBg,
          borderRadius: sz(999),
          padding: `${sz(2)}px ${sz(8)}px`,
        }}
      >
        {template.category}
      </span>
    </div>

    {/* Title */}
    <div
      style={{
        fontSize: sz(18),
        fontWeight: 500,
        color: "#111827",
        lineHeight: 1.3,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
      }}
    >
      {template.emoji} {template.title}
    </div>

    {/* Author row */}
    <div
      style={{ display: "flex", alignItems: "center", gap: sz(6) }}
    >
      <div
        style={{
          width: sz(24),
          height: sz(24),
          borderRadius: "50%",
          backgroundColor: "#6366f1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: sz(10),
          fontWeight: 600,
        }}
      >
        {template.authorInitials}
      </div>
      <span style={{ fontSize: sz(14), color: "#4b5563" }}>
        by {template.author}
      </span>
    </div>

    {/* Fork count + difficulty */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      <span style={{ fontSize: sz(14), color: "#4b5563", position: "relative" }}>
        🍴 {forks} forks
        {/* Floating +1 */}
        {floatingPlus && floatingPlus.opacity > 0 && (
          <span
            style={{
              position: "absolute",
              top: floatingPlus.translateY,
              left: sz(60),
              fontSize: sz(12),
              color: "#9ca3af",
              fontWeight: 500,
              opacity: floatingPlus.opacity,
            }}
          >
            +1
          </span>
        )}
      </span>
      <span
        style={{
          fontSize: sz(11),
          fontWeight: 500,
          color: template.difficultyColor,
          backgroundColor: template.difficultyBg,
          borderRadius: sz(999),
          padding: `${sz(2)}px ${sz(8)}px`,
        }}
      >
        {template.difficulty}
      </span>
    </div>

    {/* CTA button */}
    <div
      style={{
        backgroundColor: "#6366f1",
        color: "#fff",
        fontSize: sz(14),
        fontWeight: 500,
        textAlign: "center",
        borderRadius: sz(6),
        padding: `${sz(12)}px`,
        marginTop: sz(4),
      }}
    >
      Fork Template
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */

export const Scene7Marketplace: React.FC<{ format: VideoFormat }> = ({
  format,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth = format === "landscape" ? sz(256) : 0;
  const topOffset = format === "square" ? sz(48) : 0;
  const bottomOffset = format === "vertical" ? sz(56) : 0;

  // Card 1 hover highlight at frame 45
  const hoverSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 20, stiffness: 200 },
  });
  const card1Highlighted = frame >= 45;

  // Fork count animation 23->30 over frames 45-75
  const forkVal =
    frame < 45
      ? 23
      : frame >= 75
        ? 30
        : Math.round(
            interpolate(frame, [45, 75], [23, 30], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          );

  // Floating "+1" — show whenever fork count crosses integer boundary
  // Simple approach: show a +1 every ~4 frames cycling, using modular animation
  const forkLocalFrame = frame - 45;
  const showPlus =
    forkLocalFrame >= 0 &&
    forkLocalFrame < 30 &&
    forkLocalFrame % 4 === 0;
  const plusCycleFrame = forkLocalFrame % 4;
  const floatingPlus =
    showPlus || (forkLocalFrame >= 0 && forkLocalFrame < 30 && forkLocalFrame % 4 < 4)
      ? {
          opacity:
            forkLocalFrame < 0 || forkLocalFrame >= 30
              ? 0
              : plusCycleFrame <= 1
                ? interpolate(plusCycleFrame, [0, 1], [1, 0.8], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })
                : interpolate(plusCycleFrame, [2, 3], [0.5, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
          translateY: sz(-10) + (plusCycleFrame / 3) * sz(-15),
        }
      : null;

  // Toast at frame 75
  const toastEntrance = spring({
    frame: frame - 75,
    fps,
    config: { damping: 20, stiffness: 200 },
  });
  const toastVisible = frame >= 75 && frame < 120;
  const toastFade =
    frame < 105
      ? 1
      : frame >= 120
        ? 0
        : interpolate(frame, [105, 120], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

  // Fade out at frame 105
  const fadeOut =
    frame < 105
      ? 1
      : interpolate(frame, [105, 120], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const gridCols = isVertical ? 1 : 2;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f3f4f6",
        fontFamily: "Arial, sans-serif",
        opacity: fadeOut,
      }}
    >
      <BCLicenseSidebar format={format} activeItem="Marketplace" sz={sz} />

      {/* Main content */}
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
          gap: sz(12),
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div>
          <div
            style={{
              fontSize: sz(isVertical ? 18 : 24),
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Template Marketplace
          </div>
          <div
            style={{
              fontSize: sz(14),
              color: "#4b5563",
              marginTop: sz(4),
            }}
          >
            Proven goal templates from the community
          </div>
        </div>

        {/* Search bar */}
        <div
          style={{
            backgroundColor: "#fff",
            border: `1px solid #e5e7eb`,
            borderRadius: sz(8),
            padding: `${sz(8)}px ${sz(12)}px`,
            fontSize: sz(13),
            color: "#374151",
            display: "flex",
            alignItems: "center",
            gap: sz(8),
          }}
        >
          <span style={{ color: "#9ca3af", fontSize: sz(14) }}>🔍</span>
          <span>immigration</span>
        </div>

        {/* Filter pills */}
        <div
          style={{
            display: "flex",
            gap: sz(8),
            flexWrap: "wrap",
          }}
        >
          {filterPills.map((pill) => {
            const isActive = pill === "Immigration";
            return (
              <div
                key={pill}
                style={{
                  fontSize: sz(14),
                  fontWeight: 500,
                  color: isActive ? "#fff" : "#374151",
                  backgroundColor: isActive ? "#6366f1" : "#e5e7eb",
                  borderRadius: sz(999),
                  padding: `${sz(4)}px ${sz(12)}px`,
                }}
              >
                {pill}
              </div>
            );
          })}
        </div>

        {/* Template grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gap: sz(12),
            flex: 1,
            overflow: "hidden",
            alignContent: "start",
          }}
        >
          {templates.map((template, i) => {
            const cardEntrance = spring({
              frame: frame - i * 3,
              fps,
              config: { damping: 15, stiffness: 120 },
            });

            if (i === 0) {
              // Card 1: animated forks + hover
              return (
                <div
                  key={i}
                  style={{
                    opacity: cardEntrance,
                    transform: `translateY(${(1 - cardEntrance) * sz(20)}px)`,
                  }}
                >
                  <AnimatedTemplateCard
                    template={template}
                    forks={forkVal}
                    sz={sz}
                    highlighted={card1Highlighted}
                    floatingPlus={floatingPlus}
                  />
                </div>
              );
            }

            return (
              <div
                key={i}
                style={{
                  opacity: cardEntrance,
                  transform: `translateY(${(1 - cardEntrance) * sz(20)}px)`,
                }}
              >
                <TemplateCard template={template} sz={sz} />
              </div>
            );
          })}
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
            message="Your template hit 30 forks! People are using your system."
            sz={sz}
            variant="streak"
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
