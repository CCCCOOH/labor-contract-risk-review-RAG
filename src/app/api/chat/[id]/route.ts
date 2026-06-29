import { NextRequest, NextResponse } from "next/server";
import { getContract, saveChatSession, getChatSession, getChatSessionsByContract, deleteChatSession } from "@/lib/store";
import { queryRAG } from "@/lib/rag";
import { ChatMessage, ChatSession } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

// ── GET: list sessions for contract, or get a specific session ──
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = req.nextUrl.searchParams.get("session");

  if (sessionId) {
    const session = await getChatSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    }
    return NextResponse.json({ session });
  }

  const sessions = await getChatSessionsByContract(params.id);
  return NextResponse.json({ sessions });
}

// ── DELETE: delete a session ──
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session");
    if (!sessionId) {
      return NextResponse.json({ error: "缺少 session 参数" }, { status: 400 });
    }
    await deleteChatSession(sessionId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST: send a message, auto-save to session ──
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contract = await getContract(params.id);
    if (!contract) {
      return NextResponse.json({ error: "合同不存在" }, { status: 404 });
    }

    const body = await req.json();
    const { message, sessionId: existingSessionId } = body as {
      message: string;
      sessionId?: string;
    };

    // Load or create session
    let session: ChatSession;
    if (existingSessionId) {
      const existing = await getChatSession(existingSessionId);
      if (!existing) {
        return NextResponse.json({ error: "会话不存在" }, { status: 404 });
      }
      session = existing;
    } else {
      session = {
        id: uuidv4(),
        contractId: params.id,
        title: message.slice(0, 60) + (message.length > 60 ? "..." : ""),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Update messages with user input
    session.messages.push({ role: "user", content: message });

    // Call RAG
    const enrichedQuestion = `基于以下劳动合同内容：\n\n${contract.content.slice(0, 3000)}\n\n用户问题：${message}`;
    const result = await queryRAG(enrichedQuestion, 5);

    // Add assistant response
    session.messages.push({ role: "assistant", content: result.answer });
    session.updatedAt = new Date().toISOString();

    // Persist
    await saveChatSession(session);

    return NextResponse.json({
      answer: result.answer,
      sources: result.sources.slice(0, 3),
      sessionId: session.id,
      title: session.title,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
