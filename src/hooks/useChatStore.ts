import { Model, Models } from "@/lib/models";
import * as webllm from "@mlc-ai/web-llm";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Document } from "@langchain/core/documents";

const LOCAL_SELECTED_MODEL = "selectedModel";

interface State {
  selectedModel: Model;
  input: string;
  modelHasChanged: boolean;
  isLoading: boolean;
  messages: webllm.ChatCompletionMessageParam[];
  engine: webllm.MLCEngineInterface | null;
  fileText: Document<Record<string, any>>[] | null;
  files: File[] | undefined;
}

interface Actions {
  setSelectedModel: (model: Model) => void;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  setInput: (input: string) => void;
  setModelHasChanged: (changed: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setMessages: (
    fn: (
      messages: webllm.ChatCompletionMessageParam[]
    ) => webllm.ChatCompletionMessageParam[]
  ) => void;
  setEngine: (engine: webllm.MLCEngineInterface | null) => void;
  setFileText: (text: Document<Record<string, any>>[] | null) => void;
  setFiles: (files: File[] | undefined) => void;
}

const useChatStore = create<State & Actions>()(
  persist(
    (set) => ({
      selectedModel: Models[2],
      setSelectedModel: (model: Model) =>
        set((state: State) => ({
          selectedModel:
            state.selectedModel !== model ? model : state.selectedModel,
          modelHasChanged: true,
        })),

      input: "",
      handleInputChange: (
        e:
          | React.ChangeEvent<HTMLInputElement>
          | React.ChangeEvent<HTMLTextAreaElement>
      ) => set({ input: e.target.value }),
      setInput: (input) => set({ input }),

      modelHasChanged: false,
      setModelHasChanged: (changed) => set({ modelHasChanged: changed }),

      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      messages: [],
      setMessages: (fn) => set((state) => ({ messages: fn(state.messages) })),

      engine: null,
      setEngine: (engine) => set({ engine }),

      fileText: null,
      setFileText: (text) => set({ fileText: text }),

      files: undefined,
      setFiles: (files) => set({ files }),
    }),
    {
      name: LOCAL_SELECTED_MODEL,
      // Only save selectedModel to local storage with partialize
      partialize: (state) => ({
        selectedModel: state.selectedModel,
      }),
    }
  )
);

export default useChatStore;
