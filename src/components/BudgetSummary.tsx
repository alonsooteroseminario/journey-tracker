"use client";

import { useState } from "react";
import { BudgetSummary as BudgetSummaryType } from "@/types";

interface BudgetSummaryProps {
  budget: BudgetSummaryType;
}

export function BudgetSummary({ budget }: BudgetSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group items by phase
  const groupedItems: Record<string, typeof budget.items> = {};
  budget.items.forEach((item) => {
    if (!groupedItems[item.phase]) {
      groupedItems[item.phase] = [];
    }
    groupedItems[item.phase].push(item);
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Budget Summary</h3>
              <p className="text-sm text-gray-600">Complete cost breakdown</p>
            </div>
          </div>
          <svg
            className={`w-6 h-6 text-gray-500 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* Quick Summary */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-white/60 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Base BC PNP</p>
            <p className="text-lg font-bold text-emerald-600">{budget.totalBase}</p>
            <p className="text-xs text-gray-500">~27 months</p>
          </div>
          <div className="bg-white/60 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Express Entry</p>
            <p className="text-lg font-bold text-blue-600">{budget.totalExpressEntry}</p>
            <p className="text-xs text-gray-500">~16 months</p>
          </div>
        </div>

        <div className="mt-3 text-center">
          <span className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
            {budget.timeSaved}
          </span>
        </div>
      </button>

      {/* Detailed Breakdown */}
      {isExpanded && (
        <div className="p-6 border-t border-gray-100">
          {Object.entries(groupedItems).map(([phase, items]) => (
            <div key={phase} className="mb-6 last:mb-0">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                {phase}
              </h4>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.item}</p>
                      <p className="text-xs text-gray-500">
                        {item.timing} • {item.notes}
                      </p>
                    </div>
                    <span className="font-bold text-gray-700 ml-4">{item.cost}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Totals */}
          <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                <span className="font-semibold text-emerald-800">Total (Base BC PNP)</span>
                <span className="text-xl font-bold text-emerald-600">{budget.totalBase}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-semibold text-blue-800">Total (Express Entry)</span>
                <span className="text-xl font-bold text-blue-600">{budget.totalExpressEntry}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
