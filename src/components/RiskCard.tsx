import { RiskFinding } from "@/lib/types";
import Link from "next/link";
import { BookOpen, Lightbulb, MessageSquare, AlertTriangle, AlertCircle, CheckCircle2 } from "./Icons";

export default function RiskCard({
  finding,
  contractId,
}: {
  finding: RiskFinding;
  contractId: string;
}) {
  const SeverityIcon = finding.severity === "high"
    ? AlertTriangle
    : finding.severity === "medium"
      ? AlertCircle
      : CheckCircle2;

  const borderColor =
    finding.severity === "high"
      ? "border-l-red-500"
      : finding.severity === "medium"
        ? "border-l-yellow-500"
        : "border-l-green-500";

  const iconColor =
    finding.severity === "high"
      ? "text-red-500"
      : finding.severity === "medium"
        ? "text-yellow-500"
        : "text-green-500";

  return (
    <div className={`p-5 bg-white rounded-xl shadow-sm border border-l-4 ${borderColor} space-y-3`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <SeverityIcon size={18} className={`${iconColor} mt-0.5 shrink-0`} />
          <div className="min-w-0">
            <span className="inline-block text-xs px-2.5 py-0.5 bg-gray-100 rounded-full text-gray-500 mb-1.5 font-medium">
              {finding.dimensionName}
            </span>
            <h4 className="font-medium text-gray-900 leading-snug">{finding.title}</h4>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">{finding.description}</p>

      {finding.legalBasis && (
        <div className="flex items-start gap-2 text-sm">
          <BookOpen size={15} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-gray-700">法律依据：</span>
            <span className="text-gray-600">{finding.legalBasis}</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-sm">
        <Lightbulb size={15} className="text-amber-500 mt-0.5 shrink-0" />
        <div>
          <span className="font-medium text-gray-700">建议：</span>
          <span className="text-gray-600">{finding.suggestion}</span>
        </div>
      </div>

      <div className="pt-2">
        <Link
          href={`/chat/${contractId}?q=${encodeURIComponent(finding.title)}`}
          className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 transition-colors font-medium"
        >
          <MessageSquare size={14} />
          <span>深入讨论此风险 →</span>
        </Link>
      </div>
    </div>
  );
}
