import { fetchEmbeddings } from "./api-client";

export async function embed(texts: string[]): Promise<number[][]> {
  return fetchEmbeddings(texts);
}

export async function embedOne(text: string): Promise<number[]> {
  const results = await embed([text]);
  return results[0];
}
