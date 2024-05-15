import { Model, Models } from "@/lib/models";
import * as webllm from "@mlc-ai/web-llm";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Document } from "@langchain/core/documents";

const LOCAL_CUSTOMIZED_INSTRUCTIONS = "customizedInstructions";

interface State {
  customizedInstructions: string;
  isCustomizedInstructionsEnabled: boolean;
}

interface Actions {
  setCustomizedInstructions: (instructions: string) => void;
  setIsCustomizedInstructionsEnabled: (enabled: boolean) => void;
}

const useMemoryStore = create<State & Actions>()(
  persist(
    (set) => ({
      customizedInstructions: "",
      setCustomizedInstructions: (instructions) =>
        set({ customizedInstructions: instructions }),

      isCustomizedInstructionsEnabled: false,
      setIsCustomizedInstructionsEnabled: (enabled) =>
        set({ isCustomizedInstructionsEnabled: enabled }),
    }),
    {
      name: LOCAL_CUSTOMIZED_INSTRUCTIONS,
      skipHydration: true,
    }
  )
);

export default useMemoryStore;

// const customizedInstructions = useMemoryStore(
//     (state) => state.customizedInstructions
//   );
//   const isCustomizedInstructionsEnabled = useMemoryStore(
//     (state) => state.isCustomizedInstructionsEnabled
//   );
//   const setCustomizedInstructions = useMemoryStore(
//     (state) => state.setCustomizedInstructions
//   );
//   const setIsCustomizedInstructionsEnabled = useMemoryStore(
//     (state) => state.setIsCustomizedInstructionsEnabled
//   );
