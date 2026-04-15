export interface AnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'high' | 'medium' | 'low';
  ingredients: string[];
  description: string;
}

export type AnalyzeFoodFn = (
  jpegBase64: string,
  context: string,
  modelId?: string,
  language?: string
) => Promise<AnalysisResult>;

const LANGUAGE_NAMES: Record<string, string> = {
  mn: 'Mongolian (Cyrillic)',
  en: 'English',
};

export function languageInstruction(lang?: string): string {
  const name = LANGUAGE_NAMES[lang ?? ''] ?? 'English';
  return ` Respond in ${name} for name, ingredients, and description.`;
}

export const ANALYSIS_FIELDS = {
  name: 'short name',
  calories: 'kcal per serving shown',
  protein: 'grams',
  carbs: 'grams',
  fat: 'grams',
  confidence: 'high | medium | low',
  ingredients: 'main components',
  description: '1 short sentence',
} as const;

export function clampConfidence(v: unknown): 'high' | 'medium' | 'low' {
  return v === 'high' || v === 'low' ? v : 'medium';
}

export function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export function normalize(input: Partial<AnalysisResult>): AnalysisResult {
  return {
    name: typeof input.name === 'string' ? input.name : 'Unknown',
    calories: num(input.calories),
    protein: num(input.protein),
    carbs: num(input.carbs),
    fat: num(input.fat),
    confidence: clampConfidence(input.confidence),
    ingredients: Array.isArray(input.ingredients) ? input.ingredients.filter((x): x is string => typeof x === 'string') : [],
    description: typeof input.description === 'string' ? input.description : '',
  };
}

export const USER_PROMPT = 'Estimate nutrition.';
