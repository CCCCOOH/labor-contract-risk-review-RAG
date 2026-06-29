/** 合同记录 */
export interface Contract {
  id: string;
  fileName: string;
  fileType: "pdf" | "docx" | "doc";
  content: string;
  clauses: Clause[];
  uploadedAt: string;
}

export interface Clause {
  index: number;
  title: string;
  content: string;
}

/** 审查维度 */
export interface ReviewDimension {
  key: string;
  name: string;
  description: string;
  prompt: string;
}

/** 单条风险发现 */
export interface RiskFinding {
  id: string;
  dimensionKey: string;
  dimensionName: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  relatedClause: string;
  legalBasis: string;
  suggestion: string;
}

/** 审查报告 */
export interface ReviewReport {
  id: string;
  contractId: string;
  createdAt: string;
  findings: RiskFinding[];
  summary: string;
}

/** 对话消息 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** LLM 配置 */
export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  embeddingModel: string;
}

/** 知识库状态 */
export interface KBStatus {
  built: boolean;
  documentCount: number;
  chunkCount: number;
  lastBuiltAt: string | null;
}
