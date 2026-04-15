import { create } from 'zustand';
import { DEFAULT_MODEL_ID } from '@/lib/providers/models';

interface ModelState {
  modelId: string;
  setModelId: (id: string) => void;
}

export const useModelStore = create<ModelState>((set) => ({
  modelId: DEFAULT_MODEL_ID,
  setModelId: (modelId) => set({ modelId }),
}));
