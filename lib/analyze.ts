import { setMealStatus, updateMealAnalysis } from '@/db/queries';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import i18n from './i18n';
import { analyzeFood as analyzeClaude } from './providers/claude';
import { analyzeFood as analyzeGemini } from './providers/gemini';
import { findModel } from './providers/models';
import { useModelStore } from '@/store/model-store';

async function prepareImageBase64(photoUri: string): Promise<string> {
  const result = await manipulateAsync(
    photoUri,
    [{ resize: { width: 1024 } }],
    { compress: 0.7, format: SaveFormat.JPEG, base64: true }
  );
  if (result.base64) return result.base64;
  return await FileSystem.readAsStringAsync(result.uri, { encoding: 'base64' as const });
}

export async function analyzeAndUpdateMeal(
  mealId: string,
  photoUri: string,
  context: string
): Promise<void> {
  let base64: string;
  try {
    base64 = await prepareImageBase64(photoUri);
  } catch (err) {
    console.error('[analyze] image prep failed:', err);
    await setMealStatus(mealId, 'error');
    return;
  }

  const approxBytes = Math.floor(base64.length * 0.75);
  console.log('[analyze] image ~', Math.round(approxBytes / 1024), 'KB (jpeg, resized)');
  if (approxBytes > 4.5 * 1024 * 1024) {
    console.error('[analyze] image still too large after resize');
    await setMealStatus(mealId, 'error');
    return;
  }

  try {
    const modelId = useModelStore.getState().modelId;
    const model = findModel(modelId);
    const fn = model.provider === 'gemini' ? analyzeGemini : analyzeClaude;
    const language = i18n.language || 'en';
    console.log('[analyze] using', model.label, `($${model.inputPer1M}/$${model.outputPer1M} per 1M)`, 'lang:', language);
    const result = await fn(base64, context, model.id, language);
    await updateMealAnalysis(mealId, {
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      ingredients: JSON.stringify(result.ingredients),
      description: result.description,
      confidence: result.confidence,
      model: model.id,
    });
  } catch (error) {
    console.error('[analyze] error:', error);
    await setMealStatus(mealId, 'error');
  }
}
