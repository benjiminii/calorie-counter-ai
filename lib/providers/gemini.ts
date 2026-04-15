import { GoogleGenAI, Type } from '@google/genai';
import { AnalyzeFoodFn, AnalysisResult, USER_PROMPT, languageInstruction, normalize } from './types';

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    calories: { type: Type.NUMBER },
    protein: { type: Type.NUMBER },
    carbs: { type: Type.NUMBER },
    fat: { type: Type.NUMBER },
    confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    description: { type: Type.STRING },
  },
  required: ['name', 'calories', 'protein', 'carbs', 'fat', 'confidence', 'ingredients', 'description'],
  propertyOrdering: ['name', 'calories', 'protein', 'carbs', 'fat', 'confidence', 'ingredients', 'description'],
};

export const analyzeFood: AnalyzeFoodFn = async (jpegBase64, context, modelId, language) => {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error('missing EXPO_PUBLIC_GEMINI_API_KEY');

  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: modelId ?? 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: jpegBase64 } },
          {
            text: (context ? `${USER_PROMPT} Context: ${context}` : USER_PROMPT) + languageInstruction(language),
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 400,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  console.log('[gemini]', modelId, 'usage:', response.usageMetadata);
  const text = response.text;
  if (!text) throw new Error('no text in response');
  const parsed = JSON.parse(text) as Partial<AnalysisResult>;
  return normalize(parsed);
};
