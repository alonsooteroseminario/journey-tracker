import React from "react";
import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoFormat } from "../ninety-days/shared/types";

interface ChaosElement {
  label: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  scatterAngle: number;
}

const chaosElements: ChaosElement[] = [
  { label: "icbc", width: 300, height: 200, x: 0.05, y: 0.05, rotation: -4, zIndex: 7, scatterAngle: -45 },
  { label: "google", width: 280, height: 160, x: 0.35, y: 0.02, rotation: 3, zIndex: 8, scatterAngle: 30 },
  { label: "sticky", width: 220, height: 180, x: 0.65, y: 0.08, rotation: -2, zIndex: 10, scatterAngle: 60 },
  { label: "reddit", width: 260, height: 170, x: 0.1, y: 0.45, rotation: 5, zIndex: 6, scatterAngle: -120 },
  { label: "notes", width: 240, height: 200, x: 0.42, y: 0.4, rotation: -3, zIndex: 9, scatterAngle: 150 },
  { label: "text", width: 200, height: 100, x: 0.7, y: 0.5, rotation: 2, zIndex: 11, scatterAngle: -80 },
  { label: "bcgov", width: 290, height: 190, x: 0.25, y: 0.65, rotation: -5, zIndex: 5, scatterAngle: 170 },
];

const BrowserChrome: React.FC<{
  sz: (n: number) => number;
  children: React.ReactNode;
}> = ({ sz, children }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      backgroundColor: "#ffffff",
      borderRadius: sz(6),
      overflow: "hidden",
      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* Top bar */}
    <div
      style={{
        height: sz(24),
        backgroundColor: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        padding: `0 ${sz(8)}px`,
        gap: sz(5),
        flexShrink: 0,
      }}
    >
      <div style={{ width: sz(8), height: sz(8), borderRadius: "50%", backgroundColor: "#ef4444" }} />
      <div style={{ width: sz(8), height: sz(8), borderRadius: "50%", backgroundColor: "#eab308" }} />
      <div style={{ width: sz(8), height: sz(8), borderRadius: "50%", backgroundColor: "#22c55e" }} />
    </div>
    <div style={{ flex: 1, overflow: "hidden", padding: sz(8) }}>{children}</div>
  </div>
);

const PlaceholderLines: React.FC<{
  count: number;
  sz: (n: number) => number;
}> = ({ count, sz }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: sz(6), marginTop: sz(6) }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          width: `${80 - i * 8}%`,
          height: sz(8),
          backgroundColor: "#d1d5db",
          borderRadius: sz(4),
        }}
      />
    ))}
  </div>
);

export const Scene1Chaos: React.FC<{ format: VideoFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = format === "vertical";
  const sz = (base: number) => (isVertical ? Math.round(base * 0.75) : base);

  // Scatter at frame 45
  const scatterSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // "There's a better way." fades in at frame 60
  const betterWayOpacity = spring({
    frame: frame - 60,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // "There's a better way." fades out at frame 69
  const betterWayFadeOut = frame < 69
    ? 1
    : interpolate(frame, [69, 75], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  const renderChaosElement = (el: ChaosElement, index: number) => {
    // Staggered entrance (3 frames apart)
    const entranceSpring = spring({
      frame: frame - index * 3,
      fps,
      config: { damping: 15, stiffness: 120 },
    });

    // Scatter: translate away and fade
    const scatterX = Math.cos((el.scatterAngle * Math.PI) / 180) * sz(600) * scatterSpring;
    const scatterY = Math.sin((el.scatterAngle * Math.PI) / 180) * sz(600) * scatterSpring;
    const scatterFade = 1 - scatterSpring;

    // Entrance: slide from the edge
    const entranceX = (1 - entranceSpring) * Math.cos((el.scatterAngle * Math.PI) / 180) * sz(-200);
    const entranceY = (1 - entranceSpring) * Math.sin((el.scatterAngle * Math.PI) / 180) * sz(-200);

    const totalX = entranceX + scatterX;
    const totalY = entranceY + scatterY;

    return (
      <div
        key={el.label}
        style={{
          position: "absolute",
          left: `${el.x * 100}%`,
          top: `${el.y * 100}%`,
          width: sz(el.width),
          height: sz(el.height),
          transform: `translate(${totalX}px, ${totalY}px) rotate(${el.rotation}deg)`,
          opacity: entranceSpring * scatterFade,
          zIndex: el.zIndex,
        }}
      >
        {el.label === "icbc" && (
          <BrowserChrome sz={sz}>
            <div style={{ fontSize: sz(11), fontWeight: 600, color: "#111827", marginBottom: sz(4) }}>
              ICBC - New Residents
            </div>
            <PlaceholderLines count={5} sz={sz} />
          </BrowserChrome>
        )}

        {el.label === "google" && (
          <BrowserChrome sz={sz}>
            <div
              style={{
                backgroundColor: "#f3f4f6",
                borderRadius: sz(12),
                padding: `${sz(4)}px ${sz(8)}px`,
                fontSize: sz(9),
                color: "#4b5563",
                marginBottom: sz(6),
                border: "1px solid #e5e7eb",
              }}
            >
              how to get driver license vancouver non canadian
            </div>
            <PlaceholderLines count={3} sz={sz} />
          </BrowserChrome>
        )}

        {el.label === "sticky" && (
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#fef3c7",
              borderRadius: sz(4),
              padding: sz(10),
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              fontFamily: "Arial, sans-serif",
              fontSize: sz(11),
              color: "#92400e",
              lineHeight: 1.5,
              transform: `rotate(2deg)`,
            }}
          >
            Need: knowledge test, road test, 2 ID documents, proof of address???
          </div>
        )}

        {el.label === "reddit" && (
          <BrowserChrome sz={sz}>
            <div style={{ fontSize: sz(10), fontWeight: 600, color: "#ea580c", marginBottom: sz(4) }}>
              r/vancouver
            </div>
            <div style={{ fontSize: sz(11), fontWeight: 500, color: "#111827" }}>
              Moving from abroad - license help?
            </div>
            <PlaceholderLines count={2} sz={sz} />
          </BrowserChrome>
        )}

        {el.label === "notes" && (
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#ffffff",
              borderRadius: sz(6),
              padding: sz(10),
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              fontFamily: "Arial, sans-serif",
              fontSize: sz(10),
              color: "#374151",
              lineHeight: 1.8,
              backgroundImage: `repeating-linear-gradient(transparent, transparent ${sz(18)}px, #e5e7eb ${sz(18)}px, #e5e7eb ${sz(19)}px)`,
            }}
          >
            1. ICBC??{"\n"}2. Book test?{"\n"}3. Need translator?{"\n"}4. Which documents?
          </div>
        )}

        {el.label === "text" && (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                borderRadius: sz(16),
                padding: `${sz(8)}px ${sz(12)}px`,
                fontSize: sz(11),
                maxWidth: "100%",
                lineHeight: 1.4,
              }}
            >
              {"bro just go to ICBC they'll figure it out"}
            </div>
          </div>
        )}

        {el.label === "bcgov" && (
          <BrowserChrome sz={sz}>
            <div style={{ fontSize: sz(11), fontWeight: 600, color: "#111827", marginBottom: sz(4) }}>
              BC Government - Driver Licensing
            </div>
            <PlaceholderLines count={5} sz={sz} />
          </BrowserChrome>
        )}
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Chaos elements */}
      {chaosElements.map((el, i) => renderChaosElement(el, i))}

      {/* "There's a better way." centered text */}
      {frame >= 60 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
          }}
        >
          <div
            style={{
              fontSize: sz(20),
              fontWeight: 500,
              color: "#6366f1",
              opacity: betterWayOpacity * betterWayFadeOut,
              textAlign: "center",
            }}
          >
            {"There's a better way."}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
