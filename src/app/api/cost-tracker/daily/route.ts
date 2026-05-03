import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

  const transactions = await prisma.costTransaction.findMany({
    where: {
      userId: user.id,
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: "asc" },
  });

  const dailyMap: Record<string, { total: number; breakdown: Record<string, number> }> = {};

  for (const t of transactions) {
    const dateKey = t.date.toISOString().split("T")[0];
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { total: 0, breakdown: {} };
    }
    dailyMap[dateKey].total += t.amount;
    dailyMap[dateKey].breakdown[t.category] =
      (dailyMap[dateKey].breakdown[t.category] || 0) + t.amount;
  }

  const daily = Object.entries(dailyMap).map(([date, data]) => ({
    date,
    total: Math.round(data.total * 100) / 100,
    breakdown: Object.fromEntries(
      Object.entries(data.breakdown).map(([k, v]) => [k, Math.round(v * 100) / 100])
    ),
  }));

  return NextResponse.json(daily);
}
