"use client";

import { RiskFinding } from "@/lib/types";
import { CheckCircle2, XCircle, Loader2, Clock } from "./Icons";

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

const statusStyles: Record<string, string> = {
  active: "border-blue-300 bg-blue-50",
  done: "border-green-200 bg-green-50",
  error: "border-red-200 bg-red-50",
  pending: "border-gray-200 bg-white",
};

const statusIcons: Record<string, [any, string]> = {
  done: [CheckCircle2, "text-green-500"],
  active: [Loader2, "text-blue-500"],
  error: [XCircle, "text-red-500"],
  pending: [Clock, "text-gray-400"],
};

const statusLabels: Record<string, string> = {
  active: "审查中...",
  done: "",
  error: "出错",
  pending: "等待中",
};

export default function ReviewProgress({ dimensions, current, total }: ReviewProgressProps) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">正在审查合同...</h2>
        <p className="text-sm text-gray-500">
          已审查 {current}/{total} 项维度
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Dimension list */}
      <div className="space-y-2">
        {dimensions.map((dim) => {
          const [Icon, colorClass] = statusIcons[dim.status] || statusIcons.pending;
          return (
            <div
              key={dim.dimensionKey}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${statusStyles[dim.status] || statusStyles.pending}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon size={18} className={`${colorClass} shrink-0`} />
                <span className={`text-sm font-medium truncate ${
                  dim.status === "active" ? "text-blue-700" : "text-gray-700"
                }`}>
                  {dim.dimensionName}
                </span>
                {dim.status === "done" && (
                  <span className="text-xs text-gray-500 shrink-0">
                    {dim.findings.length > 0 ? `${dim.findings.length} 项风险` : "无风险"}
                  </span>
                )}
                {dim.status === "error" && dim.error && (
                  <span className="text-xs text-red-500 truncate">{dim.error}</span>
                )}
              </div>
              {dim.status === "active" && (
                <span className="text-xs text-blue-500 shrink-0">{statusLabels.active}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
