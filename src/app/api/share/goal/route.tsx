import React from "react";
import { ImageResponse } from "next/og";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { computeGoalTier } from "@/lib/streaks/computeTier";
import { NextRequest, NextResponse } from "next/server";

// Node.js runtime required — Prisma client is incompatible with edge runtime

const BRAND_DARK = "#2D1B8E";
const BRAND_PRIMARY = "#5B50E8";
const BRAND_LIGHT = "#EAE8FF";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ImageResponseFactory = (...args: any[]) => Response;
function createImageResponse(element: React.ReactElement, options?: { width?: number; height?: number }): Response {
  const IR = ImageResponse as unknown as ImageResponseFactory;
  try {
    return Reflect.construct(IR, [element, options]);
  } catch {
    return IR(element, options);
  }
}

function tierIcon(tier: string | null): string {
  if (tier === "gold") return "🥇";
  if (tier === "silver") return "🥈";
  if (tier === "bronze") return "🥉";
  return "";
}

function computeProgress(tasks: Array<{ status: string; substeps?: Array<{ status: string }> }>): { done: number; total: number; pct: number } {
  let done = 0;
  let total = 0;
  for (const task of tasks) {
    const subs = task.substeps ?? [];
    if (subs.length > 0) {
      total += subs.length;
      done += subs.filter((s) => s.status === "completed").length;
    } else {
      total += 1;
      done += task.status === "completed" ? 1 : 0;
    }
  }
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl ?? new URL(req.url);
  const goalId = searchParams.get("goalId");

  if (!goalId) {
    return NextResponse.json({ error: "goalId required" }, { status: 400 });
  }

  const showProgress = searchParams.get("showProgress") !== "false";
  const showTasks = searchParams.get("showTasks") !== "false";
  const showStreak = searchParams.get("showStreak") !== "false";
  const showTagline = searchParams.get("showTagline") !== "false";
  const showAppName = searchParams.get("showAppName") !== "false";

  const [goal, streakRow] = await Promise.all([
    prisma.goal.findUnique({ where: { id: goalId } }),
    prisma.goalStreak.findFirst({ where: { goalId } }),
  ]);

  const title = goal?.title ?? "My Goal";
  const icon = goal?.icon ?? "🎯";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks = (goal?.tasks as any[]) ?? [];
  const { done, total, pct } = computeProgress(tasks);
  const streakCount = streakRow?.currentStreak ?? 0;
  const tier = streakRow ? computeGoalTier(streakRow.currentStreak) : null;

  return createImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1080px",
          background: `linear-gradient(135deg, ${BRAND_DARK} 0%, ${BRAND_PRIMARY} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          gap: "0px",
        }}
      >
        {/* Background circles */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 360, height: 360, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -50, left: -50, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "36px", padding: "0 80px" }}>

          {/* Icon + Title */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", fontSize: "96px", lineHeight: 1 }}>{icon}</div>
            <div style={{ display: "flex", fontSize: "52px", fontWeight: "bold", color: "#fff", textAlign: "center", maxWidth: "900px", lineHeight: 1.2 }}>
              {title}
            </div>
          </div>

          {/* Progress */}
          {showProgress && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", width: "700px" }}>
              <div style={{ display: "flex", fontSize: "96px", fontWeight: "bold", color: "#fff", lineHeight: 1 }}>
                {`${pct}%`}
              </div>
              {/* Progress bar */}
              <div style={{ width: "100%", height: "20px", background: "rgba(255,255,255,0.2)", borderRadius: "10px", display: "flex" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: BRAND_LIGHT, borderRadius: "10px" }} />
              </div>
            </div>
          )}

          {/* Tasks done */}
          {showTasks && total > 0 && (
            <div style={{ display: "flex", fontSize: "36px", color: BRAND_LIGHT }}>
              {`${done} of ${total} tasks done`}
            </div>
          )}

          {/* Streak */}
          {showStreak && streakCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.15)", borderRadius: "60px", padding: "16px 40px" }}>
              <div style={{ display: "flex", fontSize: "48px" }}>{tierIcon(tier)}</div>
              <div style={{ display: "flex", fontSize: "36px", color: "#fff", fontWeight: 600 }}>
                {`${streakCount} day streak 🔥`}
              </div>
            </div>
          )}

          {/* Tagline */}
          {showTagline && (
            <div style={{ display: "flex", fontSize: "36px", color: "rgba(255,255,255,0.65)" }}>
              {"🎯 Working towards my goal"}
            </div>
          )}
        </div>

        {/* Branding */}
        {showAppName && (
          <div style={{ display: "flex", position: "absolute", bottom: 48, fontSize: "28px", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
            {"Journey Tracker"}
          </div>
        )}
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
