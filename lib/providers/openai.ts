import OpenAI from 'openai';
import { AnalyzeFoodFn, AnalysisResult, USER_PROMPT, languageInstruction, normalize } from './types';

const JSON_SCHEMA = {
  name: 'meal_analysis',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      calories: { type: 'number' },
      protein: { type: 'number' },
      carbs: { type: 'number' },
      fat: { type: 'number' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      ingredients: { type: 'array', items: { type: 'string' } },
      description: { type: 'string' },
    },
    required: ['name', 'calories', 'protein', 'carbs', 'fat', 'confidence', 'ingredients', 'description'],
    additionalProperties: false,
  },
};

export const analyzeFood: AnalyzeFoodFn = async (jpegBase64, context, modelId, language) => {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!key) throw new Error('missing EXPO_PUBLIC_OPENAI_API_KEY');

  const client = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
  const prompt = (context ? `${USER_PROMPT} Context: ${context}` : USER_PROMPT) + languageInstruction(language);

  const response = await client.chat.completions.create({
    model: modelId ?? 'gpt-4.1-nano',
    max_tokens: 400,
    response_format: { type: 'json_schema', json_schema: JSON_SCHEMA },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${jpegBase64}` } },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  console.log('[openai]', modelId, 'usage:', response.usage);
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('no text in response');
  const parsed = JSON.parse(text) as Partial<AnalysisResult>;
  return normalize(parsed);
};
