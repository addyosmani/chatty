import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDatabase, saveDatabase, isDatabaseInitialized } from "@/lib/db";
import { chats, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateUUID } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  contentType?: "text" | "multimodal";
  metadata?: string; // JSON string for images etc.
  createdAt?: string;
}

export interface ChatSession {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

interface ChatState {
  // UI state (not persisted to DB)
  input: string;
  isLoading: boolean;
  userName: string;
  currentChatId: string | null;
  chatListVersion: number;
}

interface ChatActions {
  // Input handling
  setInput: (input: string) => void;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;

  // Loading state
  setIsLoading: (loading: boolean) => void;

  // User
  setUserName: (name: string) => void;

  // Current chat
  setCurrentChatId: (id: string | null) => void;

  // Database operations (async)
  createChat: (chatId?: string, title?: string) => Promise<string>;
  deleteChat: (chatId: string) => Promise<void>;
  setChatTitle: (chatId: string, title: string) => Promise<void>;
  getChat: (chatId: string) => Promise<ChatSession | null>;
  getAllChats: () => Promise<ChatSession[]>;
  addMessage: (chatId: string, message: Omit<ChatMessage, "id" | "createdAt">) => Promise<string>;
  getMessages: (chatId: string) => Promise<ChatMessage[]>;
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
}

const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set, get) => ({
      // Initial state
      input: "",
      isLoading: false,
      userName: "User",
      currentChatId: null,
      chatListVersion: 0,

      // Input handling
      setInput: (input) => set({ input }),
      handleInputChange: (e) => set({ input: e.target.value }),

      // Loading state
      setIsLoading: (loading) => set({ isLoading: loading }),

      // User
      setUserName: (name) => set({ userName: name }),

      // Current chat
      setCurrentChatId: (id) => set({ currentChatId: id }),

      // Database operations
      createChat: async (chatId?: string, title?: string) => {
        if (!isDatabaseInitialized()) {
          throw new Error("Database not initialized");
        }

        const db = getDatabase();
        const id = chatId || generateUUID();
        const now = new Date().toISOString();

        await db.insert(chats).values({
          id,
          title: title || null,
          createdAt: now,
          updatedAt: now,
        });

        await saveDatabase();
        set((state) => ({ currentChatId: id, chatListVersion: state.chatListVersion + 1 }));
        return id;
      },

      deleteChat: async (chatId: string) => {
        if (!isDatabaseInitialized()) return;

        const db = getDatabase();
        await db.delete(chats).where(eq(chats.id, chatId));
        await saveDatabase();

        const { currentChatId } = get();
        if (currentChatId === chatId) {
          set((state) => ({ currentChatId: null, chatListVersion: state.chatListVersion + 1 }));
        } else {
          set((state) => ({ chatListVersion: state.chatListVersion + 1 }));
        }
      },

      setChatTitle: async (chatId: string, title: string) => {
        if (!isDatabaseInitialized()) return;

        const db = getDatabase();
        await db
          .update(chats)
          .set({ title, updatedAt: new Date().toISOString() })
          .where(eq(chats.id, chatId));
        await saveDatabase();
      },

      getChat: async (chatId: string) => {
        if (!isDatabaseInitialized()) return null;

        const db = getDatabase();
        const chatResult = await db
          .select()
          .from(chats)
          .where(eq(chats.id, chatId));

        if (chatResult.length === 0) return null;

        const chat = chatResult[0];
        const messageResult = await db
          .select()
          .from(messages)
          .where(eq(messages.chatId, chatId));

        return {
          id: chat.id,
          title: chat.title,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          messages: messageResult.map((m: typeof messageResult[number]) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            contentType: m.contentType as "text" | "multimodal" | undefined,
            metadata: m.metadata || undefined,
            createdAt: m.createdAt,
          })),
        };
      },

      getAllChats: async () => {
        if (!isDatabaseInitialized()) return [];

        const db = getDatabase();
        const chatResult = await db
          .select()
          .from(chats)
          .orderBy(desc(chats.updatedAt));

        const result: ChatSession[] = [];

        for (const chat of chatResult) {
          const messageResult = await db
            .select()
            .from(messages)
            .where(eq(messages.chatId, chat.id));

          // Only include chats with messages
          if (messageResult.length > 0) {
            result.push({
              id: chat.id,
              title: chat.title,
              createdAt: chat.createdAt,
              updatedAt: chat.updatedAt,
              messages: messageResult.map((m: typeof messageResult[number]) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                contentType: m.contentType as "text" | "multimodal" | undefined,
                metadata: m.metadata || undefined,
                createdAt: m.createdAt,
              })),
            });
          }
        }

        return result;
      },

      addMessage: async (chatId: string, message) => {
        if (!isDatabaseInitialized()) {
          throw new Error("Database not initialized");
        }

        const db = getDatabase();
        const messageId = generateUUID();
        const now = new Date().toISOString();

        await db.insert(messages).values({
          id: messageId,
          chatId,
          role: message.role,
          content: message.content,
          contentType: message.contentType || "text",
          metadata: message.metadata || null,
          createdAt: now,
        });

        // Update chat's updatedAt
        await db
          .update(chats)
          .set({ updatedAt: now })
          .where(eq(chats.id, chatId));

        await saveDatabase();
        return messageId;
      },

      getMessages: async (chatId: string) => {
        if (!isDatabaseInitialized()) return [];

        const db = getDatabase();
        const result = await db
          .select()
          .from(messages)
          .where(eq(messages.chatId, chatId));

        return result.map((m: typeof result[number]) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          contentType: m.contentType as "text" | "multimodal" | undefined,
          metadata: m.metadata || undefined,
          createdAt: m.createdAt,
        }));
      },

      deleteMessage: async (chatId: string, messageId: string) => {
        if (!isDatabaseInitialized()) return;

        const db = getDatabase();
        await db.delete(messages).where(eq(messages.id, messageId));
        await saveDatabase();
      },
    }),
    {
      name: "chatty-chat-store",
      partialize: (state) => ({
        userName: state.userName,
      }),
    }
  )
);

export default useChatStore;
