import Anthropic from '@anthropic-ai/sdk';
import { AnalyzeFoodFn, AnalysisResult, USER_PROMPT, languageInstruction, normalize } from './types';

const TOOL = {
  name: 'log_meal',
  description: 'Log meal nutrition.',
  input_schema: {
    type: 'object' as const,
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
  },
};

export const analyzeFood: AnalyzeFoodFn = async (jpegBase64, context, modelId, language) => {
  const key = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!key) throw new Error('missing EXPO_PUBLIC_ANTHROPIC_API_KEY');

  const client = new Anthropic({ apiKey: key });
  const response = await client.messages.create({
    model: modelId ?? 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    tools: [TOOL],
    tool_choice: { type: 'tool', name: 'log_meal' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpegBase64 } },
          {
            type: 'text',
            text: (context ? `${USER_PROMPT} Context: ${context}` : USER_PROMPT) + languageInstruction(language),
          },
        ],
      },
    ],
  });

  console.log('[claude]', response.model, 'usage:', response.usage);
  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('no tool_use block');
  return normalize(toolUse.input as Partial<AnalysisResult>);
};
