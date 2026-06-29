import { fetchChatCompletion } from "./api-client";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function generateChat(
  userMessage: string,
  context?: string,
  systemPrompt?: string,
  history: ChatMessage[] = []
): Promise<string> {
  const messages: ChatMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  if (context) {
    const ctxMsg = systemPrompt
      ? `\n\n参考以下法律法规：\n\n${context}`
      : `你是一位精通中国劳动法律法规的专家。请基于以下法律条文回答问题。\n\n参考法规：\n\n${context}`;
    messages.push({ role: "system", content: ctxMsg });
  } else if (!systemPrompt) {
    messages.push({
      role: "system",
      content: "你是一位精通中国劳动法律法规的专家，请专业、准确地回答用户的问题。",
    });
  }

  messages.push(...history);
  messages.push({ role: "user", content: userMessage });

  return fetchChatCompletion(messages);
}
