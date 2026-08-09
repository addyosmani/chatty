import { cosineSimilarity, embed, embedMany } from "ai";
import { webLLM } from "@browser-ai/web-llm";

export const EMBEDDING_MODEL_ID = "snowflake-arctic-embed-s-q0f32-MLC-b32";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 100;
const TOP_K = 5;

/** A document attached to a chat, as persisted alongside the chat. */
export type ChatDocument = {
  name: string;
  mediaType: string;
  text: string;
};

type IndexedChunk = {
  text: string;
  embedding: number[];
};

let embeddingModel: ReturnType<typeof webLLM.embeddingModel> | null = null;

function getEmbeddingModel() {
  if (!embeddingModel) {
    embeddingModel = webLLM.embeddingModel(EMBEDDING_MODEL_ID, {
      worker: new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      }),
    });
  }
  return embeddingModel;
}

/**
 * Embeddings are expensive to compute and far too large to keep in
 * localStorage, so indexes live in memory and are rebuilt on demand after a
 * reload from the document text persisted with the chat.
 */
const indexCache = new Map<string, Promise<IndexedChunk[]>>();

/** Split text into overlapping chunks on paragraph/sentence-ish boundaries. */
export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= CHUNK_SIZE) {
    return normalized ? [normalized] : [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    let sliceEnd = end;

    if (end < normalized.length) {
      // Prefer to break on a paragraph, then a sentence, then a space.
      const window = normalized.slice(start, end);
      const breakPoint = Math.max(
        window.lastIndexOf("\n\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf(" ")
      );
      if (breakPoint > CHUNK_SIZE * 0.5) {
        sliceEnd = start + breakPoint;
      }
    }

    const chunk = normalized.slice(start, sliceEnd).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    if (sliceEnd >= normalized.length) {
      break;
    }
    start = Math.max(sliceEnd - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

async function buildIndex(document: ChatDocument): Promise<IndexedChunk[]> {
  const chunks = chunkText(document.text);
  if (chunks.length === 0) {
    return [];
  }

  const model = getEmbeddingModel();
  const { embeddings } = await embedMany({ model, values: chunks });

  return chunks.map((text, i) => ({ text, embedding: embeddings[i] }));
}

function getIndex(
  chatId: string,
  document: ChatDocument
): Promise<IndexedChunk[]> {
  const key = `${chatId}:${document.name}:${document.text.length}`;
  let index = indexCache.get(key);
  if (!index) {
    index = buildIndex(document).catch((error) => {
      // Don't cache a rejected promise, or the chat can never recover.
      indexCache.delete(key);
      throw error;
    });
    indexCache.set(key, index);
  }
  return index;
}

export function clearDocumentIndex(chatId: string) {
  for (const key of Array.from(indexCache.keys())) {
    if (key.startsWith(`${chatId}:`)) {
      indexCache.delete(key);
    }
  }
}

/**
 * Retrieve the chunks of `document` most relevant to `query` and format them
 * as a context block for the system prompt.
 */
export async function retrieveContext(
  chatId: string,
  document: ChatDocument,
  query: string
): Promise<string | null> {
  const index = await getIndex(chatId, document);
  if (index.length === 0) {
    return null;
  }

  const model = getEmbeddingModel();
  const { embedding: queryEmbedding } = await embed({ model, value: query });

  const top = index
    .map((chunk) => ({
      text: chunk.text,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  if (top.length === 0) {
    return null;
  }

  return [
    `Text content from the file "${document.name}" (${document.mediaType}) is provided between the <context> tags.`,
    "Answer the user's question using that context and the earlier messages in the conversation.",
    'If the question cannot be answered from the context, say "I don\'t know".',
    "",
    `<context file="${document.name}" fileType="${document.mediaType}">`,
    top.map((chunk) => chunk.text).join("\n\n---\n\n"),
    "</context>",
  ].join("\n");
}
