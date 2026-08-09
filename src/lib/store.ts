import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WebLLMUIMessage } from "@browser-ai/web-llm";
import type { ChatDocument } from "./rag";
import { DEFAULT_MODEL_ID } from "./models";

export type ChatSession = {
  messages: WebLLMUIMessage[];
  createdAt: string;
  title?: string;
  document?: ChatDocument;
};

type State = {
  chats: Record<string, ChatSession>;
  selectedModelId: string;
  userName: string;
  customizedInstructions: string;
  isCustomizedInstructionsEnabled: boolean;
};

type Actions = {
  saveChat: (chatId: string, messages: WebLLMUIMessage[]) => void;
  deleteChat: (chatId: string) => void;
  setChatTitle: (chatId: string, title: string) => void;
  setChatDocument: (chatId: string, document: ChatDocument | undefined) => void;
  setSelectedModelId: (modelId: string) => void;
  setUserName: (userName: string) => void;
  setCustomizedInstructions: (instructions: string) => void;
  setIsCustomizedInstructionsEnabled: (enabled: boolean) => void;
};

/**
 * The app's only persisted state: chat history and user settings. Everything
 * about an in-flight conversation is owned by the AI SDK's `useChat`.
 */
export const useAppStore = create<State & Actions>()(
  persist(
    (set) => ({
      chats: {},
      selectedModelId: DEFAULT_MODEL_ID,
      userName: "User",
      customizedInstructions: "",
      isCustomizedInstructionsEnabled: false,

      saveChat: (chatId, messages) =>
        set((state) => ({
          chats: {
            ...state.chats,
            [chatId]: {
              ...state.chats[chatId],
              messages,
              createdAt: state.chats[chatId]?.createdAt ?? new Date().toISOString(),
            },
          },
        })),

      deleteChat: (chatId) =>
        set((state) => {
          const { [chatId]: _removed, ...rest } = state.chats;
          return { chats: rest };
        }),

      setChatTitle: (chatId, title) =>
        set((state) =>
          state.chats[chatId]
            ? {
                chats: {
                  ...state.chats,
                  [chatId]: { ...state.chats[chatId], title },
                },
              }
            : state
        ),

      setChatDocument: (chatId, document) =>
        set((state) => ({
          chats: {
            ...state.chats,
            [chatId]: {
              ...state.chats[chatId],
              messages: state.chats[chatId]?.messages ?? [],
              createdAt:
                state.chats[chatId]?.createdAt ?? new Date().toISOString(),
              document,
            },
          },
        })),

      setSelectedModelId: (selectedModelId) => set({ selectedModelId }),
      setUserName: (userName) => set({ userName }),
      setCustomizedInstructions: (customizedInstructions) =>
        set({ customizedInstructions }),
      setIsCustomizedInstructionsEnabled: (isCustomizedInstructionsEnabled) =>
        set({ isCustomizedInstructionsEnabled }),
    }),
    {
      name: "chatty-state",
      version: 2,
    }
  )
);
