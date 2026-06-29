import { NextResponse } from "next/server";
import { buildKnowledgeBase } from "@/lib/rag";
import fs from "fs/promises";
import path from "path";

export async function POST() {
  try {
    const kbDir = path.join(process.cwd(), "data", "knowledge");
    const files = await fs.readdir(kbDir);
    const docs: Array<{ content: string; source: string }> = [];

    for (const file of files) {
      if (file.endsWith(".md")) {
        const content = await fs.readFile(path.join(kbDir, file), "utf-8");
        docs.push({ content, source: file.replace(".md", "") });
      }
    }

    const result = await buildKnowledgeBase(docs);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
