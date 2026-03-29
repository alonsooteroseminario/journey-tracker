import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const transactions = await prisma.costTransaction.findMany({
    where: {
      userId: user.id,
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  const categoryMap: Record<string, number> = {};
  for (const t of transactions) {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  }

  const total = Object.values(categoryMap).reduce((sum, v) => sum + v, 0);

  const breakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: total > 0 ? Math.round((amount / total) * 100 * 10) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json(breakdown);
}
