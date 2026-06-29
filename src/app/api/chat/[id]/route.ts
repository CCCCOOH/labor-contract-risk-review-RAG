import { NextRequest, NextResponse } from "next/server";
import { getContract } from "@/lib/store";
import { queryRAG } from "@/lib/rag";
import { ChatMessage } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { message, history = [] } = body as {
      message: string;
      history?: ChatMessage[];
    };

    const contract = await getContract(params.id);
    if (!contract) {
      return NextResponse.json({ error: "合同不存在" }, { status: 404 });
    }

    const enrichedQuestion = `基于以下劳动合同内容：\n\n${contract.content.slice(0, 3000)}\n\n用户问题：${message}`;

    const result = await queryRAG(enrichedQuestion, 5);

    return NextResponse.json({
      answer: result.answer,
      sources: result.sources.slice(0, 3),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
