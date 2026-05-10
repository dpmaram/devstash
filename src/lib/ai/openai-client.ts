import OpenAI from "openai";

export const AI_MODEL = "gpt-3.5-turbo";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = new OpenAI({
    apiKey,
  });

  return cachedClient;
}