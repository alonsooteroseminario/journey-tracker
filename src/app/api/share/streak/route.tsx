import React from "react";
import { ImageResponse } from "next/og";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { computeGoalTier } from "@/lib/streaks/computeTier";
import { NextRequest, NextResponse } from "next/server";

// Node.js runtime required — Prisma client is incompatible with edge runtime

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ImageResponseFactory = (...args: any[]) => Response;
// Call ImageResponse via Reflect.construct so arrow-function mocks work in tests
function createImageResponse(element: React.ReactElement, options?: { width?: number; height?: number }): Response {
  // In production, ImageResponse is a class; in tests it may be an arrow function mock.
  // Using Reflect.construct falls back gracefully.
  const IR = ImageResponse as unknown as ImageResponseFactory;
  try {
    return Reflect.construct(IR, [element, options]);
  } catch {
    return IR(element, options);
  }
}

const BRAND_DARK = "#2D1B8E";
const BRAND_PRIMARY = "#5B50E8";
const BRAND_LIGHT = "#EAE8FF";

function tierIcon(tier: string | null): string {
  if (tier === "gold") return "🥇";
  if (tier === "silver") return "🥈";
  if (tier === "bronze") return "🥉";
  return "🔥";
}

function tierLabel(tier: string | null): string {
  if (tier === "gold") return "Gold Streak";
  if (tier === "silver") return "Silver Streak";
  if (tier === "bronze") return "Bronze Streak";
  return "Streak";
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl ?? new URL(req.url);
  const goalId = searchParams.get("goalId");
  const showTitle = searchParams.get("showTitle") !== "false";
  const showTier = searchParams.get("showTier") !== "false";
  const showTagline = searchParams.get("showTagline") !== "false";
  const showAppName = searchParams.get("showAppName") !== "false";

  let streakCount = 0;
  let tier: string | null = null;
  let goalTitle: string | null = null;

  if (goalId) {
    const [goal, streakRow] = await Promise.all([
      prisma.goal.findUnique({ where: { id: goalId } }),
      prisma.goalStreak.findFirst({ where: { goalId } }),
    ]);
    goalTitle = goal?.title ?? null;
    streakCount = streakRow?.currentStreak ?? 0;
    tier = streakRow ? computeGoalTier(streakRow.currentStreak) : null;
  } else {
    const streaks = await prisma.goalStreak.findMany({
      where: {
        user: { clerkId: userId },
        currentStreak: { gt: 0 },
      },
      orderBy: { currentStreak: "desc" },
    });
    streakCount = streaks.reduce((sum, s) => sum + s.currentStreak, 0);
    const tiers = streaks.map((s) => computeGoalTier(s.currentStreak));
    if (tiers.some((t) => t === "gold")) tier = "gold";
    else if (tiers.some((t) => t === "silver")) tier = "silver";
    else if (tiers.length > 0) tier = "bronze";
  }

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
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "32px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: "40px",
              padding: "40px 80px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", fontSize: "180px", fontWeight: "bold", color: "#fff", lineHeight: 1 }}>
              {`${streakCount}`}
            </div>
            <div style={{ display: "flex", fontSize: "40px", color: BRAND_LIGHT, fontWeight: 600 }}>
              {`day${streakCount !== 1 ? "s" : ""} streak`}
            </div>
          </div>

          {showTier && tier && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                background: "rgba(255,255,255,0.15)",
                borderRadius: "60px",
                padding: "20px 48px",
              }}
            >
              <div style={{ display: "flex", fontSize: "64px" }}>{tierIcon(tier)}</div>
              <div style={{ display: "flex", fontSize: "40px", color: "#fff", fontWeight: 700 }}>
                {tierLabel(tier)}
              </div>
            </div>
          )}

          {showTitle && goalTitle && (
            <div style={{ display: "flex", fontSize: "44px", color: BRAND_LIGHT, textAlign: "center", maxWidth: "800px" }}>
              {goalTitle}
            </div>
          )}

          {showTagline && (
            <div style={{ display: "flex", fontSize: "40px", color: "rgba(255,255,255,0.7)" }}>
              {"🔥 Staying consistent on my journey"}
            </div>
          )}
        </div>

        {showAppName && (
          <div
            style={{
              position: "absolute",
              bottom: 48,
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", fontSize: "32px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
              {"Journey Tracker"}
            </div>
          </div>
        )}
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
