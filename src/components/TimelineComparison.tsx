"use client";

import { useState } from "react";
import { TimelineComparison as TimelineComparisonType } from "@/types";

interface TimelineComparisonProps {
  timeline: TimelineComparisonType;
}

export function TimelineComparison({ timeline }: TimelineComparisonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📅</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Timeline Comparison</h3>
              <p className="text-sm text-gray-600">Base vs Express Entry BC</p>
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

        {/* Quick Comparison */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="text-center bg-white/60 rounded-xl p-4 flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Base BC PNP</p>
            <p className="text-2xl font-bold text-purple-600">{timeline.totalBase}</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">⚡</span>
            <span className="text-xs font-bold text-green-600">{timeline.totalTimeSaved}</span>
            <span className="text-xs text-gray-500">faster</span>
          </div>
          <div className="text-center bg-white/60 rounded-xl p-4 flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Express Entry</p>
            <p className="text-2xl font-bold text-indigo-600">{timeline.totalExpress}</p>
          </div>
        </div>
      </button>

      {/* Detailed Breakdown */}
      {isExpanded && (
        <div className="p-6 border-t border-gray-100">
          {/* Timeline Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Phase</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-purple-600">Base BC PNP</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-indigo-600">Express Entry</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-green-600">Time Saved</th>
                </tr>
              </thead>
              <tbody>
                {timeline.phases.map((phase, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-2 font-medium text-gray-800">{phase.phase}</td>
                    <td className="py-3 px-2 text-center text-sm text-gray-600">{phase.baseOption}</td>
                    <td className="py-3 px-2 text-center text-sm text-gray-600">{phase.expressOption}</td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`text-sm font-medium ${
                          phase.timeSaved !== "Same" && phase.timeSaved !== "N/A"
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {phase.timeSaved}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td className="py-3 px-2 text-gray-800">TOTAL</td>
                  <td className="py-3 px-2 text-center text-purple-600">{timeline.totalBase}</td>
                  <td className="py-3 px-2 text-center text-indigo-600">{timeline.totalExpress}</td>
                  <td className="py-3 px-2 text-center text-green-600">{timeline.totalTimeSaved}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Advantages Comparison */}
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-xl p-4">
              <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                <span>🔷</span> Base BC PNP Advantages
              </h4>
              <ul className="space-y-2">
                {timeline.baseAdvantages.map((adv, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-purple-700">
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {adv}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4">
              <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                <span>⚡</span> Express Entry Advantages
              </h4>
              <ul className="space-y-2">
                {timeline.expressAdvantages.map((adv, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-indigo-700">
                    <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {adv}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
