import { LLMConfig } from "./types";

export function getConfig(): LLMConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY || "",
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  };
}

export function validateConfig(config: LLMConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config.apiKey) errors.push("API Key 未设置");
  if (!config.baseUrl) errors.push("API Base URL 未设置");
  if (!config.model) errors.push("LLM 模型未设置");
  if (!config.embeddingModel) errors.push("Embedding 模型未设置");
  return { valid: errors.length === 0, errors };
}
