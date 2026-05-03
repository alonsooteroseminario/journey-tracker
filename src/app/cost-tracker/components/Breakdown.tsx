"use client";

interface BreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

interface BreakdownProps {
  data: BreakdownItem[] | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  claude: "bg-blue-500",
  elevenlabs: "bg-purple-500",
  vercel: "bg-black",
  railway: "bg-brand-primary",
  mongodb: "bg-brand-secondary",
  cloudflare: "bg-orange-500",
  discord: "bg-indigo-500",
  cursor: "bg-cyan-500",
  other: "bg-gray-500",
};

const CATEGORY_ICONS: Record<string, string> = {
  claude: "🤖",
  elevenlabs: "🔊",
  vercel: "▲",
  railway: "🚂",
  mongodb: "🍃",
  cloudflare: "☁️",
  discord: "💬",
  cursor: "⌨️",
  other: "📦",
};

export function Breakdown({ data }: BreakdownProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h2>
        <p className="text-gray-500">No transactions yet. Add your first transaction to see breakdown.</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const sorted = [...data].sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Spending by Category</h2>

      <div className="space-y-4">
        {sorted.map((item) => {
          const percentage = total > 0 ? (item.amount / total) * 100 : 0;
          return (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CATEGORY_ICONS[item.category] || "📦"}</span>
                  <span className="font-medium text-gray-800 capitalize">{item.category}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">${item.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                </div>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 mt-6 pt-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-800">Total</p>
          <p className="text-2xl font-bold text-gray-800">${total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
