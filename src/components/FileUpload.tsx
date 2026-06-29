"use client";
import { useCallback, useState } from "react";
import { Upload, Loader2, FileText } from "./Icons";

export default function FileUpload({
  onUpload,
  uploading,
}: {
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".pdf") || file.name.endsWith(".docx") || file.name.endsWith(".doc"))) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
        dragOver
          ? "border-blue-400 bg-blue-50/60 scale-[1.01]"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="text-blue-500" />
          <p className="text-gray-500">正在解析合同文件...</p>
        </div>
      ) : (
        <>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 text-gray-400 mb-4">
            <Upload size={28} />
          </div>
          <p className="text-base font-medium mb-1">将合同文件拖拽到此处</p>
          <p className="text-sm text-gray-400 mb-5">
            支持 PDF 和 Word（.docx / .doc）格式
          </p>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm">
            <FileText size={16} />
            <span>选择文件</span>
            <input type="file" accept=".pdf,.docx,.doc" className="hidden" onChange={handleChange} />
          </label>
        </>
      )}
    </div>
  );
}
