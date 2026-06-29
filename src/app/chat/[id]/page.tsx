"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import { ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const initialQ = searchParams.get("q");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const hasAsked = useRef(false);

  useEffect(() => {
    if (initialQ && !hasAsked.current) {
      hasAsked.current = true;
      handleSend(initialQ);
    }
  }, [initialQ]);

  const handleSend = async (message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setSending(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await fetch(`/api/chat/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();
      if (data.answer) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer },
        ]);
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "抱歉，请求失败：" + data.error },
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
  };

  return <ChatPanel messages={messages} onSend={handleSend} sending={sending} />;
}
