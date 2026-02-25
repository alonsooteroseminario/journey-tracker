import React from "react";
import { AbsoluteFill } from "remotion";
import type { VideoFormat } from "./types";

interface SidebarProps {
  format: VideoFormat;
  activeItem: string;
  sz: (n: number) => number;
}

const navItems = [
  { emoji: "📋", label: "Board" },
  { emoji: "📡", label: "Feed" },
  { emoji: "🏪", label: "Marketplace" },
  { emoji: "👤", label: "Profile" },
];

export const Sidebar: React.FC<SidebarProps> = ({ format, activeItem, sz }) => {
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
    <AbsoluteFill
      style={{
        width: sz(256),
        right: "auto",
        backgroundColor: "#1e1b4b",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
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
        🎯 Journey Tracker
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

      {/* Bottom avatar */}
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
          AM
        </div>
        <span
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: sz(14),
          }}
        >
          Alex M.
        </span>
      </div>
    </AbsoluteFill>
  );
};
