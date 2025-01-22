import { Model, Models } from "@/lib/models";
import * as webllm from "@mlc-ai/web-llm";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Document } from "@langchain/core/documents";
import { MessageWithFiles } from "@/lib/types";

interface ChatSession {
  messages: MessageWithFiles[];
  createdAt: string;
  title?: string;
  fileInfo?: {
    fileName: string;
    fileType: string;
    fileText: Document<Record<string, any>>[] | string,
  };
}

interface State {
  chats: Record<string, ChatSession>;
  userName: string;
  selectedModel: Model;
  input: string;
  modelHasChanged: boolean;
  isLoading: boolean;
  messages: MessageWithFiles[];
  engine: webllm.MLCEngineInterface | null;
  fileText: Document<Record<string, any>>[] | null;
  files: File[] | undefined;
  base64Images: string[] | null;
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
      messages: MessageWithFiles[]
    ) => MessageWithFiles[]
  ) => void;
  setEngine: (engine: webllm.MLCEngineInterface | null) => void;
  setFileText: (text: Document<Record<string, any>>[] | null) => void;
  setFiles: (files: File[] | undefined) => void;
  setBase64Images: (base64Images: string[] | null) => void;
  getChatById: (chatId: string) => ChatSession | undefined;
  getMessagesById: (chatId: string) => MessageWithFiles[];
  saveMessages: (chatId: string, messages: MessageWithFiles[]) => void;
  handleDelete: (chatId: string, messageId?: string) => void;
  setUserName: (userName: string) => void;
  saveFileToChat: (chatId: string, fileInfo: ChatSession['fileInfo']) => void;
  getFileInfoById: (chatId: string) => ChatSession['fileInfo'] | null;
  setChatTitle: (chatId: string, title: ChatSession['title']) => void;
}

const useChatStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      userName: 'User',
      setUserName: (userName) => set({ userName }),

      selectedModel: Models[7],
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

      base64Images: null,
      setBase64Images: (base64Images) => set({ base64Images }),

      chats: {},
      getChatById: (chatId) => {
        const state = get();
        return state.chats[chatId];
      },
      getMessagesById: (chatId) => {
        const state = get();
        return state.chats[chatId]?.messages || [];
      },

      saveMessages: (chatId, messages) => {
        set((state) => {
          const existingChat = state.chats[chatId];

          return {
            chats: {
              ...state.chats,
              [chatId]: {
                messages: [...messages],
                createdAt: existingChat?.createdAt || new Date().toISOString(),
                fileInfo: existingChat?.fileInfo,
                title: existingChat?.title
              },
            },
          };
        });
      },

      handleDelete: (chatId, messageId) => {
        set((state) => {
          const chat = state.chats[chatId];
          if (!chat) return state;

          // If messageId is provided, delete specific message
          if (messageId) {
            const updatedMessages = chat.messages.filter(
              (message) => message.id !== messageId
            );
            return {
              chats: {
                ...state.chats,
                [chatId]: {
                  ...chat,
                  messages: updatedMessages,
                },
              },
            };
          }

          // If no messageId, delete the entire chat
          const { [chatId]: _, ...remainingChats } = state.chats;
          return {
            chats: remainingChats,
          };
        });
      },

      saveFileToChat: (chatId, fileInfo) => {
        set((state) => ({
          chats: {
            ...state.chats,
            [chatId]: {
              ...state.chats[chatId],
              fileInfo
            }
          }
        }));
      },

      getFileInfoById: (chatId) => {
        const state = get();
        return state.chats[chatId]?.fileInfo;
      },

      setChatTitle: (chatId, title) => {
        console.log("Setting title:", title);
        set((state) => ({
          chats: {
            ...state.chats,
            [chatId]: {
              ...state.chats[chatId],
              title
            }
          }
        }));
      },
    }),
    {
      name: "chatty-ui-state",
      version: 1,
      partialize: (state) => ({
        chats: state.chats,
        selectedModel: state.selectedModel,
        userName: state.userName,
      }),
    }
  )
);

export default useChatStore;
