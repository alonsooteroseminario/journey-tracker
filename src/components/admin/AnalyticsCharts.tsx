"use client";

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { TimeSeriesDataPoint } from "@/types/admin";

interface AnalyticsChartsProps {
  userGrowth: TimeSeriesDataPoint[];
  goalActivity: TimeSeriesDataPoint[];
  taskActivity: TimeSeriesDataPoint[];
  topCategories: Array<{ category: string; count: number }>;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#06b6d4"];

export function AnalyticsCharts({
  userGrowth,
  goalActivity,
  taskActivity,
  topCategories,
}: AnalyticsChartsProps) {
  // Format dates for display (MM/DD)
  const formatUserGrowth = userGrowth.map((d) => ({
    ...d,
    displayDate: formatDateShort(d.date),
  }));

  const formatGoalActivity = goalActivity.map((d) => ({
    ...d,
    displayDate: formatDateShort(d.date),
  }));

  const formatTaskActivity = taskActivity.map((d) => ({
    ...d,
    displayDate: formatDateShort(d.date),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Growth Chart */}
      <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          User Growth (Last 30 Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formatUserGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="displayDate"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
              name="New Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Goal Activity Chart */}
      <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Goals Created (Last 30 Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatGoalActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="displayDate"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
            <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Goals Created" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Task Activity Chart */}
      <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Tasks Completed (Last 30 Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatTaskActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="displayDate"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
            <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} name="Tasks Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Template Categories Pie Chart */}
      <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Top Template Categories
        </h3>
        {topCategories.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topCategories}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => {
                  const data = entry as { percent: number; name: string };
                  return `${data.name} ${(data.percent * 100).toFixed(0)}%`;
                }}
                labelLine={false}
              >
                {topCategories.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                fontSize={12}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-text-muted">
            No template data available
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateShort(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${month}/${day}`;
}
