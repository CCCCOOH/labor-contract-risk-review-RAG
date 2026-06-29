import { embed } from "./embed";
import { addVectors, search, getStats, tableExists } from "@/lib/db/lancedb";
import { generateChat } from "./generate";
import crypto from "crypto";

const MAX_ARTICLE_CHARS = 1200;

/**
 * Smart chunker: splits along article boundaries (`### 第X条`),
 * then re-merges tiny articles so each chunk is substantive,
 * and splits oversized articles at the nearest paragraph boundary.
 */
function chunkText(
  text: string,
  source: string
): Array<{ id: string; content: string; source: string }> {
  // Split on article headers first
  const rawArticles = text.split(/(?=^### )/m).filter(Boolean);

  const articles: Array<{ id: string; content: string; source: string }> = [];

  // Buffer for merging very small articles
  let buffer = "";

  function flushBuffer() {
    if (buffer.trim().length === 0) return;
    const hash = crypto.createHash("md5").update(buffer).digest("hex").slice(0, 12);
    articles.push({ id: hash, content: buffer.trim(), source });
    buffer = "";
  }

  for (const block of rawArticles) {
    // Skip pure headings (no body text)
    const lines = block.trim().split("\n").filter(Boolean);
    const bodyText = lines.filter((l) => !l.startsWith("#")).join("\n").trim();
    if (!bodyText) continue;

    // If the article is very large, split at paragraph boundaries
    if (block.length > MAX_ARTICLE_CHARS) {
      flushBuffer();
      const paragraphs = block.split(/\n\n+/);
      let subBlock = "";
      for (const para of paragraphs) {
        if ((subBlock + para).length > MAX_ARTICLE_CHARS && subBlock.length > 0) {
          const hash = crypto.createHash("md5").update(subBlock).digest("hex").slice(0, 12);
          articles.push({ id: hash, content: subBlock.trim(), source });
          subBlock = para;
        } else {
          subBlock += (subBlock ? "\n\n" : "") + para;
        }
      }
      if (subBlock.trim().length > 0) {
        const hash = crypto.createHash("md5").update(subBlock).digest("hex").slice(0, 12);
        articles.push({ id: hash, content: subBlock.trim(), source });
      }
      continue;
    }

    // Small article — buffer it and merge with neighbours
    const merged = buffer ? buffer + "\n\n" + block.trim() : block.trim();
    if (merged.length <= MAX_ARTICLE_CHARS) {
      buffer = merged;
    } else {
      flushBuffer();
      buffer = block.trim();
    }
  }
  flushBuffer();

  return articles;
}

export async function buildKnowledgeBase(
  docs: Array<{ content: string; source: string }>
): Promise<{ chunkCount: number }> {
  const allChunks: Array<{ id: string; content: string; source: string }> = [];

  for (const doc of docs) {
    const chunks = chunkText(doc.content, doc.source);
    allChunks.push(...chunks);
  }

  const batchSize = 10; // DashScope text-embedding-v4 最多支持 10 条，OpenAI 支持更多
  const vectors: Array<{ id: string; vector: number[]; content: string; source: string }> = [];

  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const embeddings = await embed(batch.map((c) => c.content));
    for (let j = 0; j < batch.length; j++) {
      vectors.push({ ...batch[j], vector: embeddings[j] });
    }
  }

  await addVectors(vectors);
  return { chunkCount: vectors.length };
}

export async function queryRAG(
  question: string,
  topK: number = 5
): Promise<{ answer: string; sources: Array<{ content: string; source: string }> }> {
  const { embedOne } = await import("./embed");
  const { generateChat } = await import("./generate");

  const qVector = await embedOne(question);
  const results = await search(qVector, topK);

  const sources = results.map((r) => ({ content: r.content, source: r.source }));
  const context = sources.map((s, i) => `[法条${i + 1}] (${s.source})\n${s.content}`).join("\n\n");

  const answer = await generateChat(question, context);
  return { answer, sources };
}

export { tableExists, getStats } from "@/lib/db/lancedb";
