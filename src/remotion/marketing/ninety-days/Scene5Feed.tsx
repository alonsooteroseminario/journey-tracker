import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoFormat, FeedItemData } from "./shared/types";
import { Sidebar } from "./shared/Sidebar";
import { FeedCard } from "./shared/FeedCard";

const feedItems: FeedItemData[] = [
  {
    initials: "JK",
    avatarColor: "#6366f1",
    name: "Jordan Kim",
    action: "completed 'Finish chapter 5' on \u{1F4DA} Write My Novel",
    goalEmoji: "\u{1F4DA}",
    timestamp: "1 hour ago",
  },
  {
    initials: "SP",
    avatarColor: "#16a34a",
    name: "Sam Park",
    action:
      "reached a \u{1F525} 14-day streak on \u{1F3CB}\uFE0F Train for Half Marathon",
    goalEmoji: "\u{1F3CB}\uFE0F",
    timestamp: "3 hours ago",
  },
  {
    initials: "MR",
    avatarColor: "#4338ca",
    name: "Maya Rodriguez",
    action: "forked template '\u{1F4D0} UX Design Portfolio in 60 Days'",
    goalEmoji: "\u{1F4D0}",
    timestamp: "5 hours ago",
  },
  {
    initials: "AM",
    avatarColor: "#f97316",
    name: "You",
    action:
      "completed 'Create the projects grid with filtering' on \u{1F4BB} Build Portfolio Website",
    goalEmoji: "\u{1F4BB}",
    timestamp: "6 hours ago",
    isUser: true,
  },
];

const friendAvatars = [
  { initials: "JK", color: "#6366f1", hasStreak: true },
  { initials: "SP", color: "#16a34a", hasStreak: true },
  { initials: "MR", color: "#4338ca", hasStreak: false },
  { initials: "LT", color: "#ec4899", hasStreak: false },
];

export const Scene5Feed: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  const sidebarWidth =
    format === "landscape" ? sz(256) : 0;
  const topOffset =
    format === "square" ? sz(48) : 0;
  const bottomOffset = format === "vertical" ? sz(56) : 0;

  // Notification banner (frame 60-120)
  const bannerSpring =
    frame < 60
      ? 0
      : spring({
          frame: frame - 60,
          fps,
          config: { damping: 15, stiffness: 120 },
        });
  const bannerY = interpolate(bannerSpring, [0, 1], [-50, 0]);
  const bannerOpacity =
    frame < 60
      ? 0
      : frame < 120
        ? 1
        : interpolate(frame, [120, 135], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

  // Friends section (frame 90)
  const friendsSpring =
    frame < 90
      ? 0
      : spring({
          frame: frame - 90,
          fps,
          config: { damping: 12, stiffness: 80 },
        });

  // Transition out (frame 120-180)
  const fadeOut =
    frame < 120
      ? 1
      : interpolate(frame, [120, 160], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <AbsoluteFill style={{ backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif" }}>
      <Sidebar format={format} activeItem="Feed" sz={sz} />

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
            margin: `0 0 ${sz(16)}px`,
          }}
        >
          Activity Feed
        </h1>

        {/* Feed cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: sz(10),
          }}
        >
          {feedItems.map((item, i) => {
            const delay = i * 5;
            const cardSpring =
              frame < delay
                ? 0
                : spring({
                    frame: frame - delay,
                    fps,
                    config: { damping: 15, stiffness: 120 },
                  });
            const cardOpacity = cardSpring;
            const cardTranslateY = interpolate(cardSpring, [0, 1], [20, 0]);

            return (
              <div
                key={`${item.initials}-${i}`}
                style={{
                  opacity: cardOpacity,
                  transform: `translateY(${cardTranslateY}px)`,
                }}
              >
                <FeedCard item={item} sz={sz} />
              </div>
            );
          })}
        </div>

        {/* Friend notification banner */}
        {frame >= 60 && bannerOpacity > 0 && (
          <div
            style={{
              position: "absolute",
              top: sz(8),
              left: sz(24),
              right: sz(24),
              backgroundColor: "#eef2ff",
              borderLeft: `4px solid #6366f1`,
              borderRadius: sz(8),
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              padding: `${sz(12)}px ${sz(16)}px`,
              fontSize: sz(14),
              color: "#111827",
              transform: `translateY(${bannerY}px)`,
              opacity: bannerOpacity,
              zIndex: 5,
            }}
          >
            {"\u{1F389}"} Jordan Kim just completed their goal &apos;Write My
            Novel&apos;!
          </div>
        )}

        {/* Friends section */}
        {frame >= 90 && (
          <div
            style={{
              marginTop: sz(20),
              opacity: friendsSpring,
              transform: `translateY(${interpolate(friendsSpring, [0, 1], [15, 0])}px)`,
            }}
          >
            <div
              style={{
                fontSize: sz(14),
                fontWeight: 600,
                color: "#111827",
                marginBottom: sz(8),
              }}
            >
              Your Friends (4)
            </div>
            <div style={{ display: "flex", gap: sz(8) }}>
              {friendAvatars.map((friend) => (
                <div
                  key={friend.initials}
                  style={{ position: "relative" }}
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
                        position: "absolute",
                        bottom: sz(-2),
                        right: sz(-2),
                        fontSize: sz(10),
                        lineHeight: 1,
                      }}
                    >
                      {"\u{1F525}"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
