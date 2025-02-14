import { create } from "zustand";
import { persist } from "zustand/middleware";

interface State {
  customizedInstructions: string;
  isCustomizedInstructionsEnabled: boolean;
  chatId: string;
}

interface Actions {
  setCustomizedInstructions: (instructions: string) => void;
  setIsCustomizedInstructionsEnabled: (enabled: boolean) => void;
  setChatId: (id: string) => void;
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

      chatId: "",
      setChatId: (id) => set({ chatId: id }),
    }),
    {
      name: "memory-store",
      partialize: (state) => ({
        customizedInstructions: state.customizedInstructions,
        isCustomizedInstructionsEnabled: state.isCustomizedInstructionsEnabled,
      }),
    }
  )
);

export default useMemoryStore;
