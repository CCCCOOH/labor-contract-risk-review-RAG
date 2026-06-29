import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getAllChunks } from "@/lib/db/lancedb";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

export async function GET() {
  try {
    const kbDir = path.join(process.cwd(), "data", "knowledge");

    // Read source documents
    let sourceFiles: Array<{ filename: string; size: number; sizeLabel: string }> = [];
    try {
      const files = await fs.readdir(kbDir);
      for (const file of files) {
        if (file.endsWith(".md")) {
          const stat = await fs.stat(path.join(kbDir, file));
          sourceFiles.push({
            filename: file.replace(".md", ""),
            size: stat.size,
            sizeLabel: formatSize(stat.size),
          });
        }
      }
      sourceFiles.sort((a, b) => b.size - a.size);
    } catch {}

    // Read vector chunks
    const chunks = await getAllChunks();

    // Group chunks by source
    const chunkMap = new Map<string, typeof chunks>();
    for (const chunk of chunks) {
      const group = chunkMap.get(chunk.source) || [];
      group.push(chunk);
      chunkMap.set(chunk.source, group);
    }

    const sources = sourceFiles.map((sf) => ({
      ...sf,
      chunkCount: chunkMap.get(sf.filename)?.length || 0,
    }));

    const chunkList = chunks.map((c) => ({
      id: c.id,
      source: c.source,
      preview: truncate(c.content, 160),
      length: c.content.length,
    }));

    const totalChunkChars = chunks.reduce((s, c) => s + c.content.length, 0);

    return NextResponse.json({
      sources,
      chunks: chunkList,
      stats: {
        totalSources: sources.length,
        totalChunks: chunks.length,
        totalChunkChars,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
