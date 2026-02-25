import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface ConfettiExplosionProps {
  count: number;
  colors: string[];
  originX: number;
  originY: number;
  triggerFrame: number;
  sz: (n: number) => number;
}

interface Particle {
  angle: number;
  speed: number;
  color: string;
  size: number;
  rotateSpeed: number;
}

const generateParticles = (count: number, colors: string[]): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      angle: (i / count) * Math.PI * 2 + (i * 0.3),
      speed: 2 + (i % 3) * 1.5,
      color: colors[i % colors.length],
      size: 6 + (i % 4) * 2,
      rotateSpeed: 3 + (i % 5) * 2,
    });
  }
  return particles;
};

export const ConfettiExplosion: React.FC<ConfettiExplosionProps> = ({
  count,
  colors,
  originX,
  originY,
  triggerFrame,
  sz,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const particles = React.useMemo(() => generateParticles(count, colors), [count, colors]);

  const localFrame = frame - triggerFrame;
  if (localFrame < 0 || localFrame > 60) return null;

  const opacity = localFrame < 45
    ? 1
    : interpolate(localFrame, [45, 60], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 50,
        opacity,
      }}
    >
      {particles.map((p, i) => {
        const distance = p.speed * localFrame;
        const gravity = 0.15 * localFrame * localFrame * 0.01;
        const x = originX * width + Math.cos(p.angle) * sz(distance);
        const y = originY * height + Math.sin(p.angle) * sz(distance) + sz(gravity);
        const rotation = localFrame * p.rotateSpeed;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: sz(p.size),
              height: sz(p.size * 0.6),
              backgroundColor: p.color,
              borderRadius: sz(2),
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}
    </div>
  );
};
