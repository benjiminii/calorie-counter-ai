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
  // Gemini
  { id: 'gemini-2.5-flash-lite', provider: 'gemini', label: 'Gemini 2.5 Flash-Lite', inputPer1M: 0.1, outputPer1M: 0.4 },
  { id: 'gemini-2.5-flash', provider: 'gemini', label: 'Gemini 2.5 Flash', inputPer1M: 0.3, outputPer1M: 2.5 },
  { id: 'gemini-2.5-pro', provider: 'gemini', label: 'Gemini 2.5 Pro', inputPer1M: 1.25, outputPer1M: 10 },
];

export const DEFAULT_MODEL_ID = 'gemini-2.5-flash';

export function findModel(id: string): ModelSpec {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
