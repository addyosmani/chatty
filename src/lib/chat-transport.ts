import {
  ChatTransport,
  UIMessageChunk,
  streamText,
  convertToModelMessages,
  ChatRequestOptions,
  createUIMessageStream,
  UIMessage,
} from "ai";
import {
  WebLLMLanguageModel,
  WebLLMUIMessage,
  WebLLMProgress,
} from "@browser-ai/web-llm";
import { getRAGContext, type RetrievalResult } from "./rag";
import { useModelStore } from "@/hooks/useModelStore";

export type RetrievalStatus =
  | { phase: "retrieving" }
  | { phase: "done"; chunkCount: number; results: RetrievalResult[] }
  | { phase: "error"; message: string }
  | { phase: "skipped" };

export type { RetrievalResult };

export interface WebLLMChatTransportOptions {
  onRetrievalStatus?: (status: RetrievalStatus) => void;
}

/**
 * Client-side chat transport for @browser-ai/web-llm.
 * Implements the ChatTransport interface from Vercel AI SDK.
 *
 * Gets the model instance from the Zustand store so it persists
 * across component remounts and chat navigations.
 */
export class WebLLMChatTransport implements ChatTransport<WebLLMUIMessage> {
  private _systemPrompt: string = "You are a helpful assistant.";
  private _ragEnabled: boolean = false;
  private _onRetrievalStatus?: (status: RetrievalStatus) => void;

  constructor(options: WebLLMChatTransportOptions = {}) {
    this._onRetrievalStatus = options.onRetrievalStatus;
  }

  private getModel(): WebLLMLanguageModel {
    return useModelStore.getState().getModelInstance();
  }

  setSystemPrompt(prompt: string) {
    this._systemPrompt = prompt;
  }

  setRAGEnabled(enabled: boolean) {
    this._ragEnabled = enabled;
  }

  /** Extract text from the latest user message. */
  private getLatestUserText(messages: WebLLMUIMessage[]): string | null {
    const last = messages.findLast(
      (msg: UIMessage) => msg.role === "user"
    );
    if (!last?.parts) return null;
    return (
      last.parts
        .filter(
          (p: { type: string }): p is { type: "text"; text: string } =>
            p.type === "text"
        )
        .map((p: { text: string }) => p.text)
        .join(" ")
        .trim() || null
    );
  }

  /**
   * Run the RAG retrieval pipeline if enabled.
   * Reports status via callback, including structured results on success.
   */
  private async getRetrievalContext(
    messages: WebLLMUIMessage[]
  ): Promise<{ context: string; results: RetrievalResult[] } | null> {
    if (!this._ragEnabled) {
      this._onRetrievalStatus?.({ phase: "skipped" });
      return null;
    }

    const userText = this.getLatestUserText(messages);
    if (!userText) {
      this._onRetrievalStatus?.({ phase: "skipped" });
      return null;
    }

    try {
      this._onRetrievalStatus?.({ phase: "retrieving" });
      const ragResponse = await getRAGContext(userText);

      if (ragResponse) {
        this._onRetrievalStatus?.({
          phase: "done",
          chunkCount: ragResponse.results.length,
          results: ragResponse.results,
        });
        return ragResponse;
      } else {
        this._onRetrievalStatus?.({
          phase: "done",
          chunkCount: 0,
          results: [],
        });
        return null;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this._onRetrievalStatus?.({ phase: "error", message });
      return null;
    }
  }

  /** Build the full system prompt with optional RAG context. */
  private buildSystemPrompt(ragContext: string | null): string {
    let systemPrompt = this._systemPrompt;

    if (ragContext) {
      systemPrompt +=
        "\n\nRelevant context from uploaded documents (each prefixed with a citation number like [1], [2], etc.):\n" +
        ragContext +
        "\n\nWhen using information from the above context, include the citation number (e.g. [1], [2]) in your response. " +
        "If using general knowledge, do NOT reference the context.";
    }

    return systemPrompt;
  }

  /**
   * Send messages and get a streaming response.
   * Handles RAG retrieval internally and reports status via callback.
   */
  async sendMessages(
    options: {
      chatId: string;
      messages: WebLLMUIMessage[];
      abortSignal: AbortSignal | undefined;
    } & {
      trigger: "submit-message" | "submit-tool-result" | "regenerate-message";
      messageId: string | undefined;
    } & ChatRequestOptions
  ): Promise<ReadableStream<UIMessageChunk>> {
    const { messages, abortSignal } = options;
    const model = this.getModel();

    return createUIMessageStream<WebLLMUIMessage>({
      execute: async ({ writer }) => {
        // 1. Run RAG retrieval (status reported via callback)
        const ragResult = await this.getRetrievalContext(messages);

        // 2. Build system prompt with RAG context
        const systemPrompt = this.buildSystemPrompt(
          ragResult?.context ?? null
        );

        // 3. Convert messages for model
        const prompt = await convertToModelMessages(messages);

        // 4. Handle model download progress
        let downloadProgressId: string | undefined;
        const availability = await model.availability();

        if (availability !== "available") {
          await model.createSessionWithProgress(
            (progress: WebLLMProgress) => {
              const percent = Math.round((progress.progress ?? 0) * 100);

              if ((progress.progress ?? 0) >= 1) {
                if (downloadProgressId) {
                  writer.write({
                    type: "data-modelDownloadProgress",
                    id: downloadProgressId,
                    data: {
                      status: "complete",
                      progress: 100,
                      message: "Model ready for inference...",
                    },
                  });
                }
                return;
              }

              if (!downloadProgressId) {
                downloadProgressId = `download-${Date.now()}`;
              }

              writer.write({
                type: "data-modelDownloadProgress",
                id: downloadProgressId,
                data: {
                  status: "downloading",
                  progress: percent,
                  message:
                    progress.text || `Downloading model... ${percent}%`,
                },
              });
            }
          );
        }

        // 5. Stream the AI response
        const result = streamText({
          model,
          system: systemPrompt,
          messages: prompt,
          abortSignal,
          onChunk: (event) => {
            if (event.chunk.type === "text-delta" && downloadProgressId) {
              writer.write({
                type: "data-modelDownloadProgress",
                id: downloadProgressId,
                data: { status: "complete", progress: 100, message: "" },
              });
              downloadProgressId = undefined;
            }
          },
        });

        await writer.merge(result.toUIMessageStream({ sendStart: false }));
      },
    });
  }

  async reconnectToStream(
    _options: { chatId: string } & ChatRequestOptions
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    return null;
  }
}
