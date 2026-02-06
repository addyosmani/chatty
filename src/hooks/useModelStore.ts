import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Model, Models } from "@/lib/models";
import { WebLLMLanguageModel, webLLM } from "@browser-ai/web-llm";

interface ModelState {
  selectedModel: Model;
  modelInstance: WebLLMLanguageModel | null;
}

interface ModelActions {
  setSelectedModel: (model: Model) => void;
  getModelInstance: () => WebLLMLanguageModel;
  clearModelInstance: () => void;
}

export const useModelStore = create<ModelState & ModelActions>()(
  persist(
    (set, get) => ({
      selectedModel: Models[7], // Default: Gemma2 2B
      modelInstance: null,

      setSelectedModel: (model) => {
        const state = get();
        if (state.selectedModel.name !== model.name) {
          // Clear cached instance when model changes
          set({ selectedModel: model, modelInstance: null });
        }
      },

      getModelInstance: (): WebLLMLanguageModel => {
        const state = get();

        // Return existing instance if available
        if (state.modelInstance) {
          return state.modelInstance;
        }

        // Create worker and model instance
        const worker = new Worker(
          new URL("@/lib/worker.ts", import.meta.url),
          { type: "module" }
        );
        const modelInstance = webLLM(state.selectedModel.name, { worker });

        // Cache the instance
        set({ modelInstance });

        return modelInstance;
      },

      clearModelInstance: () => {
        set({ modelInstance: null });
      },
    }),
    {
      name: "chatty-model-store",
      partialize: (state) => ({
        selectedModel: state.selectedModel,
      }),
    }
  )
);
