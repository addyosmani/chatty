import { Model } from "@/lib/models";
import * as webllm from "@mlc-ai/web-llm";
import { create } from "zustand";

interface State {
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;

  userInput: string;
  setUserInput: (input: string) => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  messages: webllm.ChatCompletionMessage[];
  setMessages: (
    fn: (
      messages: webllm.ChatCompletionMessage[]
    ) => webllm.ChatCompletionMessage[]
  ) => void;
}

const useChatStore = create<State>((set) => ({
  selectedModel: Model.LLAMA_3_8B_INSTRUCT_Q4F16_1,
  setSelectedModel: (model) => set({ selectedModel: model }),

  userInput: "",
  setUserInput: (input) => set({ userInput: input }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  messages: [],
  setMessages: (fn) => set((state) => ({ messages: fn(state.messages) })),
}));

export default useChatStore;
