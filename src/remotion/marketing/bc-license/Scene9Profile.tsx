import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoFormat } from "../ninety-days/shared/types";

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

const statsCards = [
  { emoji: "\u{1F3AF}", value: "2", label: "Goals", color: "#111827" },
  { emoji: "\u2705", value: "18", label: "Tasks Done", color: "#111827" },
  { emoji: "\u{1F525}", value: "37", label: "Day Streak", color: "#f97316" },
  { emoji: "\u{1F374}", value: "30", label: "Template Forks", color: "#111827" },
];

const isHeatmapActive = (week: number, day: number): boolean => {
  return week >= 3 || (week * 7 + day) % 3 === 0;
};

const getHeatmapColor = (week: number, day: number): string => {
  if (!isHeatmapActive(week, day)) return "#e5e7eb";
  if (week < 3) return "rgba(22,163,74,0.3)";
  return "#16a34a";
};

export const Scene9Profile: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth = format === "landscape" ? sz(256) : 0;
  const topOffset = format === "square" ? sz(48) : 0;
  const bottomOffset = format === "vertical" ? sz(56) : 0;

  // Section entrance springs
  const headerSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const statsSpring =
    frame < 10
      ? 0
      : spring({
          frame: frame - 10,
          fps,
          config: { damping: 15, stiffness: 120 },
        });

  const goalsSpring =
    frame < 20
      ? 0
      : spring({
          frame: frame - 20,
          fps,
          config: { damping: 15, stiffness: 120 },
        });

  const heatmapSpring =
    frame < 35
      ? 0
      : spring({
          frame: frame - 35,
          fps,
          config: { damping: 15, stiffness: 120 },
        });

  const templatesSpring =
    frame < 60
      ? 0
      : spring({
          frame: frame - 60,
          fps,
          config: { damping: 15, stiffness: 120 },
        });

  // Golden shimmer on completed progress bar
  const shimmerCycle = frame % 60;
  const shimmerX = interpolate(shimmerCycle, [0, 59], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const heatmapCols = 8;
  const heatmapRows = 7;
  const cellSize = sz(10);
  const cellGap = sz(2);

  return (
    <AbsoluteFill style={{ backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif" }}>
      <CarlosSidebar format={format} activeItem="Profile" sz={sz} />

      <div
        style={{
          position: "absolute",
          top: topOffset,
          left: sidebarWidth,
          right: 0,
          bottom: bottomOffset,
          padding: sz(20),
          overflow: "hidden",
        }}
      >
        {/* Profile header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: sz(16),
            marginBottom: sz(16),
            opacity: headerSpring,
            transform: `translateY(${interpolate(headerSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: sz(80),
              height: sz(80),
              borderRadius: "50%",
              backgroundColor: "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: sz(32),
              fontWeight: "bold",
              flexShrink: 0,
            }}
          >
            CG
          </div>
          <div>
            <div
              style={{
                fontSize: sz(24),
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              Carlos Garcia
            </div>
            <div
              style={{
                fontSize: sz(14),
                color: "#4b5563",
                marginTop: sz(2),
              }}
            >
              Software Developer | New in Vancouver {"\u{1F1E8}\u{1F1E6}\u{1F1E8}\u{1F1F4}"}
            </div>
            <div
              style={{
                fontSize: sz(12),
                color: "#9ca3af",
                marginTop: sz(4),
              }}
            >
              {"\u{1F4CD}"} Vancouver, BC
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: sz(8),
            marginBottom: sz(16),
            flexWrap: "wrap",
            opacity: statsSpring,
            transform: `translateY(${interpolate(statsSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          {statsCards.map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                minWidth: sz(70),
                backgroundColor: "#fff",
                borderRadius: sz(8),
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                padding: sz(12),
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: sz(18) }}>{stat.emoji}</div>
              <div
                style={{
                  fontSize: sz(24),
                  fontWeight: "bold",
                  color: stat.color,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: sz(12), color: "#9ca3af" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Goals section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: sz(8),
            marginBottom: sz(16),
            opacity: goalsSpring,
            transform: `translateY(${interpolate(goalsSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          {/* Goal 1: BC Driver's License - Completed */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: sz(8),
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              padding: sz(14),
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: sz(8),
              }}
            >
              <span style={{ fontSize: sz(14), fontWeight: 600, color: "#111827" }}>
                {"\u{1F697}"} BC Driver{"\u0027"}s License
              </span>
              <div
                style={{
                  fontSize: sz(10),
                  fontWeight: 600,
                  backgroundColor: "#dcfce7",
                  color: "#166534",
                  borderRadius: sz(999),
                  padding: `${sz(2)}px ${sz(10)}px`,
                }}
              >
                {"\u2705"} Completed
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: sz(6),
                backgroundColor: "#e5e7eb",
                borderRadius: sz(4),
                overflow: "hidden",
                position: "relative",
              }}
            >
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
          </div>

          {/* Goal 2: Settle Into Vancouver - In Progress */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: sz(8),
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              padding: sz(14),
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: sz(8),
              }}
            >
              <span style={{ fontSize: sz(14), fontWeight: 600, color: "#111827" }}>
                {"\u{1F1E8}\u{1F1E6}"} Settle Into Vancouver
              </span>
              <div
                style={{
                  fontSize: sz(10),
                  fontWeight: 600,
                  backgroundColor: "#e0e7ff",
                  color: "#4338ca",
                  borderRadius: sz(999),
                  padding: `${sz(2)}px ${sz(10)}px`,
                }}
              >
                In Progress
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: sz(6),
                backgroundColor: "#e5e7eb",
                borderRadius: sz(4),
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "65%",
                  height: "100%",
                  backgroundColor: "#6366f1",
                  borderRadius: sz(4),
                }}
              />
            </div>
          </div>
        </div>

        {/* Mini heatmap */}
        <div
          style={{
            marginBottom: sz(12),
            opacity: heatmapSpring,
            transform: `translateY(${interpolate(heatmapSpring, [0, 1], [15, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: sz(12),
              fontWeight: 600,
              color: "#111827",
              marginBottom: sz(6),
            }}
          >
            Activity
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              gap: cellGap,
            }}
          >
            {Array.from({ length: heatmapCols }).map((_, col) => (
              <div
                key={col}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: cellGap,
                }}
              >
                {Array.from({ length: heatmapRows }).map((_, row) => (
                  <div
                    key={row}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: sz(2),
                      backgroundColor: getHeatmapColor(col, row),
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Published Templates - slides in at frame 60 */}
        {templatesSpring > 0 && (
          <div
            style={{
              opacity: templatesSpring,
              transform: `translateY(${interpolate(templatesSpring, [0, 1], [20, 0])}px)`,
            }}
          >
            <div
              style={{
                fontSize: sz(12),
                fontWeight: 600,
                color: "#111827",
                marginBottom: sz(6),
              }}
            >
              Published Templates
            </div>
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: sz(8),
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                padding: sz(12),
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: sz(13), color: "#111827" }}>
                {"\u{1F697}"} BC Driver{"\u0027"}s License - Non-Canadian Resident
              </span>
              <span style={{ fontSize: sz(12), color: "#f97316", fontWeight: 600 }}>
                {"\u{1F374}"} 30 forks
              </span>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
