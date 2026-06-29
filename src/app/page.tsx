"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import { FileText, Check, Info } from "@/components/Icons";

const DIMENSIONS = [
  "法定必备条款", "试用期合规性", "违约金条款", "竞业限制合规",
  "工时与休假", "社保缴纳", "解除/终止合同", "工资支付",
];

export default function Home() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      router.push(`/report/${data.contract.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mb-1">
          <FileText size={28} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">劳动合同风险审查</h1>
        <p className="text-gray-500 leading-relaxed">
          上传劳动合同文件，AI 将自动扫描 8 大维度风险，
          <br />并提供法律依据和修改建议
        </p>
      </div>

      <FileUpload onUpload={handleUpload} uploading={uploading} />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <Info className="mt-0.5 shrink-0 text-red-500" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Dimensions card */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={18} className="text-blue-500" />
          <h2 className="font-semibold">审查维度</h2>
        </div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          {DIMENSIONS.map((name) => (
            <div key={name} className="flex items-center gap-2 text-sm text-gray-600">
              <Check size={14} className="text-green-500 shrink-0" />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
