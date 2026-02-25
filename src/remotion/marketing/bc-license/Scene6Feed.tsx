import React from "react";
import {
  AbsoluteFill,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoFormat, FeedItemData } from "../ninety-days/shared/types";
import { FeedCard } from "../ninety-days/shared/FeedCard";

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
/*  Feed data                                                          */
/* ------------------------------------------------------------------ */

const feedItems: FeedItemData[] = [
  {
    initials: "MR",
    avatarColor: "#be185d",
    name: "Maria Rodriguez",
    action: "reacted to your 🚗 BC Driver's License progress",
    goalEmoji: "🚗",
    timestamp: "45 min ago",
  },
  {
    initials: "JL",
    avatarColor: "#16a34a",
    name: "Juan Lopez",
    action: "completed 'Find apartment in Kitsilano' on 🇨🇦 Settle Into Vancouver",
    goalEmoji: "🇨🇦",
    timestamp: "2 hours ago",
  },
  {
    initials: "CG",
    avatarColor: "#f97316",
    name: "You",
    isUser: true,
    action: "reached a 🔥 28-day streak on 🚗 BC Driver's License",
    goalEmoji: "🚗",
    timestamp: "3 hours ago",
  },
  {
    initials: "AT",
    avatarColor: "#6366f1",
    name: "Ana Torres",
    action: "forked template '🚗 BC Driver's License - Non-Canadian'",
    goalEmoji: "🍴",
    timestamp: "5 hours ago",
  },
  {
    initials: "KW",
    avatarColor: "#d97706",
    name: "Kevin Wang",
    action: "completed 'Pass IELTS with 7.5+' on 🎓 Canadian PR Application",
    goalEmoji: "🎓",
    timestamp: "8 hours ago",
  },
];

const friendAvatars = [
  { initials: "MR", color: "#be185d", hasStreak: true },
  { initials: "JL", color: "#16a34a", hasStreak: false },
  { initials: "AT", color: "#6366f1", hasStreak: true },
  { initials: "KW", color: "#d97706", hasStreak: false },
];

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */

export const Scene6Feed: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth = format === "landscape" ? sz(256) : 0;
  const topOffset = format === "square" ? sz(48) : 0;
  const bottomOffset = format === "vertical" ? sz(56) : 0;

  // Notification banner at frame 60
  const bannerEntrance = spring({
    frame: frame - 60,
    fps,
    config: { damping: 20, stiffness: 200 },
  });
  const bannerVisible = frame >= 60 && frame < 135;
  const bannerFade =
    frame < 120
      ? 1
      : frame >= 135
        ? 0
        : interpolate(frame, [120, 135], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

  // Friends section at frame 90
  const friendsEntrance = spring({
    frame: frame - 90,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Fade out at frame 135
  const fadeOut =
    frame < 135
      ? 1
      : interpolate(frame, [135, 150], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f3f4f6",
        fontFamily: "Arial, sans-serif",
        opacity: fadeOut,
      }}
    >
      <BCLicenseSidebar format={format} activeItem="Feed" sz={sz} />

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
        <div
          style={{
            fontSize: sz(isVertical ? 18 : 24),
            fontWeight: 700,
            color: "#111827",
          }}
        >
          Activity Feed
        </div>

        {/* Notification banner */}
        {bannerVisible && (
          <div
            style={{
              backgroundColor: "#eef2ff",
              borderLeft: `${sz(4)}px solid #6366f1`,
              borderRadius: sz(8),
              padding: `${sz(10)}px ${sz(14)}px`,
              fontSize: sz(12),
              color: "#3730a3",
              fontWeight: 500,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              transform: `translateY(${(1 - bannerEntrance) * sz(-50)}px)`,
              opacity: bannerEntrance * bannerFade,
            }}
          >
            🎉 Your goal 'BC Driver's License' was published as a template and
            just got its first fork!
          </div>
        )}

        {/* Feed cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: sz(8),
            flex: 1,
            overflow: "hidden",
          }}
        >
          {feedItems.map((item, i) => {
            const cardEntrance = spring({
              frame: frame - i * 5,
              fps,
              config: { damping: 15, stiffness: 120 },
            });
            return (
              <div
                key={i}
                style={{
                  opacity: cardEntrance,
                  transform: `translateY(${(1 - cardEntrance) * sz(20)}px)`,
                }}
              >
                <FeedCard item={item} sz={sz} />
              </div>
            );
          })}
        </div>

        {/* Friends section */}
        {frame >= 90 && (
          <div
            style={{
              opacity: friendsEntrance,
              transform: `translateY(${(1 - friendsEntrance) * sz(15)}px)`,
            }}
          >
            <div
              style={{
                fontSize: sz(13),
                fontWeight: 600,
                color: "#111827",
                marginBottom: sz(8),
              }}
            >
              Your Friends (5)
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: sz(8),
              }}
            >
              {friendAvatars.map((friend, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: sz(28),
                      height: sz(28),
                      borderRadius: "50%",
                      backgroundColor: friend.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: sz(10),
                      fontWeight: 600,
                    }}
                  >
                    {friend.initials}
                  </div>
                  {friend.hasStreak && (
                    <span
                      style={{
                        fontSize: sz(10),
                        lineHeight: 1,
                        marginTop: sz(2),
                      }}
                    >
                      🔥
                    </span>
                  )}
                </div>
              ))}
              {/* Add friend circle */}
              <div
                style={{
                  width: sz(28),
                  height: sz(28),
                  borderRadius: "50%",
                  border: `${sz(2)}px dashed #d1d5db`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: sz(14),
                  fontWeight: 300,
                }}
              >
                +
              </div>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
