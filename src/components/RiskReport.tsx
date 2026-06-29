import { ReviewReport } from "@/lib/types";
import RiskCard from "./RiskCard";

export default function RiskReport({
  report,
  contractId,
}: {
  report: ReviewReport;
  contractId: string;
}) {
  const highCount = report.findings.filter((f) => f.severity === "high").length;
  const mediumCount = report.findings.filter((f) => f.severity === "medium").length;
  const lowCount = report.findings.filter((f) => f.severity === "low").length;

  return (
    <div>
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-blue-600">
            {report.findings.length}
          </div>
          <div className="text-sm text-gray-500">风险总数</div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-red-500">{highCount}</div>
          <div className="text-sm text-gray-500">🔴 高风险</div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-yellow-500">{mediumCount}</div>
          <div className="text-sm text-gray-500">🟡 中风险</div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-green-500">{lowCount}</div>
          <div className="text-sm text-gray-500">🟢 低风险</div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-white rounded-xl shadow-sm border mb-6">
        <h2 className="font-semibold mb-2">📊 审查摘要</h2>
        <p className="text-gray-600">{report.summary}</p>
      </div>

      {/* Findings by severity */}
      {(["high", "medium", "low"] as const).map((severity) => {
        const findings = report.findings.filter((f) => f.severity === severity);
        if (findings.length === 0) return null;

        const labels: Record<string, string> = {
          high: "🔴 高风险",
          medium: "🟡 中风险",
          low: "🟢 低风险",
        };

        return (
          <div key={severity} className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              {labels[severity]} ({findings.length})
            </h3>
            <div className="space-y-3">
              {findings.map((f) => (
                <RiskCard key={f.id} finding={f} contractId={contractId} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
