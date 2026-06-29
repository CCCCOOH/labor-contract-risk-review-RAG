"use client";
import { useEffect, useState } from "react";
import { KBStatus } from "@/lib/types";
import { Settings, CheckCircle2, XCircle, Loader2, Wrench, Info, Database, FileText, BookOpen, Search, ChevronRight } from "@/components/Icons";

interface KBContentSource {
  filename: string;
  size: number;
  sizeLabel: string;
  chunkCount: number;
}

interface KBContentChunk {
  id: string;
  source: string;
  preview: string;
  length: number;
}

interface KBContent {
  sources: KBContentSource[];
  chunks: KBContentChunk[];
  stats: {
    totalSources: number;
    totalChunks: number;
    totalChunkChars: number;
  };
}

export default function AdminPage() {
  const [tab, setTab] = useState<"status" | "content">("status");
  const [status, setStatus] = useState<KBStatus | null>(null);
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState("");
  const [content, setContent] = useState<KBContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    fetch("/api/kb")
      .then((r) => r.json())
      .then(setStatus);
  }, []);

  const loadContent = async () => {
    setLoadingContent(true);
    try {
      const res = await fetch("/api/kb/content");
      const data = await res.json();
      if (data.sources) setContent(data);
    } catch {}
    setLoadingContent(false);
  };

  useEffect(() => {
    if (tab === "content" && !content) loadContent();
  }, [tab, content]);

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
        setContent(null);
      } else {
        setResult(`构建失败：${data.error}`);
      }
    } catch (e: any) {
      setResult(`请求失败：${e.message}`);
    } finally {
      setBuilding(false);
    }
  };

  const toggleSource = (name: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleChunk = (id: string) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter chunks
  const filteredChunks = content
    ? content.chunks.filter((c) => {
        if (filterSource && c.source !== filterSource) return false;
        if (filterText && !c.preview.toLowerCase().includes(filterText.toLowerCase())) return false;
        return true;
      })
    : [];

  // Group filtered chunks by source
  const groupedChunks = new Map<string, typeof filteredChunks>();
  for (const c of filteredChunks) {
    const group = groupedChunks.get(c.source) || [];
    group.push(c);
    groupedChunks.set(c.source, group);
  }

  const tabs = [
    { key: "status", label: "状态", icon: Info },
    { key: "content", label: "知识库文档", icon: BookOpen },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Settings size={24} className="text-blue-500" />
        <h1 className="text-2xl font-bold">知识库管理</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon size={16} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Tab: Status ─── */}
      {tab === "status" && (
        <div className="space-y-6">
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

          <button
            onClick={handleBuild}
            disabled={building}
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
          >
            {building ? <Loader2 size={18} /> : <Wrench size={18} />}
            <span>{building ? "正在构建知识库..." : "构建 / 重建知识库"}</span>
          </button>

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
      )}

      {/* ─── Tab: Content / Documents ─── */}
      {tab === "content" && (
        <div className="space-y-4">
          {loadingContent && !content && (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
              <Loader2 size={16} />
              <span>加载知识库内容...</span>
            </div>
          )}

          {!loadingContent && !content && (
            <div className="text-center py-12 text-gray-400 text-sm">
              无法加载知识库内容。请先在「状态」标签页构建知识库。
            </div>
          )}

          {content && (
            <>
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "源文档", value: content.stats.totalSources, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "向量切片", value: content.stats.totalChunks, icon: Database, color: "text-purple-600", bg: "bg-purple-50" },
                  { label: "总字符数", value: content.stats.totalChunkChars.toLocaleString(), icon: BookOpen, color: "text-green-600", bg: "bg-green-50" },
                ].map((s) => (
                  <div key={s.label} className={`p-4 rounded-xl border shadow-sm ${s.bg}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <s.icon size={16} className={s.color} />
                      <span className="text-xs text-gray-500">{s.label}</span>
                    </div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="搜索切片内容..."
                    className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
                  />
                </div>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                >
                  <option value="">全部文档</option>
                  {content.sources.map((s) => (
                    <option key={s.filename} value={s.filename}>{s.filename}</option>
                  ))}
                </select>
              </div>

              {/* Source accordion */}
              {content.sources.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <Database size={36} className="mx-auto mb-3 text-gray-300" />
                  <p>知识库中没有源文档</p>
                </div>
              )}

              <div className="space-y-2">
                {content.sources.map((source) => {
                  const chunks = groupedChunks.get(source.filename) || [];
                  const isExpanded = expandedSources.has(source.filename);
                  return (
                    <div key={source.filename} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                      {/* Source header */}
                      <button
                        onClick={() => toggleSource(source.filename)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ChevronRight
                            size={16}
                            className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                          />
                          <FileText size={18} className="text-blue-500 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">{source.filename}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {source.sizeLabel} · {source.chunkCount} 个切片
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                            {source.chunkCount} 条
                          </span>
                        </div>
                      </button>

                      {/* Chunks */}
                      {isExpanded && (
                        <div className="border-t divide-y">
                          {chunks.length === 0 && (
                            <div className="px-5 py-6 text-center text-sm text-gray-400">无匹配切片</div>
                          )}
                          {chunks.map((chunk) => {
                            const isChunkExpanded = expandedChunks.has(chunk.id);
                            return (
                              <div key={chunk.id} className="px-5 py-3">
                                <button
                                  onClick={() => toggleChunk(chunk.id)}
                                  className="flex items-start gap-2 w-full text-left"
                                >
                                  <ChevronRight
                                    size={14}
                                    className={`text-gray-400 mt-0.5 shrink-0 transition-transform duration-150 ${isChunkExpanded ? "rotate-90" : ""}`}
                                  />
                                  <div className="min-w-0 flex-1">
                                    {isChunkExpanded ? (
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-mono text-xs bg-gray-50 p-3 rounded-lg">
                                        {content.chunks.find((c) => c.id === chunk.id)?.preview.replace(/\n{2,}/g, "\n")}
                                      </p>
                                    ) : (
                                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{chunk.preview}</p>
                                    )}
                                    <div className="text-xs text-gray-400 mt-1">
                                      {chunk.length} 字符 · ID: {chunk.id.slice(0, 8)}
                                    </div>
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
