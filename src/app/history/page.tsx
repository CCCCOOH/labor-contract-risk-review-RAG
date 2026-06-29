"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle2, AlertTriangle, BarChart3, MessageSquare, Clock, Info } from "@/components/Icons";

interface ContractItem {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  clauseCount: number;
  reviewed: boolean;
  riskCount: number;
  highRiskCount: number;
  sessionCount: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/contracts")
      .then((r) => r.json())
      .then((data) => {
        setContracts(data.contracts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        加载中...
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-4">
        <FileText size={48} className="text-gray-300 mx-auto" />
        <h1 className="text-2xl font-bold">审查历史</h1>
        <p className="text-gray-500">还没有审查过任何合同</p>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
        >
          <FileText size={16} />
          <span>上传合同</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock size={24} className="text-blue-500" />
        <h1 className="text-2xl font-bold">审查历史</h1>
      </div>

      <div className="space-y-3">
        {contracts.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
            onClick={() => router.push(`/report/${c.id}`)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={16} className="text-blue-500 shrink-0" />
                  <h3 className="font-medium text-gray-900 truncate">{c.fileName}</h3>
                  {c.reviewed ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full font-medium shrink-0">
                      <CheckCircle2 size={12} />
                      已审查
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full font-medium shrink-0">
                      <Clock size={12} />
                      待审查
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                  <span>{new Date(c.uploadedAt).toLocaleString("zh-CN")}</span>
                  <span>{c.clauseCount} 条条款</span>
                  <span>{c.fileType.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {c.reviewed && (
                  <>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                        <BarChart3 size={14} className="text-blue-500" />
                        <span>{c.riskCount}</span>
                      </div>
                      <div className="text-xs text-gray-400">风险</div>
                    </div>
                    {c.highRiskCount > 0 && (
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm font-semibold text-red-500">
                          <AlertTriangle size={14} />
                          <span>{c.highRiskCount}</span>
                        </div>
                        <div className="text-xs text-gray-400">高风险</div>
                      </div>
                    )}
                    {c.sessionCount > 0 && (
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                          <MessageSquare size={14} className="text-blue-500" />
                          <span>{c.sessionCount}</span>
                        </div>
                        <div className="text-xs text-gray-400">对话</div>
                      </div>
                    )}
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/report/${c.id}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors text-xs text-gray-600"
                >
                  <Info size={14} />
                  <span>查看</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
