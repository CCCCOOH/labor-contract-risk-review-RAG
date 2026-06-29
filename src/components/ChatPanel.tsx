"use client";
import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/lib/types";
import { MessageSquare, MessageCircle, Send } from "./Icons";
import MarkdownRenderer from "./MarkdownRenderer";

export default function ChatPanel({
  messages,
  onSend,
  sending,
}: {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  sending: boolean;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare size={22} className="text-blue-500" />
        <h1 className="text-xl font-bold">合同条款深度探讨</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border mb-4 min-h-[400px] max-h-[600px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <MessageCircle size={48} className="text-gray-300" />
            <p className="text-sm text-center leading-relaxed">
              针对合同条款或审查结果提出问题，
              <br />AI 将基于劳动法规为您解答
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  <div className="max-w-[80%] bg-blue-500 text-white rounded-xl px-4 py-3 shadow-sm">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[85%] bg-gray-100 text-gray-800 rounded-xl px-4 py-3">
                    <MarkdownRenderer content={msg.content} />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入您的问题..."
          className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <MessageSquare size={16} />
          <span>发送</span>
        </button>
      </form>
    </div>
  );
}
