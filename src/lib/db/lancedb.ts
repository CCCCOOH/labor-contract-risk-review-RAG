import fs from "fs/promises";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "vectors.json");

interface VectorRecord {
  id: string;
  vector: number[];
  content: string;
  source: string;
}

let cacheLoaded = false;
let cache: VectorRecord[] = [];

async function load(): Promise<VectorRecord[]> {
  if (cacheLoaded) return cache;
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    cache = JSON.parse(raw);
  } catch {
    cache = [];
  }
  cacheLoaded = true;
  return cache;
}

async function save(records: VectorRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(records, null, 2), "utf-8");
  cache = records;
}

export async function tableExists(): Promise<boolean> {
  const records = await load();
  return records.length > 0;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function addVectors(
  records: Array<{
    id: string;
    vector: number[];
    content: string;
    source: string;
  }>
): Promise<void> {
  const existing = await load();
  // 替换相同 ID 的记录，追加新的
  const idSet = new Set(records.map((r) => r.id));
  const filtered = existing.filter((r) => !idSet.has(r.id));
  const updated = [...filtered, ...records];
  await save(updated);
}

export async function search(
  vector: number[],
  limit: number = 5
): Promise<
  Array<{ id: string; content: string; source: string; score: number }>
> {
  const records = await load();
  const scored = records.map((r) => ({
    id: r.id,
    content: r.content,
    source: r.source,
    score: cosineSimilarity(vector, r.vector),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export async function getStats(): Promise<{ count: number }> {
  const records = await load();
  return { count: records.length };
}
