import React from "react";

interface ToastProps {
  message: string;
  sz: (n: number) => number;
  variant: "success" | "streak" | "info";
}

const variantStyles = {
  success: {
    bg: "#f0fdf4",
    border: "#16a34a",
    text: "#166534",
    icon: "✅",
  },
  streak: {
    bg: "#ffedd5",
    border: "#f97316",
    text: "#9a3412",
    icon: "🔥",
  },
  info: {
    bg: "#eef2ff",
    border: "#6366f1",
    text: "#3730a3",
    icon: "ℹ️",
  },
};

export const Toast: React.FC<ToastProps> = ({ message, sz, variant }) => {
  const style = variantStyles[variant];

  return (
    <div
      style={{
        backgroundColor: style.bg,
        borderLeft: `${sz(4)}px solid ${style.border}`,
        borderRadius: sz(8),
        padding: `${sz(10)}px ${sz(16)}px`,
        fontSize: sz(13),
        color: style.text,
        fontWeight: 500,
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: sz(8),
        maxWidth: sz(320),
      }}
    >
      <span style={{ fontSize: sz(16) }}>{style.icon}</span>
      <span>{message}</span>
    </div>
  );
};
