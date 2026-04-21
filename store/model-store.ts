import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_MODEL_ID, findModel } from '@/lib/providers/models';

interface ModelState {
  modelId: string;
  setModelId: (id: string) => void;
}

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      modelId: DEFAULT_MODEL_ID,
      setModelId: (modelId) => set({ modelId }),
    }),
    {
      name: 'model-store',
      storage: createJSONStorage(() => secureStoreAdapter),
      merge: (persisted, current) => {
        const saved = (persisted as Partial<ModelState>)?.modelId;
        // Drop stale IDs that no longer exist in the registry.
        const validId = saved && findModel(saved).id === saved ? saved : current.modelId;
        return { ...current, modelId: validId };
      },
    }
  )
);
