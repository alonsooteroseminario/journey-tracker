import React from "react";
import type { FeedItemData } from "./types";

interface FeedCardProps {
  item: FeedItemData;
  sz: (n: number) => number;
}

export const FeedCard: React.FC<FeedCardProps> = ({ item, sz }) => {
  const displayName = item.isUser ? "You" : item.name;

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: sz(8),
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        padding: sz(16),
        fontFamily: "Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        gap: sz(12),
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: sz(32),
          height: sz(32),
          borderRadius: "50%",
          backgroundColor: item.avatarColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: sz(12),
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {item.initials}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: sz(14),
            color: "#111827",
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontWeight: 600 }}>{displayName}</span>{" "}
          <span style={{ color: "#4b5563" }}>{item.action}</span>
        </div>
        <div
          style={{
            fontSize: sz(12),
            color: "#9ca3af",
            marginTop: sz(2),
          }}
        >
          {item.timestamp}
        </div>
      </div>

      {/* Goal emoji */}
      <span style={{ fontSize: sz(20), flexShrink: 0 }}>
        {item.goalEmoji}
      </span>
    </div>
  );
};
