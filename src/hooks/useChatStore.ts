import { Model, Models } from "@/lib/models";
import * as webllm from "@mlc-ai/web-llm";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const LOCAL_SELECTED_MODEL = "selectedModel";

interface State {
  selectedModel: Model;
  modelHasChanged: boolean;
  isLoading: boolean;
  messages: webllm.ChatCompletionMessageParam[];
}

interface Actions {
  setSelectedModel: (model: Model) => void;
  setModelHasChanged: (changed: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setMessages: (
    fn: (
      messages: webllm.ChatCompletionMessageParam[]
    ) => webllm.ChatCompletionMessageParam[]
  ) => void;
}

const useChatStore = create<State & Actions>()(
  persist(
    (set) => ({
      selectedModel: Models[0],
      setSelectedModel: (model: Model) =>
        set((state: State) => ({
          selectedModel:
            state.selectedModel !== model ? model : state.selectedModel,
          modelHasChanged: true,
        })),
      modelHasChanged: false,
      setModelHasChanged: (changed) => set({ modelHasChanged: changed }),

      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      messages: [],
      setMessages: (fn) => set((state) => ({ messages: fn(state.messages) })),
    }),
    {
      name: LOCAL_SELECTED_MODEL,
      // Only save selectedModel to local storage with partialize
      partialize: (state) => ({
        selectedModel: state.selectedModel,
      }),
      skipHydration: true,
    }
  )
);

export default useChatStore;
