import { getDatabase, saveDatabase } from "./db";
import { documents, documentChunks } from "@/db/schema";
import {
  embedText,
  embedTexts,
  cosineSimilarity,
  embeddingToBuffer,
  bufferToEmbedding,
} from "./embeddings";
import { parseFile, splitIntoChunks } from "./pdf-parser";
import { generateUUID } from "./utils";
import { eq } from "drizzle-orm";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 100;
const TOP_K = 5;
const SIMILARITY_THRESHOLD = 0.3;

export type RetrievalResult = {
  documentId: string;
  fileName: string;
  chunkIndex: number;
  content: string;
  similarity: number;
};

export type RAGResponse = {
  context: string;
  results: RetrievalResult[];
};

/**
 * Add a document to the RAG system
 * Parses the file, chunks it, generates embeddings, and stores in SQLite
 */
export async function addDocument(file: File): Promise<string> {
  const db = getDatabase();
  const docId = generateUUID();

  // Parse file content
  const content = await parseFile(file);

  // Insert document
  await db.insert(documents).values({
    id: docId,
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
    content,
  });

  // Split into chunks
  const chunks = splitIntoChunks(content, CHUNK_SIZE, CHUNK_OVERLAP);

  if (chunks.length === 0) {
    await saveDatabase();
    return docId;
  }

  // Generate embeddings for all chunks
  const embeddings = await embedTexts(chunks);

  // Insert chunks with embeddings
  for (let i = 0; i < chunks.length; i++) {
    await db.insert(documentChunks).values({
      id: generateUUID(),
      documentId: docId,
      chunkIndex: i,
      content: chunks[i],
      embedding: embeddingToBuffer(embeddings[i]),
    });
  }

  await saveDatabase();
  return docId;
}

/**
 * Remove a document and its chunks
 */
export async function removeDocument(documentId: string): Promise<void> {
  const db = getDatabase();
  await db.delete(documents).where(eq(documents.id, documentId));
  await saveDatabase();
}

/**
 * Get all documents (without chunks)
 */
export async function getAllDocuments() {
  const db = getDatabase();
  return db.select().from(documents);
}

/**
 * Get document by ID
 */
export async function getDocumentById(documentId: string) {
  const db = getDatabase();
  const result = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));
  return result[0] || null;
}

/**
 * Search for relevant context using semantic similarity.
 * Returns structured results with document metadata for source attribution.
 */
export async function getRAGContext(
  query: string
): Promise<RAGResponse | null> {
  const db = getDatabase();

  // Get all chunks with embeddings, joined with document info
  const allChunksWithDocs = await db
    .select({
      chunkId: documentChunks.id,
      documentId: documentChunks.documentId,
      chunkIndex: documentChunks.chunkIndex,
      content: documentChunks.content,
      embedding: documentChunks.embedding,
      fileName: documents.fileName,
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id));

  if (allChunksWithDocs.length === 0) {
    return null;
  }

  // Generate embedding for query
  const queryEmbedding = await embedText(query);

  // Calculate similarity scores
  type ScoredChunk = (typeof allChunksWithDocs)[number] & {
    similarity: number;
  };
  const scoredChunks: ScoredChunk[] = allChunksWithDocs
    .map((chunk): ScoredChunk | null => {
      if (!chunk.embedding) return null;

      const chunkEmbedding = bufferToEmbedding(chunk.embedding as Buffer);
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

      return {
        ...chunk,
        similarity,
      };
    })
    .filter((chunk): chunk is ScoredChunk => chunk !== null);

  // Sort by similarity and take top K
  scoredChunks.sort(
    (a: ScoredChunk, b: ScoredChunk) => b.similarity - a.similarity
  );
  const topChunks = scoredChunks.slice(0, TOP_K);

  // Filter by similarity threshold
  const relevantChunks = topChunks.filter(
    (chunk: ScoredChunk) => chunk.similarity >= SIMILARITY_THRESHOLD
  );

  if (relevantChunks.length === 0) {
    return null;
  }

  // Build structured results
  const results: RetrievalResult[] = relevantChunks.map((chunk, index) => ({
    documentId: chunk.documentId,
    fileName: chunk.fileName,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    similarity: chunk.similarity,
  }));

  // Build context string with numbered citations
  const context = results
    .map((r, i) => `[${i + 1}] ${r.content}`)
    .join("\n\n---\n\n");

  return { context, results };
}

/**
 * Check if there are any documents in the system
 */
export async function hasDocuments(): Promise<boolean> {
  const db = getDatabase();
  const result = await db.select().from(documents);
  return result.length > 0;
}

/**
 * Get document count
 */
export async function getDocumentCount(): Promise<number> {
  const db = getDatabase();
  const result = await db.select().from(documents);
  return result.length;
}
