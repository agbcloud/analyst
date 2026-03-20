import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOllama } from "ollama-ai-provider";

export type LLMModel = {
  id: string;
  name: string;
  provider: string;
  providerId: string;
};

export type LLMModelConfig = {
  model?: string;
  apiKey?: string;
  baseURL?: string;
  agbApiKey?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  maxTokens?: number;
};

export function getModelClient(model: LLMModel, config: LLMModelConfig) {
  const { providerId } = model || { providerId: "openai" };
  const { apiKey, baseURL, model: modelNameString } = config;

  if (!modelNameString) {
    throw new Error("Model name is required in config");
  }

  const providerConfigs = {
    anthropic: () => createAnthropic({ apiKey, baseURL })(modelNameString),
    google: () =>
      createGoogleGenerativeAI({ apiKey, baseURL })(modelNameString),
    openai: () => createOpenAI({ apiKey, baseURL })(modelNameString),
    ollama: () => createOllama({ baseURL })(modelNameString),
  };

  const createClient =
    providerConfigs[providerId as keyof typeof providerConfigs];

  if (!createClient) {
    throw new Error(`Unsupported provider: ${providerId}`);
  }

  return createClient();
}
