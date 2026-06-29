"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import { ChatMessage, ChatSession } from "@/lib/types";
import { ArrowLeft, MessageSquare, Plus, Trash2, Clock, FileText } from "@/components/Icons";

interface SessionSummary {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
}

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const initialQ = searchParams.get("q");
  const sessionParam = searchParams.get("session");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(sessionParam);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(!!sessionParam);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const initRef = useRef(false);

  // Load all sessions for this contract
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/${id}`);
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions.map((s: ChatSession) => ({
          id: s.id,
          title: s.title,
          messageCount: s.messages.length,
          updatedAt: s.updatedAt,
        })));
      }
    } catch {}
  }, [id]);

  // Load existing session on mount
  useEffect(() => {
    if (sessionParam && !initRef.current) {
      initRef.current = true;
      fetch(`/api/chat/${id}?session=${sessionParam}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.session) setMessages(data.session.messages);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
    if (!sessionParam) initRef.current = true;
    loadSessions();
  }, [sessionParam, id, loadSessions]);

  // Switch to a different session
  const switchSession = useCallback(async (sid: string) => {
    setLoading(true);
    setSessionId(sid);
    setSidebarOpen(false);
    try {
      const res = await fetch(`/api/chat/${id}?session=${sid}`);
      const data = await res.json();
      if (data.session) {
        setMessages(data.session.messages);
      }
    } catch {}
    setLoading(false);
  }, [id]);

  // Start a new session
  const newSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setSidebarOpen(false);
    router.replace(`/chat/${id}`);
  }, [id, router]);

  // Delete a session
  const deleteSession = useCallback(async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/${id}?session=${sid}`, { method: "DELETE" });
      if (sid === sessionId) {
        setSessionId(null);
        setMessages([]);
      }
      loadSessions();
    } catch {}
  }, [id, sessionId, loadSessions]);

  const handleSend = useCallback(async (message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setSending(true);

    try {
      const res = await fetch(`/api/chat/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId: sessionId }),
      });
      const data = await res.json();
      if (data.answer) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
        if (data.sessionId) {
          setSessionId(data.sessionId);
          loadSessions();
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "抱歉，请求失败：" + (data.error || "未知错误") },
        ]);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "抱歉，请求失败：" + e.message },
      ]);
    } finally {
      setSending(false);
    }
  }, [id, sessionId, loadSessions]);

  // Trigger initial question after component is ready
  useEffect(() => {
    if (loading) return;
    if (!initialQ) return;
    if (sessionParam) return;
    const timer = setTimeout(() => handleSend(initialQ), 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        加载会话中...
      </div>
    );
  }

  const activeSessionTitle = sessions.find((s) => s.id === sessionId)?.title;

  return (
    <div className="flex gap-0 min-h-[70vh]">
      {/* Session sidebar - mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`
        fixed md:sticky top-14 md:top-auto left-0 bottom-0 w-72 z-50
        bg-white border-r shadow-lg md:shadow-none
        transform transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">对话历史</h2>
            <button
              onClick={newSession}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus size={14} />
              <span>新建</span>
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">暂无对话记录</p>
          ) : (
            <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => switchSession(s.id)}
                  className={`group flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    s.id === sessionId
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <MessageSquare size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-700 truncate">{s.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{s.messageCount} 条消息</span>
                      <span>{new Date(s.updatedAt).toLocaleString("zh-CN")}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                    title="删除对话"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 min-w-0 ml-0 md:ml-72">
        <div className="space-y-4">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 border rounded-lg"
              >
                <MessageSquare size={16} />
              </button>
              <button
                onClick={() => router.push(`/report/${id}`)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>返回报告</span>
              </button>
              {activeSessionTitle && (
                <span className="text-sm text-gray-400 hidden sm:inline">
                  / {activeSessionTitle}
                </span>
              )}
            </div>
            {messages.length === 0 && (
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <MessageSquare size={15} />
                <span>新对话</span>
              </div>
            )}
          </div>

          <ChatPanel messages={messages} onSend={handleSend} sending={sending} />
        </div>
      </div>
    </div>
  );
}
