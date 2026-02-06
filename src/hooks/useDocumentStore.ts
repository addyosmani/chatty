import { create } from "zustand";
import {
  addDocument as addDocumentToDb,
  removeDocument as removeDocumentFromDb,
  getAllDocuments,
  getRAGContext as getRAGContextFromDb,
} from "@/lib/rag";
import { Document } from "@/db/schema";

interface DocumentState {
  documents: Document[];
  isLoading: boolean;
  searchInDocuments: boolean;
  ragContext: string | null;
}

interface DocumentActions {
  loadDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  setSearchInDocuments: (enabled: boolean) => void;
  updateRAGContext: (query: string) => Promise<void>;
  clearRAGContext: () => void;
}

export const useDocumentStore = create<DocumentState & DocumentActions>()(
  (set, get) => ({
    documents: [],
    isLoading: false,
    searchInDocuments: false,
    ragContext: null,

    loadDocuments: async () => {
      set({ isLoading: true });
      try {
        const docs = await getAllDocuments();
        set({ documents: docs, isLoading: false });
      } catch (error) {
        console.error("Failed to load documents:", error);
        set({ isLoading: false });
      }
    },

    uploadDocument: async (file: File) => {
      set({ isLoading: true });
      try {
        await addDocumentToDb(file);
        // Reload documents
        const docs = await getAllDocuments();
        set({ documents: docs, isLoading: false });
      } catch (error) {
        console.error("Failed to upload document:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    deleteDocument: async (id: string) => {
      set({ isLoading: true });
      try {
        await removeDocumentFromDb(id);
        // Reload documents
        const docs = await getAllDocuments();
        set({ documents: docs, isLoading: false });
      } catch (error) {
        console.error("Failed to delete document:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    setSearchInDocuments: (enabled: boolean) => {
      set({ searchInDocuments: enabled });
      if (!enabled) {
        set({ ragContext: null });
      }
    },

    updateRAGContext: async (query: string) => {
      const { searchInDocuments, documents } = get();

      if (!searchInDocuments || documents.length === 0) {
        set({ ragContext: null });
        return;
      }

      try {
        const response = await getRAGContextFromDb(query);
        set({ ragContext: response?.context ?? null });
      } catch (error) {
        console.error("Failed to get RAG context:", error);
        set({ ragContext: null });
      }
    },

    clearRAGContext: () => {
      set({ ragContext: null });
    },
  })
);

/**
 * Hook to check if RAG is available (has documents)
 */
export function useHasDocuments(): boolean {
  return useDocumentStore((state) => state.documents.length > 0);
}

/**
 * Hook to get RAG enabled state
 */
export function useSearchInDocuments(): boolean {
  return useDocumentStore((state) => state.searchInDocuments);
}
