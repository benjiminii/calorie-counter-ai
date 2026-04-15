export type Provider = 'claude' | 'gemini';

export interface ModelSpec {
  id: string;
  provider: Provider;
  label: string;
  // USD per 1M tokens
  inputPer1M: number;
  outputPer1M: number;
}

export const MODELS: ModelSpec[] = [
  // Claude
  { id: 'claude-haiku-4-5-20251001', provider: 'claude', label: 'Claude Haiku 4.5', inputPer1M: 1, outputPer1M: 5 },
  { id: 'claude-sonnet-4-6', provider: 'claude', label: 'Claude Sonnet 4.6', inputPer1M: 3, outputPer1M: 15 },
  { id: 'claude-opus-4-6', provider: 'claude', label: 'Claude Opus 4.6', inputPer1M: 15, outputPer1M: 75 },
  // Gemini
  { id: 'gemini-2.5-flash-lite', provider: 'gemini', label: 'Gemini 2.5 Flash-Lite', inputPer1M: 0.1, outputPer1M: 0.4 },
  { id: 'gemini-2.5-flash', provider: 'gemini', label: 'Gemini 2.5 Flash', inputPer1M: 0.3, outputPer1M: 2.5 },
  { id: 'gemini-2.5-pro', provider: 'gemini', label: 'Gemini 2.5 Pro', inputPer1M: 1.25, outputPer1M: 10 },
];

export const DEFAULT_MODEL_ID = 'claude-haiku-4-5-20251001';

export function findModel(id: string): ModelSpec {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
