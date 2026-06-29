import { getConfig } from "@/lib/config";

const DEFAULT_TIMEOUT = 60000; // 60 seconds

async function apiFetch(
  endpoint: string,
  body: any,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const config = getConfig();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let detail = errText;
      try {
        const errJson = JSON.parse(errText);
        detail = errJson.error?.message || errJson.message || errText;
      } catch {}
      throw new Error(`API ${response.status}: ${detail}`);
    }

    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`请求超时 (${timeoutMs / 1000}s): ${endpoint}。请检查 OPENAI_BASE_URL 和网络连接。`);
    }
    if (error.message?.includes("fetch failed") || error.cause?.code === "ECONNREFUSED") {
      throw new Error(
        `无法连接到 API 服务器 (${config.baseUrl})。请检查:\n` +
        `1. OPENAI_BASE_URL 是否正确\n` +
        `2. 网络连接是否正常\n` +
        `3. API 服务是否在运行`
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchEmbeddings(texts: string[]): Promise<number[][]> {
  const config = getConfig();
  const body: any = {
    model: config.embeddingModel,
    input: texts,
    encoding_format: "float",
  };
  // text-embedding-v4/v3 支持指定维度，默认 1024
  if (config.embeddingModel === "text-embedding-v4" || config.embeddingModel === "text-embedding-v3") {
    body.dimensions = 1024;
  }
  const response = await apiFetch("/embeddings", body);
  const data = await response.json();
  return data.data.map((d: any) => d.embedding);
}

export async function fetchChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const config = getConfig();
  const response = await apiFetch("/chat/completions", {
    model: config.model,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 2048,
  });
  const data = await response.json();
  return data.choices[0].message.content;
}
