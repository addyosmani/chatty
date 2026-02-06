// Lazy load the embedding model to avoid SSR issues
// eslint-disable-next-line
let embeddingModel: any = null;

async function getEmbeddingModel() {
  if (embeddingModel) return embeddingModel;

  // Dynamic import to avoid SSR issues
  const { transformersJS } = await import("@browser-ai/transformers-js");
  embeddingModel = transformersJS.embedding("Supabase/gte-small");
  return embeddingModel;
}

/**
 * Generate embedding for a single text
 */
export async function embedText(text: string): Promise<number[]> {
  const { embed } = await import("ai");
  const model = await getEmbeddingModel();
  const { embedding } = await embed({
    model,
    value: text,
  });
  return embedding;
}

/**
 * Generate embeddings for multiple texts
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embedMany } = await import("ai");
  const model = await getEmbeddingModel();
  const { embeddings } = await embedMany({
    model,
    values: texts,
  });
  return embeddings;
}


/**
 * Convert Float32Array to regular array
 */
export function float32ArrayToArray(arr: Float32Array): number[] {
  return Array.from(arr);
}

/**
 * Convert regular array to Float32Array
 */
export function arrayToFloat32Array(arr: number[]): Float32Array {
  return new Float32Array(arr);
}

/**
 * Convert Float32Array to Buffer for storage
 */
export function embeddingToBuffer(embedding: number[]): Buffer {
  const float32 = new Float32Array(embedding);
  return Buffer.from(float32.buffer);
}

/**
 * Convert Uint8Array back to embedding array
 */
export function bufferToEmbedding(buffer: Uint8Array | Buffer): number[] {
  const float32 = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
  return Array.from(float32);
}
