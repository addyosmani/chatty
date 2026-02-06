// Cross-encoder reranker using Xenova/ms-marco-MiniLM-L6-v2
// Uses AutoTokenizer + AutoModelForSequenceClassification for proper
// [CLS] query [SEP] document [SEP] pair encoding

import type { PreTrainedTokenizer, PreTrainedModel } from "@huggingface/transformers";

const RERANKER_MODEL_ID = "Xenova/ms-marco-MiniLM-L-6-v2";
const SCORE_CONCURRENCY_LIMIT = 4;

let tokenizer: PreTrainedTokenizer | null = null;
let model: PreTrainedModel | null = null;
let loadingPromise: Promise<void> | null = null;

async function loadReranker(): Promise<void> {
  if (loadingPromise) return loadingPromise;
  if (tokenizer && model) return;

  loadingPromise = (async () => {
    try {
      const { AutoTokenizer, AutoModelForSequenceClassification } =
        await import("@huggingface/transformers");

      const [loadedTokenizer, loadedModel] = await Promise.all([
        AutoTokenizer.from_pretrained(RERANKER_MODEL_ID),
        AutoModelForSequenceClassification.from_pretrained(RERANKER_MODEL_ID),
      ]);

      tokenizer = loadedTokenizer;
      model = loadedModel;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/** Score a query-document pair, returns 0-1 relevance score via sigmoid */
async function scoreCandidate(
  query: string,
  document: string
): Promise<number> {
  if (!tokenizer || !model) {
    throw new Error("Reranker not loaded");
  }

  const inputs = await tokenizer(query, {
    text_pair: document,
    truncation: true,
    padding: true,
    return_tensors: "pt",
  });

  // eslint-disable-next-line
  const output = await (model as any)(inputs);

  const logits = output.logits;
  if (logits?.data) {
    const logitValue = logits.data[0];
    return 1 / (1 + Math.exp(-logitValue));
  }

  return 0;
}

export type RerankResult<T> = {
  item: T;
  relevanceScore: number;
};

/**
 * Rerank a list of items using a cross-encoder model.
 * Takes a query and candidate texts, returns items sorted by relevance.
 */
export async function rerank<T>(
  query: string,
  items: T[],
  getText: (item: T) => string,
  topK?: number
): Promise<RerankResult<T>[]> {
  if (items.length === 0) return [];

  await loadReranker();

  // Score candidates with bounded concurrency
  const results: RerankResult<T>[] = [];

  for (let i = 0; i < items.length; i += SCORE_CONCURRENCY_LIMIT) {
    const batch = items.slice(i, i + SCORE_CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map(async (item, batchIdx) => {
        const relevanceScore = await scoreCandidate(query, getText(item));
        return { item: items[i + batchIdx], relevanceScore };
      })
    );
    results.push(...batchResults);
  }

  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  if (topK !== undefined) {
    return results.slice(0, topK);
  }

  return results;
}
