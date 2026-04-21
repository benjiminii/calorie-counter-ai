export type Provider = 'claude' | 'gemini' | 'openai';

export interface ModelSpec {
  id: string;
  provider: Provider;
  label: string;
  // USD per 1M tokens
  inputPer1M: number;
  outputPer1M: number;
}

export const MODELS: ModelSpec[] = [
  // Gemini
  { id: 'gemini-2.5-flash-lite', provider: 'gemini', label: 'Gemini 2.5 Flash-Lite', inputPer1M: 0.1, outputPer1M: 0.4 },
  { id: 'gemini-2.5-flash', provider: 'gemini', label: 'Gemini 2.5 Flash', inputPer1M: 0.3, outputPer1M: 2.5 },
  { id: 'gemini-2.5-pro', provider: 'gemini', label: 'Gemini 2.5 Pro', inputPer1M: 1.25, outputPer1M: 10 },
  // OpenAI
  { id: 'gpt-4.1-nano', provider: 'openai', label: 'GPT-4.1 Nano', inputPer1M: 0.1, outputPer1M: 0.4 },
  { id: 'gpt-4.1-mini', provider: 'openai', label: 'GPT-4.1 Mini', inputPer1M: 0.4, outputPer1M: 1.6 },
  { id: 'gpt-4.1', provider: 'openai', label: 'GPT-4.1', inputPer1M: 2, outputPer1M: 8 },
  // Claude
  { id: 'claude-haiku-4-5', provider: 'claude', label: 'Claude Haiku 4.5', inputPer1M: 1, outputPer1M: 5 },
  { id: 'claude-sonnet-4-6', provider: 'claude', label: 'Claude Sonnet 4.6', inputPer1M: 3, outputPer1M: 15 },
  { id: 'claude-opus-4-7', provider: 'claude', label: 'Claude Opus 4.7', inputPer1M: 5, outputPer1M: 25 },
];

export const DEFAULT_MODEL_ID = 'gemini-2.5-flash';

export function findModel(id: string): ModelSpec {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
