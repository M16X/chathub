import { create } from "zustand";

export const DEFAULT_MODEL_ID = "hy3-free";

export type ModelInfo = {
  id: string;
  name: string;
  description?: string;
  owned_by?: string;
};

export const FALLBACK_MODELS: ModelInfo[] = [
  {
    id: "stepfun/step-3.7-flash:free",
    name: "Step 3.7 Flash",
    description: "Default model",
  }
];

export function formatModelName(id: string): string {
  return id
    .split(/[-_/]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type ModelStore = {
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
};

export const useModelStore = create<ModelStore>((set) => ({
  selectedModelId: DEFAULT_MODEL_ID,
  setSelectedModelId: (selectedModelId) => set({ selectedModelId }),
}));
