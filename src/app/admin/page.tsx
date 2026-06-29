"use client";
import { useEffect, useState } from "react";
import { KBStatus } from "@/lib/types";

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
        setResult(`✅ 知识库构建完成！共 ${data.chunkCount} 个向量切片`);
        const sres = await fetch("/api/kb");
        setStatus(await sres.json());
      } else {
        setResult(`❌ 构建失败：${data.error}`);
      }
    } catch (e: any) {
      setResult(`❌ 请求失败：${e.message}`);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">⚙️ 知识库管理</h1>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="font-semibold mb-3">知识库状态</h2>
        {status ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">状态</span>
              <span className={status.built ? "text-green-600" : "text-red-500"}>
                {status.built ? "✅ 已构建" : "❌ 未构建"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">向量切片数</span>
              <span>{status.chunkCount}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">加载中...</p>
        )}
      </div>

      <button
        onClick={handleBuild}
        disabled={building}
        className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {building ? "⏳ 正在构建知识库..." : "🔧 构建/重建知识库"}
      </button>

      {result && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            result.startsWith("✅")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {result}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
        <p className="font-medium mb-2">📌 说明</p>
        <p>
          首次使用前需要构建知识库。系统将自动读取
          data/knowledge/ 目录下的法律文件，切片后生成向量并存入
          LanceDB。请确保已正确配置 .env.local 中的 API 参数。
        </p>
      </div>
    </div>
  );
}
