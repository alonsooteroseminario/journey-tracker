import React from "react";
import type { TemplateData } from "./types";

interface TemplateCardProps {
  template: TemplateData;
  sz: (n: number) => number;
  highlighted?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  sz,
  highlighted = false,
}) => {
  return (
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
        style={{
          display: "flex",
          alignItems: "center",
          gap: sz(6),
        }}
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
        }}
      >
        <span style={{ fontSize: sz(14), color: "#4b5563" }}>
          🍴 {template.forks} forks
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
};
