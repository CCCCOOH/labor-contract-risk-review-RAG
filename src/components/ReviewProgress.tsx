"use client";

import { RiskFinding, ReviewDimension } from "@/lib/types";

export interface DimensionProgress {
  dimensionKey: string;
  dimensionName: string;
  status: "pending" | "active" | "done" | "error";
  findings: RiskFinding[];
  error?: string;
}

interface ReviewProgressProps {
  dimensions: DimensionProgress[];
  current: number;
  total: number;
}

export default function ReviewProgress({ dimensions, current, total }: ReviewProgressProps) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-1">🔍 正在审查合同...</h2>
        <p className="text-sm text-gray-500">
          已审查 {current}/{total} 项维度
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
        <div
          className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Dimension list */}
      <div className="space-y-2">
        {dimensions.map((dim) => (
          <div
            key={dim.dimensionKey}
            className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
              dim.status === "active"
                ? "border-blue-300 bg-blue-50"
                : dim.status === "done"
                ? "border-green-200 bg-green-50"
                : dim.status === "error"
                ? "border-red-200 bg-red-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {dim.status === "done"
                  ? "✅"
                  : dim.status === "active"
                  ? "🔄"
                  : dim.status === "error"
                  ? "❌"
                  : "⏳"}
              </span>
              <span
                className={`text-sm font-medium ${
                  dim.status === "active" ? "text-blue-700" : "text-gray-700"
                }`}
              >
                {dim.dimensionName}
              </span>
              {dim.status === "done" && (
                <span className="text-xs text-gray-500">
                  {dim.findings.length > 0
                    ? `发现 ${dim.findings.length} 项风险`
                    : "无风险"}
                </span>
              )}
              {dim.status === "error" && dim.error && (
                <span className="text-xs text-red-500">{dim.error}</span>
              )}
            </div>
            {dim.status === "active" && (
              <span className="text-xs text-blue-500 animate-pulse">审查中...</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
