import { getDatabase, saveDatabase } from "./db";
import { chats, messages } from "@/db/schema";
import { generateUUID } from "./utils";

interface LegacyMessageContent {
  type: string;
  text?: string;
  image_url?: { url: string };
}

interface LegacyMessage {
  id: string;
  role: "user" | "assistant";
  content: string | LegacyMessageContent[];
  fileName?: string;
  chatTitle?: string;
}

interface LegacyChatSession {
  messages: LegacyMessage[];
  createdAt: string;
  title?: string;
  fileInfo?: {
    fileName: string;
    fileType: string;
    fileText: unknown;
  };
}

interface LegacyState {
  chats: Record<string, LegacyChatSession>;
  selectedModel: unknown;
  userName: string;
}

/**
 * Migrate data from localStorage to SQLite
 * Returns true if migration was performed, false if no data to migrate
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  const legacyData = localStorage.getItem("chatty-ui-state");

  if (!legacyData) return false;

  try {
    const parsed = JSON.parse(legacyData) as { state: LegacyState };
    const state = parsed.state;

    if (!state.chats || Object.keys(state.chats).length === 0) {
      // No chats to migrate, but clean up localStorage
      cleanupLocalStorage();
      return false;
    }

    const db = getDatabase();

    // Migrate each chat
    for (const [chatId, chat] of Object.entries(state.chats)) {
      if (!chat.messages || chat.messages.length === 0) continue;

      // Insert chat
      await db.insert(chats).values({
        id: chatId,
        title: chat.title || null,
        createdAt: chat.createdAt || new Date().toISOString(),
        updatedAt: chat.createdAt || new Date().toISOString(),
      });

      // Insert messages
      for (const message of chat.messages) {
        // Handle content - can be string or array of content parts
        let content: string;
        let contentType: "text" | "multimodal" = "text";
        let metadata: string | null = null;

        if (typeof message.content === "string") {
          content = message.content;
        } else if (Array.isArray(message.content)) {
          // Multimodal content
          contentType = "multimodal";
          const textParts = message.content
            .filter((part) => part.type === "text" && part.text)
            .map((part) => part.text)
            .join("\n");
          content = textParts || "";

          // Extract images for metadata
          const images = message.content
            .filter((part) => part.type === "image_url" && part.image_url?.url)
            .map((part) => part.image_url!.url);

          if (images.length > 0 || message.fileName) {
            metadata = JSON.stringify({
              images: images.length > 0 ? images : undefined,
              fileName: message.fileName,
            });
          }
        } else {
          content = "";
        }

        await db.insert(messages).values({
          id: message.id || generateUUID(),
          chatId,
          role: message.role,
          content,
          contentType,
          metadata,
        });
      }
    }

    await saveDatabase();

    // Migrate settings
    if (state.userName) {
      localStorage.setItem("chatty-username", state.userName);
    }

    // Note: selectedModel is still managed by Zustand with its own key
    // We'll create a new store for it, so we need to preserve it
    if (state.selectedModel) {
      localStorage.setItem(
        "chatty-model-store",
        JSON.stringify({
          state: { selectedModel: state.selectedModel },
          version: 0,
        })
      );
    }

    // Clean up legacy data
    cleanupLocalStorage();

    console.log(
      `Migration completed: ${Object.keys(state.chats).length} chats migrated`
    );
    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

/**
 * Clean up legacy localStorage keys after migration
 */
function cleanupLocalStorage() {
  // Remove the main legacy state
  localStorage.removeItem("chatty-ui-state");

  // Remove any per-chat file markers
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("chatFile_")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Check if there's legacy data to migrate
 */
export function hasLegacyData(): boolean {
  return localStorage.getItem("chatty-ui-state") !== null;
}
