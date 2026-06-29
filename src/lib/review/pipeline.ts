import { Contract, RiskFinding } from "@/lib/types";
import { REVIEW_DIMENSIONS } from "./dimensions";
import { generateChat } from "@/lib/rag/generate";
import { embedOne } from "@/lib/rag/embed";
import { search } from "@/lib/db/lancedb";
import crypto from "crypto";

function parseFindings(
  text: string,
  dimensionKey: string,
  dimensionName: string,
  contractId: string
): RiskFinding[] {
  try {
    const jsonMatch = text.match(/\{[\s\S]*"findings"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return (parsed.findings || []).map((f: any, i: number) => ({
        id: crypto
          .createHash("md5")
          .update(`${contractId}-${dimensionKey}-${i}`)
          .digest("hex")
          .slice(0, 12),
        dimensionKey,
        dimensionName,
        severity: f.severity || "medium",
        title: f.title || "未命名风险",
        description: f.description || "",
        relatedClause: f.relatedClause || "",
        legalBasis: f.legalBasis || "",
        suggestion: f.suggestion || "",
      }));
    }
  } catch {
    // JSON 解析失败
  }
  return [];
}

// ── Cache dimension embeddings (descriptions are static) ──
const embeddingCache = new Map<string, number[]>();

async function getDimensionEmbedding(description: string): Promise<number[]> {
  if (embeddingCache.has(description)) {
    return embeddingCache.get(description)!;
  }
  const vector = await embedOne(description);
  embeddingCache.set(description, vector);
  return vector;
}

// ── Build shared contract text once ──
function buildContractText(contract: Contract): string {
  return contract.clauses
    .slice(0, 20)
    .map((c) => `${c.title}\n${c.content}`)
    .join("\n\n");
}

export async function reviewDimension(
  contract: Contract,
  dimension: (typeof REVIEW_DIMENSIONS)[0]
): Promise<RiskFinding[]> {
  const dimVector = await getDimensionEmbedding(dimension.description);
  const relevantLaws = await search(dimVector, 5);

  const lawContext = relevantLaws
    .map((r, i) => `[参考法条${i + 1}] (${r.source})\n${r.content}`)
    .join("\n\n");

  const contractText = buildContractText(contract);

  const systemPrompt = `你是一位精通中国劳动法律法规的专家。请基于以下法律条文和合同内容进行审查。\n\n参考法规：\n${lawContext}\n\n合同内容：\n${contractText}`;

  const userPrompt = `请审查以下劳动合同内容。\n\n${dimension.prompt}`;

  const result = await generateChat(userPrompt, undefined, systemPrompt);
  return parseFindings(result, dimension.key, dimension.name, contract.id);
}

export async function runFullReview(contract: Contract): Promise<RiskFinding[]> {
  const allFindings: RiskFinding[] = [];

  for (const dim of REVIEW_DIMENSIONS) {
    const findings = await reviewDimension(contract, dim);
    allFindings.push(...findings);
  }

  return allFindings;
}

export interface ReviewDimensionResult {
  dimension: (typeof REVIEW_DIMENSIONS)[0];
  current: number;
  total: number;
  findings: RiskFinding[];
  error?: string;
}

export async function* reviewEachDimension(
  contract: Contract
): AsyncGenerator<ReviewDimensionResult> {
  const total = REVIEW_DIMENSIONS.length;

  type TaskResult = {
    index: number;
    dim: (typeof REVIEW_DIMENSIONS)[0];
    findings: RiskFinding[];
    error?: string;
  };

  let resolveQueue: ((value: TaskResult) => void) | null = null;
  const queue: TaskResult[] = [];

  function enqueue(result: TaskResult) {
    if (resolveQueue) {
      resolveQueue(result);
      resolveQueue = null;
    } else {
      queue.push(result);
    }
  }

  for (let index = 0; index < total; index++) {
    const dim = REVIEW_DIMENSIONS[index];
    reviewDimension(contract, dim)
      .then(
        (findings) => enqueue({ index, dim, findings, error: undefined }),
        (e: any) => enqueue({ index, dim, findings: [], error: e.message || String(e) })
      );
  }

  let completedCount = 0;
  while (completedCount < total) {
    const result =
      queue.length > 0
        ? queue.shift()!
        : await new Promise<TaskResult>((resolve) => {
            resolveQueue = resolve;
          });

    completedCount++;
    yield {
      dimension: result.dim,
      current: completedCount,
      total,
      findings: result.findings,
      error: result.error,
    };
  }
}
