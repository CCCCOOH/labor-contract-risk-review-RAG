"use client";
import { useEffect, useState } from "react";
import { KBStatus } from "@/lib/types";
import { Settings, CheckCircle2, XCircle, Loader2, Wrench, Info, Database } from "@/components/Icons";

export default function AdminPage() {
  const [status, setStatus] = useState<KBStatus | null>(null);
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch("/api/kb")
      .then((r) => r.json())
      .then(setStatus);
  }, []);

  const handleBuild = async () => {
    setBuilding(true);
    setResult("");
    try {
      const res = await fetch("/api/kb/build", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResult(`知识库构建完成！共 ${data.chunkCount} 个向量切片`);
        const sres = await fetch("/api/kb");
        setStatus(await sres.json());
      } else {
        setResult(`构建失败：${data.error}`);
      }
    } catch (e: any) {
      setResult(`请求失败：${e.message}`);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Settings size={24} className="text-blue-500" />
        <h1 className="text-2xl font-bold">知识库管理</h1>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-3">
        <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">知识库状态</h2>
        {status ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">状态</span>
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${status.built ? "text-green-600" : "text-red-500"}`}>
                {status.built ? <><CheckCircle2 size={16} />已构建</> : <><XCircle size={16} />未构建</>}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">向量切片数</span>
              <span className="text-sm font-medium">{status.chunkCount}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={16} />
            <span>加载中...</span>
          </div>
        )}
      </div>

      {/* Build button */}
      <button
        onClick={handleBuild}
        disabled={building}
        className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
      >
        {building ? <Loader2 size={18} /> : <Wrench size={18} />}
        <span>{building ? "正在构建知识库..." : "构建 / 重建知识库"}</span>
      </button>

      {/* Result */}
      {result && (
        <div className={`p-4 rounded-xl border text-sm flex items-start gap-2 ${
          result.includes("完成") || result.startsWith("知识库")
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {result.includes("完成") || result.startsWith("知识库")
            ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-500" />
            : <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          }
          <span>{result}</span>
        </div>
      )}

      {/* Info card */}
      <div className="p-5 bg-gray-50 rounded-xl border text-sm text-gray-500 space-y-2">
        <div className="flex items-center gap-1.5 font-medium text-gray-600">
          <Info size={15} />
          <span>说明</span>
        </div>
        <p className="leading-relaxed">
          首次使用前需要构建知识库。系统将自动读取
          <code className="text-xs bg-gray-200 px-1 rounded mx-1">data/knowledge/</code>
          目录下的法律文件，按法条边界切片后生成向量并存入索引。
          请确保已正确配置
          <code className="text-xs bg-gray-200 px-1 rounded mx-1">.env.local</code>
          中的 API 参数。
        </p>
      </div>
    </div>
  );
}
