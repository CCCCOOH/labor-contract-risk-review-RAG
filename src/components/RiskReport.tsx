import { ReviewReport } from "@/lib/types";
import RiskCard from "./RiskCard";
import { AlertTriangle, AlertCircle, CheckCircle2, BarChart3 } from "./Icons";

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

  const stats = [
    { label: "风险总数", value: report.findings.length, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "高风险", value: highCount, color: "text-red-500", bg: "bg-red-50", icon: AlertTriangle },
    { label: "中风险", value: mediumCount, color: "text-yellow-500", bg: "bg-yellow-50", icon: AlertCircle },
    { label: "低风险", value: lowCount, color: "text-green-500", bg: "bg-green-50", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`p-4 rounded-xl border shadow-sm ${s.bg} text-center space-y-1`}>
            {s.icon && <s.icon size={20} className={`${s.color} mx-auto`} />}
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={18} className="text-blue-500" />
          <h2 className="font-semibold">审查摘要</h2>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{report.summary}</p>
      </div>

      {/* Findings by severity */}
      {(["high", "medium", "low"] as const).map((severity) => {
        const findings = report.findings.filter((f) => f.severity === severity);
        if (findings.length === 0) return null;

        const labels: Record<string, string> = {
          high: "高风险",
          medium: "中风险",
          low: "低风险",
        };
        const colors: Record<string, string> = {
          high: "text-red-500",
          medium: "text-yellow-500",
          low: "text-green-500",
        };
        const Icons: Record<string, any> = {
          high: AlertTriangle,
          medium: AlertCircle,
          low: CheckCircle2,
        };
        const Icon = Icons[severity];

        return (
          <div key={severity} className="space-y-3">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <Icon size={18} className={colors[severity]} />
              <span>{labels[severity]}</span>
              <span className="text-sm font-normal text-gray-400">({findings.length})</span>
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
